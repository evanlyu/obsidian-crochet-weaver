import { describe, expect, it } from 'vitest';
import {
	DEFAULT_SETTINGS,
	RING_SPACING_OPTIONS,
	SCALE_OPTIONS,
	SETTING_DEFINITIONS,
	STROKE_WIDTH_OPTIONS,
	getLocalizedSettingDefinitions,
	normalizeSettings,
} from '../src/settings-data';

describe('plugin settings', () => {
	it('normalizes malformed persisted settings to safe values', () => {
		const raw: unknown = JSON.parse(`{
			"symbolRotation": "sideways",
			"languagePreference": "ja",
			"scale": "1.25",
			"strokeWidth": "nope",
			"ringSpacing": 40,
			"highlightIncDec": "yes",
			"progress": {
				"scarf": 2,
				"bad": -1,
				"__proto__": 3,
				"constructor": 4,
				"nan": "oops"
			}
		}`);

		expect(normalizeSettings(raw)).toEqual({
			...DEFAULT_SETTINGS,
			scale: 1.25,
			languagePreference: 'ja',
			ringSpacing: 40,
			highlightIncDec: true,
			progress: { scarf: 2 },
		});
	});

	it('accepts a valid persisted chart marker color and normalizes an invalid one', () => {
		expect(normalizeSettings({ chartMarkerColor: '#2f9e44' }).chartMarkerColor).toBe('#2f9e44');
		expect(normalizeSettings({ chartMarkerColor: 'blue' }).chartMarkerColor).toBe(
			DEFAULT_SETTINGS.chartMarkerColor,
		);
		expect(normalizeSettings({}).chartMarkerColor).toBe(DEFAULT_SETTINGS.chartMarkerColor);
	});

	it('normalizes the panel settings', () => {
		expect(normalizeSettings({ showTool: 'yes' }).showTool).toBe(true);
		expect(normalizeSettings({ showTool: 'nope' }).showTool).toBe(DEFAULT_SETTINGS.showTool);
		expect(normalizeSettings({ showPatternText: true }).showPatternText).toBe(true);
		expect(normalizeSettings({ showPatternText: 'nope' }).showPatternText).toBe(DEFAULT_SETTINGS.showPatternText);
		expect(normalizeSettings({ panelPosition: 'left' }).panelPosition).toBe('left');
		expect(normalizeSettings({ panelPosition: 'below' }).panelPosition).toBe('below');
		expect(normalizeSettings({ panelPosition: 'sideways' }).panelPosition).toBe(DEFAULT_SETTINGS.panelPosition);
		expect(normalizeSettings({}).panelPosition).toBe(DEFAULT_SETTINGS.panelPosition);
		expect(normalizeSettings({ showGrid: 'on' }).showGrid).toBe(true);
		expect(normalizeSettings({ showGrid: 'nope' }).showGrid).toBe(DEFAULT_SETTINGS.showGrid);
		expect(normalizeSettings({ patternTextStyle: 'readable' }).patternTextStyle).toBe('readable');
		expect(normalizeSettings({ patternTextStyle: 'fancy' }).patternTextStyle).toBe(
			DEFAULT_SETTINGS.patternTextStyle,
		);
		expect(normalizeSettings({}).patternTextStyle).toBe(DEFAULT_SETTINGS.patternTextStyle);
		expect(normalizeSettings({ roundChartStyle: 'book' }).roundChartStyle).toBe('book');
		expect(normalizeSettings({ roundChartStyle: 'comic' }).roundChartStyle).toBe(
			DEFAULT_SETTINGS.roundChartStyle,
		);
		expect(normalizeSettings({}).roundChartStyle).toBe(DEFAULT_SETTINGS.roundChartStyle);
	});

	it('exposes settings definitions for Obsidian settings search', () => {
		const controls = SETTING_DEFINITIONS.map((definition) => definition.control.key);

		expect(controls).toEqual([
			'languagePreference',
			'scale',
			'strokeWidth',
			'ringSpacing',
			'highlightIncDec',
			'chartMarkerColor',
			'showTool',
			'showPatternText',
			'patternTextStyle',
			'panelPosition',
			'showGrid',
			'symbolRotation',
			'roundChartStyle',
			'gridDefaultShape',
			'gridDefaultRounds',
			'gridDefaultColumns',
			'gridDefaultRows',
		]);
	});

	it('exposes localized setting definitions', () => {
		const definitions = getLocalizedSettingDefinitions('ja');

		expect(definitions[0]?.name).toBe('言語');
		expect(definitions[5]?.name).toBe('チャートの現在位置マーカー色');
		expect(definitions[6]?.name).toBe('進捗ツールを既定で表示');
		expect(definitions[7]?.name).toBe('編み図テキストを既定で表示');
		expect(definitions[8]?.name).toBe('パターン文字の表示方法');
		expect(definitions[9]?.name).toBe('パネルの位置');
		expect(definitions[10]?.name).toBe('背景の参考グリッドを表示');
		expect(definitions[11]?.name).toBe('輪編み記号の回転');
		expect(definitions[12]?.name).toBe('輪編みチャートのスタイル');
		expect(definitions[13]?.name).toBe('グリッドの既定の形状');
		expect(definitions[14]?.name).toBe('グリッドの既定の周数');
		expect(definitions[15]?.name).toBe('グリッドの既定の列数');
		expect(definitions[16]?.name).toBe('グリッドの既定の行数');
	});

	it('normalizes malformed grid default settings', () => {
		expect(normalizeSettings({ gridDefaultShape: 'rect' }).gridDefaultShape).toBe('rect');
		expect(normalizeSettings({ gridDefaultShape: 'triangle' }).gridDefaultShape).toBe(
			DEFAULT_SETTINGS.gridDefaultShape,
		);
		expect(normalizeSettings({ gridDefaultRounds: '8' }).gridDefaultRounds).toBe(8);
		expect(normalizeSettings({ gridDefaultRounds: -3 }).gridDefaultRounds).toBe(
			DEFAULT_SETTINGS.gridDefaultRounds,
		);
		expect(normalizeSettings({ gridDefaultColumns: 1.5 }).gridDefaultColumns).toBe(
			DEFAULT_SETTINGS.gridDefaultColumns,
		);
		expect(normalizeSettings({ gridDefaultRows: 10 }).gridDefaultRows).toBe(10);
		expect(normalizeSettings({}).gridDefaultRows).toBe(DEFAULT_SETTINGS.gridDefaultRows);
	});

	it('offers fine-grained numeric presets for chart settings', () => {
		expect(SCALE_OPTIONS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]);
		expect(STROKE_WIDTH_OPTIONS).toContain(1.75);
		expect(STROKE_WIDTH_OPTIONS).toContain(3.5);
		expect(RING_SPACING_OPTIONS).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
	});
});
