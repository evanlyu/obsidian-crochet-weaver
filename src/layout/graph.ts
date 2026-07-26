import type { CrochetAst } from '../types';
import { consumedStitches, flattenGroup, roundInstructions, unroll, type ColorState, type LayoutUnit } from './steps';

// The stitch graph: which previous-round stitch(es) every stitch of this round
// is worked into.
//
// Stitch counts alone cannot express shaping — "6 stitches became 7" says an
// increase happened somewhere, not which stitch was worked into twice. So the
// graph is built once, from the pattern's own operations, and every later stage
// (placement, shaping connectors, rendering) reads the relationship from here
// instead of guessing it back from geometry.

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
	// The previous-round stitches this one is worked into: one for a plain
	// stitch, one shared with a sibling for an increase, two or more for a
	// decrease. Never empty — the first round's stitches point at FOUNDATION_ID.
	sourceStitchIds: readonly string[];
	// The next-round stitches worked into this one, filled in when that round is
	// built. Empty only in the last round (and on stitches a pattern never works
	// into, which validateStitchGraph reports).
	targetStitchIds: string[];
	// Same sources as raw cyclic slot numbers, un-wrapped: a round that runs
	// past the end of the previous round keeps counting (slot 6 of a 6-stitch
	// round is slot 0 one lap on), so the layout can turn them into continuous
	// angles without a 0°/360° discontinuity.
	sourceSlots: readonly number[];
	shaping: ShapingKind;
	color?: string;
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
}

export interface StitchRound {
	roundIndex: number;
	num: number;
	stitches: GraphStitch[];
	groups: StitchMappingGroup[];
	// The chain that opens the round and the slip stitch that closes it:
	// instructions of the round, drawn at its seam, but not stitches of the
	// fabric (see roundInstructions).
	start: LayoutUnit[];
	end: LayoutUnit[];
	loop?: 'blo' | 'flo';
	// How many previous-round stitches this round works into in total. Equal to
	// the previous round's stitch count in a well-formed pattern.
	consumed: number;
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
	let previous: GraphStitch[] = [];

	ast.rows.forEach((row, roundIndex) => {
		const { start, stitches: units, end } = roundInstructions(unroll(row.steps, colorState));
		const stitches: GraphStitch[] = [];
		const groups: StitchMappingGroup[] = [];
		// Counts previous-round stitches consumed so far. It is allowed to run
		// past the previous round's length (see GraphStitch.sourceSlots).
		let slot = 0;

		units.forEach((unit, unitIndex) => {
			const symbols = childSymbols(unit);
			// The first round is worked into the center ring, which takes any
			// number of stitches: every stitch sources the one foundation anchor,
			// and none of them is shaping (there is no earlier stitch to work
			// twice into, or two to close together).
			const intoFoundation = previous.length === 0;
			const consumed = intoFoundation ? 0 : consumedStitches(unit);
			const sourceSlots = Array.from({ length: consumed }, (_, i) => slot + i);
			const sourceIds = intoFoundation
				? [foundation.id]
				: sourceSlots.map((source) => previous[source % previous.length]?.id ?? '');
			slot += consumed;

			const shaping = intoFoundation ? 'normal' : shapingKind(consumed, symbols.length);
			const targetIds: string[] = [];
			for (const symbol of symbols) {
				const stitchIndex = stitches.length;
				const stitch: GraphStitch = {
					id: `r${roundIndex}s${stitchIndex}`,
					roundIndex,
					stitchIndex,
					unitIndex,
					symbol,
					sourceStitchIds: sourceIds,
					targetStitchIds: [],
					sourceSlots,
					shaping,
					color: unit.color,
				};
				stitches.push(stitch);
				byId.set(stitch.id, stitch);
				targetIds.push(stitch.id);
				// Record the relationship from the other end too, so a stitch can
				// be asked what the next round did with it — which is what makes
				// "every stitch is worked into by the round above" checkable.
				for (const sourceId of sourceIds) byId.get(sourceId)?.targetStitchIds.push(stitch.id);
			}

			groups.push({
				type: shaping,
				roundIndex,
				unitIndex,
				sourceIds,
				targetIds,
				mark: shapingMarkOf(unit, shaping),
			});
		});

		rounds.push({
			roundIndex,
			num: row.num,
			stitches,
			groups,
			start,
			end,
			loop: row.loop,
			consumed: slot,
		});
		if (stitches.length > 0) previous = stitches;
	});

	return { rounds, byId, foundation };
}

// What a mapping check can find wrong. Everything here is a property of the
// pattern, not of the drawing, so it is decidable before any coordinate exists.
export type GraphIssueCode =
	// A stitch is worked into nothing.
	| 'missing-source'
	// A stitch names a source that is not in the graph.
	| 'unknown-source'
	// A previous-round stitch that this round never worked into.
	| 'source-skipped'
	// A previous-round stitch that more than one step of this round worked into.
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
// every previous-round stitch worked into exactly once, every step's shaping
// matching the stitches it actually joins, and every stitch below the last
// round carried forward. These are the invariants the layout then relies on, so
// finding them here means a broken pattern is reported as a fact about the
// pattern rather than noticed later as a strange-looking chart.
export function validateStitchGraph(graph: StitchGraph): GraphIssue[] {
	const issues: GraphIssue[] = [];
	const lastRoundIndex = lastNonEmptyRound(graph);

	graph.rounds.forEach((round, roundIndex) => {
		const previous = previousStitches(graph, roundIndex);

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
			if (stitch.targetStitchIds.length === 0 && roundIndex < lastRoundIndex) {
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
			if (expected !== group.type) {
				issues.push({
					code: 'shaping-mismatch',
					roundIndex,
					detail: `step ${group.unitIndex} is recorded as ${group.type} but joins ${group.sourceIds.length} to ${group.targetIds.length}`,
				});
			}
		}

		// Each stitch of the round below must be worked into exactly once by
		// this round: one step for a plain stitch or an increase (both start
		// from a single stitch), one shared step for a decrease.
		if (previous.length > 0) {
			const uses = new Map<string, number>();
			for (const group of round.groups) {
				for (const sourceId of group.sourceIds) uses.set(sourceId, (uses.get(sourceId) ?? 0) + 1);
			}
			for (const stitch of previous) {
				const used = uses.get(stitch.id) ?? 0;
				if (used === 0) {
					issues.push({
						code: 'source-skipped',
						roundIndex,
						stitchId: stitch.id,
						detail: `round ${round.num} never works into ${stitch.id}`,
					});
				} else if (used > 1) {
					issues.push({
						code: 'source-reused',
						roundIndex,
						stitchId: stitch.id,
						detail: `round ${round.num} works into ${stitch.id} ${used} times`,
					});
				}
			}
		}
	});

	return issues;
}

// Whether this round's stitches can be placed from their ancestry: it must work
// into the round below exactly once each, or the two rounds do not line up and
// there is no correspondence to follow.
export function consumesPreviousRoundExactly(graph: StitchGraph, roundIndex: number): boolean {
	const round = graph.rounds[roundIndex];
	const previous = previousStitches(graph, roundIndex);
	if (round === undefined || previous.length === 0) return false;
	if (round.consumed !== previous.length) return false;
	const used = new Set(round.groups.flatMap((group) => group.sourceIds));
	return used.size === previous.length;
}

function previousStitches(graph: StitchGraph, roundIndex: number): readonly GraphStitch[] {
	for (let index = roundIndex - 1; index >= 0; index--) {
		const round = graph.rounds[index];
		if (round !== undefined && round.stitches.length > 0) return round.stitches;
	}
	return [];
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
		symbol: anchor === 'ch ring' ? 'ch' : 'MR',
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
//
// The count returned here matches outputStitches() by construction (only "inc"
// weighs 2, and only "inc" expands to two symbols), which is what the round
// radius and the progress tool are sized from.
function childSymbols(unit: LayoutUnit): string[] {
	return unit.type === 'GroupNode' ? flattenGroup(unit).flatMap(baseSymbols) : baseSymbols(unit.stitch);
}

function baseSymbols(stitch: string): string[] {
	if (stitch === 'inc') return ['sc', 'sc'];
	if (stitch === 'dec' || /^sc\dtog$/.test(stitch)) return ['sc'];
	return [stitch];
}
