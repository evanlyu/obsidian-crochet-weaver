import { arcToDegrees } from './angles';
import {
	labelExtent,
	OPENING_TURN_SCALE,
	ROUND_CHANGE_ARC,
	symbolExtent,
	symbolHalfHeight,
	symbolHalfWidth,
} from './constants';

// The seam of a round: the wrap-around gap between its last stitch and its
// first, where one round becomes the next.
//
// Everything drawn there has to fit beside everything else drawn there, so the
// seam is not just "wherever the round happened to end". It is a budget of arc,
// spent walking from the closing side of the round to the opening side (angles
// decrease with working order, see layout/angles.ts):
//
//   last stitch │ join │ step out │ round number │ chain │ first stitch
//
// The round's stitches are kept out of the whole gap — the same budget is what
// the layout asks for as the minimum wrap-around gap — which is what stops a
// stitch being drawn over the round number or across the step where the round
// changes.
//
// Every slot is measured from what that round really draws in it: a chain takes
// a chain's width and a slip stitch a slip stitch's, however many of either the
// round is written with, and the number takes as much room as its own digits
// need. Nothing here is per-round or per-stitch — a round with no chain and no
// join simply has no slot for them.

// Air between two things drawn at the seam, in px: one gap between each pair,
// not a margin around each of them. Padding both sides of everything charged
// the seam for the same gap twice and made the wedge half again as wide as what
// it holds — on a first round of six stitches that was a third of the ring
// spent on air, and (since every round above inherits the angle) a corridor
// that wide all the way out. The number sits beside the round change with a
// gap, and the stitches either side of the seam with a gap, and that is all the
// room the seam takes beyond what it draws.
const SEAM_AIR = 2;

// The step out to the next round's band: the width it is drawn at. It is drawn
// nearly radially, so it needs no more than that.
const STEP_ARC = ROUND_CHANGE_ARC;

// The seam is given the arc its contents ask for, because they are drawn at
// their own size whatever room they are given: a gap capped below their asking
// does not draw them smaller, it draws them over each other and over the
// stitches either side of the gap. Rings are sized to hold the seam as well as
// the stitches (see roundCircumference), so a round that asks honestly is
// already round enough to pay — a first round of six stitches spends a wide
// wedge on its chain, its join and its number because at that radius that is
// what they measure, which is how a book draws it too.
//
// The cap that remains is a ceiling against the absurd, not a budget: whatever
// a round is written as, the seam may not take half the chart.
const MAX_SEAM_GAP_DEG = 180;

// What a round draws at its seam. Symbols rather than counts, so each one is
// given the room it actually takes; `label` is the round number, absent in the
// styles that draw none.
export interface SeamContents {
	// The stitches the seam sits between — the round's last and its first. A
	// stitch's angle is the middle of its symbol, so half of each reaches into
	// the gap; the seam leaves room for that before anything else goes in it.
	lastStitch: string;
	firstStitch: string;
	// The chain(s) the round opens with and the slip stitch(es) it closes with.
	start: readonly string[];
	end: readonly string[];
	label?: string;
	// Set on a lace round, where what sits at the seam is measured across rather
	// than along. A double crochet is a tall thin stem: given a seam slot as
	// wide as it is tall, a round of them hands the seam three stitches' worth
	// of itself and the round is drawn with a bite out of it.
	lace?: boolean;
}

// Where each thing drawn at the seam goes. Angles are continuous degrees in the
// same run as the round's stitches, decreasing with working order.
export interface SeamRegion {
	// The round change: where this round's band steps out to the next one, and
	// where the guide's boundary arcs leave their gap.
	step: number;
	// The round number, just past the step on the side the round opens.
	label: number;
	// One angle per closing slip stitch and one per opening chain, in the order
	// they are worked — the joins before the step, the chains after the number.
	end: number[];
	start: number[];
}

// How much arc the seam wants for what this round draws there, in px: the width
// of each of those things, and one gap between each pair of them.
export function seamArc(contents: SeamContents): number {
	const widths = seamWidths(contents);
	const drawn = widths.reduce(sum, 0);
	return drawn + SEAM_AIR * (widths.length - 1);
}

// Everything drawn at the seam, in the order it is drawn there, as the arc each
// one takes. The half-symbol of the stitch at either edge is one of them: the
// seam's angle is measured between stitch centers, so half of each reaches into
// it, and the seam is only as wide as its contents plus those two halves.
function seamWidths(contents: SeamContents): number[] {
	const lace = contents.lace === true;
	const label = labelArc(contents.label);
	return [
		halfOf(contents.lastStitch, lace),
		...instructionArcs(contents.end, lace),
		STEP_ARC,
		...(label > 0 ? [label] : []),
		...openingArcs(contents.start, lace),
		halfOf(contents.firstStitch, lace),
	];
}

// The gap a round has to leave between its last stitch and its first, in
// degrees, so that everything drawn at the seam has room of its own.
export function seamGapDegrees(contents: SeamContents, radius: number): number {
	return Math.min(arcToDegrees(seamArc(contents), radius), MAX_SEAM_GAP_DEG);
}

// Lays the seam out inside the gap the round really left. The slots are scaled
// down together when that gap is tighter than they asked for (a round too small
// to spare it, see the caps above), so a crowded seam crowds evenly instead of
// spilling its contents over the round's stitches.
export function placeSeam(
	contents: SeamContents,
	lastStitchAngle: number,
	// The round's first stitch, counted one lap down, so the gap is a plain
	// subtraction whatever lap the round ended on.
	firstStitchAngle: number,
	radius: number,
): SeamRegion {
	const gap = lastStitchAngle - firstStitchAngle;
	const wanted = arcToDegrees(seamArc(contents), radius);
	const scale = wanted > 0 ? Math.min(1, gap / wanted) : 1;
	const slot = (arc: number): number => arcToDegrees(arc, radius) * scale;

	// Whatever room the round left over the seam's asking sits either side of its
	// contents, so the step and the number stay in the middle of the gap rather
	// than hugging the stitch the round closed on.
	const spare = Math.max(0, gap - wanted) / 2;

	// Each slot is claimed by stepping to its middle and on to its far edge, and
	// then over the gap to the next one, so the walk lands each thing exactly
	// where seamArc said it would fit.
	let at = lastStitchAngle - spare - slot(halfOf(contents.lastStitch));
	const middleOf = (arc: number): number => {
		// Nothing drawn here — a style with no round numbers, say — takes no slot
		// and no gap either, which is what it was charged for.
		if (arc <= 0) return at;
		at -= slot(SEAM_AIR) + slot(arc) / 2;
		const middle = at;
		at -= slot(arc) / 2;
		return middle;
	};

	const end = instructionArcs(contents.end).map((arc) => middleOf(arc));
	const step = middleOf(STEP_ARC);
	const label = middleOf(labelArc(contents.label));
	// The opening chain leans on the stitch it turns up to rather than floating
	// in the middle of the seam: whatever room the round left over its asking
	// gathers behind it, between the round number and the chain, instead of
	// pushing the chain away from the first stitch.
	const start = placeStart(contents, firstStitchAngle, slot);

	return { step, label, end, start };
}

// Where each opening chain goes: walked back from the first stitch, against it,
// in reverse working order — the last chain worked is the one the first stitch
// stands on.
function placeStart(
	contents: SeamContents,
	firstStitchAngle: number,
	slot: (arc: number) => number,
): number[] {
	const lace = contents.lace === true;
	const arcs = openingArcs(contents.start, lace);
	const angles: number[] = [];
	let at = firstStitchAngle + slot(halfOf(contents.firstStitch, lace));
	for (let index = arcs.length - 1; index >= 0; index--) {
		const arc = arcs[index] ?? 0;
		at += slot(SEAM_AIR) + slot(arc) / 2;
		angles[index] = at;
		at += slot(arc) / 2;
	}
	return angles;
}

// Room the seam leaves at one of its edges: half the symbol of the stitch there,
// which its angle is the middle of. Whatever that stitch's own shaping reaches
// past it is handled by the caller, which knows what the round below it looks
// like (see seamReachOf in layout/round-graph.ts).
function halfOf(symbol: string, lace = false): number {
	return lace ? symbolHalfWidth(symbol) : symbolExtent(symbol);
}

// A chain or a slip stitch at the seam takes the width its own symbol is drawn
// at, beside the next thing drawn there — not a stitch's slot of the round: it is
// an instruction squeezed into the seam, not a stitch of the ring.
function instructionArcs(symbols: readonly string[], lace = false): number[] {
	return symbols.map((symbol) => 2 * halfOf(symbol, lace));
}

// The chain a round opens with is not a stitch of the round: it is the turn up
// to it, so it is drawn turned across the ring, smaller than the stitches, and
// tucked against the first one (see placeStart). Turned, a chain lies along the
// ring its short way, and that — at the size it is really drawn — is all the
// room it is charged for, a quarter of the slot it took when it was measured as
// if it stood in the ring like a stitch.
function openingArcs(symbols: readonly string[], lace = false): number[] {
	// A lace round stands its opening chains one above the next across the
	// round's band instead, so they lie across the ring already.
	if (lace) return instructionArcs(symbols, true);
	return symbols.map((symbol) => 2 * symbolHalfHeight(symbol) * OPENING_TURN_SCALE);
}

// The round number takes the width of its own digits and nothing more; the gap
// that keeps it off the round change beside it is the seam's one gap, the same
// as between everything else drawn there.
function labelArc(text: string | undefined): number {
	return text === undefined ? 0 : 2 * labelExtent(text);
}

function sum(total: number, value: number): number {
	return total + value;
}
