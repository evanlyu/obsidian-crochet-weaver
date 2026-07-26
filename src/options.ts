import type {
	CrochetAst,
	LayoutOptions,
	PanelPosition,
	PatternTextStyle,
	RenderOptions,
	RoundStyle,
	SymbolRotation,
} from './types';
import type { CrochetWeaverSettings } from './settings';

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
	const rotation = config.rotation?.toLowerCase();
	const style = config.style?.toLowerCase();
	const gridCountKey = config.type === 'flat' ? config.rows : config.rounds;
	return {
		rotation: isSymbolRotation(rotation) ? rotation : settings.symbolRotation,
		roundStyle: isRoundStyle(style) ? style : settings.roundChartStyle,
		ringSpacing: positiveFloat(config.spacing) ?? settings.ringSpacing,
		scale: positiveFloat(config.scale) ?? settings.scale,
		strokeWidth: positiveFloat(config.stroke) ?? settings.strokeWidth,
		highlightIncDec: boolOption(config.highlight) ?? settings.highlightIncDec,
		chartMarkerColor: settings.chartMarkerColor,
		grid: boolOption(config.grid) ?? settings.showGrid,
		gridCount: positiveInt(gridCountKey),
		gridColumns: positiveInt(config.columns),
	};
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

function isSymbolRotation(value: string | undefined): value is SymbolRotation {
	return value === 'smart' || value === 'all' || value === 'none';
}

function isRoundStyle(value: string | undefined): value is RoundStyle {
	return value === 'standard' || value === 'book' || value === 'linked';
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
