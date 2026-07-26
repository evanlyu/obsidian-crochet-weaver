import { describe, expect, it } from 'vitest';
import {
	arcToDegrees,
	enforceOrderAndGap,
	fitTurn,
	meanAngle,
	normalizeAngle,
	shortestAngleDelta,
} from '../src/layout/angles';
import {
	buildStitchGraph,
	consumesPreviousRoundExactly,
	FOUNDATION_ID,
	validateStitchGraph,
	type StitchGraph,
} from '../src/layout/graph';
import { parse } from '../src/parser';
import type { CrochetAst } from '../src/types';

function graphOf(source: string): StitchGraph {
	return buildStitchGraph(parse(`---\ntype: round\n---\n${source}`) as CrochetAst);
}

// "which previous-round stitches is each stitch of this round worked into",
// written as one entry per stitch in working order.
function ancestry(graph: StitchGraph, roundIndex: number): string[][] {
	return (graph.rounds[roundIndex]?.stitches ?? []).map((stitch) => [...stitch.sourceStitchIds]);
}

describe('stitch graph', () => {
	it('gives every stitch an id, a working-order index and its round', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: 6 sc\n');
		const round2 = graph.rounds[1]?.stitches ?? [];

		expect(round2.map((stitch) => stitch.id)).toEqual(['r1s0', 'r1s1', 'r1s2', 'r1s3', 'r1s4', 'r1s5']);
		expect(round2.map((stitch) => stitch.stitchIndex)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(round2.every((stitch) => stitch.roundIndex === 1)).toBe(true);
		expect(graph.byId.get('r1s3')).toBe(round2[3]);
	});

	// Spec section 10: the first round has no previous round, but it still has a
	// source — the ring it is worked into.
	it('works the first round into the center ring anchor, never into nothing', () => {
		const graph = graphOf('R1: 6 sc in MR\n');

		expect(ancestry(graph, 0)).toEqual(Array(6).fill([FOUNDATION_ID]));
		expect(graph.rounds[0]?.consumed).toBe(0);
		// The anchor is a real node in the graph, so every mapping id resolves.
		expect(graph.byId.get(FOUNDATION_ID)).toBe(graph.foundation);
		expect(graph.foundation.targetStitchIds).toHaveLength(6);
		// Working into the ring is not shaping: the ring takes any number.
		expect(graph.rounds[0]?.stitches.every((stitch) => stitch.shaping === 'normal')).toBe(true);
	});

	// Spec section 9: the mapping has to be walkable in both directions.
	it('records which stitches of the next round were worked into each stitch', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: inc, sc, dec\n');

		expect(graph.rounds[0]?.stitches.map((stitch) => stitch.targetStitchIds)).toEqual([
			['r1s0', 'r1s1'], // worked into twice: the increase
			['r1s2'],
			['r1s3'], // both of these merged into one stitch: the decrease
			['r1s3'],
		]);
		expect(graph.rounds[1]?.stitches.every((stitch) => stitch.targetStitchIds.length === 0)).toBe(true);
	});

	// Spec test 1: all plain stitches.
	it('maps a plain round one-to-one onto the round below, in order', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: 6 sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0'], ['r0s1'], ['r0s2'], ['r0s3'], ['r0s4'], ['r0s5']]);
		expect(graph.rounds[1]?.stitches.every((stitch) => stitch.shaping === 'normal')).toBe(true);
		expect(graph.rounds[1]?.groups.every((group) => group.type === 'normal')).toBe(true);
	});

	// Spec test 2 / section 11: one increase then plain stitches.
	it('points both stitches of an increase at the one stitch they share', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: inc, 5 sc\n');

		expect(ancestry(graph, 1)).toEqual([
			['r0s0'],
			['r0s0'],
			['r0s1'],
			['r0s2'],
			['r0s3'],
			['r0s4'],
			['r0s5'],
		]);
		const [increase] = graph.rounds[1]?.groups ?? [];
		expect(increase).toMatchObject({ type: 'increase', sourceIds: ['r0s0'], targetIds: ['r1s0', 'r1s1'] });
		// An increase is two real single crochets, not one fused "inc" glyph.
		expect(graph.rounds[1]?.stitches.slice(0, 2).map((stitch) => stitch.symbol)).toEqual(['sc', 'sc']);
	});

	// Spec test 3 / section 12: one decrease then plain stitches.
	it('points a decrease at both stitches it closed over', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: dec, 4 sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0', 'r0s1'], ['r0s2'], ['r0s3'], ['r0s4'], ['r0s5']]);
		const [decrease] = graph.rounds[1]?.groups ?? [];
		expect(decrease).toMatchObject({
			type: 'decrease',
			sourceIds: ['r0s0', 'r0s1'],
			targetIds: ['r1s0'],
		});
	});

	// Spec test 4 / section 13: back-to-back increases stay separate groups.
	it('keeps consecutive increases as separate two-into-one groups', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: inc, inc, sc, sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0'], ['r0s0'], ['r0s1'], ['r0s1'], ['r0s2'], ['r0s3']]);
		expect(graph.rounds[1]?.groups.map((group) => group.type)).toEqual([
			'increase',
			'increase',
			'normal',
			'normal',
		]);
	});

	// Spec test 5 / section 14: back-to-back decreases.
	it('keeps consecutive decreases as separate two-into-one groups', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: dec, dec, sc, sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0', 'r0s1'], ['r0s2', 'r0s3'], ['r0s4'], ['r0s5']]);
		expect(graph.rounds[1]?.groups.map((group) => group.type)).toEqual([
			'decrease',
			'decrease',
			'normal',
			'normal',
		]);
	});

	// Spec test 6: every operation consumes the right sources in a mixed round.
	it('consumes sources in order through a round mixing increases and decreases', () => {
		const graph = graphOf('R1: 8 sc in MR\nR2: inc, sc, dec, sc, inc, dec\n');

		expect(ancestry(graph, 1)).toEqual([
			['r0s0'],
			['r0s0'],
			['r0s1'],
			['r0s2', 'r0s3'],
			['r0s4'],
			['r0s5'],
			['r0s5'],
			['r0s6', 'r0s7'],
		]);
		expect(graph.rounds[1]?.consumed).toBe(8);
	});

	it('counts an N-together as consuming N stitches and making one', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: sc3tog, sc, sc, sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0', 'r0s1', 'r0s2'], ['r0s3'], ['r0s4'], ['r0s5']]);
		expect(graph.rounds[1]?.stitches[0]?.symbol).toBe('sc');
		expect(graph.rounds[1]?.groups[0]?.type).toBe('decrease');
	});

	it('treats stitches worked into one stitch as an increase group', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: (dc, ch, dc), sc, sc, sc\n');

		expect(ancestry(graph, 1)).toEqual([['r0s0'], ['r0s0'], ['r0s0'], ['r0s1'], ['r0s2'], ['r0s3']]);
		expect(graph.rounds[1]?.stitches.slice(0, 3).map((stitch) => stitch.symbol)).toEqual(['dc', 'ch', 'dc']);
		expect(graph.rounds[1]?.groups[0]?.type).toBe('increase');
	});

	it('excludes a closing slip stitch from the round\'s stitches, keeping it as the join', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: 6 sc, sl st\n');

		expect(graph.rounds[1]?.stitches).toHaveLength(6);
		expect(graph.rounds[1]?.join).toMatchObject({ stitch: 'sl st' });
	});

	it('carries yarn color onto every stitch a step produced', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: color red, inc, 3 sc\n');

		expect(graph.rounds[1]?.stitches.map((stitch) => stitch.color)).toEqual(['red', 'red', 'red', 'red', 'red']);
		expect(graph.rounds[0]?.stitches.every((stitch) => stitch.color === undefined)).toBe(true);
	});

	// Section 15: a round that runs past the end of the one below keeps counting
	// instead of wrapping to a slot a full turn away.
	it('keeps counting source slots past the end of the previous round', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: 4 sc, dec\n');
		const last = graph.rounds[1]?.stitches[4];

		expect(last?.sourceStitchIds).toEqual(['r0s0', 'r0s1']);
		expect(last?.sourceSlots).toEqual([4, 5]);
	});
});

describe('stitch graph validation', () => {
	// Spec test 9: front-to-back completeness over a multi-round pattern.
	it('passes a well-formed pattern: every stitch sourced, carried forward and consumed once', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: [dec] x 9\n');

		expect(validateStitchGraph(graph)).toEqual([]);

		const last = graph.rounds.length - 1;
		graph.rounds.forEach((round, index) => {
			for (const stitch of round.stitches) {
				expect(stitch.sourceStitchIds.length).toBeGreaterThan(0);
				// Every middle-round stitch is worked into by the round above it;
				// only the last round is allowed to have no targets.
				if (index < last) expect(stitch.targetStitchIds.length).toBeGreaterThan(0);
				else expect(stitch.targetStitchIds).toHaveLength(0);
			}
		});
	});

	it('reports previous-round stitches a round never works into', () => {
		const graph = graphOf('R1: 6 sc in MR\nR2: 4 sc\n');
		const issues = validateStitchGraph(graph);

		expect(issues.map((issue) => issue.code)).toEqual(['unconsumed-stitch', 'unconsumed-stitch', 'source-skipped', 'source-skipped']);
		expect(issues.map((issue) => issue.stitchId)).toEqual(['r0s4', 'r0s5', 'r0s4', 'r0s5']);
		expect(consumesPreviousRoundExactly(graph, 1)).toBe(false);
	});

	it('reports previous-round stitches a round works into more than once', () => {
		const graph = graphOf('R1: 4 sc in MR\nR2: 3 sc, dec\n');
		const issues = validateStitchGraph(graph);

		// Spec test 8: the decrease runs off the end of round 1 and back onto its
		// first stitch — the last and first stitch are neighbours on a circle, so
		// it merges those two...
		expect(graph.rounds[1]?.stitches[3]?.sourceStitchIds).toEqual(['r0s3', 'r0s0']);
		// ...and r0s0 is then worked into twice, which is a real fault in the
		// pattern (it is also the first stitch of round 2's own first step).
		expect(issues.map((issue) => issue.code)).toEqual(['source-reused']);
		expect(issues[0]?.stitchId).toBe('r0s0');
		expect(consumesPreviousRoundExactly(graph, 1)).toBe(false);
	});

	it('accepts a round that ends on a join without counting it as a stitch', () => {
		const graph = graphOf('R1: 6 sc in MR, sl st\nR2: 6 sc, sl st\n');

		expect(validateStitchGraph(graph)).toEqual([]);
		expect(consumesPreviousRoundExactly(graph, 1)).toBe(true);
	});
});

describe('circular angle math', () => {
	// Spec test 7 / section 5.3.
	it('averages angles across 0°/360° without landing on the opposite side', () => {
		expect(normalizeAngle(meanAngle([350, 10]))).toBeCloseTo(0);
		expect(normalizeAngle(meanAngle([10, 350]))).toBeCloseTo(0);
		expect(meanAngle([90, 150])).toBeCloseTo(120);
	});

	it('keeps a mean in the same turn as the angles it averages', () => {
		// Continuous (unwrapped) angles must not be dragged back a lap: -330 and
		// -360 are neighbours, and their midpoint belongs between them.
		expect(meanAngle([-330, -360])).toBeCloseTo(-345);
	});

	it('measures the shortest way round, signed', () => {
		expect(shortestAngleDelta(350, 10)).toBeCloseTo(20);
		expect(shortestAngleDelta(10, 350)).toBeCloseTo(-20);
		expect(shortestAngleDelta(0, 90)).toBeCloseTo(90);
	});

	it('converts an arc length to the angle it subtends', () => {
		expect(arcToDegrees(Math.PI, 1)).toBeCloseTo(180);
		expect(arcToDegrees(20, 40)).toBeCloseTo(28.65, 1);
	});

	it('separates crowded stitches without reordering them', () => {
		const placed = enforceOrderAndGap([0, -1, -2, -30], 10);

		expect(placed).toHaveLength(4);
		for (let i = 1; i < placed.length; i++) {
			expect((placed[i - 1] ?? 0) - (placed[i] ?? 0)).toBeGreaterThanOrEqual(10 - 1e-9);
		}
		// A stitch that already had room does not get dragged along with them.
		expect(placed[3]).toBeCloseTo(-30);
	});

	it('leaves stitches that are already far enough apart exactly where they are', () => {
		const placed = enforceOrderAndGap([0, -20, -40], 10);

		[0, -20, -40].forEach((expected, i) => expect(placed[i]).toBeCloseTo(expected));
	});

	it('keeps the wrap-around gap when a round spans too much of the turn', () => {
		const fitted = fitTurn([0, -120, -240, -358], 20);

		expect((fitted[0] ?? 0) - (fitted[3] ?? 0)).toBeLessThanOrEqual(360 - 20 + 1e-9);
		for (let i = 1; i < fitted.length; i++) {
			expect((fitted[i - 1] ?? 0) - (fitted[i] ?? 0)).toBeGreaterThanOrEqual(20 - 1e-9);
		}
	});
});
