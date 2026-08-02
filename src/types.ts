// Abstract syntax tree types.
export interface CrochetConfig {
	type: string;
	[key: string]: string;
}

// What a step says it is worked into. Written patterns name the place rather
// than counting to it — "in next ch-2 sp" means "pass whatever is in between
// and use the next chain space" — so the target is kept as written and
// resolved against the round below when the graph is built.
//
// `same` reuses the place the previous step selected; `next` searches forward
// in the current working direction for the next place of that type;
// `shell-center` picks the middle stitch of the next shell of that size.
export type TargetSpec =
	| { kind: 'same'; type: string }
	| { kind: 'next'; type: string }
	| { kind: 'shell-center'; size: number };

// What a round's opening chain is worth. Resolved before anything reads the
// chart: a pattern says it outright ("ch 3 (counts as dc)"), or leaves it to
// the round's own join — closing to the top of the beginning chain means the
// chain stood in for a stitch.
export interface BeginningChain {
	counts: boolean;
	// The stitch it replaces, where the pattern named one.
	as?: string;
}

export interface StitchNode {
	type: 'StitchNode';
	stitch: string;
	count: number;
	// Set on the chain a round opens with. A chain is still a chain — it is
	// drawn as the chains it is — so this rides along rather than replacing it
	// with a node of its own.
	beginning?: BeginningChain;
	// Yarn color in effect at this stitch, set by unroll() from the nearest
	// preceding ColorChangeNode (in this row or an earlier one). Not set by
	// the parser itself.
	color?: string;
	// Where this step is worked, when the pattern says so.
	target?: TargetSpec;
	// Set on the slip stitches that are instructions rather than fabric: the
	// one a round closes with, and the one worked only to move to where the
	// round starts. Both are drawn; neither is worked into.
	instruction?: 'join' | 'reposition';
	// Set when a quantity and a target were written as one instruction ("5 dc in
	// next ch-2 sp"): the whole quantity shares one source and is drawn as one
	// motif, so unrolling must not split it into five independent stitches.
	motif?: boolean;
}

export interface GroupNode {
	type: 'GroupNode';
	children: AstNode[];
	// See StitchNode.color.
	color?: string;
	// See StitchNode.target.
	target?: TargetSpec;
	// The shorthand this group was written as, kept so the chart can name it
	// back ("V2") even though the graph works from the stitches it expands to.
	alias?: string;
}

// The slip stitch a round closes with, and what it closes to. Drawn, worth
// nothing, and the place the next round starts from.
export interface JoinNode {
	type: 'JoinNode';
	target: 'beginning-ch' | 'first-sc' | 'join';
}

// A slip stitch worked only to get to where the round really starts. It moves
// the working place and consumes nothing.
export interface RepositionNode {
	type: 'RepositionNode';
	target: TargetSpec;
}

// Turning the work over. Written at the start of the round it applies to.
export interface TurnNode {
	type: 'TurnNode';
}

// Explicitly passing over places of the round below.
export interface SkipNode {
	type: 'SkipNode';
	count: number;
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

export type AstNode =
	| StitchNode
	| GroupNode
	| RepeatNode
	| ColorChangeNode
	| JoinNode
	| RepositionNode
	| TurnNode
	| SkipNode;

// A round's written stitch count, as the pattern states it: "(24 dc)",
// "(24 sc + 24 ch-1 sp = 48 sts)", "(12 reps, 4 sts per rep)". Checked against
// what the round is actually worth, which is why it is kept rather than
// discarded as prose.
export interface CountAnnotation {
	total: number;
	reps?: number;
	perRep?: number;
	text: string;
}

// A round written as "R13: repeat R11." — a source convenience, expanded into a
// real round before anything reads the chart.
export interface RowRepeatNode {
	type: 'RowRepeat';
	from: number;
	to: number;
	sourceFrom: number;
	sourceTo: number;
}

export interface RowNode {
	type: 'Row';
	num: number;
	loop?: 'blo' | 'flo';
	steps: AstNode[];
	anchor?: 'MR' | 'ch ring';
	// Set when the round opens by turning the work.
	turn?: boolean;
	count?: CountAnnotation;
	// Where an expanded round was copied from.
	source?: { repeatOf: number };
}

export interface CrochetAst {
	type: 'CrochetChart';
	config: CrochetConfig;
	rows: RowNode[];
}

// What the parser returns before source repeats are expanded (see
// pattern/expand.ts). Nothing outside that step sees a RowRepeatNode.
export interface RawCrochetAst {
	type: 'CrochetChart';
	config: CrochetConfig;
	rows: (RowNode | RowRepeatNode)[];
}

// Where an embedded tool/text panel sits relative to its chart.
export type PanelPosition = 'left' | 'right' | 'below';

// How the progress tool and pattern-text panel display each row's steps:
// raw keeps the typed shorthand (e.g. "6 sc"); readable translates stitch
// abbreviations into full, localized names (e.g. "短針6").
export type PatternTextStyle = 'raw' | 'readable';

// Drawing style for type: round charts, named for what the finished chart is.
//
// radial: each round's units spread evenly around the circle, so the chart reads
// as spokes out from the centre, with the stock inc/dec glyphs. What a round
// contains, not which stitch is worked into which.
//
// japanese and continuous share one layout — separator circles enclose each
// round in its own band, every stitch is placed from the previous-round stitch
// it is worked into, and each round is numbered at the starting seam — and
// differ in how shaping is drawn:
//   japanese: as pattern books print it, the V of an increase and the ∧ of a
//     decrease standing in for the stitches they make, inside their own round's
//     band, in line with the plain stitches.
//   continuous: every stitch keeps its own symbol, and lines are drawn from an
//     increase's or decrease's stitches to the stitch below they are worked
//     into, so the fabric reads as one continuous run from round to round —
//     the correspondence spelled out rather than implied.
export type RoundStyle = 'radial' | 'japanese' | 'continuous';

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
	// Draw only a wedge of a round chart, in degrees, instead of the whole
	// circle. A pattern whose rounds are the same motif twelve times over says
	// everything it has to say in one slice of itself, which is how a book
	// prints it: the piece is drawn as a fan, not as a full disc.
	sector?: number;
	// How many rounds a chart draws entire before it starts showing only that
	// wedge. The middle of a piece is where the pattern is set up and every
	// round is different, so a book draws it whole and fans out only once the
	// rounds have settled into the same motif over and over.
	wholeRounds?: number;
	// Draw the chart the way a pattern book prints lace: no band lines around
	// the rounds, no round numbers, and the symbols drawn larger against the
	// openwork so the motifs read at a glance. What the chart is made of does
	// not change — only what is drawn around it.
	lace?: boolean;
}

// How much bigger than its own size a symbol is drawn in lace charts. Book
// charts print lace open and its symbols large; at their ordinary size they
// disappear into the space around a motif.
export const LACE_SYMBOL_SCALE = 1.45;

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
	// How big this symbol is drawn against its own size. 1 everywhere except
	// where several symbols have to share the room of one: the chains a round
	// opens with stand one above the next inside that round's band, standing in
	// for the one stitch they replace, so they are drawn to fit it.
	scale?: number;

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

// One stitch of a fan, drawn as the lines it is made of rather than stamped
// from the shared symbol library.
//
// A group worked into one place — a shell, a V-stitch — is not a row of
// stitches side by side: every stitch of it starts at that one place and
// reaches out to its own head, so each is a different length and leans a
// different way. A stamped symbol is one fixed size and cannot do that, so
// these are drawn: the stem from foot to head, and the bars that say which
// stitch it is. Each is still one stitch — its own id, its own step, its own
// place in the count — so it highlights and counts like any other.
export interface MotifStitch {
	symbol: string;
	// Stem first, then its bars, in chart coordinates.
	segments: readonly (readonly GridPoint[])[];
	// Where the stitch's head is, and which way it leans there, so a loop
	// marker sits on it the way it sits on a stamped stitch.
	x: number;
	y: number;
	rotation: number;
	rowIndex: number;
	unitIndex: number;
	stitchId?: string;
	sourceStitchIds?: readonly string[];
	color?: string;
	loop?: 'blo' | 'flo';
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
	motifStitches?: MotifStitch[];
}

// Render options resolved from global settings and per-chart frontmatter.
export interface RenderOptions {
	scale: number;
	strokeWidth: number;
	highlightIncDec: boolean;
	// Color the increase and decrease symbols take when highlightIncDec is on.
	highlightColor: string;
	chartMarkerColor: string;
	// How big the stamped symbols are drawn, as a multiple of their own size.
	// Matches what the layout measured them at (see layout/constants.ts).
	symbolScale?: number;
}
