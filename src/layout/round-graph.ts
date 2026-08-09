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
	enforceOrderAndGap,
	fitTurn,
	meanAngle,
	shortestAngleDelta,
} from './angles';
import {
	labelExtent,
	OPENING_SLIP_STITCH_OFFSET,
	ROUND_CHANGE_ARC,
	symbolArc,
	symbolArcRoomy,
	symbolExtent,
	symbolHalfWidth,
	SYMBOL_CLEARANCE,
} from './constants';
import { buildShapingMark } from './shaping';
import {
	buildStitchGraph,
	FOUNDATION_ID,
	type GraphStitch,
	type StitchGraph,
	type StitchRound,
} from './graph';
import { bandBoundaries, buildBandGuide } from './grid-guide';
import { curveChainRuns, fanMotifs, fanSpread, ringRoom } from './lace';
import { tangentialSymbolScale } from './clarity';
import { CENTER_RING, CHAIN, makesSpace } from '../render/symbols';
import { buildStitchLink } from './links';
import { normalize } from './normalize';
import { MIN_ROUND_STEP, roundStep } from './round';
import { cropToSector } from './sector';
import { centerExtent, placeUnitPolar, pushCenterAnchor, symbolAngle } from './polar';
import {
	openingSeamSymbols,
	placeSeam,
	seamArc,
	seamGapDegrees,
	type SeamContents,
	type SeamRegion,
} from './seam';
import { isStackedOpeningSlipStitch, tagLoop, unitSymbols, type LayoutUnit } from './steps';

// Round charts laid out from the chart's stitch graph, in either of the two
// styles that use it.
//
// A round is not spread out on its own: every stitch starts from the
// previous-round stitch(es) it is worked into (see layout/graph.ts), so a plain
// stitch sits over its parent, an increase's two stitches straddle the parent
// they share, and a decrease sits between the stitches it closed over. With
// natural spacing those semantic angles are immutable and the ring grows until
// order, symbol clearance and the numbered seam all fit. With configured
// spacing every ring remains exactly one configured step from the previous
// one. Exact angles remain preferred, but an inherited collision at the
// configured symbol size receives the least order-preserving angular
// correction. Fixed-spacing layout never changes that configured symbol size.
//
// The two styles differ only in how shaping is *drawn* from that same layout:
// `japanese` replaces an increase or decrease with the V or ∧ printed charts
// use, inside its own round's band (layout/shaping.ts); `continuous` keeps each
// stitch's own symbol and draws lines to the stitch below it is worked into
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

// How far apart the two stitches of an increase sit: the opening of the V drawn
// across them, and no more — the pair is one symbol, so it takes one stitch's
// worth of the round and the stitches after it follow straight on. Read off the
// stitch's own room rather than fixed in px, so the V a shorthand for taller
// stitches would draw opens to match them.
const MARK_OPENING_SHARE = 0.6;
const MARK_WIDTH_SHARE = 0.35;

// Japanese charts conventionally place their round-number column just to the
// right of twelve o'clock. Keeping this explicit prevents the column inheriting
// whatever bearing the first round happened to acquire from its seam contents.
const ROUND_NUMBER_BEARING = -50;
// Each outer row leans another half degree toward twelve o'clock, giving the
// number column a subtle upward-narrowing trapezoid rather than a rigid spoke.
const ROUND_NUMBER_BEARING_STEP = -0.5;

// The innermost seam needs enough radius that generous marker margins do not
// turn into an extreme wedge, but it need not be as large as the seam is long:
// retaining this share keeps the center compact while preserving alignment.
const COMPACT_INNER_SEAM_RADIUS_SHARE = 0.56;

// Visible air between a round number and any stitch/instruction beside it.
// The seam owns the larger round-change margins; this final screen-space check
// keeps a preferred label bearing from crossing a symbol after the seam has
// capped how far its contents can safely move.
const ROUND_NUMBER_ITEM_CLEARANCE = 2;

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
	pushCenterAnchor(ast, items, style === 'japanese' ? 'japanese' : 'generic');

	const colorMarkers: ColorMarker[] = [];
	const colorMarkersByStitchId = new Map<string, ColorMarker>();
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
	const projectedRounds = new Set<number>();
	const fixedRoundSpacing = options.ringSpacing !== undefined;
	const fixedFirstRadius = fixedRoundSpacing
		? minimumFixedFirstRadius(graph, options, style, lace)
		: 0;
	let previousRound: StitchRound | undefined;
	let previousColor: string | undefined;
	let radius = 0;
	let previousRadius = 0;
	let previousCount = -1;
	for (const round of graph.rounds) {
		if (round.stitches.length === 0) continue;
		const contents = seamContentsOf(round, options.lace !== true, lace);
		const roundNumberBearing =
			ROUND_NUMBER_BEARING + placed.length * ROUND_NUMBER_BEARING_STEP;
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
		if (previousCount < 0) radius = Math.max(radius, fixedFirstRadius);
		// On the innermost numbered round, keep the seam's physical width from
		// becoming a sharper-than-one-radian wedge. A generous marker margin is
		// otherwise paid for by dragging the first stitches far around the tiny
		// center ring; a slightly larger first radius keeps that stitch near the
		// top and leaves later shaping aligned with its parents.
		if (previousCount < 0 && contents.label !== undefined) {
			radius = Math.max(radius, seamArc(contents) * COMPACT_INNER_SEAM_RADIUS_SHARE);
		}
		if (!fixedRoundSpacing) {
			radius = fitAncestryRadius(
				graph,
				round,
				previousRound,
				radius,
				step,
				style,
				contents,
				reach,
				lace,
			);
		}

		// Where this round's stitches reach to: the far edge of its own band.
		const topRadius = radius + step / 2;
		let angles = placeRound(
			graph,
			round,
			previousRound,
			radius,
			style,
			contents,
			reach,
			topRadius,
			lace,
			fixedRoundSpacing,
			projectedRounds,
		);
		// The first stitch worked into the center ring is the chart's radial
		// origin. Keep it at twelve o'clock independently of the nearby numbered
		// seam; every round above can then inherit this line without being
		// rotated merely to position a label.
		if (contents.label !== undefined && previousRound === undefined) angles = anchorFirstAtTop(angles);
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
		const finalReach = seamReachOf(graph, round, previousRound, angles);
		const rawSeam = seamOf(contents, angles, radius, finalReach);
		const seam =
			contents.label !== undefined
				? alignNumberedSeamContents(
						rawSeam,
						roundNumberBearing,
						numberedMarkerTurnRoom(contents, angles, radius, finalReach),
					)
				: rawSeam;
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
			// Turned across the ring and tucked against the first stitch: the round
			// opens with a turn up to its first stitch, not with a stitch of its own
			// standing in the ring (see placeSeam in layout/seam.ts).
			const stacked = !lace && isStackedOpeningSlipStitch(round.start, index);
			placeUnitPolar(
				items,
				unit,
				radius,
				angle,
				round.roundIndex,
				undefined,
				true,
				stacked ? { x: OPENING_SLIP_STITCH_OFFSET, y: -OPENING_SLIP_STITCH_OFFSET } : undefined,
			);
			if (!stacked) slot++;
		});

		for (const stitch of round.stitches) {
			// In japanese style a stitch the V or ∧ stands for has no symbol of its
			// own on the chart — but it is still a stitch of this round, and
			// still what the next round works into. Continuous style draws them all.
			const marked = round.groups[stitch.groupIndex]?.mark !== undefined;
			if (stitch.drawn !== false && (style === 'continuous' || !marked)) {
				const item = toRenderItem(stitch);
				items.push(item);
				itemsById.set(stitch.id, item);
			}
			if (stitch.color !== undefined && stitch.color !== previousColor) {
				const marker = { x: stitch.layout?.x ?? 0, y: stitch.layout?.y ?? 0, color: stitch.color };
				colorMarkers.push(marker);
				colorMarkersByStitchId.set(stitch.id, marker);
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
			const text = contents.label ?? String(round.num);
			const labelAngle = fitRoundNumberBearing(
				seam.label,
				roundNumberBearing,
				seam.step,
				radius,
				text,
				items.slice(start),
			);
			const labelRadians = (labelAngle * Math.PI) / 180;
			labels.push({
				x: radius * Math.cos(labelRadians),
				y: radius * Math.sin(labelRadians),
				text,
			});
		}

		roundRadii.push(radius);
		seamAngles.push(seam.step);
		placed.push(round);
		previousCount = round.stitches.length;
		previousRadius = radius;
		previousRound = round;
	}

	// A fixed-radius round sometimes has to spread inherited near-collisions so
	// its stitches remain legible. Reconcile that correction inward through the
	// graph before drawing shaping: a plain child stays on its parent, an
	// increase's parent stays between its children, and a decrease keeps the
	// relative opening of its sources. This makes the correction one coherent
	// ancestry layout instead of a visually detached outer ring.
	if (!lace) {
		reconcileProjectedAncestry(
			graph,
			projectedRounds,
			itemsById,
			colorMarkersByStitchId,
		);
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

function anchorFirstAtTop(angles: readonly number[]): number[] {
	const first = angles[0];
	if (first === undefined) return [...angles];
	const turn = shortestAngleDelta(first, -90);
	return angles.map((angle) => angle + turn);
}

// A numbered seam has two independently meaningful sides. Its opening belongs
// with the first stitch and may stay farther away when ancestry leaves more
// than the minimum 10px; its number and step form the fixed round-change
// marker. Move that pair and any closing instructions toward the requested
// bearing, leaving the opening and all real stitch positions untouched. The
// movement is capped to the seam's actual surplus, so the closing packet can
// never pass the final stitch or its minimum clearance.
function alignNumberedSeamContents(
	seam: SeamRegion,
	targetLabel: number,
	maximumTurn: number,
): SeamRegion {
	const wanted = shortestAngleDelta(seam.label, targetLabel);
	const turn = Math.max(0, Math.min(wanted, maximumTurn));
	return {
		start: seam.start,
		label: seam.label + turn,
		step: seam.step + turn,
		end: seam.end.map((angle) => angle + turn),
	};
}

// The seam's own label slot is always safe. Walk continuously from that slot
// toward the shared numbered bearing and stop at the first collision boundary.
// The separator is part of that collision geometry: a number may move away
// from it, but never through it to reach a later clear space beside the closing
// join. This preserves the seam's semantic order for a chart that starts at
// any round, without branching on a round number or instruction combination.
function fitRoundNumberBearing(
	safeBearing: number,
	preferredBearing: number,
	separatorBearing: number,
	radius: number,
	text: string,
	roundItems: readonly RenderItem[],
): number {
	const separatorRadians = (separatorBearing * Math.PI) / 180;
	const separator = {
		x: radius * Math.cos(separatorRadians),
		y: radius * Math.sin(separatorRadians),
	};
	const clearance = (bearing: number): number => {
		const radians = (bearing * Math.PI) / 180;
		const label = {
			x: radius * Math.cos(radians),
			y: radius * Math.sin(radians),
		};
		const separatorClearance =
			Math.hypot(label.x - separator.x, label.y - separator.y) -
			labelExtent(text) -
			ROUND_CHANGE_ARC / 2;
		return Math.min(
			separatorClearance,
			...roundItems.map(
				(item) =>
					Math.hypot(label.x - item.x, label.y - item.y) -
					labelExtent(text) -
					symbolExtent(item.symbol) * (item.scale ?? 1),
			),
		);
	};

	const turn = shortestAngleDelta(safeBearing, preferredBearing);
	let safeShare = 0;
	const sampleArc = arcToDegrees(1, radius);
	const samples = Math.max(1, Math.ceil(Math.abs(turn) / sampleArc));
	for (let sample = 1; sample <= samples; sample++) {
		const share = sample / samples;
		const bearing = safeBearing + turn * share;
		if (clearance(bearing) >= ROUND_NUMBER_ITEM_CLEARANCE) {
			safeShare = share;
			continue;
		}

		let crowdedShare = share;
		for (let attempt = 0; attempt < 24; attempt++) {
			const refined = (safeShare + crowdedShare) / 2;
			const refinedBearing = safeBearing + turn * refined;
			if (clearance(refinedBearing) >= ROUND_NUMBER_ITEM_CLEARANCE) safeShare = refined;
			else crowdedShare = refined;
		}
		return safeBearing + turn * safeShare;
	}
	return preferredBearing;
}

// The seam is packed from the opening side, leaving all surplus beside the
// final stitch. That surplus is exactly how far its number, step, and closing
// instructions may slide together without crossing the separator or consuming
// any symbol/margin room promised by seamArc.
function numberedMarkerTurnRoom(
	contents: SeamContents,
	angles: readonly number[],
	radius: number,
	reach: { start: number; end: number },
): number {
	const first = angles[0];
	const last = angles.at(-1);
	if (first === undefined || last === undefined) return 0;
	const availableGap = last - reach.end - (first - 360 + reach.start);
	const promisedGap = arcToDegrees(seamArc(contents), radius);
	return Math.max(0, availableGap - promisedGap);
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
	return lace ? collapseChainRun(symbols) : openingSeamSymbols(symbols);
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
	const firstStitch = stitches[0];
	const lastStitch = stitches[stitches.length - 1];
	const first = firstStitch?.shaping === 'decrease'
		? parentAnglesOf(firstStitch, parentAngles, parentTurn)
		: [];
	const last = lastStitch?.shaping === 'decrease'
		? parentAnglesOf(lastStitch, parentAngles, parentTurn)
		: [];
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

// Explicit spacing fixes the difference between radii, not the absolute radius
// of the first round. Look across the whole chart before placing it and choose
// the smallest first radius whose later fixed-step rings have enough arc for
// their actual symbol-to-symbol gaps and seam. Without this lower bound, an
// early 5→10→64 expansion can be asked to fit sixty-four full-size symbols on
// a ring sized only from the five stitches at the centre — an impossible
// constraint no angular projection can repair.
function minimumFixedFirstRadius(
	graph: StitchGraph,
	options: LayoutOptions,
	style: 'japanese' | 'continuous',
	lace: boolean,
): number {
	let first = true;
	let radiusOffset = 0;
	let minimum = 0;
	for (const round of graph.rounds) {
		if (round.stitches.length === 0) continue;
		if (!first) {
			radiusOffset += roundStep(
				round.stitches.map((stitch) => stitch.symbol),
				options.ringSpacing,
			);
		}
		first = false;

		const gaps = minStitchGaps(round, 1, style, lace).map((degrees) => (degrees * Math.PI) / 180);
		const seam = seamContentsOf(round, options.lace !== true, lace);
		const last = gaps.length - 1;
		if (last >= 0) gaps[last] = Math.max(gaps[last] ?? 0, seamArc(seam));
		const requiredRadius = gaps.reduce((total, gap) => total + gap, 0) / (2 * Math.PI);
		minimum = Math.max(minimum, requiredRadius - radiusOffset);
	}
	return minimum;
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
//
// In automatic-spacing mode, radius is the presentation variable allowed to
// repair a collision in a valid ancestry mapping. Grow the ring until the
// semantic targets satisfy the same minimum-gap and seam constraints used by
// placement. Fixed-spacing mode never calls this solver.
function fitAncestryRadius(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	minimum: number,
	step: number,
	style: 'japanese' | 'continuous',
	contents: SeamContents,
	reach: { start: number; end: number },
	lace: boolean,
): number {
	if (previous === undefined || round.stitches.length < 2) return minimum;
	const fits = (radius: number): boolean => {
		const topRadius = radius + step / 2;
		const drawn = drawnRound(round);
		const { aligned, minGaps, seamTarget } = placementConstraints(
			graph,
			drawn,
			previous,
			radius,
			style,
			contents,
			reach,
			topRadius,
			lace,
		);
		return fitsMinimumGaps(aligned, minGaps, seamTarget);
	};
	if (fits(minimum)) return minimum;

	let lower = minimum;
	let upper = minimum;
	let found = false;
	for (let attempt = 0; attempt < 12; attempt++) {
		upper = Math.max(upper + step, upper * 2);
		if (!fits(upper)) continue;
		found = true;
		break;
	}
	// A contradictory source order can never fit inside one turn. Keep the
	// bounded constraint projection below as a deterministic fallback instead
	// of making an invalid pattern produce an unbounded chart.
	if (!found) return minimum;

	for (let iteration = 0; iteration < 24; iteration++) {
		const middle = (lower + upper) / 2;
		if (fits(middle)) upper = middle;
		else lower = middle;
	}
	return upper;
}

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
	fixedRoundSpacing: boolean,
	projectedRounds: Set<number>,
): number[] {
	// A round drawn the other way about the chart is laid out in the order it is
	// drawn — outermost angle first — and handed back in working order, so
	// everything below can assume, as it always has, that angles fall as the
	// round goes on.
	const drawn = drawnRound(round);
	const angles = placeDrawnOrder(
		graph,
		drawn,
		previous,
		radius,
		style,
		contents,
		reach,
		topRadius,
		lace,
		fixedRoundSpacing,
		projectedRounds,
	);
	return round.direction === -1 ? [...angles].reverse() : angles;
}

function drawnRound(round: StitchRound): StitchRound {
	return round.direction === -1 ? { ...round, stitches: [...round.stitches].reverse() } : round;
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
	fixedRoundSpacing: boolean,
	projectedRounds: Set<number>,
): number[] {
	const { aligned, minGaps, seamTarget } = placementConstraints(
		graph,
		round,
		previous,
		radius,
		style,
		contents,
		reach,
		topRadius,
		lace,
	);
	// Preserve exact ancestry whenever the symbols fit at their configured size. If several
	// rounds of differently placed shaping make two inherited targets nearly
	// coincide, use the same order-and-gap projection as an automatically spaced
	// chart instead of changing the symbols' size. This is a geometric rule,
	// independent of round number, stitch count, or pattern wording.
	if (
		fixedRoundSpacing &&
		previous !== undefined &&
		readableScaleAt(round, aligned, radius, style) >= 1
	) {
		return aligned;
	}
	// A seam margin is a minimum, never an instruction to compact the round.
	// When ancestry already satisfies every hard constraint, preserving it is
	// the complete solution for every style, stitch count and round number.
	if (fitsMinimumGaps(aligned, minGaps, seamTarget)) return aligned;

	// Only malformed or geometrically contradictory ancestry reaches this
	// fallback after the radius solver. Preserve order and collision clearance
	// deterministically while keeping the first semantic target anchored.
	if (fixedRoundSpacing && previous !== undefined) projectedRounds.add(round.roundIndex);
	return anchorToStart(fitTurn(enforceOrderAndGap(aligned, minGaps), minGaps), aligned);
}

function readableScaleAt(
	round: StitchRound,
	angles: readonly number[],
	radius: number,
	style: 'japanese' | 'continuous',
): number {
	const symbols = round.stitches.flatMap((stitch, index) => {
		const marked = round.groups[stitch.groupIndex]?.mark !== undefined;
		if (stitch.drawn === false || (style === 'japanese' && marked)) return [];
		const angle = angles[index] ?? -90;
		const radians = (angle * Math.PI) / 180;
		return [{
			symbol: stitch.symbol,
			x: radius * Math.cos(radians),
			y: radius * Math.sin(radians),
		}];
	});
	return tangentialSymbolScale(symbols);
}

function reconcileProjectedAncestry(
	graph: StitchGraph,
	projectedRounds: ReadonlySet<number>,
	itemsById: ReadonlyMap<string, RenderItem>,
	colorMarkersByStitchId: ReadonlyMap<string, ColorMarker>,
): void {
	const anchorRoundIndex = Math.max(-1, ...projectedRounds);
	if (anchorRoundIndex < 1) return;

	let round = graph.rounds.find((candidate) => candidate.roundIndex === anchorRoundIndex);
	while (round !== undefined) {
		const previous = previousStitchRound(graph.rounds, round);
		if (previous === undefined) break;
		const sourceCoverage = new Map<string, number>();
		for (const group of round.groups) {
			for (const id of group.sourceIds) {
				if (graph.byId.get(id)?.roundIndex !== previous.roundIndex) continue;
				sourceCoverage.set(id, (sourceCoverage.get(id) ?? 0) + 1);
			}
		}
		// A round worked into selected places is intentionally only partially
		// attached to the round below. Moving those selected sources while leaving
		// the skipped ones fixed would tear an earlier increase/decrease open. A
		// projected correction may only travel through a relationship that covers
		// the whole displayed round exactly once. Partial free-form ancestry and a
		// motif that wraps across the same source more than once are both semantic
		// boundaries: neither has one unambiguous replacement bearing to write
		// inward, independent of stitch kind, count, or pattern wording.
		if (previous.stitches.some((stitch) => sourceCoverage.get(stitch.id) !== 1)) break;

		const candidates = new Map<string, number[]>();
		for (const group of round.groups) {
			const sources = group.sourceIds
				.map((id) => graph.byId.get(id))
				.filter((stitch): stitch is GraphStitch => stitch?.roundIndex === previous.roundIndex && stitch.layout !== undefined);
			const targets = group.targetIds
				.map((id) => graph.byId.get(id))
				.filter((stitch): stitch is GraphStitch => stitch?.layout !== undefined);
			if (sources.length === 0 || targets.length === 0) continue;

			const targetCenter = meanAngle(targets.map((stitch) => stitch.layout!.angle));
			if (sources.length === 1) {
				pushAngleCandidate(candidates, sources[0]!.id, targetCenter);
				continue;
			}

			// A decrease has several sources but one displayed target. Keep the
			// sources' existing opening and move their midpoint under that target.
			const sourceCenter = meanAngle(sources.map((stitch) => stitch.layout!.angle));
			const turn = shortestAngleDelta(sourceCenter, targetCenter);
			for (const source of sources) {
				pushAngleCandidate(candidates, source.id, source.layout!.angle + turn);
			}
		}

		for (const stitch of previous.stitches) {
			const proposed = candidates.get(stitch.id);
			if (proposed === undefined || stitch.layout === undefined) continue;
			const angle = nearestContinuousAngle(stitch.layout.angle, meanAngle(proposed));
			updateStitchAngle(stitch, angle);

			const item = itemsById.get(stitch.id);
			if (item !== undefined) {
				item.x = stitch.layout.x;
				item.y = stitch.layout.y;
				item.rotation = stitch.layout.rotation;
			}
			const colorMarker = colorMarkersByStitchId.get(stitch.id);
			if (colorMarker !== undefined) {
				colorMarker.x = stitch.layout.x;
				colorMarker.y = stitch.layout.y;
			}
		}

		round = previous;
	}
}

function previousStitchRound(rounds: readonly StitchRound[], current: StitchRound): StitchRound | undefined {
	for (let index = rounds.indexOf(current) - 1; index >= 0; index--) {
		const candidate = rounds[index];
		if (candidate !== undefined && candidate.stitches.length > 0) return candidate;
	}
	return undefined;
}

function pushAngleCandidate(candidates: Map<string, number[]>, id: string, angle: number): void {
	candidates.set(id, [...(candidates.get(id) ?? []), angle]);
}

function nearestContinuousAngle(current: number, proposed: number): number {
	return proposed + 360 * Math.round((current - proposed) / 360);
}

function updateStitchAngle(stitch: GraphStitch, angle: number): void {
	if (stitch.layout === undefined) return;
	const radians = (angle * Math.PI) / 180;
	stitch.layout.angle = angle;
	stitch.layout.x = stitch.layout.radius * Math.cos(radians);
	stitch.layout.y = stitch.layout.radius * Math.sin(radians);
	stitch.layout.rotation = symbolAngle(angle);
}

function placementConstraints(
	graph: StitchGraph,
	round: StitchRound,
	previous: StitchRound | undefined,
	radius: number,
	style: 'japanese' | 'continuous',
	contents: SeamContents,
	reach: { start: number; end: number },
	topRadius: number,
	lace: boolean,
): { aligned: number[]; minGaps: number[]; seamTarget: number } {
	const count = round.stitches.length;
	const step = 360 / count;
	const minGaps = minStitchGaps(round, radius, style, lace);
	// The gap after the last stitch is the seam, which has its own contents to
	// hold (layout/seam.ts) and so is asked for by arc rather than by symbol.
	minGaps[count - 1] = Math.max(
		minGaps[count - 1] ?? 0,
		seamGapDegrees(contents, radius) + reach.start + reach.end,
	);
	const parentAngles = placeAngles(graph, previous);

	// Which way the round below's angles run as its places are counted off: a
	// round drawn the other way about the chart counts its places up as its
	// angles rise, so a slot past the end of it unwraps the other way too.
	const parentTurn = previous?.direction ?? 1;
	const aligned =
		parentAngles.length === 0
			? evenTargets(step, count)
			: ancestryTargets(round, parentAngles, step, radius, parentTurn, topRadius, lace);
	const seamTarget = minGaps[count - 1] ?? 0;
	return { aligned, minGaps, seamTarget };
}

function fitsMinimumGaps(
	angles: readonly number[],
	minGaps: readonly number[],
	seamTarget: number,
): boolean {
	const first = angles[0];
	const last = angles[angles.length - 1];
	if (first === undefined || last === undefined) return false;
	for (let index = 0; index + 1 < angles.length; index++) {
		const here = angles[index];
		const next = angles[index + 1];
		if (here === undefined || next === undefined || here - next + ON_ITS_PARENT_DEG < (minGaps[index] ?? 0)) {
			return false;
		}
	}
	const seam = 360 - (first - last);
	return seam + ON_ITS_PARENT_DEG >= Math.max(seamTarget, minGaps[angles.length - 1] ?? 0);
}

// A malformed mapping may need constraint projection after the ancestry-radius
// solver fails. Keep its first semantic target anchored so the fallback cannot
// add a second, arbitrary whole-round rotation.
function anchorToStart(placed: readonly number[], targets: readonly number[]): number[] {
	const from = placed[0];
	const to = targets[0];
	if (from === undefined || to === undefined || from === to) return [...placed];
	const turn = from - to;
	return placed.map((angle) => angle - turn);
}

// How close a target has to be to its parent's angle to count as standing on
// it. Not zero only because the arithmetic that got there is floating point.
const ON_ITS_PARENT_DEG = 1e-9;

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

	// The shaping mark this stitch is drawn under, if it is drawn under one at
	// all: continuous style draws every stitch as itself, so an increase there is
	// two stitches needing two stitches' room, not a V needing a V's.
	const markOf = (stitch: GraphStitch): 'increase' | 'decrease' | undefined =>
		style === 'continuous' ? undefined : round.groups[stitch.groupIndex]?.mark;

	const half = (stitch: GraphStitch): number => {
		// A chain hangs on the curve that bridges its space rather than standing
		// on the ring, so it asks the ring for the chord under that curve. In
		// lace the whole run asks once: given nothing at all its chains would
		// share one angle and be drawn over each other, and given a share each
		// the round would be spent on chains laid end to end.
		if (makesSpace(stitch.symbol)) {
			// Outside lace mode every chain is stamped directly on the ring, so it
			// needs its full drawn half-width like any other symbol. The shortened
			// chord budget belongs only to a lace chain run hanging on a curve.
			if (!lace) return symbolExtent(stitch.symbol);
			return runStarts.has(stitch.id) ? ringRoom(stitch.symbol) / 2 : 0;
		}
		const mark = markOf(stitch);
		if (mark === undefined) return symbolExtent(stitch.symbol);
		// A decrease's ∧ opens around its one stitch; an increase's V is drawn
		// between its two, reaching no further out than they do.
		return mark === 'decrease' ? markHalfWidth(stitch.symbol) : 0;
	};

	return round.stitches.map((stitch, index) => {
		const next = round.stitches[(index + 1) % round.stitches.length] ?? stitch;
		const sameMark = stitch.groupIndex === next.groupIndex && markOf(stitch) !== undefined;
		// Lace is read as openwork, so its stitches are given a little more air
		// than the bare clearance two symbols need not to touch: at that spacing
		// a round of shells and picots reads as one mass rather than as motifs.
		const air = lace ? LACE_AIR : SYMBOL_CLEARANCE;
		const needed = sameMark ? markOpening(stitch.symbol) : half(stitch) + half(next) + air;
		return arcToDegrees(needed, radius);
	});
}

// The first round has no parent angles, so it is the only round spread evenly.
// Every later round uses ancestryTargets, including free-form rounds that
// deliberately skip places.
function evenTargets(step: number, count: number): number[] {
	return Array.from({ length: count }, (_, index) => -90 - index * step);
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
		const group = round.groups[stitch.groupIndex];
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
