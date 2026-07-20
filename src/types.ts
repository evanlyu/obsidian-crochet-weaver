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
	// Background grid-guide overlay (see ChartGridGuide below).
	grid: boolean;
	// Explicit override for the guide's primary axis count: rounds for
	// type: round/spiral, rows for type: flat. Undefined means "match the
	// chart's real extent." Never applied below that real extent.
	gridCount?: number;
	// Explicit override for the guide's cross-axis (spokes/columns) count.
	// Undefined means "match the chart's real extent."
	gridColumns?: number;
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

// A turn between two flat rows, drawn as a straight line so the S-shaped
// back-and-forth working path reads clearly on the chart.
export interface RowConnector {
	x: number;
	fromY: number;
	toY: number;
}

// A background reference layer drawn behind a chart's real stitches: round
// guide rings/spokes for round and spiral charts, or a row/column mesh for
// flat charts. Shares its shape with the standalone crochet-grid block's
// geometry (GridCircle/GridLine) but is computed from the chart's own real
// layout, not a blank shape of its own.
export interface ChartGridGuide {
	circles: readonly GridCircle[];
	lines: readonly GridLine[];
}

export interface LayoutResult {
	items: RenderItem[];
	width: number;
	height: number;
	rowConnectors?: RowConnector[];
	gridGuide?: ChartGridGuide;
}

// Render options resolved from global settings and per-chart frontmatter.
export interface RenderOptions {
	scale: number;
	strokeWidth: number;
	highlightIncDec: boolean;
	chartMarkerColor: string;
}

// --- Blank drafting grid (crochet-grid block) ---
// A grid has no stitches; it is pure guide geometry sized by counts, not
// parsed pattern rows, so it uses its own small config/options/layout shapes
// instead of CrochetAst/LayoutOptions/LayoutResult.

export type GridShape = 'polar' | 'rect';

// Flat key:value config parsed from a crochet-grid block, mirroring how
// CrochetConfig's frontmatter values are always raw strings until resolved.
export type GridConfig = Record<string, string>;

// Grid options resolved from global settings and per-block config.
export interface ResolvedGridOptions {
	shape: GridShape;
	rounds: number;
	columns: number;
	rows: number;
	scale: number;
	strokeWidth: number;
	ringSpacing: number;
}

export interface GridCircle {
	cx: number;
	cy: number;
	r: number;
}

export interface GridLine {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface GridLayoutResult {
	width: number;
	height: number;
	circles: readonly GridCircle[];
	lines: readonly GridLine[];
}
