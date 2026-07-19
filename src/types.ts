// Abstract syntax tree types.
export interface CrochetConfig {
	type: string;
	[key: string]: string;
}

export interface StitchNode {
	type: 'StitchNode';
	stitch: string;
	count: number;
}

export interface GroupNode {
	type: 'GroupNode';
	children: AstNode[];
}

export interface RepeatNode {
	type: 'RepeatNode';
	count: number;
	children: AstNode[];
}

export type AstNode = StitchNode | GroupNode | RepeatNode;

export interface RowNode {
	type: 'Row';
	num: number;
	loop?: 'blo' | 'flo';
	steps: AstNode[];
	anchor?: 'MR' | 'ch ring';
}

export interface CrochetAst {
	type: 'CrochetChart';
	config: CrochetConfig;
	rows: RowNode[];
}

// Symbol rotation strategy for round and spiral charts.
// smart: tall stitches face outward, short and symmetric symbols stay upright.
export type SymbolRotation = 'smart' | 'all' | 'none';

// Where an embedded tool/text panel sits relative to its chart.
export type PanelPosition = 'left' | 'right' | 'below';

// Layout options resolved from global settings and per-chart frontmatter.
export interface LayoutOptions {
	rotation: SymbolRotation;
	ringSpacing: number;
	showNextRoundMarker: boolean;
}

// Render item list emitted by the layout engine.
//
// Rendering only needs to know which symbol to stamp, where its anchor is, and
// how far to rotate it. This keeps flat, round, and spiral layouts behind one
// data shape.
export interface RenderItem {
	symbol: string;
	x: number;
	y: number;
	rotation: number;
	loop?: 'blo' | 'flo';
	rowIndex?: number;
	unitIndex?: number;
}

// Which row/unit an embedded progress tool wants highlighted on its paired chart.
export interface ChartHighlight {
	rowIndex: number;
	unitIndex?: number;
}

export interface NextRoundMarker {
	x: number;
	y: number;
	rotation: number;
}

// A turn between two flat rows, drawn as a straight line so the S-shaped
// back-and-forth working path reads clearly on the chart.
export interface RowConnector {
	x: number;
	fromY: number;
	toY: number;
}

export interface LayoutResult {
	items: RenderItem[];
	width: number;
	height: number;
	nextRoundMarker?: NextRoundMarker;
	rowConnectors?: RowConnector[];
}

// Render options resolved from global settings and per-chart frontmatter.
export interface RenderOptions {
	scale: number;
	strokeWidth: number;
	highlightIncDec: boolean;
	nextRoundMarkerColor: string;
	chartMarkerColor: string;
}
