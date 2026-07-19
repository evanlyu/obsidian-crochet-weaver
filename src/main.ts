import { getLanguage, Plugin } from 'obsidian';
// parser.ts is generated from grammar.peggy by `npm run generate-parser`.
import { parse } from './parser';
import { validateChartBudget } from './budget';
import { calculateLayout } from './layout';
import { renderSVG } from './render';
import { renderCrochetPatternText, renderCrochetTool } from './tool';
import { renderCrochetError } from './errors';
import { resolveLocale, type Locale } from './i18n';
import { resolveOptions, resolvePanelOptions } from './options';
import { isSafeProgressId } from './progress-id';
import type { ChartHighlight, CrochetAst } from './types';
import {
	CrochetWeaverSettingTab,
	normalizeSettings,
	type CrochetWeaverSettings,
} from './settings';

export default class CrochetWeaverPlugin extends Plugin {
	settings!: CrochetWeaverSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CrochetWeaverSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('crochet', (source, el) => {
			try {
				const ast = parse(source) as CrochetAst;
				validateChartBudget(ast);
				const opts = resolveOptions(ast, this.settings);
				const layout = calculateLayout(ast, opts);
				const locale = this.getLocale();
				const panel = resolvePanelOptions(ast, this.settings);
				if (panel.showTool) {
					const wrapper = el.createDiv({
						cls: `crochet-weaver-chart-row crochet-weaver-panel-${panel.position}`,
					});
					const chartContainer = wrapper.createDiv({ cls: 'crochet-weaver-chart-container' });
					const paintChart = (highlight: ChartHighlight | undefined) => {
						chartContainer.empty();
						renderSVG(layout, chartContainer, opts, locale, highlight);
					};
					renderCrochetTool(source, wrapper, this, locale, paintChart);
				} else if (panel.showText) {
					const wrapper = el.createDiv({
						cls: `crochet-weaver-chart-row crochet-weaver-panel-${panel.position}`,
					});
					const chartContainer = wrapper.createDiv({ cls: 'crochet-weaver-chart-container' });
					renderSVG(layout, chartContainer, opts, locale);
					renderCrochetPatternText(source, wrapper, locale);
				} else {
					renderSVG(layout, el, opts, locale);
				}
			} catch (error) {
				renderCrochetError(error, el, this.getLocale());
			}
		});

		this.registerMarkdownCodeBlockProcessor('crochet-tool', (source, el) => {
			renderCrochetTool(source, el, this, this.getLocale());
		});
	}

	getLocale(): Locale {
		return resolveLocale(this.settings.languagePreference, getLanguage());
	}

	getProgress(id: string): number {
		if (!isSafeProgressId(id) || !hasOwnProgress(this.settings.progress, id)) return 0;
		return this.settings.progress[id] ?? 0;
	}

	async setProgress(id: string, done: number): Promise<void> {
		if (!isSafeProgressId(id)) return;
		this.settings.progress[id] = Math.max(0, Math.trunc(done));
		await this.saveSettings();
	}

	getStitchProgress(id: string): number {
		if (!isSafeProgressId(id) || !hasOwnProgress(this.settings.stitchProgress, id)) return 0;
		return this.settings.stitchProgress[id] ?? 0;
	}

	async setStitchProgress(id: string, count: number): Promise<void> {
		if (!isSafeProgressId(id)) return;
		this.settings.stitchProgress[id] = Math.max(0, Math.trunc(count));
		await this.saveSettings();
	}

	async loadSettings() {
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function hasOwnProgress(progress: Record<string, number>, id: string): boolean {
	return Object.prototype.hasOwnProperty.call(progress, id);
}
