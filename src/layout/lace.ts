import type { GridPoint, MotifStitch, RenderItem } from '../types';
import { symbolArc, symbolHalfHeight, symbolHalfWidth, SYMBOL_CLEARANCE } from './constants';
import { makesSpace, symbolStem } from '../render/symbols';
import { FOUNDATION_ID, type GraphStitch, type StitchGraph, type StitchRound } from './graph';
import { symbolAngle } from './polar';

// How lace is drawn, once every stitch knows where it goes.
//
// Two things a lace chart shows that a plain round chart never has to. A group
// worked into one place is drawn as a fan: its stitches share a foot and open
// outward, which is what makes a shell read as one motif instead of as five
// stitches that happen to be next to each other. And a run of chains between
// two anchors is drawn as the curve it hangs in, bowed away from the centre,
// with every chain of it still drawn and countable.
//
// Both are read off what the chart already decided — where the stitches are,
// where the place below them is, how deep the round's band is — so neither
// needs a size of its own.

// How far out of its round's band a chain run bows, as a share of the room
// between the round's ring and the outer edge of its band. Enough for the run
// to read as a bridge over the space it makes, not so much that it crowds the
// round above.
const CHAIN_BOW_SHARE = 0.55;

// A fan opens by a stitch's own room per stitch, so a nine-double shell is
// drawn nine stitches wide however wide the round is.
export function fanSpread(symbol: string): number {
	return ringRoom(symbol) + SYMBOL_CLEARANCE;
}

// How much of the ring a chain takes. A chain of a run is not drawn standing on
// the ring — it hangs on the curve that bridges the space, and a curve is
// longer than the straight line under it. So the ring only has to be long
// enough for the chord that curve spans, which is what stops a mesh round being
// blown out to the length of all its chains laid end to end and leaves the
// motifs sitting where their spaces put them.
const CHAIN_CHORD_SHARE = 0.55;

// How much of its round's ring a stitch takes.
//
// Measured by the stitch's own extent rather than by its width. A round has to
// hold more than its symbols side by side: where each stitch sits comes from
// what it is worked into, and the places below a round are not evenly spread,
// so a ring sized to the symbols alone leaves the solver no slack and it takes
// that slack out of the motifs — closing up the fans, which are the one thing
// lace is about. (Measured: a round of twelve five-double shells wants 372° of
// a 360° ring when the ring is sized by width alone.)
export function ringRoom(symbol: string): number {
	return makesSpace(symbol) ? symbolArc(symbol) * CHAIN_CHORD_SHARE : symbolArc(symbol);
}

// Stand every stitch of a motif on the place it is worked into: feet together
// at that one point, heads out on the edge of the round's band, each stitch
// turned to face the way it leans. That is what makes a shell read as one
// motif opening from one space, rather than as five stitches side by side.
//
// A stitch worked into a place of its own is left where the round put it: it
// stands straight out of the chart, as every stitch that is not part of a fan
// does.
export function fanMotifs(
	graph: StitchGraph,
	round: StitchRound,
	bandOuter: number,
	centre: number,
): MotifStitch[] {
	const drawn: MotifStitch[] = [];

	// The first round is worked into the ring at the middle of the chart, so its
	// stitches stand on that ring and reach out to the edge of their band — the
	// way a book draws the round that starts a piece, radiating from the centre
	// rather than sitting on a circle of their own well outside it.
	if (round.groups.every((group) => group.sourceIds[0] === FOUNDATION_ID)) {
		for (const stitch of round.stitches) {
			if (stitch.layout === undefined || stitch.drawn === false || makesSpace(stitch.symbol)) continue;
			const radians = (stitch.layout.angle * Math.PI) / 180;
			const reach = Math.max(bandOuter, stitch.layout.radius + symbolHalfHeight(stitch.symbol));
			const head = { x: reach * Math.cos(radians), y: reach * Math.sin(radians) };
			const foot = { x: centre * Math.cos(radians), y: centre * Math.sin(radians) };
			drawn.push({
				symbol: stitch.symbol,
				segments: stitchSegments(stitch.symbol, foot, head),
				x: head.x,
				y: head.y,
				rotation: symbolAngle(stitch.layout.angle),
				rowIndex: stitch.roundIndex,
				unitIndex: stitch.unitIndex,
				stitchId: stitch.id,
				sourceStitchIds: stitch.sourceStitchIds,
				color: stitch.color,
				loop: round.loop,
			});
			stitch.layout = { ...stitch.layout, radius: reach, x: head.x, y: head.y };
		}
		return drawn;
	}

	for (const group of round.groups) {
		if (group.motif === undefined || group.targetIds.length < 2) continue;
		const foot = placePoint(graph, round, group.sourceIds[0]);
		// A first round is worked into the ring at the centre, which is not a
		// place to stand a fan on: those rounds are drawn as they always were.
		if (foot === undefined) continue;

		// A fan stands up out of the place it is worked into: its stitches are
		// spread about the line from the centre through that place, rather than
		// each keeping the angle the round gave it. The round settles where the
		// motif goes; this settles how it stands there, which is what makes a
		// row of shells read as a row of shells rather than as a drift of them.
		const standing = group.targetIds
			.map((id) => graph.byId.get(id))
			.filter((stitch): stitch is GraphStitch => stitch?.layout !== undefined && !makesSpace(stitch.symbol));
		const upright = (Math.atan2(foot.y, foot.x) * 180) / Math.PI;
		const opening = degreesOf(fanSpread(standing[0]?.symbol ?? 'dc'), bandOuter);

		for (const [child, stitch] of standing.entries()) {
			if (stitch.layout === undefined) continue;
			// A stitch a beginning chain stands in for is drawn as those chains,
			// at the seam. Drawing it here too would draw it twice.
			if (stitch.drawn === false) continue;
			// Every stitch of the fan starts at the one place they are all
			// worked into and reaches out to its own head, where the round above
			// will work into it. That is what opens the fan: the stitches at the
			// edges are longer and lean further than the one in the middle.
			// The head goes where the round above will work into it: the outer
			// edge of this round's own band, at its own place in the fan.
			const angle = upright + ((standing.length - 1) / 2 - child) * opening;
			const radians = (angle * Math.PI) / 180;
			const reach = Math.max(bandOuter, stitch.layout.radius + symbolHalfHeight(stitch.symbol));
			const head = { x: reach * Math.cos(radians), y: reach * Math.sin(radians) };
			const lean = symbolAngle((Math.atan2(head.y - foot.y, head.x - foot.x) * 180) / Math.PI);

			drawn.push({
				symbol: stitch.symbol,
				segments: stitchSegments(stitch.symbol, foot, head),
				x: head.x,
				y: head.y,
				rotation: lean,
				rowIndex: stitch.roundIndex,
				unitIndex: stitch.unitIndex,
				stitchId: stitch.id,
				sourceStitchIds: stitch.sourceStitchIds,
				color: stitch.color,
				loop: round.loop,
			});
			stitch.layout = { ...stitch.layout, angle, radius: reach, x: head.x, y: head.y, rotation: lean };
		}
	}
	return drawn;
}

// How far under the head a stitch's bars sit, as a share of the stitch's own
// height.
const BAR_SPACING_SHARE = 0.45;

// A stitch drawn as the lines it is made of: the stem it stands on, the head it
// is worked into from above, and the bars that say how tall it is. Read off the
// same symbol sizes everything else on the chart is drawn at.
function stitchSegments(symbol: string, foot: Point, head: Point): GridPoint[][] {
	const length = Math.hypot(head.x - foot.x, head.y - foot.y) || 1;
	// Along the stem, from head to foot, and across it.
	const along = { x: (foot.x - head.x) / length, y: (foot.y - head.y) / length };
	const across = { x: -along.y, y: along.x };
	const half = symbolHalfWidth(symbol);
	// A stitch's bars belong to the stitch, not to the stem: they sit the same
	// distance below the head whether the stitch reaches down one round or
	// three, which is how a chart says "this is a double crochet" at a glance.
	// Spread down the stem instead, they would drift into the middle of a long
	// stitch and the round would stop reading as a row of the same stitch.
	const own = 2 * symbolHalfHeight(symbol);

	const at = (down: number, offset: number): GridPoint => ({
		x: head.x + along.x * down + across.x * offset,
		y: head.y + along.y * down + across.y * offset,
	});

	// What this stitch is made of is a fact about the stitch, kept beside the
	// symbol that draws the same thing at a fixed size (see render/symbols.ts).
	const { bars, head: headMark } = symbolStem(symbol);

	const segments: GridPoint[][] = [[foot, head]];
	if (headMark === 'cross') {
		const arm = own / 3;
		segments.push([at(-arm, -half), at(arm, half)], [at(-arm, half), at(arm, -half)]);
		return segments;
	}

	// The bar the stitch is topped with, then the bars down it that say how tall
	// it is, close under the head and never further down than the stitch is long.
	segments.push([at(0, -half), at(0, half)]);
	const spacing = Math.min(own * BAR_SPACING_SHARE, length / (bars + 1));
	for (let bar = 0; bar < bars; bar++) {
		const down = spacing * (bar + 1);
		const slant = spacing * 0.35;
		segments.push([at(down + slant, -half), at(down - slant, half)]);
	}
	return segments;
}

// Where a place of the round below is: a stitch at its own point, a chain space
// at the middle of the run that makes it.
function placePoint(graph: StitchGraph, round: StitchRound, sourceId: string | undefined): Point | undefined {
	if (sourceId === undefined) return undefined;
	const previous = graph.rounds.find(
		(candidate) => candidate.roundIndex < round.roundIndex && candidate.stitches.some((s) => s.id === sourceId),
	);
	const place = previous?.places.find((candidate) => candidate.stitchIds.includes(sourceId));
	const stitches = (place?.stitchIds ?? [sourceId])
		.map((id) => graph.byId.get(id))
		.filter((stitch): stitch is GraphStitch => stitch?.layout !== undefined && stitch.layout.radius > 0);
	if (stitches.length === 0) return undefined;
	const middle = {
		x: stitches.reduce((sum, stitch) => sum + (stitch.layout?.x ?? 0), 0) / stitches.length,
		y: stitches.reduce((sum, stitch) => sum + (stitch.layout?.y ?? 0), 0) / stitches.length,
	};
	// A stitch is worked into the head of the one below it, not through the
	// middle of it, so that is where the fan stands.
	const head = symbolHalfHeight(stitches[0]?.symbol ?? 'sc');
	const length = Math.hypot(middle.x, middle.y) || 1;
	return { x: middle.x * (1 + head / length), y: middle.y * (1 + head / length) };
}

// Hang every chain of a run along the curve it really makes: from the anchor
// before it, out across the space, to the anchor after it. The chains stay
// their own symbols and stay countable — this moves them onto the curve rather
// than replacing them with one.
export function curveChainRuns(
	graph: StitchGraph,
	round: StitchRound,
	radius: number,
	bandOuter: number,
	items: ReadonlyMap<string, RenderItem>,
): void {
	const spaces = round.places.filter((place) => place.kind === 'space');
	if (spaces.length === 0) return;
	const reach = Math.max(0, bandOuter - radius) * CHAIN_BOW_SHARE;

	for (const space of spaces) {
		const chains = space.stitchIds
			.map((id) => graph.byId.get(id))
			.filter((stitch): stitch is GraphStitch => stitch?.layout !== undefined);
		if (chains.length === 0) continue;

		const from = anchorPoint(graph, round, space.index, -1) ?? endOf(chains, 0);
		const to = anchorPoint(graph, round, space.index, 1) ?? endOf(chains, chains.length - 1);
		// The run is hung around the chart rather than straight across it: it
		// sweeps from one anchor to the other the short way round, bowing out as
		// it goes. Drawn as a straight line's arc instead, a run whose anchors
		// happen to lie opposite each other would swing in across the middle of
		// the chart; going round the way the fabric does, it never can.
		const fromAngle = Math.atan2(from.y, from.x);
		const toAngle = Math.atan2(to.y, to.x);
		const sweep = shortWay(toAngle - fromAngle);
		const fromRadius = Math.hypot(from.x, from.y);
		const toRadius = Math.hypot(to.x, to.y);
		const bow = Math.min(reach, (Math.abs(sweep) * (fromRadius + toRadius)) / 4);

		chains.forEach((chain, index) => {
			const item = items.get(chain.id);
			if (item === undefined || chain.layout === undefined) return;
			// Spread the chains along the run rather than over its whole span, so
			// it starts and ends clear of the stitches it bridges.
			const t = (index + 1) / (chains.length + 1);
			const angle = fromAngle + sweep * t;
			const along = fromRadius + (toRadius - fromRadius) * t + bow * Math.sin(Math.PI * t);
			const point = { x: along * Math.cos(angle), y: along * Math.sin(angle) };
			item.x = point.x;
			item.y = point.y;
			chain.layout = {
				...chain.layout,
				angle: (angle * 180) / Math.PI,
				radius: along,
				x: point.x,
				y: point.y,
			};
			// A chain of a run stands out of the chart rather than lying along it:
			// turned that way the run is as narrow as one stitch however many
			// chains it is made of, which is what keeps a mesh round open instead
			// of spending its ring on chains laid end to end.
			item.rotation = symbolAngle((angle * 180) / Math.PI);
		});
	}
}

// The same turn, taken the short way round.
function shortWay(radians: number): number {
	const turn = 2 * Math.PI;
	return ((radians % turn) + turn + Math.PI) % turn - Math.PI;
}

interface Point {
	x: number;
	y: number;
}

// An arc length, as the angle it subtends at a radius.
function degreesOf(arc: number, radius: number): number {
	return radius <= 0 ? 0 : (arc / radius) * (180 / Math.PI);
}

// The stitch on one side of a space: the last of the place before it, or the
// first of the place after it. A round wraps, so a space at either end of the
// list is bridged to the place at the other end.
function anchorPoint(graph: StitchGraph, round: StitchRound, index: number, step: -1 | 1): Point | undefined {
	const places = round.places;
	for (let offset = 1; offset <= places.length; offset++) {
		const place = places[(((index + step * offset) % places.length) + places.length) % places.length];
		if (place === undefined || place.kind !== 'stitch') continue;
		const id = step === -1 ? place.stitchIds[place.stitchIds.length - 1] : place.stitchIds[0];
		const layout = graph.byId.get(id ?? '')?.layout;
		if (layout !== undefined) return { x: layout.x, y: layout.y };
	}
	return undefined;
}

function endOf(chains: readonly GraphStitch[], index: number): Point {
	const layout = chains[index]?.layout;
	return { x: layout?.x ?? 0, y: layout?.y ?? 0 };
}
