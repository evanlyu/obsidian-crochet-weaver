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
			'panelPosition',
			'symbolRotation',
		]);
	});

	it('exposes localized setting definitions', () => {
		const definitions = getLocalizedSettingDefinitions('ja');

		expect(definitions[0]?.name).toBe('言語');
		expect(definitions[5]?.name).toBe('チャートの現在位置マーカー色');
		expect(definitions[6]?.name).toBe('進捗ツールを既定で表示');
		expect(definitions[7]?.name).toBe('編み図テキストを既定で表示');
		expect(definitions[8]?.name).toBe('パネルの位置');
		expect(definitions[9]?.name).toBe('輪編み記号の回転');
	});

	it('offers fine-grained numeric presets for chart settings', () => {
		expect(SCALE_OPTIONS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]);
		expect(STROKE_WIDTH_OPTIONS).toContain(1.75);
		expect(STROKE_WIDTH_OPTIONS).toContain(3.5);
		expect(RING_SPACING_OPTIONS).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
	});
});
