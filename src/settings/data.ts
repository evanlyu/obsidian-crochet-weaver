import {
	normalizeLanguagePreference,
	t,
	type LanguagePreference,
	type Locale,
} from '../i18n';
import { isSafeProgressId } from '../panel/progress-id';
import type { PanelPosition, PatternTextStyle, RoundStyle } from '../types';
import type { GridShape } from '../grid/types';

export interface CrochetWeaverSettings {
	languagePreference: LanguagePreference;
	roundChartStyle: RoundStyle;
	scale: number;
	strokeWidth: number;
	ringSpacing: number;
	highlightIncDec: boolean;
	highlightColor: string;
	chartMarkerColor: string;
	showTool: boolean;
	showPatternText: boolean;
	patternTextStyle: PatternTextStyle;
	panelPosition: PanelPosition;
	showGrid: boolean;
	gridDefaultShape: GridShape;
	gridDefaultRounds: number;
	gridDefaultColumns: number;
	gridDefaultRows: number;
	progress: Record<string, number>;
	stitchProgress: Record<string, number>;
}

export const SCALE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3] as const;
export const STROKE_WIDTH_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4] as const;
export const RING_SPACING_OPTIONS = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80] as const;
export const GRID_ROUNDS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20] as const;
export const GRID_COLUMNS_OPTIONS = [4, 6, 8, 10, 12, 16, 18, 20, 24, 32, 36, 48] as const;
export const GRID_ROWS_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20] as const;

// The one setting that may be zero: zero is not "no spacing", it is "whatever
// the stitches need".
function parseRingSpacing(value: unknown): number | undefined {
	const spacing = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(spacing) && spacing >= 0 ? spacing : undefined;
}

export const DEFAULT_SETTINGS: CrochetWeaverSettings = {
	languagePreference: 'auto',
	roundChartStyle: 'radial',
	scale: 1,
	strokeWidth: 1.5,
	// 0: each round sits as far from the one below as its own stitches are
	// tall, which is what a pattern book draws (see layout/round.ts).
	ringSpacing: 0,
	highlightIncDec: false,
	highlightColor: '#8b5cf6',
	chartMarkerColor: '#f1c40f',
	showTool: false,
	showPatternText: false,
	patternTextStyle: 'raw',
	panelPosition: 'right',
	showGrid: false,
	gridDefaultShape: 'polar',
	gridDefaultRounds: 6,
	gridDefaultColumns: 12,
	gridDefaultRows: 6,
	progress: {},
	stitchProgress: {},
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface SettingDefinitionBase {
	readonly name: string;
	readonly desc: string;
}

interface DropdownSettingDefinition extends SettingDefinitionBase {
	readonly control: {
		readonly type: 'dropdown';
		readonly key: keyof Omit<CrochetWeaverSettings, 'progress' | 'stitchProgress'>;
		readonly defaultValue: string;
		readonly options: Record<string, string>;
	};
}

interface ToggleSettingDefinition extends SettingDefinitionBase {
	readonly control: {
		readonly type: 'toggle';
		readonly key: 'highlightIncDec' | 'showTool' | 'showPatternText' | 'showGrid';
		readonly defaultValue: boolean;
	};
}

interface ColorSettingDefinition extends SettingDefinitionBase {
	readonly control: {
		readonly type: 'color';
		readonly key: 'chartMarkerColor' | 'highlightColor';
		readonly defaultValue: string;
	};
}

export type CrochetSettingDefinition =
	| DropdownSettingDefinition
	| ToggleSettingDefinition
	| ColorSettingDefinition;

// A run of settings shown under one heading.
export interface CrochetSettingGroup {
	readonly id: 'chart' | 'shaping' | 'tool' | 'grid' | 'general';
	readonly heading: string;
	readonly items: readonly CrochetSettingDefinition[];
}

export const SETTING_DEFINITIONS = getLocalizedSettingDefinitions('en');

// The settings, in the order they are shown: grouped by what they affect, and
// the groups themselves ordered by how much of a chart they change — the look of
// every chart first, the panels beside it next, then the blank grid block, and
// last the things set once and left alone.
// The settings, in the order they are shown: grouped by what they affect, and
// the groups ordered by how often they are the reason someone opened this page —
// the language the plugin speaks and the reference to hand an AI first, then the
// look of every chart, the panels beside it, and the blank grid block last.
// The settings, in the order they are shown: grouped by what they affect, and
// the groups ordered by how much of a chart each one changes — the look of every
// chart first, the panels beside it next, then the blank grid block, and last the
// things set once and left alone.
export function getLocalizedSettingGroups(locale: Locale): readonly CrochetSettingGroup[] {
	return [
		{
			id: 'chart',
			heading: t(locale, 'settings.group.chart'),
			items: [
				{
					name: t(locale, 'settings.roundStyle.name'),
					desc: t(locale, 'settings.roundStyle.desc'),
					control: {
						type: 'dropdown',
						key: 'roundChartStyle',
						defaultValue: DEFAULT_SETTINGS.roundChartStyle,
						options: {
							radial: t(locale, 'settings.roundStyle.radial'),
							japanese: t(locale, 'settings.roundStyle.japanese'),
							continuous: t(locale, 'settings.roundStyle.continuous'),
						},
					},
				},
				{
					name: t(locale, 'settings.scale.name'),
					desc: t(locale, 'settings.scale.desc'),
					control: {
						type: 'dropdown',
						key: 'scale',
						defaultValue: String(DEFAULT_SETTINGS.scale),
						options: numberOptions(SCALE_OPTIONS),
					},
				},
				{
					name: t(locale, 'settings.stroke.name'),
					desc: t(locale, 'settings.stroke.desc'),
					control: {
						type: 'dropdown',
						key: 'strokeWidth',
						defaultValue: String(DEFAULT_SETTINGS.strokeWidth),
						options: numberOptions(STROKE_WIDTH_OPTIONS),
					},
				},
				{
					name: t(locale, 'settings.spacing.name'),
					desc: t(locale, 'settings.spacing.desc'),
					control: {
						type: 'dropdown',
						key: 'ringSpacing',
						defaultValue: String(DEFAULT_SETTINGS.ringSpacing),
						options: numberOptions(RING_SPACING_OPTIONS),
					},
				},
				{
					name: t(locale, 'settings.showGrid.name'),
					desc: t(locale, 'settings.showGrid.desc'),
					control: {
						type: 'toggle',
						key: 'showGrid',
						defaultValue: DEFAULT_SETTINGS.showGrid,
					},
				},
			],
		},
		{
			id: 'shaping',
			heading: t(locale, 'settings.group.shaping'),
			items: [
				{
					name: t(locale, 'settings.highlight.name'),
					desc: t(locale, 'settings.highlight.desc'),
					control: {
						type: 'toggle',
						key: 'highlightIncDec',
						defaultValue: DEFAULT_SETTINGS.highlightIncDec,
					},
				},
				{
					name: t(locale, 'settings.highlightColor.name'),
					desc: t(locale, 'settings.highlightColor.desc'),
					control: {
						type: 'color',
						key: 'highlightColor',
						defaultValue: DEFAULT_SETTINGS.highlightColor,
					},
				},
				{
					name: t(locale, 'settings.chartMarkerColor.name'),
					desc: t(locale, 'settings.chartMarkerColor.desc'),
					control: {
						type: 'color',
						key: 'chartMarkerColor',
						defaultValue: DEFAULT_SETTINGS.chartMarkerColor,
					},
				},
			],
		},
		{
			id: 'tool',
			heading: t(locale, 'settings.group.tool'),
			items: [
				{
					name: t(locale, 'settings.showTool.name'),
					desc: t(locale, 'settings.showTool.desc'),
					control: {
						type: 'toggle',
						key: 'showTool',
						defaultValue: DEFAULT_SETTINGS.showTool,
					},
				},
				{
					name: t(locale, 'settings.showPatternText.name'),
					desc: t(locale, 'settings.showPatternText.desc'),
					control: {
						type: 'toggle',
						key: 'showPatternText',
						defaultValue: DEFAULT_SETTINGS.showPatternText,
					},
				},
				{
					name: t(locale, 'settings.patternTextStyle.name'),
					desc: t(locale, 'settings.patternTextStyle.desc'),
					control: {
						type: 'dropdown',
						key: 'patternTextStyle',
						defaultValue: DEFAULT_SETTINGS.patternTextStyle,
						options: {
							raw: t(locale, 'settings.patternTextStyle.raw'),
							readable: t(locale, 'settings.patternTextStyle.readable'),
						},
					},
				},
				{
					name: t(locale, 'settings.panelPosition.name'),
					desc: t(locale, 'settings.panelPosition.desc'),
					control: {
						type: 'dropdown',
						key: 'panelPosition',
						defaultValue: DEFAULT_SETTINGS.panelPosition,
						options: {
							right: t(locale, 'settings.panelPosition.right'),
							left: t(locale, 'settings.panelPosition.left'),
							below: t(locale, 'settings.panelPosition.below'),
						},
					},
				},
			],
		},
		{
			id: 'grid',
			heading: t(locale, 'settings.group.grid'),
			items: [
				{
					name: t(locale, 'settings.gridDefaultShape.name'),
					desc: t(locale, 'settings.gridDefaultShape.desc'),
					control: {
						type: 'dropdown',
						key: 'gridDefaultShape',
						defaultValue: DEFAULT_SETTINGS.gridDefaultShape,
						options: {
							polar: t(locale, 'settings.gridDefaultShape.polar'),
							rect: t(locale, 'settings.gridDefaultShape.rect'),
						},
					},
				},
				{
					name: t(locale, 'settings.gridDefaultRounds.name'),
					desc: t(locale, 'settings.gridDefaultRounds.desc'),
					control: {
						type: 'dropdown',
						key: 'gridDefaultRounds',
						defaultValue: String(DEFAULT_SETTINGS.gridDefaultRounds),
						options: numberOptions(GRID_ROUNDS_OPTIONS),
					},
				},
				{
					name: t(locale, 'settings.gridDefaultColumns.name'),
					desc: t(locale, 'settings.gridDefaultColumns.desc'),
					control: {
						type: 'dropdown',
						key: 'gridDefaultColumns',
						defaultValue: String(DEFAULT_SETTINGS.gridDefaultColumns),
						options: numberOptions(GRID_COLUMNS_OPTIONS),
					},
				},
				{
					name: t(locale, 'settings.gridDefaultRows.name'),
					desc: t(locale, 'settings.gridDefaultRows.desc'),
					control: {
						type: 'dropdown',
						key: 'gridDefaultRows',
						defaultValue: String(DEFAULT_SETTINGS.gridDefaultRows),
						options: numberOptions(GRID_ROWS_OPTIONS),
					},
				},
			],
		},
		{
			id: 'general',
			heading: t(locale, 'settings.group.general'),
			items: [
				{
					name: t(locale, 'settings.language.name'),
					desc: t(locale, 'settings.language.desc'),
					control: {
						type: 'dropdown',
						key: 'languagePreference',
						defaultValue: DEFAULT_SETTINGS.languagePreference,
						options: languageOptions(locale),
					},
				},
			],
		},
	];
}

// The same settings as one flat list, for anything that wants them without their
// grouping.
export function getLocalizedSettingDefinitions(locale: Locale): readonly CrochetSettingDefinition[] {
	return getLocalizedSettingGroups(locale).flatMap((group) => group.items);
}

export function normalizeSettings(raw: unknown): CrochetWeaverSettings {
	const record = isRecord(raw) ? raw : {};
	return {
		languagePreference: normalizeLanguagePreference(record.languagePreference) ?? DEFAULT_SETTINGS.languagePreference,
		roundChartStyle: parseRoundStyle(record.roundChartStyle) ?? DEFAULT_SETTINGS.roundChartStyle,
		scale: parsePositiveNumber(record.scale) ?? DEFAULT_SETTINGS.scale,
		strokeWidth: parsePositiveNumber(record.strokeWidth) ?? DEFAULT_SETTINGS.strokeWidth,
		ringSpacing: parseRingSpacing(record.ringSpacing) ?? DEFAULT_SETTINGS.ringSpacing,
		highlightIncDec: parseBoolean(record.highlightIncDec) ?? DEFAULT_SETTINGS.highlightIncDec,
		chartMarkerColor: parseHexColor(record.chartMarkerColor) ?? DEFAULT_SETTINGS.chartMarkerColor,
		highlightColor: parseHexColor(record.highlightColor) ?? DEFAULT_SETTINGS.highlightColor,
		showTool: parseBoolean(record.showTool) ?? DEFAULT_SETTINGS.showTool,
		showPatternText: parseBoolean(record.showPatternText) ?? DEFAULT_SETTINGS.showPatternText,
		patternTextStyle: parsePatternTextStyle(record.patternTextStyle) ?? DEFAULT_SETTINGS.patternTextStyle,
		panelPosition: parsePanelPosition(record.panelPosition) ?? DEFAULT_SETTINGS.panelPosition,
		showGrid: parseBoolean(record.showGrid) ?? DEFAULT_SETTINGS.showGrid,
		gridDefaultShape: parseGridShape(record.gridDefaultShape) ?? DEFAULT_SETTINGS.gridDefaultShape,
		gridDefaultRounds: parsePositiveInteger(record.gridDefaultRounds) ?? DEFAULT_SETTINGS.gridDefaultRounds,
		gridDefaultColumns: parsePositiveInteger(record.gridDefaultColumns) ?? DEFAULT_SETTINGS.gridDefaultColumns,
		gridDefaultRows: parsePositiveInteger(record.gridDefaultRows) ?? DEFAULT_SETTINGS.gridDefaultRows,
		progress: normalizeProgress(record.progress),
		stitchProgress: normalizeProgress(record.stitchProgress),
	};
}

function languageOptions(locale: Locale): Record<LanguagePreference, string> {
	return {
		auto: t(locale, 'settings.language.auto'),
		en: t(locale, 'settings.language.en'),
		'zh-TW': t(locale, 'settings.language.zhTW'),
		'zh-CN': t(locale, 'settings.language.zhCN'),
		ja: t(locale, 'settings.language.ja'),
		ko: t(locale, 'settings.language.ko'),
		de: t(locale, 'settings.language.de'),
		fr: t(locale, 'settings.language.fr'),
		es: t(locale, 'settings.language.es'),
	};
}

function numberOptions(values: readonly number[]): Record<string, string> {
	const options: Record<string, string> = {};
	for (const value of values) options[String(value)] = String(value);
	return options;
}

// The three styles, and the names they used to go by. A chart or a saved setting
// written before they were renamed still means what it meant, so reading one
// never silently changes how a chart is drawn.
const ROUND_STYLES: readonly RoundStyle[] = ['radial', 'japanese', 'continuous'];
const RENAMED_ROUND_STYLES: Readonly<Record<string, RoundStyle>> = {
	standard: 'radial',
	book: 'japanese',
	linked: 'continuous',
};

export function parseRoundStyle(value: unknown): RoundStyle | undefined {
	if (typeof value !== 'string') return undefined;
	const name = value.trim().toLowerCase();
	return ROUND_STYLES.find((style) => style === name) ?? RENAMED_ROUND_STYLES[name];
}

function parsePositiveNumber(value: unknown): number | undefined {
	const numberValue = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
	return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	if (typeof value !== 'string') return undefined;
	const normalized = value.toLowerCase();
	if (normalized === 'true' || normalized === 'on' || normalized === 'yes' || normalized === '1') return true;
	if (normalized === 'false' || normalized === 'off' || normalized === 'no' || normalized === '0') return false;
	return undefined;
}

function parsePanelPosition(value: unknown): PanelPosition | undefined {
	return value === 'left' || value === 'right' || value === 'below' ? value : undefined;
}

function parsePatternTextStyle(value: unknown): PatternTextStyle | undefined {
	return value === 'raw' || value === 'readable' ? value : undefined;
}

function parseGridShape(value: unknown): GridShape | undefined {
	return value === 'polar' || value === 'rect' ? value : undefined;
}

function parsePositiveInteger(value: unknown): number | undefined {
	const numberValue = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
	return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function parseHexColor(value: unknown): string | undefined {
	return typeof value === 'string' && HEX_COLOR_PATTERN.test(value) ? value : undefined;
}

function normalizeProgress(value: unknown): Record<string, number> {
	const progress: Record<string, number> = {};
	if (!isRecord(value)) return progress;
	for (const [id, done] of Object.entries(value)) {
		if (!isSafeProgressId(id)) continue;
		const count = typeof done === 'number' ? done : Number(done);
		if (!Number.isFinite(count) || count < 0) continue;
		progress[id] = Math.trunc(count);
	}
	return progress;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
