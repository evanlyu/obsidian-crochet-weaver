import type { AstNode, ChartHighlight, CrochetAst } from './types';
import { parse } from './parser';
import { validateChartBudget } from './budget';
import { roundStitchCount, unitStitchCounts } from './layout';
import { renderCrochetError } from './errors';
import { t, type Locale } from './i18n';
import { progressIdFromConfig } from './progress-id';

export interface ProgressStore {
	getProgress(id: string): number;
	setProgress(id: string, done: number): Promise<void>;
	getStitchProgress(id: string): number;
	setStitchProgress(id: string, count: number): Promise<void>;
}

export function renderCrochetPatternText(source: string, el: HTMLElement, locale: Locale = 'en') {
	let ast: CrochetAst;
	try {
		ast = parse(source) as CrochetAst;
		validateChartBudget(ast);
	} catch (error) {
		renderCrochetError(error, el, locale);
		return;
	}

	const root = el.createDiv({ cls: 'crochet-pattern-text' });
	root.createDiv({
		cls: 'crochet-pattern-text-title',
		text: patternTitle(ast.config.type, locale),
	});

	const list = root.createDiv({ cls: 'crochet-pattern-text-list' });
	ast.rows.forEach((row) => {
		const stepsText = serializeSteps(row.steps) + anchorText(row.anchor) + loopText(row.loop, locale);
		const stitchCount = roundStitchCount(row);
		const item = list.createDiv({ cls: 'crochet-pattern-text-row' });
		item.createSpan({ cls: 'crochet-pattern-text-badge', text: `R${row.num}` });
		item.createSpan({ cls: 'crochet-pattern-text-steps', text: stepsText });
		item.createSpan({
			cls: 'crochet-pattern-text-count',
			text: t(locale, 'tool.stitchCount', { count: stitchCount }),
		});
	});
}

export function renderCrochetTool(
	source: string,
	el: HTMLElement,
	store: ProgressStore,
	locale: Locale = 'en',
	onHighlightChange?: (target: ChartHighlight | undefined) => void,
) {
	let ast: CrochetAst;
	try {
		ast = parse(source) as CrochetAst;
		validateChartBudget(ast);
	} catch (error) {
		renderCrochetError(error, el, locale);
		return;
	}

	const id = configId(ast, source);
	const rows = ast.rows;
	const total = rows.length;
	const root = el.createDiv({ cls: 'crochet-tool' });

	const advanceDone = (newDone: number) => {
		void store.setProgress(id, newDone);
		void store.setStitchProgress(id, 0);
		paint();
	};

	const paint = () => {
		root.empty();
		const done = clamp(store.getProgress(id), 0, total);
		const currentRow = rows[done];
		const unitWeights = currentRow ? unitStitchCounts(currentRow) : [];
		const totalUnits = unitWeights.length;
		const unitsDone = currentRow ? clamp(store.getStitchProgress(id), 0, totalUnits) : 0;
		const stitchesDone = unitWeights.slice(0, unitsDone).reduce((sum, weight) => sum + weight, 0);
		const rowTotal = currentRow ? roundStitchCount(currentRow) : 0;

		const header = root.createDiv({ cls: 'crochet-tool-header' });
		header.createDiv({
			cls: 'crochet-tool-title',
			text: patternTitle(ast.config.type, locale),
		});
		header.createDiv({
			cls: 'crochet-tool-progress-text',
			text: t(locale, 'tool.progress', {
				done,
				total,
				unit: unitWord(ast.config.type, locale),
			}),
		});

		const bar = root.createDiv({ cls: 'crochet-tool-bar' });
		bar.setAttribute('role', 'progressbar');
		bar.setAttribute('aria-label', t(locale, 'tool.progressAria'));
		bar.setAttribute('aria-valuemin', '0');
		bar.setAttribute('aria-valuemax', String(total));
		bar.setAttribute('aria-valuenow', String(done));
		for (let i = 0; i < total; i++) {
			bar.createDiv({
				cls: i < done ? 'crochet-tool-seg is-done' : 'crochet-tool-seg',
			});
		}

		if (currentRow) {
			const nextWeight = unitWeights[unitsDone] ?? 1;
			const prevWeight = unitsDone > 0 ? unitWeights[unitsDone - 1] : undefined;

			const counter = root.createDiv({ cls: 'crochet-tool-stitch-counter' });
			counter.createDiv({
				cls: 'crochet-tool-stitch-label',
				text: t(locale, 'tool.stitchCounterLabel', { row: currentRow.num }),
			});
			const controlsRow = counter.createDiv({ cls: 'crochet-tool-stitch-controls' });

			const subtract = controlsRow.createEl('button', {
				cls: 'crochet-tool-stitch-btn',
				text: prevWeight !== undefined ? `−${prevWeight}` : '−',
			});
			subtract.type = 'button';
			subtract.setAttribute('aria-label', t(locale, 'tool.stitchSubtract'));
			subtract.disabled = unitsDone <= 0;
			subtract.addEventListener('click', () => {
				void store.setStitchProgress(id, Math.max(0, unitsDone - 1));
				paint();
			});

			const countEl = controlsRow.createSpan({
				cls: 'crochet-tool-stitch-count',
				text: t(locale, 'tool.stitchProgress', { done: stitchesDone, total: rowTotal }),
			});
			countEl.setAttribute('aria-live', 'polite');

			const add = controlsRow.createEl('button', {
				cls: 'crochet-tool-stitch-btn mod-cta',
				text: `+${nextWeight}`,
			});
			add.type = 'button';
			add.setAttribute('aria-label', t(locale, 'tool.stitchAdd'));
			add.addEventListener('click', () => {
				const nextUnitsDone = unitsDone + 1;
				if (nextUnitsDone >= totalUnits) {
					advanceDone(Math.min(total, done + 1));
				} else {
					void store.setStitchProgress(id, nextUnitsDone);
					paint();
				}
			});

			const resetStitch = controlsRow.createEl('button', {
				cls: 'crochet-tool-stitch-reset',
				text: t(locale, 'tool.stitchReset'),
			});
			resetStitch.type = 'button';
			resetStitch.disabled = unitsDone <= 0;
			resetStitch.addEventListener('click', () => {
				void store.setStitchProgress(id, 0);
				paint();
			});
		}

		const list = root.createDiv({ cls: 'crochet-tool-list' });
		rows.forEach((row, i) => {
			const n = i + 1;
			const cls = ['crochet-tool-row'];
			if (n <= done) cls.push('is-done');
			else if (n === done + 1) cls.push('is-current');
			const stepsText = serializeSteps(row.steps) + anchorText(row.anchor) + loopText(row.loop, locale);
			const stitchCount = roundStitchCount(row);
			const item = list.createEl('button', { cls });
			item.type = 'button';
			item.setAttribute(
				'aria-label',
				t(locale, 'tool.rowAria', {
					row: row.num,
					steps: stepsText,
					count: stitchCount,
				}),
			);
			item.createSpan({ cls: 'crochet-tool-badge', text: `R${row.num}` });
			item.createSpan({ cls: 'crochet-tool-steps', text: stepsText });
			item.createSpan({
				cls: 'crochet-tool-count',
				text: t(locale, 'tool.stitchCount', { count: stitchCount }),
			});
			item.addEventListener('click', () => {
				advanceDone(n);
			});
		});

		const controls = root.createDiv({ cls: 'crochet-tool-controls' });
		const back = controls.createEl('button', { text: t(locale, 'tool.previous') });
		back.disabled = done <= 0;
		back.addEventListener('click', () => {
			advanceDone(Math.max(0, done - 1));
		});
		const next = controls.createEl('button', {
			cls: 'mod-cta',
			text: t(locale, 'tool.complete'),
		});
		next.disabled = done >= total;
		next.addEventListener('click', () => {
			advanceDone(Math.min(total, done + 1));
		});
		const reset = controls.createEl('button', { text: t(locale, 'tool.reset') });
		reset.addEventListener('click', () => {
			advanceDone(0);
		});

		onHighlightChange?.(currentRow ? { rowIndex: done, unitIndex: unitsDone } : undefined);
	};

	paint();
}

function configId(ast: CrochetAst, source: string): string {
	return progressIdFromConfig(ast.config.id, source);
}

function serializeSteps(steps: AstNode[]): string {
	return steps.map(serializeNode).join(', ');
}

function serializeNode(node: AstNode): string {
	if (node.type === 'StitchNode') {
		return node.count > 1 ? `${node.count} ${node.stitch}` : node.stitch;
	}
	if (node.type === 'GroupNode') {
		return `(${serializeSteps(node.children)})`;
	}
	return `[${serializeSteps(node.children)}] × ${node.count}`;
}

function anchorText(anchor: string | undefined): string {
	return anchor ? ` in ${anchor}` : '';
}

function loopText(loop: string | undefined, locale: Locale): string {
	if (loop === 'blo') return t(locale, 'tool.loop.blo');
	if (loop === 'flo') return t(locale, 'tool.loop.flo');
	return '';
}

function patternTitle(type: string, locale: Locale): string {
	if (type === 'round') return t(locale, 'tool.title.round');
	if (type === 'spiral') return t(locale, 'tool.title.spiral');
	if (type === 'flat') return t(locale, 'tool.title.flat');
	return type;
}

function unitWord(type: string, locale: Locale): string {
	return type === 'flat' ? t(locale, 'tool.rowUnit') : t(locale, 'tool.roundUnit');
}

function clamp(value: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, value));
}
