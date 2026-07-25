// Abstract syntax tree types.
export interface CrochetConfig {
	type: string;
	[key: string]: string;
}

export interface StitchNode {
	type: 'StitchNode';
	stitch: string;
	count: number;
	// Yarn color in effect at this stitch, set by unroll() from the nearest
	// preceding ColorChangeNode (in this row or an earlier one). Not set by
	// the parser itself.
	color?: string;
}

export interface GroupNode {
	type: 'GroupNode';
	children: AstNode[];
	// See StitchNode.color.
	color?: string;
}

export interface RepeatNode {
	type: 'RepeatNode';
	count: number;
	children: AstNode[];
}

// Mid-row yarn color change (e.g. "color white"). Carries no width of its
// own — layout.unroll() consumes it to tag the stitches that follow.
export interface ColorChangeNode {
	type: 'ColorChangeNode';
	color: string;
}

export type AstNode = StitchNode | GroupNode | RepeatNode | ColorChangeNode;

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

// How the progress tool and pattern-text panel display each row's steps:
// raw keeps the typed shorthand (e.g. "6 sc"); readable translates stitch
// abbreviations into full, localized names (e.g. "短針6").
export type PatternTextStyle = 'raw' | 'readable';

// Drawing style for type: round charts.
// standard: each round's units spread evenly around the circle (the original
// behavior). book: Japanese-pattern-book style — separator circles enclose
// each round in its own band, every stitch sits directly above the
// previous-round stitch it is worked into (an inc fans its two stitches out
// from the parent, a dec converges its parents), and each round is numbered
// at the starting seam.
export type RoundStyle = 'standard' | 'book';

// Layout options resolved from global settings and per-chart frontmatter.
export interface LayoutOptions {
	rotation: SymbolRotation;
	ringSpacing: number;
	// See RoundStyle; undefined behaves as 'standard'. Ignored by flat and
	// spiral charts.
	roundStyle?: RoundStyle;
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
	// Yarn color for this stitch (CSS color name or #hex), from a "color"
	// step earlier in this row or a previous one. Undefined means "use the
	// theme's default symbol color," same as before this feature existed.
	color?: string;
	// Book-style round charts: an explicit little polyline (offsets from this
	// item's own x/y, in chart px) drawn in place of the fixed glyph, so an
	// increase / decrease points at the actual stitches it connects to — its
	// apex toward the one stitch on the single side, its two arms toward the
	// two stitches on the split side. Computed per stitch from the real
	// neighbouring-round geometry (see layout/round.ts), which is why it is
	// not a symmetric stock symbol. Undefined renders the normal glyph.
	glyphPoints?: readonly GridPoint[];
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

// A point on an open guide polyline.
export interface GridPoint {
	x: number;
	y: number;
}

// A background reference layer drawn behind a chart's real stitches: round
// guide rings/spokes for round and spiral charts, or a row/column mesh for
// flat charts. Shares its shape with the standalone crochet-grid block's
// geometry (GridCircle/GridLine) but is computed from the chart's own real
// layout, not a blank shape of its own. `polylines` carries open curved
// guides (the book-style continuous round spiral); each is drawn as one
// stroked path.
export interface ChartGridGuide {
	circles: readonly GridCircle[];
	lines: readonly GridLine[];
	polylines?: readonly (readonly GridPoint[])[];
}

// Marks the first stitch worked in a new yarn color, drawn as a small flag
// so the change is legible even where the color itself isn't obvious (e.g.
// two similar shades, or a symbol whose color a viewer can't easily compare
// stitch-to-stitch at a glance).
export interface ColorMarker {
	x: number;
	y: number;
	color: string;
}

// A small text label stamped onto the chart (currently the per-round numbers
// drawn along the starting seam in book-style round charts).
export interface ChartLabel {
	x: number;
	y: number;
	text: string;
}

export interface LayoutResult {
	items: RenderItem[];
	width: number;
	height: number;
	rowConnectors?: RowConnector[];
	gridGuide?: ChartGridGuide;
	colorMarkers?: ColorMarker[];
	labels?: ChartLabel[];
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
