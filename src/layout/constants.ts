import {
	symbolExtent as baseSymbolExtent,
	symbolHalfHeight as baseSymbolHalfHeight,
	symbolHalfWidth as baseSymbolHalfWidth,
} from '../render/symbols';

// How big the symbols of the chart being laid out are drawn, as a multiple of
// their own size. One chart at a time is laid out, and every part of sizing it
// — ring lengths, minimum gaps, seam room, the bars of a drawn stitch — has to
// agree on this, so it is set once around the whole layout rather than passed
// through every function that measures anything.
let symbolScale = 1;

export function withSymbolScale<T>(scale: number, run: () => T): T {
	const previous = symbolScale;
	symbolScale = scale;
	try {
		return run();
	} finally {
		symbolScale = previous;
	}
}

// The extent of a symbol belongs with the symbol itself (see render/symbols.ts);
// this is that size at the scale the current chart draws it.
export function symbolExtent(symbol: string): number {
	return baseSymbolExtent(symbol) * symbolScale;
}

// How far across, and how far along, a symbol really reaches at that scale.
export function symbolHalfWidth(symbol: string): number {
	return baseSymbolHalfWidth(symbol) * symbolScale;
}

export function symbolHalfHeight(symbol: string): number {
	return baseSymbolHalfHeight(symbol) * symbolScale;
}

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


// The room one symbol takes along a round, as arc length in px: the chart's
// stitch pitch, or what this symbol really needs beside another of its kind,
// whichever is larger. Ring radii are sized from this rather than from a flat
// pitch per stitch, so a round of tall or wide symbols — a dc is 20px across
// where an sc is 12 — is drawn on a ring long enough to hold what it draws
// instead of being packed into one sized for single crochet.
export function symbolArc(symbol: string): number {
	return Math.max(MIN_ARC, 2 * symbolExtent(symbol) + SYMBOL_CLEARANCE);
}
