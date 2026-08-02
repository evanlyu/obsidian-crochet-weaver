import type {
	ChartLabel,
	ColorMarker,
	CrochetAst,
	LayoutOptions,
	LayoutResult,
	MotifStitch,
	RenderItem,
	ShapingMark,
} from '../types';
import {
	arcToDegrees,
	closeSeam,
	enforceOrderAndGap,
	fitTurn,
	meanAngle,
	relaxSpacing,
	shortestAngleDelta,
} from './angles';
import { symbolArc, symbolArcRoomy, symbolExtent, symbolHalfWidth, SYMBOL_CLEARANCE } from './constants';
import { buildShapingMark } from './shaping';
import {
	buildStitchGraph,
	consumesPreviousRoundExactly,
	FOUNDATION_ID,
	type GraphStitch,
	type StitchGraph,
	type StitchRound,
} from './graph';
import { bandBoundaries, buildBandGuide } from './grid-guide';
import { curveChainRuns, fanMotifs, fanSpread, ringRoom } from './lace';
import { CENTER_RING, CHAIN, makesSpace } from '../render/symbols';
import { buildStitchLink } from './links';
import { normalize } from './normalize';
import { MIN_ROUND_STEP, roundStep } from './round';
import { cropToSector } from './sector';
import { centerExtent, placeUnitPolar, pushCenterAnchor, symbolAngle } from './polar';
import { placeSeam, seamArc, seamGapDegrees, type SeamContents, type SeamRegion } from './seam';
import { tagLoop, unitSymbols, type LayoutUnit } from './steps';

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

// Air between two neighbouring stitches of a lace round, in px.
const LACE_AIR = 5;

// How far apart an increase's stitches start, as a share of the round's average
// stitch pitch. Under 1 so the pair reads as one group worked into one stitch,
// while still leaving each of them close to its own slot.
const INCREASE_SPREAD_SHARE = 0.85;

// ...and never further apart, in px of arc, than one stitch's own room plus air.
// On a round with few stitches a share of the pitch alone would fling the pair a
// third of the way round the chart, flattening the V into a wide zigzag; capping
// the real on-screen distance keeps every V about as open as every other one, and
// taking that cap from the stitches themselves keeps it right for a pair of tall
// stitches as well as a pair of short ones.
function maxIncreaseSpread(symbol: string): number {
	return symbolArc(symbol) + SYMBOL_CLEARANCE;
}

// How far the redistribution pass may move a plain stitch from where the round
// was placed, as a share of the round's average stitch pitch. Small, because it
// is spent again on every round: crowding closes up over the rounds above it,
// which is how real fabric takes it up, rather than in one jump.
const MAX_DRIFT_SHARE = 0.2;

// ...and how much of a stitch a round may spend closing its seam back to the room
// it needs (see closeSeam), on top of that. Spent by the stitches beside the seam
// and by none of the ones opposite it, so what a round gives up to keep its seam
// one width is a fifth of a stitch where the seam is and nothing where it isn't.
const SEAM_CLOSE_SHARE = 0.2;

// How far apart the two stitches of an increase sit: the opening of the V drawn
// across them, and no more — the pair is one symbol, so it takes one stitch's
// worth of the round and the stitches after it follow straight on. Read off the
// stitch's own room rather than fixed in px, so the V a shorthand for taller
// stitches would draw opens to match them.
const MARK_OPENING_SHARE = 0.6;
const MARK_WIDTH_SHARE = 0.35;

function markOpening(symbol: string): number {
	return symbolArc(symbol) * MARK_OPENING_SHARE;
}

// Half the width of a decrease's ∧, which opens around the single stitch it
// stands for.
function markHalfWidth(symbol: string): number {
	return symbolArc(symbol) * MARK_WIDTH_SHARE;
}

export function layoutRoundGraph(
	ast: CrochetAst,
	options: LayoutOptions,
	style: 'japanese' | 'continuous',
	nextRadius: (
		previousRadius: number,
		previousCount: number,
		circumference: number,
		step: number,
		roomy: number,
	) => number,
): LayoutResult {
	const lace = options.lace === true;
	const graph = buildStitchGraph(ast);
	// What the chart draws at its middle, which the first round stands on.
	const center = centerExtent(ast);
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);

	const colorMarkers: ColorMarker[] = [];
	// Which render item each stitch became, so the lace pass can hang a chain
	// run on its curve, and what a motif's stitches are drawn as.
	const itemsById = new Map<string, RenderItem>();
	const motifStitches: MotifStitch[] = [];
	const labels: ChartLabel[] = [];
	const roundRadii: number[] = [];
	// What each round was stepped out by, so the band around it is measured the
	// same way it was placed.
	const steps: number[] = [];
	const seamAngles: number[] = [];
	const placed: StitchRound[] = [];
	let previousRound: StitchRound | undefined;
	let previousColor: string | undefined;
	let radius = 0;
	let previousRadius = 0;
	let previousCount = -1;
	// Where the round change sits, handed from one round to the next so it reads
	// as one radial line rather than as a spiral (see alignSeam).
	let seamCentre: number | undefined;

	for (const round of graph.rounds) {
		if (round.stitches.length === 0) continue;
		const contents = seamContentsOf(round, options.lace !== true, lace);
		const reach = seamReachOf(graph, round, previousRound);
		// How far this round sits from the one below: as far as its own stitches
		// are tall, unless the chart asked for a spacing of its own.
		const step = roundStep(round.stitches.map((stitch) => stitch.symbol), options.ringSpacing);
		steps.push(step);
		// What must go round the ring — the symbols themselves, and the seam —
		// and what the round would like: the same with room to spare between the
		// stitches. The step wins over the second, never over the first.
		const mustFit = roundCircumference(round, contents, reach, radius, lace, style, false);
		const roomy = roundCircumference(round, contents, reach, radius, lace, style, true);
		radius = nextRadius(radius, previousCount, mustFit, step, roomy);

		// Where this round's stitches reach to: the far edge of its own band.
		const topRadius = radius + step / 2;
		const angles = placeRound(
			graph,
			round,
			previousRound,
			radius,
			style,
			contents,
			reach,
			topRadius,
			lace,
			seamCentre,
		);
		seamCentre = seamCentreOf(angles);
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
		// in the ring of stitches, only a slot of the seam's own gap.
		const start = items.length;
		const seam = seamOf(contents, angles, radius, seamReachOf(graph, round, previousRound, angles));
		// The chain a round opens with. In lace it is drawn the way a book draws
		// it: standing out of the chart at the seam, its chains stacked one above
		// the next across the round's band, so the run reads as the stitch it
		// stands in for rather than as chains laid along the ring.
		const opening = lace ? standingChainRun(round.start) : undefined;
		// Which slot of the seam each thing goes in. The ring is drawn at the
		// middle rather than here, and in lace a whole chain run shares one slot,
		// so the slots are counted as the seam was measured (see seamStart)
		// rather than assumed to match the round's opening one for one.
		let slot = 0;
		round.start.forEach((unit, index) => {
			if (unit.type === 'StitchNode' && unit.stitch === CENTER_RING) return;
			const inRun = opening !== undefined && index >= opening.from && index < opening.from + opening.length;
			const angle = seam.start[slot] ?? seam.step;
			if (inRun) {
				// A round's band runs from where the round below leaves off to
				// its own outer edge. For the first round that is the ring at the
				// middle of the chart, so its opening chain has all the room
				// between the ring and the round to stand in — which is where it
				// really is, and is why it need not be drawn small there.
				const bandInner = previousRadius > 0 ? radius - step / 2 : center;
				items.push(
					standingChain(
						unit,
						bandInner,
						radius + step / 2 - bandInner,
						index - opening.from,
						opening.length,
						angle,
						round.roundIndex,
					),
				);
				// The whole run stands in one slot.
				if (index === opening.from + opening.length - 1) slot++;
				return;
			}
			placeUnitPolar(items, unit, radius, angle, round.roundIndex, undefined);
			slot++;
		});

		for (const stitch of round.stitches) {
			// In japanese style a stitch the V or ∧ stands for has no symbol of its
			// own on the chart — but it is still a stitch of this round, and
			// still what the next round works into. Continuous style draws them all.
			const marked = round.groups[stitch.unitIndex]?.mark !== undefined;
			if (stitch.drawn !== false && (style === 'continuous' || !marked)) {
				const item = toRenderItem(stitch);
				items.push(item);
				itemsById.set(stitch.id, item);
			}
			if (stitch.color !== undefined && stitch.color !== previousColor) {
				colorMarkers.push({ x: stitch.layout?.x ?? 0, y: stitch.layout?.y ?? 0, color: stitch.color });
				previousColor = stitch.color;
			}
		}

		// Lace, while the round is still being placed: its motifs stand on the
		// places they are worked into and its chain runs are hung between them,
		// so the round above is placed against where they really ended up.
		//
		// Only a chart that says it is lace is drawn this way. Everywhere else a
		// group is what it has always been — its stitches stamped side by side
		// on the round — and changing that under charts that never asked for it
		// would redraw every shell and cluster already written.
		if (lace) {
			motifStitches.push(...fanMotifs(graph, round, topRadius, center + SYMBOL_CLEARANCE));
			curveChainRuns(graph, round, radius, topRadius, itemsById);
		}

		round.end.forEach((unit, index) => {
			placeUnitPolar(items, unit, radius, seam.end[index] ?? seam.step, round.roundIndex, undefined);
		});

		tagLoop(items, start, round.loop);

		// Round number in its own slot of the seam gap, on the side the round
		// opens — so it reads as numbering the round that starts at that step,
		// with nothing drawn across it. A lace chart prints none, the way a
		// pattern book prints lace.
		if (options.lace !== true) {
			const labelRadians = (seam.label * Math.PI) / 180;
			labels.push({
				x: radius * Math.cos(labelRadians),
				y: radius * Math.sin(labelRadians),
				text: contents.label ?? String(round.num),
			});
		}

		roundRadii.push(radius);
		seamAngles.push(seam.step);
		placed.push(round);
		previousCount = round.stitches.length;
		previousRadius = radius;
		previousRound = round;
	}

	// Shaping is drawn last, from the angles every round finally settled on and
	// from the bands the guide really draws, so a mark can never point at where
	// a stitch used to be or drift off its round.
	const boundaries = bandBoundaries(roundRadii, steps[steps.length - 1] ?? MIN_ROUND_STEP, center);
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
				style === 'japanese'
					? buildShapingMark(group, sources, targets, band)
					: group.sourceIds.includes(FOUNDATION_ID)
						? undefined // nothing to link to: this round is worked into the ring
						: buildStitchLink(group, sources, targets);
			if (mark !== undefined) shapingMarks.push({ ...mark, loop: round.loop });
		}
	});

	// A stitch the chart draws itself is not also stamped from the symbol
	// library: it left `items` the moment its fan was built.
	const fanned = new Set(motifStitches.map((stitch) => stitch.stitchId));
	const stamped = items.filter((item) => item.stitchId === undefined || !fanned.has(item.stitchId));

	// Book style always draws its band spiral; it is the style, not an overlay.
	// A lace chart draws none: the openwork is the picture, and lines around
	// each round would read as part of the fabric.
	const gridGuide =
		options.lace === true
			? undefined
			: buildBandGuide(roundRadii, steps[steps.length - 1] ?? MIN_ROUND_STEP, seamAngles, center);

	// ...and a chart asked for one wedge of itself keeps what falls in it.
	const drawn =
		options.sector === undefined
			? { items: stamped, motifStitches, shapingMarks, labels, colorMarkers, gridGuide }
			: cropToSector(options.sector, options.wholeRounds ?? 0, {
					items: stamped,
					motifStitches,
					shapingMarks,
					labels,
					colorMarkers,
					gridGuide,
				});

	return normalize(
		drawn.items,
		undefined,
		drawn.gridGuide,
		drawn.colorMarkers,
		drawn.labels,
		drawn.shapingMarks,
		drawn.motifStitches,
	);
}

// The space left between two chains of an opening run, in px. Enough to read as
// separate chains, no more: they are one run, not a row of stitches.
const CHAIN_GAP = 3;

// How small a chain of an opening run may be drawn, against its own size.
//
// A shallow round cannot give three chains a length each without pushing the
// run into the round above, so they are drawn smaller — but not so much smaller
// that the chart has two sizes of chain in it. Past this floor they are left
// touching instead, which reads as the one run they are.
const MIN_CHAIN_SCALE = 0.72;

// The chain a round opens with, among the instructions it opens with: a magic
// ring or a slip stitch across to where the round starts may come first, so the
// run is looked for rather than assumed to be at the front.
function standingChainRun(start: readonly LayoutUnit[]): { from: number; length: number } | undefined {
	const opens = (unit: LayoutUnit | undefined): boolean =>
		unit?.type === 'StitchNode' && makesSpace(unit.stitch);
	const from = start.findIndex((unit) => opens(unit));
	if (from < 0) return undefined;
	let length = 0;
	while (opens(start[from + length])) length++;
	return { from, length };
}

// One chain of that run, standing out of the chart and stacked across the
// round's band with the rest of it.
function chainSymbol(unit: LayoutUnit): string {
	return unit.type === 'StitchNode' ? unit.stitch : CHAIN;
}

function standingChain(
	unit: LayoutUnit,
	inner: number,
	depth: number,
	index: number,
	run: number,
	angle: number,
	roundIndex: number,
): RenderItem {
	// The chains of a run are drawn as the one run they are: each just clear of
	// the next, rather than spread over whatever room the round happens to have.
	// A round with room to spare leaves the rest of it empty; a round without
	// enough shares out what it has and draws the chains smaller, so the run
	// never reaches past the round it opens into the round above.
	const own = 2 * symbolHalfWidth(chainSymbol(unit));
	const step = Math.min(own + CHAIN_GAP, depth / run);
	const scale = Math.max(MIN_CHAIN_SCALE, Math.min(1, (step - CHAIN_GAP) / own));
	// The run is hung from the top of the round, not stood on the bottom of it:
	// the last chain of it is the head of the stitch it replaces, which is where
	// the round above works into it. What room the round has to spare is left
	// below the run, between it and the round underneath.
	const radius = inner + depth - step * (run - index - 0.5);
	const radians = (angle * Math.PI) / 180;
	return {
		symbol: chainSymbol(unit),
		scale,
		x: radius * Math.cos(radians),
		y: radius * Math.sin(radians),
		// Turned out of the chart, so the chain stands the way the stitch it
		// replaces does.
		rotation: angle,
		rowIndex: roundIndex,
		color: unit.type === 'StitchNode' ? unit.color : undefined,
	};
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

// What this round draws at its seam: the symbols of the chain that opens it and
// the join that closes it, and its number.
function seamContentsOf(round: StitchRound, numbered: boolean, lace: boolean): SeamContents {
	const stitches = round.stitches;
	return {
		lastStitch: stitches[stitches.length - 1]?.symbol ?? 'sc',
		firstStitch: stitches[0]?.symbol ?? 'sc',
		// A chain a round opens with is drawn standing at the seam in lace, one
		// chain above the next, so it asks the seam for one chain's width rather
		// than for one per chain — asking for all of them would leave a hole in
		// the round the size of the turning chain laid flat.
		start: seamStart(round.start, lace),
		end: instructionSymbols(round.end),
		// A round that is not numbered needs no room kept for its number.
		label: numbered ? String(round.num) : undefined,
		lace,
	};
}

function instructionSymbols(units: readonly LayoutUnit[]): string[] {
	return units.flatMap(unitSymbols);
}

// What a round's opening asks the seam to keep clear. The ring is drawn at the
// middle of the chart, not here, so it asks for nothing.
function seamStart(start: readonly LayoutUnit[], lace: boolean): string[] {
	const symbols = instructionSymbols(start).filter((symbol) => symbol !== CENTER_RING);
	return lace ? collapseChainRun(symbols) : symbols;
}

// A run of chains, as the one thing it is drawn as.
function collapseChainRun(symbols: readonly string[]): string[] {
	const kept: string[] = [];
	for (const symbol of symbols) {
		if (makesSpace(symbol) && kept[kept.length - 1] === symbol) continue;
		kept.push(symbol);
	}
	return kept;
}

// How far past its own stitch the shaping at either end of a round is drawn, in
// degrees. A decrease is drawn down onto the stitches it closed over, and those
// sit either side of the one it makes — so a round that opens or closes with one
// draws its ∧ out past its own first or last stitch, and the seam has to be
// asked for that too or the mark is drawn across the round number. Everything
// else is drawn no wider than the stitch it belongs to, and reaches nothing.
//
// It is an angle, taken from where the round below really is: no radius comes
// into it, so it can be known before this round has one.
// `angles` is where the round's stitches finally landed, when that is known: the
// reach is then the real distance from the round's own edge out to the stitch
// below its shaping is drawn onto. Before placement there are no angles yet, and
// half the spread of those same stitches below is the estimate the seam is
// reserved from.
function seamReachOf(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	angles?: readonly number[],
): { start: number; end: number } {
	const parentAngles = placeAngles(graph, previous);
	if (parentAngles.length === 0) return { start: 0, end: 0 };
	const stitches = round.stitches;
	const parentTurn = previous?.direction ?? 1;
	const first = parentAnglesOf(stitches[0], parentAngles, parentTurn);
	const last = parentAnglesOf(stitches[stitches.length - 1], parentAngles, parentTurn);
	if (angles === undefined) return { start: spreadHalf(first), end: spreadHalf(last) };

	const firstAngle = angles[0];
	const lastAngle = angles[angles.length - 1];
	if (firstAngle === undefined || lastAngle === undefined) return { start: 0, end: 0 };
	return {
		start: first.length > 0 ? Math.max(0, Math.max(...first) - firstAngle) : 0,
		end: last.length > 0 ? Math.max(0, lastAngle - Math.min(...last)) : 0,
	};
}

// Where each place of a round sits: a stitch at its own angle, a chain space at
// the middle of the chains that make it. This is what the round above lines up
// with, so a shell worked into a space is drawn over that space rather than
// over one of its chains.
function placeAngles(graph: StitchGraph, round: StitchRound | undefined): number[] {
	if (round === undefined) return [];
	return round.places.map((place) => {
		const angles = place.stitchIds
			.map((id) => graph.byId.get(id)?.layout?.angle)
			.filter((angle): angle is number => angle !== undefined);
		return angles.length === 0 ? 0 : angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
	});
}

function spreadHalf(parents: readonly number[]): number {
	if (parents.length < 2) return 0;
	return (Math.max(...parents) - Math.min(...parents)) / 2;
}

// How long this round's ring has to be to draw it: the room each of its symbols
// takes, plus the room its seam needs. Both are measured from what the round
// really draws — the stitches it names, at the size those symbols are drawn, and
// the chain, join and number at its seam — so a round of tall stitches, or one
// opening with a three-chain turn, is given a ring long enough for them instead
// of being packed into one sized by stitch count alone.
function roundCircumference(
	round: StitchRound,
	contents: SeamContents,
	reach: { start: number; end: number },
	previousRadius: number,
	lace: boolean,
	style: 'japanese' | 'continuous',
	roomy: boolean,
): number {
	const room = roomy ? symbolArcRoomy : symbolArc;
	const stitches = lace ? placeRoom(round, room) : drawnRoom(round, style, room);
	// The reach is measured where it is drawn: on the round below's ring.
	const reachArc = ((reach.start + reach.end) * Math.PI * previousRadius) / 180;
	return stitches + seamArc(contents) + reachArc;
}

// How much ring a round needs for what it actually draws.
//
// A stitch an increase or a decrease stands for has no symbol of its own in
// japanese style: the V or the ∧ is drawn across the pair, so the round needs
// room for that one mark rather than for the stitches it replaces. Sized by the
// stitches, a round of increases asks for twice the ring it needs and is pushed
// out to a radius it never had to reach — which the minimum gaps already knew,
// and only this did not.
function drawnRoom(round: StitchRound, style: 'japanese' | 'continuous', room: (symbol: string) => number): number {
	let total = 0;
	for (const group of round.groups) {
		const symbols = group.targetIds.map(
			(id) => round.stitches.find((stitch) => stitch.id === id)?.symbol ?? 'sc',
		);
		const marked = style === 'japanese' && group.mark !== undefined;
		if (!marked) {
			total += symbols.reduce((sum, symbol) => sum + ringRoom(symbol, room), 0);
			continue;
		}
		const symbol = symbols[0] ?? 'sc';
		total +=
			(group.mark === 'increase' ? markOpening(symbol) : 2 * markHalfWidth(symbol)) + SYMBOL_CLEARANCE;
	}
	return total;
}

// How much ring a lace round needs: one stitch's room for each thing that
// stands on it, counting a whole chain run as one — its chains are turned out
// of the chart and hang on the curve that bridges the space, so the run is no
// wider than a stitch however many chains it is made of.
function placeRoom(round: StitchRound, room: (symbol: string) => number): number {
	let total = 0;
	let chains = false;
	for (const stitch of round.stitches) {
		if (makesSpace(stitch.symbol)) {
			if (!chains) total += ringRoom(stitch.symbol, room);
			chains = true;
			continue;
		}
		chains = false;
		total += ringRoom(stitch.symbol, room);
	}
	return total;
}

// One angle per stitch, in working order, as continuous degrees decreasing
// clockwise (see layout/angles.ts).
function placeRound(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	radius: number,
	style: 'japanese' | 'continuous',
	contents: SeamContents,
	reach: { start: number; end: number },
	topRadius: number,
	lace: boolean,
	seamCentre: number | undefined,
): number[] {
	// A round drawn the other way about the chart is laid out in the order it is
	// drawn — outermost angle first — and handed back in working order, so
	// everything below can assume, as it always has, that angles fall as the
	// round goes on.
	const drawn = round.direction === -1 ? [...round.stitches].reverse() : round.stitches;
	const angles = placeDrawnOrder(graph, { ...round, stitches: drawn }, previous, radius, style, contents, reach, topRadius, lace);
	// The round change is one line across the chart, not a spiral. Where a round
	// ends on an increase its last stitch sits half a spread short of the place
	// below it, which moves the seam a degree or two; kept, that is handed to
	// every round above and adds up — measured on a 41-round body, 37° by the
	// last round. So the round is turned back onto the seam the round below
	// left, which moves every stitch of it by the same fraction of a stitch and
	// changes no gap inside it.
	const turned = alignSeam(angles, seamCentre);
	return round.direction === -1 ? [...turned].reverse() : turned;
}

function placeDrawnOrder(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	radius: number,
	style: 'japanese' | 'continuous',
	contents: SeamContents,
	reach: { start: number; end: number },
	topRadius: number,
	lace: boolean,
): number[] {
	void topRadius;
	const count = round.stitches.length;
	const step = 360 / count;
	const minGaps = minStitchGaps(round, radius, style, lace).map((gap) => Math.min(step, gap));
	// The gap after the last stitch is the seam, which has its own contents to
	// hold (layout/seam.ts) and so is asked for by arc rather than by symbol.
	minGaps[count - 1] = Math.max(
		minGaps[count - 1] ?? 0,
		seamGapDegrees(contents, radius, step) + reach.start + reach.end,
	);
	const parentAngles = placeAngles(graph, previous);

	// Which way the round below's angles run as its places are counted off: a
	// round drawn the other way about the chart counts its places up as its
	// angles rise, so a slot past the end of it unwraps the other way too.
	const parentTurn = previous?.direction ?? 1;
	const aligned =
		parentAngles.length === 0 || !consumesPreviousRoundExactly(graph, round.roundIndex)
			? evenTargets(round, parentAngles, step, count)
			: ancestryTargets(round, parentAngles, step, radius, parentTurn, topRadius, lace);
	// Which stitches are free to move at all: not one an increase or decrease of
	// this round produced, and not one the next round works its shaping into —
	// the V or ∧ drawn there is aimed at where the stitch sits.
	const pinned = pinnedByNextRound(graph, round.roundIndex);
	const movable = round.stitches.map((stitch) => stitch.shaping === 'normal' && !pinned.has(stitch.id));

	// Ancestry hands down the seam's angle, which is more and more arc the
	// further out the round is; close it back toward the room it needs, by a
	// share of a stitch at most (see closeSeam).
	const targets = closeSeam(aligned, minGaps[count - 1] ?? 0, step * SEAM_CLOSE_SHARE);
	const placed = fitTurn(enforceOrderAndGap(targets, minGaps), minGaps);

	// An increase's two stitches sit closer together than the round's pitch —
	// they are one symbol worked into one place — so the room they gave up shows
	// up as a wider gap on either side of them, and ancestry alone hands that
	// gap on to every round above unchanged. So a round evens out what it
	// inherited: its stitches drift toward the midpoint of their neighbours, by
	// no more than MAX_DRIFT_SHARE of a stitch each round, which closes the gap
	// after an increase gradually over the rounds above it rather than all at
	// once under it.
	//
	if (!movable.includes(true)) return placed;
	return relaxSpacing(placed, movable, step * MAX_DRIFT_SHARE, minGaps);
}

// Where a round's seam sits: the middle of the wrap-around gap between its last
// stitch and its first.
function seamCentreOf(angles: readonly number[]): number | undefined {
	const first = angles[0];
	const last = angles[angles.length - 1];
	return first === undefined || last === undefined ? undefined : (last + first - 360) / 2;
}

// Turn a round onto the seam the round below left, keeping every gap inside it.
// Never by more than half a stitch: a round whose seam really does belong
// somewhere else — one that cannot follow its ancestry at all — is left where
// it was placed rather than dragged into line.
function alignSeam(angles: readonly number[], seamCentre: number | undefined): number[] {
	const own = seamCentreOf(angles);
	if (own === undefined || seamCentre === undefined || angles.length < 2) return [...angles];
	const step = 360 / angles.length;
	const turn = shortestAngleDelta(seamCentre, own);
	if (Math.abs(turn) > step / 2) return [...angles];
	return angles.map((angle) => angle - turn);
}

// The stitches of a round that the next round works something across: an
// increase splitting one of them in two, or a decrease closing over two of them.
// Whatever else the layout does, those keep the angle their ancestry gave them.
function pinnedByNextRound(graph: StitchGraph, roundIndex: number): ReadonlySet<string> {
	const pinned = new Set<string>();
	for (let index = roundIndex + 1; index < graph.rounds.length; index++) {
		const next = graph.rounds[index];
		if (next === undefined || next.stitches.length === 0) continue;
		for (const group of next.groups) {
			if (group.sourceIds.length <= 1 && group.targetIds.length <= 1) continue;
			for (const id of group.sourceIds) pinned.add(id);
		}
		break;
	}
	return pinned;
}

// How close each pair of neighbouring stitches may be drawn, one per gap
// (the gap after stitch k), worked out from what is actually drawn at each
// rather than assumed — so a round is never spread wider than it needs to be.
//
// The stitches an increase or decrease stands in for have no symbol of their
// own in japanese style: the V or ∧ is drawn across them, so they need no room for
// a symbol beside their neighbour, and only enough between themselves for that
// mark to open. That is what stops an increase taking up two stitches' worth of
// the round while drawing one symbol, leaving a hole after it.
function minStitchGaps(
	round: StitchRound,
	radius: number,
	style: 'japanese' | 'continuous',
	lace: boolean,
): number[] {
	// Where each run of chains starts, so the run can be given room once rather
	// than either once per chain or not at all.
	const runStarts = new Set<string>();
	let inRun = false;
	for (const stitch of round.stitches) {
		if (!makesSpace(stitch.symbol)) {
			inRun = false;
			continue;
		}
		if (!inRun) runStarts.add(stitch.id);
		inRun = true;
	}

	const half = (stitch: GraphStitch): number => {
		// A chain hangs on the curve that bridges its space rather than standing
		// on the ring, so it asks the ring for the chord under that curve. In
		// lace the whole run asks once: given nothing at all its chains would
		// share one angle and be drawn over each other, and given a share each
		// the round would be spent on chains laid end to end.
		if (makesSpace(stitch.symbol)) {
			if (!lace) return ringRoom(stitch.symbol) / 2;
			return runStarts.has(stitch.id) ? ringRoom(stitch.symbol) / 2 : 0;
		}
		if (style === 'continuous' || round.groups[stitch.unitIndex]?.mark === undefined) {
			return symbolExtent(stitch.symbol);
		}
		// A decrease's ∧ opens around its one stitch; an increase's V is drawn
		// between its two, reaching no further out than they do.
		return round.groups[stitch.unitIndex]?.mark === 'decrease' ? markHalfWidth(stitch.symbol) : 0;
	};

	return round.stitches.map((stitch, index) => {
		const next = round.stitches[(index + 1) % round.stitches.length] ?? stitch;
		const sameMark = stitch.unitIndex === next.unitIndex && round.groups[stitch.unitIndex]?.mark !== undefined;
		// Lace is read as openwork, so its stitches are given a little more air
		// than the bare clearance two symbols need not to touch: at that spacing
		// a round of shells and picots reads as one mass rather than as motifs.
		const air = lace ? LACE_AIR : SYMBOL_CLEARANCE;
		const needed = sameMark ? markOpening(stitch.symbol) : half(stitch) + half(next) + air;
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
	parentTurn: 1 | -1,
	topRadius: number,
	lace: boolean,
): number[] {
	const targets: number[] = [];

	round.stitches.forEach((stitch, index) => {
		const group = round.groups[stitch.unitIndex];
		// How far this group's stitches straddle the one below. A shell or a
		// V-stitch is a motif: it opens by one stitch's room per stitch, so it
		// is drawn as wide as the stitches it is made of however wide the round
		// is. Shaping is not — an increase's pair reads as one symbol, so it
		// takes a share of the round's pitch and no more than its own room.
		const spread =
			group?.motif !== undefined
				? // A fan opens at its tops, out on the edge of the round's band, so
					// that is where the room between them is measured — the same room
					// closer in would fling the fan open across its neighbours.
					arcToDegrees(fanSpread(stitch.symbol), topRadius)
				: Math.min(step * INCREASE_SPREAD_SHARE, arcToDegrees(maxIncreaseSpread(stitch.symbol), radius));
		const parents = parentAnglesOf(stitch, parentAngles, parentTurn);
		const center = parents.length > 0 ? meanAngle(parents) : (targets[index - 1] ?? -90) - step;
		// Where this stitch sits inside its own group. The chains of a motif are
		// drawn on the curve that bridges the space they make, not standing on
		// the ring beside their siblings, so they take no room in the fan: a
		// V-stitch's two doubles sit side by side, with its chains arching over
		// the space between them.
		const standing = standingChildren(round, group?.targetIds);
		const child = standing.indexOf(stitch.id);
		const opens = Math.max(1, standing.length);
		targets.push(center + ((opens - 1) / 2 - Math.max(0, child)) * spread);
	});
	return targets;
}

// The stitches of a group that stand on the round: everything but its chains.
function standingChildren(round: StitchRound, targetIds: readonly string[] | undefined): string[] {
	if (targetIds === undefined) return [];
	return targetIds.filter((id) => !makesSpace(round.stitches.find((stitch) => stitch.id === id)?.symbol ?? ''));
}

// Rotation for an evenly spread round that still wants to line up with its
// parents: the average of the offsets each stitch would need to sit over the
// previous-round stitch it is worked into.
function alignedPhase(round: StitchRound, parentAngles: readonly number[], step: number): number {
	let sum = 0;
	let counted = 0;

	round.stitches.forEach((stitch, index) => {
		const parents = parentAnglesOf(stitch, parentAngles);
		if (parents.length === 0) return;
		sum += meanAngle(parents) + index * step;
		counted++;
	});
	return counted > 0 ? sum / counted : -90;
}

// A stitch's parents as continuous angles. Slots past the end of the previous
// round wrap around it but keep counting down a lap, so a decrease that merges
// the round's last stitch with its first sees two neighbouring angles instead of
// two angles a full turn apart.
function parentAnglesOf(
	stitch: GraphStitch | undefined,
	parentAngles: readonly number[],
	parentTurn: 1 | -1 = 1,
): number[] {
	if (stitch === undefined || parentAngles.length === 0) return [];
	return stitch.sourceSlots.map((slot) => {
		const lap = Math.floor(slot / parentAngles.length);
		const index = ((slot % parentAngles.length) + parentAngles.length) % parentAngles.length;
		return (parentAngles[index] ?? 0) - 360 * lap * parentTurn;
	});
}

// The round's wrap-around gap, laid out: where the round ends and the next one
// begins, and where each thing drawn there goes (layout/seam.ts).
function seamOf(
	contents: SeamContents,
	angles: readonly number[],
	radius: number,
	reach: { start: number; end: number },
): SeamRegion {
	const first = angles[0];
	const last = angles[angles.length - 1];
	if (first === undefined || last === undefined) {
		return { step: -90, label: -90, start: [], end: [] };
	}
	// The seam runs from where the round really stops being drawn to where it
	// starts again — past the last stitch by whatever its shaping reaches, and
	// short of the first by the same.
	return placeSeam(contents, last - reach.end, first - 360 + reach.start, radius);
}
