export const STITCH_WIDTH = 20;
export const ROW_HEIGHT = 30;
export const PADDING = 14;
export const GROUP_FAN_ANGLE = 18;
export const GROUP_FAN_SPREAD = 7;

export const BASE_RADIUS = 22;
export const MIN_ARC = STITCH_WIDTH;

// Breathing room left between two neighbouring symbols, on top of the space they
// actually occupy, in px.
export const SYMBOL_CLEARANCE = 2;

// How wide the round change at a seam is drawn, as arc length in px: the gap each
// band boundary leaves for the step out to the next round (layout/grid-guide.ts),
// which is also the room the seam reserves for it (layout/seam.ts). One constant
// for both, so the step and the space kept for it can never disagree.
export const ROUND_CHANGE_ARC = 5;

// How many chains a `ch ring` center is drawn with. The syntax carries no count
// ("in ch ring"), so unlike everything else about a chart's size this one is a
// drawn convention rather than a fact about the pattern — but the ring it is
// drawn on is sized from it and from how wide a chain really is, so the chains
// sit round it without touching whatever either of those becomes.
export const CH_RING_COUNT = 6;

export function chRingRadius(): number {
	return (CH_RING_COUNT * symbolArc('ch')) / (2 * Math.PI);
}

// Radius of the hollow ring drawn around the first stitch worked in a new
// yarn color, flagging the color change without covering the stitch symbol
// (a filled marker would hide it, and read as a second "current position"
// dot next to the progress tool's own highlight). Close enough to the
// symbol to read as "circling this stitch," not a loose halo around it.
export const COLOR_MARKER_RADIUS = 8;

// A chart text label (a book-style round number) is drawn centered, at the font
// size styles.css gives .crochet-weaver-round-number, in tabular figures — so
// its width follows the number itself rather than being assumed: "1" needs a
// fraction of the room "10" does, and a chart deep enough to reach three digits
// needs more again.
const LABEL_DIGIT_WIDTH = 5.5;

export function labelExtent(text: string): number {
	return (text.length * LABEL_DIGIT_WIDTH) / 2;
}

const SYMBOL_EXTENT: Record<string, number> = {
	'sl st': 3,
	sc: 6,
	ch: 6,
	MR: 6,
	inc: 6,
	dec: 6,
	rsc: 8,
	picot: 8,
	fpsc: 8,
	bpsc: 8,
	hdc: 9,
	bobble: 9,
	xhdc: 9,
	sc2tog: 9,
	sc3tog: 9,
	hdc2cl: 9,
	hdc3cl: 9,
	hdc5cl: 9,
	dc2cl: 9,
	dc3cl: 9,
	dc5cl: 9,
	'hdc popcorn': 9,
	dc: 10,
	popcorn: 10,
	fpdc: 10,
	bpdc: 10,
	fphdc: 10,
	bphdc: 10,
	xdc: 10,
	hdc2tog: 10,
	hdc3tog: 10,
	hdc4tog: 10,
	hdc5tog: 10,
	dc2tog: 10,
	dc3tog: 10,
	dc4tog: 10,
	dc5tog: 10,
	tr2cl: 10,
	tr3cl: 10,
	tr5cl: 10,
	tr: 11,
	xtr: 11,
	fptr: 12,
	bptr: 12,
	'tr popcorn': 12,
	dtr: 13,
};

export function symbolExtent(symbol: string): number {
	return SYMBOL_EXTENT[symbol] ?? 8;
}

// The room one symbol takes along a round, as arc length in px: the chart's
// stitch pitch, or what this symbol really needs beside another of its kind,
// whichever is larger. Ring radii are sized from this rather than from a flat
// pitch per stitch, so a round of tall or wide symbols — a dc is 20px across
// where an sc is 12 — is drawn on a ring long enough to hold what it draws
// instead of being packed into one sized for single crochet.
export function symbolArc(symbol: string): number {
	return Math.max(MIN_ARC, 2 * symbolExtent(symbol) + SYMBOL_CLEARANCE);
}
