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
	// null for a bare "rep": how many times it goes depends on the round below,
	// which the parser cannot see. resolveRepeats() fills it in before anything
	// else reads the chart.
	count: number | null;
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

// Where an embedded tool/text panel sits relative to its chart.
export type PanelPosition = 'left' | 'right' | 'below';

// How the progress tool and pattern-text panel display each row's steps:
// raw keeps the typed shorthand (e.g. "6 sc"); readable translates stitch
// abbreviations into full, localized names (e.g. "短針6").
export type PatternTextStyle = 'raw' | 'readable';

// Drawing style for type: round charts.
//
// standard: each round's units spread evenly around the circle, with the stock
// inc/dec glyphs (the original behavior).
//
// book and linked share one layout — separator circles enclose each round in
// its own band, every stitch is placed from the previous-round stitch it is
// worked into, and each round is numbered at the starting seam — and differ in
// how shaping is drawn:
//   book: as Japanese pattern books print it, the V of an increase and the ∧ of
//     a decrease standing in for the stitches they make, inside their own
//     round's band, in line with the plain stitches.
//   linked: every stitch keeps its own symbol, and lines are drawn from an
//     increase's or decrease's stitches to the stitch below they are worked
//     into — the correspondence spelled out rather than implied.
export type RoundStyle = 'standard' | 'book' | 'linked';

// Layout options resolved from global settings and per-chart frontmatter.
export interface LayoutOptions {
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
	// Identity of this stitch in the chart's stitch graph, and the
	// previous-round stitches it is worked into (see layout/graph.ts). Set by
	// graph-driven layouts (book-style round charts) so the rendered item can
	// be traced back to its ancestry; undefined elsewhere.
	stitchId?: string;
	sourceStitchIds?: readonly string[];
	// Set on the stitches an increase or decrease produced, so they can be
	// accented as shaping even though they render as ordinary stitch symbols
	// (the shaping itself is drawn by the matching ShapingConnector).
	shaping?: 'increase' | 'decrease';
}

// The V of an increase or the ∧ of a decrease: a stitch symbol of its own
// round, drawn in place of the stitches it makes, exactly as printed charts do.
// It spans its round's band — the pointed end sits on the inner edge, in line
// with the previous-round stitch it is worked into, and the open end reaches
// the outer edge at each stitch it produces, where the next round will be
// worked. Nothing crosses into a neighbouring round's band; the correspondence
// is shown by where the ends point, which is why this is computed from the
// round's final angles instead of being a fixed glyph.
//
// `segments` holds one or more polylines in chart coordinates. The usual
// two-on-one shaping is a single three-point polyline; wider shaping (an
// N-together) adds one two-point leg per extra stitch, meeting the same apex.
export interface ShapingMark {
	kind: 'increase' | 'decrease';
	segments: readonly (readonly GridPoint[])[];
	// The mark's own anchor on its round, and the outward angle there, so a
	// back-/front-loop marker faces the same way as the stitches around it.
	x: number;
	y: number;
	rotation: number;
	loop?: 'blo' | 'flo';
	// Which pattern step drew this, so it highlights with that step.
	rowIndex: number;
	unitIndex: number;
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
	shapingMarks?: ShapingMark[];
}

// Render options resolved from global settings and per-chart frontmatter.
export interface RenderOptions {
	scale: number;
	strokeWidth: number;
	highlightIncDec: boolean;
	// Color the increase and decrease symbols take when highlightIncDec is on.
	highlightColor: string;
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
