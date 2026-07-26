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
import { MIN_STITCH_GAP } from './constants';
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

// How far the final spacing pass may move a plain stitch from the position its
// ancestry asked for, as a share of the round's average pitch.
const MAX_DRIFT_SHARE = 0.35;

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

		const angles = placeRound(graph, round, previousRound, radius);
		round.stitches.forEach((stitch, index) => {
			const angle = angles[index] ?? -90;
			const radians = (angle * Math.PI) / 180;
			stitch.layout = {
				angle,
				radius,
				x: radius * Math.cos(radians),
				y: radius * Math.sin(radians),
				rotation: symbolAngle(stitch.symbol, angle, options.rotation),
			};
		});

		const start = items.length;
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

		const seamAngle = seamOf(angles);
		if (round.join) {
			placeUnitPolar(items, round.join, radius, seamAngle, options.rotation, round.roundIndex, undefined);
		}
		tagLoop(items, start, round.loop);

		// Round number in the seam gap, nudged inward when a join dot already
		// occupies the gap at the ring radius itself.
		const labelRadians = (seamAngle * Math.PI) / 180;
		const labelRadius = round.join ? radius - options.ringSpacing * 0.35 : radius;
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
): number[] {
	const count = round.stitches.length;
	const step = 360 / count;
	const minGap = Math.min(step, arcToDegrees(MIN_STITCH_GAP, radius));
	const parentAngles = previous?.stitches.map((stitch) => stitch.layout?.angle ?? 0) ?? [];

	// The first round is worked into the center ring, and a round that does not
	// work into the round below exactly once each (a pattern that skips or
	// repeats stitches — validateStitchGraph reports which) has no consistent
	// alignment to inherit. Both spread evenly, the second phased to sit as
	// close to its sources as an even round can.
	if (parentAngles.length === 0 || !consumesPreviousRoundExactly(graph, round.roundIndex)) {
		const phase = parentAngles.length === 0 ? -90 : alignedPhase(round, parentAngles, step);
		return Array.from({ length: count }, (_, index) => phase - index * step);
	}

	const targets = ancestryTargets(round, parentAngles, step, radius);
	const placed = fitTurn(enforceOrderAndGap(targets, minGap), minGap);
	const movable = round.stitches.map((stitch) => stitch.shaping === 'normal');
	return relaxSpacing(placed, targets, movable, step * MAX_DRIFT_SHARE, minGap);
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
