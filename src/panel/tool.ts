import type { AstNode, ChartHighlight, CrochetAst, PatternTextStyle, RowNode, StitchNode, TargetSpec } from '../types';
import { parseChart } from '../pattern/parse-chart';
import { validateChartBudget } from '../pattern/budget';
import { rowWrittenCount, writtenUnitWeights } from '../pattern/count';
import { renderCrochetError } from '../pattern/errors';
import { stitchName, t, type Locale } from '../i18n';
import { progressIdFromConfig } from '../panel/progress-id';

export interface ProgressStore {
	getProgress(id: string): number;
	setProgress(id: string, done: number): Promise<void>;
	getStitchProgress(id: string): number;
	setStitchProgress(id: string, count: number): Promise<void>;
}

export function renderCrochetPatternText(
	source: string,
	el: HTMLElement,
	locale: Locale = 'en',
	textStyle: PatternTextStyle = 'raw',
) {
	let ast: CrochetAst;
	try {
		ast = parseChart(source);
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
		const stepsText = rowStepsText(row, locale, textStyle);
		const stitchCount = rowWrittenCount(row);
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
	textStyle: PatternTextStyle = 'raw',
	onHighlightChange?: (target: ChartHighlight | undefined) => void,
) {
	let ast: CrochetAst;
	try {
		ast = parseChart(source);
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
		const unitWeights = currentRow ? writtenUnitWeights(currentRow) : [];
		const totalUnits = unitWeights.length;
		const unitsDone = currentRow ? clamp(store.getStitchProgress(id), 0, totalUnits) : 0;
		const rowTotal = currentRow ? rowWrittenCount(currentRow) : 0;
		// A position stored before this row's total changed — a round whose
		// ordinary chains now count, say — is read back against what the row is
		// worth now, rather than left pointing past the end of it.
		const stitchesDone = clamp(
			unitWeights.slice(0, unitsDone).reduce((sum, weight) => sum + weight, 0),
			0,
			rowTotal,
		);

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
			subtract.setAttribute('aria-label', stitchSubtractLabel(locale, prevWeight ?? 1));
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
			add.setAttribute('aria-label', stitchAddLabel(locale, nextWeight));
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

			const resetAll = controlsRow.createEl('button', {
				cls: 'crochet-tool-stitch-reset-all',
				text: t(locale, 'tool.resetAll'),
			});
			resetAll.type = 'button';
			resetAll.addEventListener('click', () => {
				advanceDone(0);
			});
		}

		const list = root.createDiv({ cls: 'crochet-tool-list' });
		rows.forEach((row, i) => {
			const n = i + 1;
			const cls = ['crochet-tool-row'];
			if (n <= done) cls.push('is-done');
			else if (n === done + 1) cls.push('is-current');
			const stepsText = rowStepsText(row, locale, textStyle);
			const stitchCount = rowWrittenCount(row);
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

function serializeSteps(steps: AstNode[], locale: Locale, style: PatternTextStyle): string {
	return steps.map((node) => serializeNode(node, locale, style)).join(', ');
}

function serializeNode(node: AstNode, locale: Locale, style: PatternTextStyle): string {
	switch (node.type) {
		case 'StitchNode': {
			const stitch = style === 'readable'
				? `${stitchName(locale, node.stitch)}${node.count}`
				: node.count > 1 ? `${node.count} ${node.stitch}` : node.stitch;
			return withBeginning(withTarget(stitch, node.target, locale, style), node, locale, style);
		}
		case 'GroupNode': {
			// A V-stitch is written back as the shorthand it was written as; the
			// stitches it stands for are still what the chart draws.
			const group = node.alias ?? `(${serializeSteps(node.children, locale, style)})`;
			return withTarget(group, node.target, locale, style);
		}
		case 'ColorChangeNode':
			return t(locale, 'tool.colorChange', { color: node.color });
		case 'TurnNode':
			return style === 'readable' ? t(locale, 'tool.turn') : 'turn';
		case 'JoinNode':
			if (style === 'readable') return t(locale, 'tool.join');
			if (node.target === 'beginning-ch') return 'sl st to top of beginning ch';
			return node.target === 'first' ? `sl st to first ${node.stitch ?? 'st'}` : 'sl st to join';
		case 'RepositionNode':
			return style === 'readable'
				? t(locale, 'tool.reposition', { target: targetText(node.target, locale, style) })
				: `sl st into ${rawTarget(node.target)}`;
		case 'SkipNode':
			return style === 'readable' ? t(locale, 'tool.skip', { count: node.count }) : `skip ${node.count}`;
		case 'RepeatNode':
			return `[${serializeSteps(node.children, locale, style)}] × ${node.count}`;
	}
}

function withTarget(step: string, target: TargetSpec | undefined, locale: Locale, style: PatternTextStyle): string {
	if (target === undefined) return step;
	if (style === 'raw') return `${step} in ${rawTarget(target)}`;
	return t(locale, 'tool.into', { step, target: targetText(target, locale, style) });
}

// A beginning chain is written back with what it is worth, so the panel says
// the same thing the pattern did.
function withBeginning(step: string, node: StitchNode, locale: Locale, style: PatternTextStyle): string {
	if (node.beginning === undefined) return step;
	if (style === 'raw') return `${step} (${node.beginning.counts ? `counts as ${node.beginning.as ?? 'a st'}` : 'does not count as a st'})`;
	return t(locale, node.beginning.counts ? 'tool.beginning.counts' : 'tool.beginning.free', { step });
}

// What the pattern wrote, back as it was written.
function rawTarget(target: TargetSpec): string {
	if (target.kind === 'shell-center') return `center dc of next ${target.size}-dc shell`;
	return `${target.kind} ${target.type}`;
}

function targetText(target: TargetSpec, locale: Locale, style: PatternTextStyle): string {
	if (target.kind === 'shell-center') {
		return t(locale, 'tool.target.shellCenter', { size: target.size });
	}
	const type = placeName(target.type, locale, style);
	return t(locale, target.kind === 'same' ? 'tool.target.same' : 'tool.target.next', { type });
}

function placeName(type: string, locale: Locale, style: PatternTextStyle): string {
	const chains = /^ch-(\d+) sp$/.exec(type);
	if (chains !== null) return t(locale, 'tool.chainSpace', { chains: Number(chains[1]) });
	if (type === 'st') return t(locale, 'tool.place.st');
	if (type === 'sp') return t(locale, 'tool.place.sp');
	return style === 'readable' ? stitchName(locale, type) : type;
}

// Readable style leads with the anchor and wraps the row's steps in
// parens — "魔術環(短針5)" — rather than trailing it the way raw shorthand
// does ("5 sc in MR"), since that reads more naturally once translated.
function rowStepsText(row: RowNode, locale: Locale, style: PatternTextStyle): string {
	const steps = serializeSteps(row.steps, locale, style);
	const loop = loopText(row.loop, locale);
	if (style === 'readable' && row.anchor) {
		return `${stitchName(locale, row.anchor)}(${steps})${loop}`;
	}
	return steps + anchorText(row.anchor) + loop;
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

function stitchAddLabel(locale: Locale, count: number): string {
	return count === 1 ? t(locale, 'tool.stitchAddOne') : t(locale, 'tool.stitchAddMany', { count });
}

function stitchSubtractLabel(locale: Locale, count: number): string {
	return count === 1 ? t(locale, 'tool.stitchSubtractOne') : t(locale, 'tool.stitchSubtractMany', { count });
}

function clamp(value: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, value));
}
