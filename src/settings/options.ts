import { LACE_SYMBOL_SCALE } from '../types';
import type {
	CrochetAst,
	LayoutOptions,
	PanelPosition,
	PatternTextStyle,
	RenderOptions,
} from '../types';
import { parseRoundStyle } from '../settings/data';
import type { CrochetWeaverSettings } from '../settings/tab';

export type ResolvedOptions = RenderOptions & LayoutOptions;

export interface PanelOptions {
	showTool: boolean;
	showText: boolean;
	position: PanelPosition;
	textStyle: PatternTextStyle;
}

export function resolveOptions(
	ast: CrochetAst,
	settings: CrochetWeaverSettings,
): ResolvedOptions {
	const config = ast.config;
	const style = config.style?.toLowerCase();
	const gridCountKey = config.type === 'flat' ? config.rows : config.rounds;
	return {
		roundStyle: parseRoundStyle(style) ?? settings.roundChartStyle,
		ringSpacing: positiveFloat(config.spacing) ?? settings.ringSpacing,
		scale: positiveFloat(config.scale) ?? settings.scale,
		strokeWidth: positiveFloat(config.stroke) ?? settings.strokeWidth,
		highlightIncDec: boolOption(config.highlight) ?? settings.highlightIncDec,
		highlightColor: settings.highlightColor,
		chartMarkerColor: settings.chartMarkerColor,
		grid: boolOption(config.grid) ?? settings.showGrid,
		lace: boolOption(config.lace) ?? false,
		sector: sectorDegrees(config.sector),
		wholeRounds: positiveInt(config.wholeRounds ?? config.whole),
		symbolScale: boolOption(config.lace) === true ? LACE_SYMBOL_SCALE : 1,
		gridCount: positiveInt(gridCountKey),
		gridColumns: positiveInt(config.columns),
	};
}

// "sector: 90" draws a ninety-degree wedge; "sector: on" draws a quarter, which
// is what a book usually prints. Anything else leaves the chart whole.
const DEFAULT_SECTOR = 90;

function sectorDegrees(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	if (boolOption(value) === true) return DEFAULT_SECTOR;
	const degrees = positiveFloat(value);
	return degrees !== undefined && degrees > 0 && degrees < 360 ? degrees : undefined;
}

export function resolvePanelOptions(
	ast: CrochetAst,
	settings: CrochetWeaverSettings,
): PanelOptions {
	const config = ast.config;
	const position = config.position?.toLowerCase();
	const readableOverride = boolOption(config.readable);
	return {
		showTool: boolOption(config.tool) ?? settings.showTool,
		showText: boolOption(config.text) ?? settings.showPatternText,
		position: isPanelPosition(position) ? position : settings.panelPosition,
		textStyle: readableOverride === undefined ? settings.patternTextStyle : readableOverride ? 'readable' : 'raw',
	};
}

function isPanelPosition(value: string | undefined): value is PanelPosition {
	return value === 'left' || value === 'right' || value === 'below';
}

function positiveFloat(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function positiveInt(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const numberValue = Number(value);
	return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function boolOption(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	const normalized = value.toLowerCase();
	if (normalized === 'true' || normalized === 'on' || normalized === 'yes' || normalized === '1') return true;
	if (normalized === 'false' || normalized === 'off' || normalized === 'no' || normalized === '0') return false;
	return undefined;
}
