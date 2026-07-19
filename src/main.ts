import { getLanguage, Plugin, type Editor } from 'obsidian';
import { parseChart } from './parse-chart';
import { validateChartBudget, validateGridGuideBudget } from './budget';
import { calculateLayout } from './layout';
import { renderCrochetTool } from './tool';
import { renderCrochetError } from './errors';
import { renderGridError } from './grid/errors';
import { parseGridConfig } from './grid/parse';
import { resolveGridOptions } from './grid/options';
import { validateGridBudget } from './grid/budget';
import { calculateGridLayout } from './grid/layout';
import { renderGrid } from './grid/render';
import { resolveLocale, t, type Locale } from './i18n';
import { resolveOptions, resolvePanelOptions } from './options';
import { isSafeProgressId } from './progress-id';
import { renderEmbeddedChart } from './embed';
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
				const ast = parseChart(source);
				validateChartBudget(ast);
				const opts = resolveOptions(ast, this.settings);
				validateGridGuideBudget(ast.config.type, opts);
				const layout = calculateLayout(ast, opts);
				const locale = this.getLocale();
				const panel = resolvePanelOptions(ast, this.settings);
				renderEmbeddedChart(el, source, ast, layout, opts, panel, locale, this);
			} catch (error) {
				renderCrochetError(error, el, this.getLocale());
			}
		});

		this.registerMarkdownCodeBlockProcessor('crochet-tool', (source, el) => {
			renderCrochetTool(source, el, this, this.getLocale());
		});

		this.registerMarkdownCodeBlockProcessor('crochet-grid', (source, el) => {
			try {
				const config = parseGridConfig(source);
				const opts = resolveGridOptions(config, this.settings);
				validateGridBudget(opts);
				const layout = calculateGridLayout(opts);
				renderGrid(layout, el, opts, this.getLocale());
			} catch (error) {
				renderGridError(error, el, this.getLocale());
			}
		});

		this.addCommand({
			id: 'insert-crochet-grid',
			name: t(this.getLocale(), 'command.insertGrid'),
			editorCallback: (editor: Editor) => {
				const { gridDefaultShape, gridDefaultRounds, gridDefaultColumns, gridDefaultRows } = this.settings;
				const template = [
					'```crochet-grid',
					`shape: ${gridDefaultShape}`,
					`rounds: ${gridDefaultRounds}`,
					`columns: ${gridDefaultColumns}`,
					`rows: ${gridDefaultRows}`,
					'```',
					'',
				].join('\n');
				editor.replaceSelection(template);
			},
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
