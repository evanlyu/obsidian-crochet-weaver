import type {
	ChartLabel,
	ColorMarker,
	CrochetAst,
	LayoutOptions,
	LayoutResult,
	RenderItem,
	ShapingMark,
} from '../types';
import { arcToDegrees, enforceOrderAndGap, fitTurn, meanAngle, relaxSpacing } from './angles';
import { symbolExtent } from './constants';
import { buildShapingMark } from './shaping';
import {
	buildStitchGraph,
	consumesPreviousRoundExactly,
	type GraphStitch,
	type StitchGraph,
	type StitchRound,
} from './graph';
import { bandBoundaries, buildBandGuide } from './grid-guide';
import { buildStitchLink } from './links';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor, symbolAngle } from './polar';
import { tagLoop } from './steps';

// Round charts laid out from the chart's stitch graph, in either of the two
// styles that use it.
//
// A round is not spread out on its own: every stitch starts from the
// previous-round stitch(es) it is worked into (see layout/graph.ts), so a plain
// stitch sits over its parent, an increase's two stitches straddle the parent
// they share, and a decrease sits between the stitches it closed over. Only
// then is the round made drawable — order and minimum spacing are imposed as
// constraints, and the leftover slack is shared between plain stitches — so
// spacing never rearranges the correspondence it is smoothing.
//
// The two styles differ only in how shaping is *drawn* from that same layout:
// `book` replaces an increase or decrease with the V or ∧ printed charts use,
// inside its own round's band (layout/shaping.ts); `linked` keeps each stitch's
// own symbol and draws lines to the stitch below it is worked into
// (layout/links.ts).

// How far apart an increase's stitches start, as a share of the round's average
// stitch pitch. Under 1 so the pair reads as one group worked into one stitch,
// while still leaving each of them close to its own slot.
const INCREASE_SPREAD_SHARE = 0.85;

// ...and never further apart than this, in px of arc. On a round with few
// stitches a share of the pitch alone would fling the pair a third of the way
// round the chart, flattening the V into a wide zigzag; capping the real
// on-screen distance keeps every V about as open as every other one.
const MAX_INCREASE_SPREAD = 22;

// How far the redistribution pass may move a plain stitch from where its
// ancestry put it, as a share of the round's average stitch pitch.
const MAX_DRIFT_SHARE = 0.2;

// Breathing room left between two neighbouring symbols, on top of the space
// they actually occupy, in px.
const SYMBOL_CLEARANCE = 2;

// How much of a stitch's worth of the seam gap each instruction drawn there
// takes. Under 1 so a chain and a join sit inside the gap the round already
// leaves at its seam, rather than pushing the round's stitches apart.
const SEAM_INSTRUCTION_SHARE = 0.55;

// How far apart the two stitches of an increase sit, in px: the opening of the
// V drawn across them, and no more — the pair is one symbol, so it takes one
// stitch's worth of the round and the stitches after it follow straight on.
const MARK_OPENING = 12;

// Half the width of a decrease's ∧, which opens around the single stitch it
// stands for.
const MARK_HALF_WIDTH = 7;

export function layoutRoundGraph(
	ast: CrochetAst,
	options: LayoutOptions,
	style: 'book' | 'linked',
	nextRadius: (previousRadius: number, previousCount: number, stitchCount: number) => number,
): LayoutResult {
	const graph = buildStitchGraph(ast);
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);

	const colorMarkers: ColorMarker[] = [];
	const labels: ChartLabel[] = [];
	const roundRadii: number[] = [];
	const seamAngles: number[] = [];
	const placed: StitchRound[] = [];
	let previousRound: StitchRound | undefined;
	let previousColor: string | undefined;
	let radius = 0;
	let previousCount = -1;

	for (const round of graph.rounds) {
		if (round.stitches.length === 0) continue;
		radius = nextRadius(radius, previousCount, round.stitches.length);

		const angles = placeRound(graph, round, previousRound, radius, style);
		round.stitches.forEach((stitch, index) => {
			const angle = angles[index] ?? -90;
			const radians = (angle * Math.PI) / 180;
			stitch.layout = {
				angle,
				radius,
				x: radius * Math.cos(radians),
				y: radius * Math.sin(radians),
				rotation: symbolAngle(angle),
			};
		});

		// A round is drawn as it is worked: the chain that opens it, then its
		// stitches, then the slip stitch that closes it. The chain and the join
		// sit at the seam — nothing is worked into them, so they take no place
		// in the ring of stitches.
		const start = items.length;
		const seamAngle = seamOf(angles);
		const seamStep = 360 / (round.stitches.length + round.start.length + round.end.length);
		round.start.forEach((unit, index) => {
			const at = seamAngle - (round.start.length - index) * seamStep * SEAM_INSTRUCTION_SHARE;
			placeUnitPolar(items, unit, radius, at, round.roundIndex, undefined);
		});

		for (const stitch of round.stitches) {
			// In book style a stitch the V or ∧ stands for has no symbol of its
			// own on the chart — but it is still a stitch of this round, and
			// still what the next round works into. Linked style draws them all.
			if (style === 'linked' || round.groups[stitch.unitIndex]?.mark === undefined) {
				items.push(toRenderItem(stitch));
			}
			if (stitch.color !== undefined && stitch.color !== previousColor) {
				colorMarkers.push({ x: stitch.layout?.x ?? 0, y: stitch.layout?.y ?? 0, color: stitch.color });
				previousColor = stitch.color;
			}
		}

		round.end.forEach((unit, index) => {
			const at = seamAngle + (index + 1) * seamStep * SEAM_INSTRUCTION_SHARE;
			placeUnitPolar(items, unit, radius, at, round.roundIndex, undefined);
		});

		tagLoop(items, start, round.loop);

		// Round number in the seam gap, nudged inward when a join dot already
		// occupies the gap at the ring radius itself.
		const labelRadians = (seamAngle * Math.PI) / 180;
		const labelRadius = round.end.length > 0 ? radius - options.ringSpacing * 0.35 : radius;
		labels.push({
			x: labelRadius * Math.cos(labelRadians),
			y: labelRadius * Math.sin(labelRadians),
			text: String(round.num),
		});

		roundRadii.push(radius);
		seamAngles.push(seamAngle);
		placed.push(round);
		previousCount = round.stitches.length;
		previousRound = round;
	}

	// Shaping is drawn last, from the angles every round finally settled on and
	// from the bands the guide really draws, so a mark can never point at where
	// a stitch used to be or drift off its round.
	const boundaries = bandBoundaries(roundRadii, options.ringSpacing);
	const shapingMarks: ShapingMark[] = [];
	placed.forEach((round, index) => {
		const band = {
			inner: boundaries[index] ?? 0,
			outer: boundaries[index + 1] ?? 0,
			radius: roundRadii[index] ?? 0,
		};
		for (const group of round.groups) {
			const sources = group.sourceIds.map((id) => graph.byId.get(id)).filter(isStitch);
			const targets = group.targetIds.map((id) => graph.byId.get(id)).filter(isStitch);
			const mark =
				style === 'book'
					? buildShapingMark(group, sources, targets, band)
					: index === 0
						? undefined // nothing to link to: round 1 is worked into the ring
						: buildStitchLink(group, sources, targets);
			if (mark !== undefined) shapingMarks.push({ ...mark, loop: round.loop });
		}
	});

	// Book style always draws its band spiral; it is the style, not an overlay.
	const gridGuide = buildBandGuide(roundRadii, options.ringSpacing, seamAngles);
	return normalize(items, undefined, gridGuide, colorMarkers, labels, shapingMarks);
}

function isStitch(stitch: GraphStitch | undefined): stitch is GraphStitch {
	return stitch !== undefined;
}

function toRenderItem(stitch: GraphStitch): RenderItem {
	return {
		symbol: stitch.symbol,
		x: stitch.layout?.x ?? 0,
		y: stitch.layout?.y ?? 0,
		rotation: stitch.layout?.rotation ?? 0,
		rowIndex: stitch.roundIndex,
		unitIndex: stitch.unitIndex,
		color: stitch.color,
		stitchId: stitch.id,
		sourceStitchIds: stitch.sourceStitchIds,
		shaping: stitch.shaping === 'normal' ? undefined : stitch.shaping,
	};
}

// One angle per stitch, in working order, as continuous degrees decreasing
// clockwise (see layout/angles.ts).
function placeRound(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	radius: number,
	style: 'book' | 'linked',
): number[] {
	const count = round.stitches.length;
	const step = 360 / count;
	const minGaps = minStitchGaps(round, radius, style).map((gap) => Math.min(step, gap));
	const parentAngles = previous?.stitches.map((stitch) => stitch.layout?.angle ?? 0) ?? [];

	const targets =
		parentAngles.length === 0 || !consumesPreviousRoundExactly(graph, round.roundIndex)
			? evenTargets(round, parentAngles, step, count)
			: ancestryTargets(round, parentAngles, step, radius);

	// A round that only works one stitch into each of the round below has
	// nothing to share out and nothing to group: every stitch belongs directly
	// over the one it is worked into, and that is where it goes. Spreading such
	// a round at all is what breaks the columns through the plain rounds of a
	// piece — the straight sides of a basket, the body of a toy.
	if (!shapesAnywhere(round)) return fitTurn(enforceOrderAndGap(targets, minGaps), minGaps);

	// A round that shapes has to share out the room its new stitches took, or
	// the crowding they cause is inherited by every round above and the piece
	// ends up bunched on one side. Only the plain stitches move, and none of
	// them by more than MAX_DRIFT_SHARE of a stitch.
	const placed = fitTurn(enforceOrderAndGap(targets, minGaps), minGaps);
	const movable = round.stitches.map((stitch) => stitch.shaping === 'normal');
	return relaxSpacing(placed, targets, movable, step * MAX_DRIFT_SHARE, minGaps);
}

// Does this round change the stitch count anywhere — an increase, a decrease,
// stitches worked into one stitch? A round that does not is a plain copy of the
// round below.
function shapesAnywhere(round: StitchRound): boolean {
	return round.stitches.some((stitch) => stitch.shaping !== 'normal');
}

// How close each pair of neighbouring stitches may be drawn, one per gap
// (the gap after stitch k), worked out from what is actually drawn at each
// rather than assumed — so a round is never spread wider than it needs to be.
//
// The stitches an increase or decrease stands in for have no symbol of their
// own in book style: the V or ∧ is drawn across them, so they need no room for
// a symbol beside their neighbour, and only enough between themselves for that
// mark to open. That is what stops an increase taking up two stitches' worth of
// the round while drawing one symbol, leaving a hole after it.
function minStitchGaps(round: StitchRound, radius: number, style: 'book' | 'linked'): number[] {
	const half = (stitch: GraphStitch): number => {
		if (style === 'linked' || round.groups[stitch.unitIndex]?.mark === undefined) {
			return symbolExtent(stitch.symbol);
		}
		// A decrease's ∧ opens around its one stitch; an increase's V is drawn
		// between its two, reaching no further out than they do.
		return round.groups[stitch.unitIndex]?.mark === 'decrease' ? MARK_HALF_WIDTH : 0;
	};

	return round.stitches.map((stitch, index) => {
		const next = round.stitches[(index + 1) % round.stitches.length] ?? stitch;
		const sameMark = stitch.unitIndex === next.unitIndex && round.groups[stitch.unitIndex]?.mark !== undefined;
		const needed = sameMark ? MARK_OPENING : half(stitch) + half(next) + SYMBOL_CLEARANCE;
		return arcToDegrees(needed, radius);
	});
}

// The first round is worked into the center ring, and a round that does not
// work into the round below exactly once each (a pattern that skips or repeats
// stitches — validateStitchGraph reports which) has no consistent alignment to
// inherit. Both spread evenly, the second phased to sit as close to its sources
// as an even round can.
function evenTargets(round: StitchRound, parentAngles: readonly number[], step: number, count: number): number[] {
	const phase = parentAngles.length === 0 ? -90 : alignedPhase(round, parentAngles, step);
	return Array.from({ length: count }, (_, index) => phase - index * step);
}

// Where each stitch would sit if only its ancestry mattered: over its parent,
// straddling a shared parent, or midway between the parents it merged.
function ancestryTargets(
	round: StitchRound,
	parentAngles: readonly number[],
	step: number,
	radius: number,
): number[] {
	const spread = Math.min(step * INCREASE_SPREAD_SHARE, arcToDegrees(MAX_INCREASE_SPREAD, radius));
	const targets: number[] = [];
	let index = 0;

	for (const group of round.groups) {
		const produced = group.targetIds.length;
		const parents = parentAnglesOf(round.stitches[index], parentAngles);
		const center = parents.length > 0 ? meanAngle(parents) : (targets[targets.length - 1] ?? -90) - step;
		for (let child = 0; child < produced; child++) {
			targets.push(center + ((produced - 1) / 2 - child) * spread);
		}
		index += produced;
	}
	return targets;
}

// Rotation for an evenly spread round that still wants to line up with its
// parents: the average of the offsets each stitch would need to sit over the
// previous-round stitch it is worked into.
function alignedPhase(round: StitchRound, parentAngles: readonly number[], step: number): number {
	let index = 0;
	let sum = 0;
	let counted = 0;

	for (const group of round.groups) {
		const produced = group.targetIds.length;
		const parents = parentAnglesOf(round.stitches[index], parentAngles);
		if (parents.length > 0) {
			sum += meanAngle(parents) + (index + (produced - 1) / 2) * step;
			counted++;
		}
		index += produced;
	}
	return counted > 0 ? sum / counted : -90;
}

// A stitch's parents as continuous angles. Slots past the end of the previous
// round wrap around it but keep counting down a lap, so a decrease that merges
// the round's last stitch with its first sees two neighbouring angles instead of
// two angles a full turn apart.
function parentAnglesOf(stitch: GraphStitch | undefined, parentAngles: readonly number[]): number[] {
	if (stitch === undefined || parentAngles.length === 0) return [];
	return stitch.sourceSlots.map((slot) => {
		const lap = Math.floor(slot / parentAngles.length);
		const index = ((slot % parentAngles.length) + parentAngles.length) % parentAngles.length;
		return (parentAngles[index] ?? 0) - 360 * lap;
	});
}

// Middle of the round's wrap-around gap: where the round ends and the next one
// begins, which is where the round number and the guide's step out are drawn.
function seamOf(angles: readonly number[]): number {
	const first = angles[0];
	const last = angles[angles.length - 1];
	if (first === undefined || last === undefined) return -90;
	return (first + last - 360) / 2;
}
