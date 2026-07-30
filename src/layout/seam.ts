import { arcToDegrees } from './angles';
import { labelExtent, symbolExtent, SYMBOL_CLEARANCE } from './constants';

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

// Room left between the seam's contents and the stitches either side of it.
const STITCH_CLEARANCE = 4;

// The step out to the next round's band. It is drawn nearly radially, so it
// needs no more than clearance either side of the seam angle itself.
const STEP_ARC = 8;

// A round with few stitches would otherwise hand the seam a third of the chart.
// So the gap is capped: at two stitches' worth of the round, plus one more for
// every chain or join that has to be drawn in it, and never past a quarter turn.
// Past that the seam crowds its own contents instead — a tight seam still reads
// better than a round with a bite taken out of it. Rings are sized to leave room
// for the seam (see roundCircumference), so this is a floor to fall back to, not
// the usual case.
const MIN_SEAM_SLOTS = 2;
const MAX_SEAM_GAP_DEG = 90;

// What a round draws at its seam. Symbols rather than counts, so each one is
// given the room it actually takes; `label` is the round number, absent in the
// styles that draw none.
export interface SeamContents {
	start: readonly string[];
	end: readonly string[];
	label?: string;
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

// How much arc the seam wants for what this round draws there, in px.
export function seamArc(contents: SeamContents): number {
	return (
		2 * STITCH_CLEARANCE +
		instructionArcs(contents.end).reduce(sum, 0) +
		STEP_ARC +
		labelArc(contents.label) +
		instructionArcs(contents.start).reduce(sum, 0)
	);
}

// The gap a round has to leave between its last stitch and its first, in
// degrees, so that everything drawn at the seam has room of its own.
export function seamGapDegrees(contents: SeamContents, radius: number, stitchStep: number): number {
	const wanted = arcToDegrees(seamArc(contents), radius);
	const slots = MIN_SEAM_SLOTS + contents.start.length + contents.end.length;
	return Math.min(wanted, slots * stitchStep, MAX_SEAM_GAP_DEG);
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

	// Each slot is claimed by stepping to its middle and on to its far edge, so
	// the next one starts where this one ended.
	let at = lastStitchAngle - spare - slot(STITCH_CLEARANCE);
	const middleOf = (slotSize: number): number => {
		at -= slotSize / 2;
		const middle = at;
		at -= slotSize / 2;
		return middle;
	};

	const end = instructionArcs(contents.end).map((arc) => middleOf(slot(arc)));
	const step = middleOf(slot(STEP_ARC));
	const label = middleOf(slot(labelArc(contents.label)));
	const start = instructionArcs(contents.start).map((arc) => middleOf(slot(arc)));

	return { step, label, end, start };
}

// A chain or a slip stitch at the seam takes the width its own symbol is drawn
// at, beside the next thing drawn there — not a stitch's slot of the round: it is
// an instruction squeezed into the seam, not a stitch of the ring.
function instructionArcs(symbols: readonly string[]): number[] {
	return symbols.map((symbol) => 2 * symbolExtent(symbol) + SYMBOL_CLEARANCE);
}

function labelArc(text: string | undefined): number {
	return text === undefined ? 0 : 2 * labelExtent(text) + 2 * SYMBOL_CLEARANCE;
}

function sum(total: number, value: number): number {
	return total + value;
}
