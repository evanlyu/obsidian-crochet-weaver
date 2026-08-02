import { PatternError } from '../pattern/pattern-error';
import { CENTER_RING, CHAIN, JOINING_STITCH, makesSpace } from '../render/symbols';
import type { CrochetAst, RowNode, TargetSpec } from '../types';
import { isShellCenter, placeMatches, placesOf, RoundCursor, type GraphPlace } from './places';
import {
	consumedStitches,
	flattenGroup,
	unrollAll,
	type ColorState,
	type LayoutUnit,
	type UnrolledStep,
} from './steps';

// The stitch graph: which place of the round below every stitch of this round
// is worked into.
//
// Stitch counts alone cannot express shaping — "6 stitches became 7" says an
// increase happened somewhere, not which stitch was worked into twice. So the
// graph is built once, from the pattern's own operations, and every later stage
// (placement, shaping connectors, rendering) reads the relationship from here
// instead of guessing it back from geometry.
//
// A round is walked with a cursor over the round below (see layout/places.ts).
// A step that says where it goes — "in next ch-2 sp", "in same st" — sends the
// cursor looking; a step that does not simply takes the next places in order,
// which is what shorthand patterns have always meant.

export type ShapingKind = 'normal' | 'increase' | 'decrease';

// Where a stitch ended up on the chart. Filled in by the layout pass; the
// ancestry above it never changes.
export interface StitchLayout {
	// Continuous degrees, decreasing with stitch order (see layout/angles.ts).
	angle: number;
	radius: number;
	x: number;
	y: number;
	rotation: number;
}

// The center ring (or chain foundation) the first round is worked into. It is
// not a stitch of any round and gets no symbol of its own on the chart — it
// exists so that no stitch anywhere in the graph is left without a source, and
// so the first round's "worked into the ring" is recorded rather than implied
// by an empty list.
export const FOUNDATION_ID = 'foundation';

export interface GraphStitch {
	id: string;
	// -1 for the foundation anchor, which belongs to no round.
	roundIndex: number;
	// Position in the round's working order. The layout may move a stitch's
	// angle; it must never change this.
	stitchIndex: number;
	// The pattern step that produced this stitch. An increase produces two
	// stitches sharing one unitIndex, which is also how the progress tool
	// counts ("inc" is one action, worth two stitches).
	unitIndex: number;
	symbol: string;
	// The places of the round below this one is worked into: one for a plain
	// stitch, one shared with a sibling for an increase or a shell, two or more
	// for a decrease. Never empty — the first round's stitches point at
	// FOUNDATION_ID.
	sourceStitchIds: readonly string[];
	// The next-round stitches worked into this one, filled in when that round is
	// built. Empty only in the last round (and on stitches a pattern never works
	// into, which validateStitchGraph reports).
	targetStitchIds: string[];
	// Same sources as running slot numbers, un-wrapped: a round that runs past
	// the end of the previous round keeps counting (slot 6 of a 6-place round is
	// slot 0 one lap on), so the layout can turn them into continuous angles
	// without a 0°/360° discontinuity.
	sourceSlots: readonly number[];
	shaping: ShapingKind;
	color?: string;
	// Set on the stitches of a motif worked into one place, so a round above can
	// ask for the middle stitch of "the next 7-dc shell".
	motif?: { size: number; index: number };
	// False for a stitch that is worked and counted but drawn as something else:
	// a beginning chain that stands in for a stitch is drawn as its chains at
	// the seam, not a second time as the stitch it replaces.
	drawn?: boolean;
	layout?: StitchLayout;
}

// The mapping between one pattern step and the stitches around it, in the
// grouped form the shaping symbols are drawn from.
export interface StitchMappingGroup {
	type: ShapingKind;
	roundIndex: number;
	unitIndex: number;
	sourceIds: readonly string[];
	targetIds: readonly string[];
	// Set when this step is printed as a shaping symbol of its own — the V of
	// "2 sc in one stitch", the ∧ of "sc worked together" — which is drawn in
	// place of the stitches it makes rather than alongside them.
	mark?: 'increase' | 'decrease';
	// Set when this step is a motif worked into one place: a shell, a V-stitch,
	// a group. Its stitches fan from that one place rather than each taking a
	// place of their own.
	motif?: { size: number; alias?: string };
	// Set when the step works into nothing of the round below — a chain, a
	// picot — and is only carried at the place the round had reached. It names
	// that place so it has somewhere to be drawn, but does not use it up.
	carried?: boolean;
}

export interface StitchRound {
	roundIndex: number;
	num: number;
	stitches: GraphStitch[];
	groups: StitchMappingGroup[];
	// What this round leaves for the next one to work into (layout/places.ts).
	places: GraphPlace[];
	// The chain that opens the round and the slip stitch that closes it:
	// instructions of the round, drawn at its seam, but not stitches of the
	// fabric (see roundInstructions).
	start: LayoutUnit[];
	end: LayoutUnit[];
	loop?: 'blo' | 'flo';
	// Which way this round reads the round below: backwards, if it turned.
	traversal: 1 | -1;
	// Which way round the chart it comes out, which follows from that and from
	// the round below's own direction.
	direction: 1 | -1;
	// Which side of the fabric faces the maker while this round is worked.
	side: 'RS' | 'WS';
	// Where the next round starts from: the place this round's join closes to.
	entryIndex: number;
	// How many places of the round below this round works into in total. Equal
	// to that round's place count in a well-formed pattern.
	consumed: number;
	// The places of the round below this round passed over rather than worked
	// into: what a typed search stepped past on its way, what a skip named, and
	// what the round's own seam gap covers.
	skipped: ReadonlySet<string>;
}

export interface StitchGraph {
	rounds: readonly StitchRound[];
	byId: ReadonlyMap<string, GraphStitch>;
	foundation: GraphStitch;
}

export function buildStitchGraph(ast: CrochetAst): StitchGraph {
	const colorState: ColorState = {};
	const rounds: StitchRound[] = [];
	const byId = new Map<string, GraphStitch>();
	const foundation = makeFoundation(ast);
	byId.set(foundation.id, foundation);
	let previous: StitchRound | undefined;

	ast.rows.forEach((row, roundIndex) => {
		const round = buildRound(row, roundIndex, previous, byId, foundation, colorState);
		rounds.push(round);
		if (round.stitches.length > 0) previous = round;
	});

	return { rounds, byId, foundation };
}

function buildRound(
	row: RowNode,
	roundIndex: number,
	previous: StitchRound | undefined,
	byId: Map<string, GraphStitch>,
	foundation: GraphStitch,
	colorState: ColorState,
): StitchRound {
	const steps = unrollAll(row.steps, colorState);
	const { start, body, end } = splitRound(steps);
	// Turning reverses the way the work is going, so the round reads the round
	// below the other way along: the cursor walks its places backwards.
	const traversal: 1 | -1 = row.turn === true ? flip(previous?.traversal ?? 1) : previous?.traversal ?? 1;
	// Which way round the chart that comes out as is not a free choice. Every
	// stitch is drawn where the place it is worked into puts it, so a round runs
	// the way its parents run: the round below's own direction, turned around if
	// this round reads that round backwards.
	const direction: 1 | -1 = ((previous?.direction ?? 1) * traversal) as 1 | -1;
	const side: 'RS' | 'WS' = row.turn === true ? flipSide(previous?.side ?? 'RS') : previous?.side ?? 'RS';
	const places = previous?.places ?? [];
	const cursor = new RoundCursor(places, previous?.entryIndex ?? 0, traversal);

	const stitches: GraphStitch[] = [];
	const groups: StitchMappingGroup[] = [];
	let unitIndex = -1;
	// A step that says "in same place" adds its stitches to the motif the last
	// step started, rather than starting one of its own.
	let lastGroup: StitchMappingGroup | undefined;

	const produce = (
		unit: LayoutUnit,
		sourceIds: readonly string[],
		slots: readonly number[],
		symbols: readonly string[],
		aggregate: boolean,
		alias: string | undefined,
		drawn: boolean,
		carried = false,
	) => {
		const shaping = sourceIds[0] === FOUNDATION_ID ? 'normal' : shapingKind(sourceIds.length, symbols.length);
		const targetIds: string[] = [];
		const motifBase = aggregate ? (lastGroup?.targetIds.length ?? 0) : 0;
		const motifSize = motifBase + symbols.length;

		symbols.forEach((symbol, child) => {
			const stitchIndex = stitches.length;
			const stitch: GraphStitch = {
				id: `r${roundIndex}s${stitchIndex}`,
				roundIndex,
				stitchIndex,
				unitIndex: aggregate && lastGroup !== undefined ? lastGroup.unitIndex : unitIndex,
				symbol,
				sourceStitchIds: sourceIds,
				targetStitchIds: [],
				sourceSlots: slots,
				shaping,
				color: unit.color,
				motif: { size: motifSize, index: motifBase + child },
				drawn,
			};
			stitches.push(stitch);
			byId.set(stitch.id, stitch);
			targetIds.push(stitch.id);
			// Record the relationship from the other end too, so a stitch can be
			// asked what the next round did with it — which is what makes "every
			// stitch is worked into by the round above" checkable.
			for (const sourceId of sourceIds) byId.get(sourceId)?.targetStitchIds.push(stitch.id);
		});

		if (aggregate && lastGroup !== undefined) {
			lastGroup.targetIds = [...lastGroup.targetIds, ...targetIds];
			lastGroup.motif = { size: motifSize, alias: lastGroup.motif?.alias ?? alias };
			// The stitches already there belong to the same motif, now bigger.
			for (const id of lastGroup.targetIds) {
				const stitch = byId.get(id);
				if (stitch?.motif !== undefined) stitch.motif = { size: motifSize, index: stitch.motif.index };
			}
			return;
		}

		const group: StitchMappingGroup = {
			type: shaping,
			roundIndex,
			unitIndex,
			sourceIds,
			targetIds,
			mark: shapingMarkOf(unit, shaping),
			// A motif is a group the pattern wrote as one thing worked into one
			// place — a shell, a V, a written group. An increase makes two
			// stitches too, but it is shaping: it is drawn as the V that stands
			// for the pair, not as a fan.
			motif: isMotif(unit) ? { size: motifSize, alias } : undefined,
			carried: carried ? true : undefined,
		};
		groups.push(group);
		lastGroup = group;
	};

	// What opens the round, in the order it is worked: a slip stitch across to
	// where the round really starts, then the chain it opens with. A beginning
	// chain that stands in for a stitch makes one stitch of this round, worked
	// where the round starts — drawn as the chains it is, at the seam, so the
	// stitch it stands for is not drawn a second time.
	for (const step of start) {
		if (isDrawn(step)) unitIndex++;
		if (step.type === 'RepositionNode') {
			resolveMove(cursor, step.target, row, previous);
			continue;
		}
		if (step.type !== 'StitchNode' || step.beginning?.counts !== true) continue;
		const symbols = [step.beginning.as ?? 'dc'];
		if (previous === undefined || places.length === 0) {
			produce(step, [foundation.id], [], symbols, false, undefined, false);
			continue;
		}
		// It is worked where the round starts: the place the round is already at.
		const same = cursor.takeSame();
		if (same === undefined) continue;
		produce(step, [placeSourceId(same.place)], [same.slot], symbols, !same.fresh, undefined, false);
	}

	for (const step of body) {
		if (isDrawn(step)) unitIndex++;

		switch (step.type) {
			case 'TurnNode':
			case 'JoinNode':
				break;
			case 'SkipNode':
				cursor.skip(step.count);
				lastGroup = undefined;
				break;
			case 'RepositionNode':
				resolveMove(cursor, step.target, row, previous);
				lastGroup = undefined;
				break;
			case 'StitchNode':
			case 'GroupNode': {
				const symbols = childSymbols(step);
				if (symbols.length === 0) break;
				if (previous === undefined || places.length === 0) {
					// The first round is worked into the center ring, which takes
					// any number of stitches.
					produce(step, [foundation.id], [], symbols, false, aliasOf(step), true);
					break;
				}
				const taken = resolveSources(cursor, step, row);
				if (taken === undefined) break;
				produce(step, taken.sourceIds, taken.slots, symbols, taken.aggregate, aliasOf(step), true, taken.carried);
				break;
			}
		}
	}

	if (places.length > 0) cursor.finish();

	// A round that says where its stitches go can be held to the round below: if
	// what it worked into and passed over adds up to more than there was, it has
	// run past the end of that round. Said before anything is drawn, and with
	// both numbers, because which of the two is wrong is the useful thing to
	// know.
	const used = [...cursor.used.values()].reduce((sum, uses) => sum + uses, 0);
	if (cursor.saidWhere && used > places.length) {
		throw new PatternError('pattern.skipOverrun', {
			round: row.num,
			needed: used,
			available: places.length,
		});
	}

	const roundPlaces = placesOf(roundIndex, stitches);
	return {
		roundIndex,
		num: row.num,
		stitches,
		groups,
		places: roundPlaces,
		start: drawnUnits(start),
		end: drawnUnits(end),
		loop: row.loop,
		traversal,
		direction,
		side,
		entryIndex: entryIndexOf(roundPlaces, stitches, end),
		consumed: used,
		skipped: cursor.passed,
	};
}

// A round is written as: what opens it, its stitches, and what closes it. The
// chain a round opens with, the magic ring a first round names as a step, and
// the slip stitch worked only to move to the round's start are instructions —
// each is drawn, none is a stitch of the fabric. So is the slip stitch a round
// closes with.
function splitRound(steps: readonly UnrolledStep[]): {
	start: UnrolledStep[];
	body: UnrolledStep[];
	end: UnrolledStep[];
} {
	let first = 0;
	while (first < steps.length && opensRound(steps[first])) first++;
	let last = steps.length;
	while (last > first && closesRound(steps[last - 1])) last--;
	return { start: steps.slice(0, first), body: steps.slice(first, last), end: steps.slice(last) };
}

function opensRound(step: UnrolledStep | undefined): boolean {
	if (step === undefined) return false;
	if (step.type === 'RepositionNode' || step.type === 'TurnNode') return true;
	return (
		step.type === 'StitchNode' &&
		(makesSpace(step.stitch) || step.stitch === CENTER_RING) &&
		step.target === undefined
	);
}

function closesRound(step: UnrolledStep | undefined): boolean {
	if (step === undefined) return false;
	if (step.type === 'JoinNode') return true;
	return step.type === 'StitchNode' && step.stitch === JOINING_STITCH && step.target === undefined;
}

// Where the next round starts from: the place this round's join closes to.
function entryIndexOf(places: readonly GraphPlace[], stitches: readonly GraphStitch[], end: readonly UnrolledStep[]): number {
	const join = end.find((step): step is Extract<UnrolledStep, { type: 'JoinNode' }> => step.type === 'JoinNode');
	if (join === undefined) return 0;
	const wanted =
		join.target === 'first'
			? stitches.find((stitch) => stitch.symbol === join.stitch)
			: join.target === 'beginning-ch'
				? stitches.find((stitch) => stitch.drawn === false)
				: undefined;
	if (wanted === undefined) return 0;
	const place = places.find((candidate) => candidate.stitchIds.includes(wanted.id));
	return place?.index ?? 0;
}

// Where a step is worked, when the pattern says so — and the next places in
// order when it does not.
function resolveSources(
	cursor: RoundCursor,
	unit: LayoutUnit,
	row: RowNode,
): { sourceIds: string[]; slots: number[]; aggregate: boolean; carried?: boolean } | undefined {
	const target = unit.target;
	if (target === undefined) {
		const consumed = consumedStitches(unit);
		if (consumed === 0) {
			// A chain or a picot is worked into nothing below; it is carried
			// along at the place the round is already at, which is what gives it
			// somewhere to be drawn.
			const here = cursor.peek();
			return here === undefined
				? { sourceIds: [], slots: [], aggregate: false, carried: true }
				: { sourceIds: [placeSourceId(here.place)], slots: [here.slot], aggregate: false, carried: true };
		}
		const taken = cursor.takeSequential(consumed);
		return { sourceIds: taken.places.map(placeSourceId), slots: taken.slots, aggregate: false };
	}

	if (target.kind === 'same') {
		const same = cursor.takeSame();
		if (same === undefined) return undefined;
		// Working into the same place again adds to the motif already there.
		return { sourceIds: [placeSourceId(same.place)], slots: [same.slot], aggregate: !same.fresh };
	}

	const found = cursor.takeNext(matcherFor(target));
	if (found === undefined) {
		throw new PatternError('pattern.targetMissing', { round: row.num, target: targetName(target) });
	}
	return { sourceIds: [placeSourceId(found.place)], slots: [found.slot], aggregate: false };
}

function resolveMove(cursor: RoundCursor, target: TargetSpec, row: RowNode, previous: StitchRound | undefined): void {
	if (previous === undefined) return;
	if (target.kind === 'same') return;
	const moved = cursor.moveToNext(matcherFor(target));
	if (moved === undefined) {
		throw new PatternError('pattern.targetMissing', { round: row.num, target: targetName(target) });
	}
}

function matcherFor(target: TargetSpec): (place: GraphPlace) => boolean {
	if (target.kind === 'shell-center') return (place) => isShellCenter(place, target.size);
	return (place) => placeMatches(place, target.type);
}

function targetName(target: TargetSpec): string {
	return target.kind === 'shell-center' ? `center dc of a ${target.size}-dc shell` : target.type;
}

// A place is worked into as itself: a stitch by its own id, a space by the
// first chain that makes it, so ancestry always names something drawn.
function placeSourceId(place: GraphPlace): string {
	return place.stitchIds[0] ?? place.id;
}

function isDrawn(step: UnrolledStep): boolean {
	return step.type !== 'TurnNode' && step.type !== 'SkipNode';
}

// What a step draws. Turning and skipping draw nothing; the two slip stitches
// that are instructions draw as the slip stitches they are.
function drawnUnits(steps: readonly UnrolledStep[]): LayoutUnit[] {
	return steps.flatMap((step) => {
		// A beginning chain is one instruction, and is drawn as every chain of
		// it: three seam chains for a "ch 3", not one symbol standing for them.
		if (step.type === 'StitchNode' && step.beginning !== undefined && step.count > 1) {
			return Array.from({ length: step.count }, () => ({ ...step, count: 1 }));
		}
		switch (step.type) {
			case 'JoinNode':
				return [{ type: 'StitchNode', stitch: JOINING_STITCH, count: 1, instruction: 'join' }];
			case 'RepositionNode':
				return [{ type: 'StitchNode', stitch: JOINING_STITCH, count: 1, instruction: 'reposition', target: step.target }];
			case 'TurnNode':
			case 'SkipNode':
				return [];
			default:
				return [step];
		}
	});
}

// Whether the pattern wrote this step as one thing worked into one place.
function isMotif(unit: LayoutUnit): boolean {
	return unit.type === 'GroupNode' || unit.motif === true;
}

function aliasOf(unit: LayoutUnit): string | undefined {
	return unit.type === 'GroupNode' ? unit.alias : undefined;
}

function flip(direction: 1 | -1): 1 | -1 {
	return direction === 1 ? -1 : 1;
}

function flipSide(side: 'RS' | 'WS'): 'RS' | 'WS' {
	return side === 'RS' ? 'WS' : 'RS';
}

// What a mapping check can find wrong. Everything here is a property of the
// pattern, not of the drawing, so it is decidable before any coordinate exists.
export type GraphIssueCode =
	// A stitch is worked into nothing.
	| 'missing-source'
	// A stitch names a source that is not in the graph.
	| 'unknown-source'
	// A place of the round below that this round never worked into.
	| 'source-skipped'
	// A place of the round below that more than one step of this round worked into.
	| 'source-reused'
	// A step's source/target counts contradict the shaping it claims.
	| 'shaping-mismatch'
	// A stitch no later round is worked into, in a chart that continues past it.
	| 'unconsumed-stitch';

export interface GraphIssue {
	code: GraphIssueCode;
	roundIndex: number;
	stitchId?: string;
	detail: string;
}

// Checks the graph's own consistency: every stitch worked into something real,
// every place of the round below worked into exactly once, every step's shaping
// matching the stitches it actually joins, and every stitch below the last
// round carried forward. These are the invariants the layout then relies on, so
// finding them here means a broken pattern is reported as a fact about the
// pattern rather than noticed later as a strange-looking chart.
export function validateStitchGraph(graph: StitchGraph): GraphIssue[] {
	const issues: GraphIssue[] = [];
	const lastRoundIndex = lastNonEmptyRound(graph);

	graph.rounds.forEach((round, roundIndex) => {
		const previous = previousRound(graph, roundIndex);

		for (const stitch of round.stitches) {
			if (stitch.sourceStitchIds.length === 0) {
				issues.push({
					code: 'missing-source',
					roundIndex,
					stitchId: stitch.id,
					detail: `${stitch.id} is not worked into anything`,
				});
			}
			for (const sourceId of stitch.sourceStitchIds) {
				if (!graph.byId.has(sourceId)) {
					issues.push({
						code: 'unknown-source',
						roundIndex,
						stitchId: stitch.id,
						detail: `${stitch.id} names a source that does not exist: "${sourceId}"`,
					});
				}
			}
			if (
				stitch.targetStitchIds.length === 0 &&
				roundIndex < lastRoundIndex &&
				!makesSpace(stitch.symbol) &&
				!passedOver(graph, roundIndex, stitch.id)
			) {
				issues.push({
					code: 'unconsumed-stitch',
					roundIndex,
					stitchId: stitch.id,
					detail: `${stitch.id} is never worked into by a later round`,
				});
			}
		}

		for (const group of round.groups) {
			const expected = shapingKind(
				group.sourceIds[0] === FOUNDATION_ID ? 0 : group.sourceIds.length,
				group.targetIds.length,
			);
			if (expected !== group.type && group.motif === undefined) {
				issues.push({
					code: 'shaping-mismatch',
					roundIndex,
					detail: `step ${group.unitIndex} is recorded as ${group.type} but joins ${group.sourceIds.length} to ${group.targetIds.length}`,
				});
			}
		}

		// Each place of the round below must be used exactly once by this round:
		// worked into, or passed over on the way to one that is.
		if (previous !== undefined && previous.places.length > 0) {
			const uses = new Map<string, number>();
			for (const group of round.groups) {
				if (group.carried === true) continue;
				for (const sourceId of group.sourceIds) uses.set(sourceId, (uses.get(sourceId) ?? 0) + 1);
			}
			for (const place of previous.places) {
				const used = uses.get(placeSourceId(place)) ?? 0;
				if (used === 0 && !round.skipped.has(place.id)) {
					issues.push({
						code: 'source-skipped',
						roundIndex,
						stitchId: placeSourceId(place),
						detail: `round ${round.num} never works into ${place.id}`,
					});
				} else if (used > 1) {
					issues.push({
						code: 'source-reused',
						roundIndex,
						stitchId: placeSourceId(place),
						detail: `round ${round.num} works into ${place.id} ${used} times`,
					});
				}
			}
		}
	});

	return issues;
}

// Whether this round's stitches can be placed from their ancestry: it must
// account for every place of the round below exactly once, or the two rounds do
// not line up and there is no correspondence to follow.
export function consumesPreviousRoundExactly(graph: StitchGraph, roundIndex: number): boolean {
	const round = graph.rounds[roundIndex];
	const previous = previousRound(graph, roundIndex);
	if (round === undefined || previous === undefined || previous.places.length === 0) return false;
	return round.consumed === previous.places.length;
}

// Whether the round above passed this stitch over on its way somewhere: worked
// past rather than worked into, which a lace round does constantly.
function passedOver(graph: StitchGraph, roundIndex: number, stitchId: string): boolean {
	const round = graph.rounds[roundIndex];
	const above = graph.rounds.find((candidate) => candidate.roundIndex > roundIndex && candidate.stitches.length > 0);
	if (round === undefined || above === undefined) return false;
	const place = round.places.find((candidate) => candidate.stitchIds.includes(stitchId));
	return place !== undefined && above.skipped.has(place.id);
}

export function previousRound(graph: StitchGraph, roundIndex: number): StitchRound | undefined {
	for (let index = roundIndex - 1; index >= 0; index--) {
		const round = graph.rounds[index];
		if (round !== undefined && round.stitches.length > 0) return round;
	}
	return undefined;
}

function lastNonEmptyRound(graph: StitchGraph): number {
	for (let index = graph.rounds.length - 1; index >= 0; index--) {
		if ((graph.rounds[index]?.stitches.length ?? 0) > 0) return index;
	}
	return -1;
}

function makeFoundation(ast: CrochetAst): GraphStitch {
	const anchor = ast.rows[0]?.anchor;
	return {
		id: FOUNDATION_ID,
		roundIndex: -1,
		stitchIndex: 0,
		unitIndex: 0,
		symbol: anchor === 'ch ring' ? CHAIN : CENTER_RING,
		sourceStitchIds: [],
		targetStitchIds: [],
		sourceSlots: [],
		shaping: 'normal',
		layout: { angle: -90, radius: 0, x: 0, y: 0, rotation: 0 },
	};
}

function shapingKind(consumed: number, produced: number): ShapingKind {
	if (consumed === 0) return 'normal';
	if (produced > consumed) return 'increase';
	if (consumed > produced) return 'decrease';
	return 'normal';
}

// Which steps are printed as a shaping symbol instead of as the stitches they
// make: the single-crochet shorthands, whose chart symbol is the V or the ∧
// itself. The taller N-togethers already have their own composite symbol, and a
// group keeps the symbols of the stitches it names, so neither takes a mark —
// their position alone carries the correspondence.
function shapingMarkOf(unit: LayoutUnit, kind: ShapingKind): 'increase' | 'decrease' | undefined {
	if (unit.type !== 'StitchNode') return undefined;
	if (kind === 'increase') return unit.stitch === 'inc' ? 'increase' : undefined;
	if (kind === 'decrease' && (unit.stitch === 'dec' || /^sc\dtog$/.test(unit.stitch))) return 'decrease';
	return undefined;
}

// The stitch symbols one pattern step produces, one per stitch it adds to the
// round. The single-crochet shaping shorthands expand into the stitches they
// really make — an "inc" is two single crochets worked into the same place, an
// "sc2tog" is one closed over two — because the graph has to name each stitch
// the next round can be worked into, even where a V or ∧ is what gets drawn.
function childSymbols(unit: LayoutUnit): string[] {
	if (unit.type === 'GroupNode') return flattenGroup(unit).flatMap(baseSymbols);
	// A quantity worked into one place makes that many stitches, all siblings.
	const symbols = baseSymbols(unit.stitch);
	return unit.motif === true ? Array.from({ length: unit.count }, () => symbols).flat() : symbols;
}

function baseSymbols(stitch: string): string[] {
	if (stitch === 'inc') return ['sc', 'sc'];
	if (stitch === 'dec' || /^sc\dtog$/.test(stitch)) return ['sc'];
	return [stitch];
}
