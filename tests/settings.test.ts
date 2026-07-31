import { describe, expect, it } from 'vitest';
import {
	DEFAULT_SETTINGS,
	RING_SPACING_OPTIONS,
	SCALE_OPTIONS,
	SETTING_DEFINITIONS,
	STROKE_WIDTH_OPTIONS,
	getLocalizedSettingDefinitions,
	getLocalizedSettingGroups,
	normalizeSettings,
} from '../src/settings/data';

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
		expect(normalizeSettings({ roundChartStyle: 'japanese' }).roundChartStyle).toBe('japanese');
		expect(normalizeSettings({ roundChartStyle: 'comic' }).roundChartStyle).toBe(
			DEFAULT_SETTINGS.roundChartStyle,
		);
		expect(normalizeSettings({}).roundChartStyle).toBe(DEFAULT_SETTINGS.roundChartStyle);
	});

	// Grouped by what they affect, and the groups ordered by how much of a chart
	// they change: the look of every chart first, the panels beside it next, the
	// blank grid block after that, and the set-once things last.
	it('exposes settings definitions for Obsidian settings search, grouped and in order', () => {
		const groups = getLocalizedSettingGroups('en');

		expect(groups.map((group) => group.id)).toEqual(['chart', 'shaping', 'tool', 'grid', 'general']);
		expect(groups.map((group) => group.items.map((definition) => definition.control.key))).toEqual([
			['roundChartStyle', 'scale', 'strokeWidth', 'ringSpacing', 'showGrid'],
			['highlightIncDec', 'highlightColor', 'chartMarkerColor'],
			['showTool', 'showPatternText', 'patternTextStyle', 'panelPosition'],
			['gridDefaultShape', 'gridDefaultRounds', 'gridDefaultColumns', 'gridDefaultRows'],
			['languagePreference'],
		]);
		// Every setting sits in exactly one group, and the flat list is those
		// groups read straight through.
		expect(SETTING_DEFINITIONS.map((definition) => definition.control.key)).toEqual(
			groups.flatMap((group) => group.items.map((definition) => definition.control.key)),
		);
	});

	it('exposes localized setting definitions', () => {
		const definitions = getLocalizedSettingDefinitions('ja');

		expect(definitions[0]?.name).toBe('輪編みチャートのスタイル');
		expect(definitions[4]?.name).toBe('背景の参考グリッドを表示');
		expect(definitions[6]?.name).toBe('増し目・減らし目の色');
		expect(definitions[7]?.name).toBe('チャートの現在位置マーカー色');
		expect(definitions[8]?.name).toBe('進捗ツールを既定で表示');
		expect(definitions[12]?.name).toBe('グリッドの既定の形状');
		expect(definitions.at(-1)?.name).toBe('言語');
		expect(getLocalizedSettingGroups('ja').map((group) => group.heading)).toEqual([
			'チャートの見た目',
			'強調表示と色',
			'進捗ツールとパネル',
			'方眼シートの既定値',
			'一般',
		]);
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
