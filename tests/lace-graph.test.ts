import { describe, expect, it } from 'vitest';
import {
	buildStitchGraph,
	consumesPreviousRoundExactly,
	validateStitchGraph,
	type StitchGraph,
	type StitchRound,
} from '../src/layout/graph';
import { parseChart } from '../src/pattern/parse-chart';
import { CROCHET_DEV, crochetDevThrough } from './fixtures/crochet-dev';

function graphOf(source: string): StitchGraph {
	return buildStitchGraph(parseChart(source));
}

function chart(body: string): StitchGraph {
	return graphOf(`---\ntype: round\n---\n${body}\n`);
}

function round(graph: StitchGraph, num: number): StitchRound {
	const found = graph.rounds.find((candidate) => candidate.num === num);
	if (found === undefined) throw new Error(`no round ${num}`);
	return found;
}

function placeTypes(round: StitchRound): string[] {
	return round.places.map((place) => place.type);
}

describe('a round works into the places of the round below', () => {
	it('makes one space out of a run of chains, and keeps the chains', () => {
		const graph = chart(`R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.`);
		const r2 = round(graph, 2);

		expect(placeTypes(r2)).toEqual(['sc', 'ch-2 sp', 'sc', 'ch-2 sp', 'sc', 'ch-2 sp', 'sc', 'ch-2 sp', 'sc', 'ch-2 sp', 'sc', 'ch-2 sp']);
		expect(r2.stitches.filter((stitch) => stitch.symbol === 'ch')).toHaveLength(12);
	});

	it('gives a V-stitch a space of its own between its two doubles', () => {
		const graph = chart(`R1: 6 sc in MR
R2: [V2 in next sc] x6, sl st to join.`);

		expect(placeTypes(round(graph, 2))).toEqual([
			'dc', 'ch-2 sp', 'dc', 'dc', 'ch-2 sp', 'dc', 'dc', 'ch-2 sp', 'dc',
			'dc', 'ch-2 sp', 'dc', 'dc', 'ch-2 sp', 'dc', 'dc', 'ch-2 sp', 'dc',
		]);
	});

	it('works a quantity-targeted shell into one place, once', () => {
		const graph = chart(`R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.
R3: [sc in next sc, 5 dc in next ch-2 sp] x6, sl st to join.`);
		const r3 = round(graph, 3);
		const shell = r3.groups[1];

		expect(shell?.sourceIds).toHaveLength(1);
		expect(shell?.targetIds).toHaveLength(5);
		expect(shell?.motif).toMatchObject({ size: 5 });
		expect(r3.stitches.filter((stitch) => stitch.symbol === 'dc')).toHaveLength(30);
	});

	it('records what a typed search passed over, so the round below is still accounted for once', () => {
		const graph = chart(`R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.
R3: [sc in next sc, 5 dc in next ch-2 sp] x6, sl st to join.`);

		expect(round(graph, 2).places).toHaveLength(12);
		expect(round(graph, 3).consumed).toBe(12);
		expect(consumesPreviousRoundExactly(graph, 2)).toBe(true);
		expect(validateStitchGraph(graph)).toEqual([]);
	});

	it('reports a target the round below does not have', () => {
		expect(() => chart(`R1: 6 sc in MR
R2: 6 sc in next ch-9 sp, sl st to join.`)).toThrow(/targetMissing/);
	});
});

describe('working into the same place', () => {
	it('adds siblings to one motif rather than using the place twice', () => {
		const graph = chart(`R1: 6 sc in MR
R2: [sc, ch 1] x6, sl st to join.
R3: sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp, sc in next ch-1 sp,
    [3 dc in next ch-1 sp, sc in next ch-1 sp] x2,
    sl st to top of beginning ch-3.`);
		const r3 = round(graph, 3);
		const firstShell = r3.groups[0];

		expect(firstShell?.targetIds).toHaveLength(3);
		expect(firstShell?.motif).toMatchObject({ size: 3 });
		expect(validateStitchGraph(graph).filter((issue) => issue.code === 'source-reused')).toEqual([]);
	});

	it('starts a joined round from the place its join closed to', () => {
		const graph = chart(`R1: MR, ch 3 (counts as dc), 5 dc in MR, sl st to top of beginning ch-3.
R2: ch 1 (does not count as a st), sc in same st, [sc in next dc] x5, sl st to first sc.`);
		const r2 = round(graph, 2);

		// Six single crochets, one for each of R1's six doubles.
		expect(r2.stitches.filter((stitch) => stitch.symbol === 'sc')).toHaveLength(6);
		expect(validateStitchGraph(graph)).toEqual([]);
	});
});

describe('a beginning chain that stands in for a stitch', () => {
	it('makes a stitch of the round without being drawn twice', () => {
		const graph = chart('R1: MR, ch 3 (counts as dc), 23 dc in MR, sl st to top of beginning ch-3. (24 dc)');
		const r1 = round(graph, 1);

		expect(r1.places).toHaveLength(24);
		expect(r1.stitches[0]).toMatchObject({ symbol: 'dc', drawn: false });
		// The ring, then the three chains the beginning chain is drawn as.
		expect(r1.start.map((unit) => (unit.type === 'StitchNode' ? unit.stitch : '?'))).toEqual([
			'MR', 'ch', 'ch', 'ch',
		]);
	});

	it('makes no stitch when it does not count', () => {
		const graph = chart(`R1: 6 sc in MR
R2: ch 1 (does not count as a st), 6 sc, sl st to first sc.`);

		expect(round(graph, 2).places).toHaveLength(6);
	});
});

describe('turning', () => {
	it('reads the round below backwards, and turns the side facing the maker', () => {
		const graph = chart(`R1: 6 sc in MR
R2: turn, 6 sc, sl st to join.
R3: turn, 6 sc, sl st to join.
R4: 6 sc, sl st to join.`);

		expect(graph.rounds.map((r) => r.traversal)).toEqual([1, -1, 1, 1]);
		expect(graph.rounds.map((r) => r.side)).toEqual(['RS', 'WS', 'RS', 'RS']);
	});

	it('draws a round the way its own parents run, not the way it was worked', () => {
		const graph = chart(`R1: 6 sc in MR
R2: turn, 6 sc, sl st to join.
R3: turn, 6 sc, sl st to join.
R4: turn, 6 sc, sl st to join.`);

		// Every stitch is drawn where the place it is worked into puts it, so a
		// round runs the round below's way round the chart, reversed only if it
		// reads that round backwards.
		for (const round of graph.rounds.slice(1)) {
			const below = graph.rounds[round.roundIndex - 1];
			expect(`R${round.num}: ${round.direction}`).toBe(`R${round.num}: ${(below?.direction ?? 1) * round.traversal}`);
		}
	});

	it('alternates the side through the source pattern, R4 onward', () => {
		const graph = graphOf(CROCHET_DEV);
		const sides = graph.rounds.map((round) => round.side);

		expect(sides.slice(0, 4)).toEqual(['RS', 'RS', 'RS', 'WS']);
		expect(sides[4]).toBe('RS');
		expect(sides[21]).toBe('WS');
	});
});

describe('the source pattern as a graph', () => {
	it('works each round into the one below it exactly once, all the way out', () => {
		const graph = graphOf(CROCHET_DEV);

		for (const round of graph.rounds.slice(1)) {
			expect(`R${round.num}: ${round.consumed}`).toBe(
				`R${round.num}: ${graph.rounds[round.roundIndex - 1]?.places.length ?? 0}`,
			);
		}
	});

	it('has no mapping faults', () => {
		expect(validateStitchGraph(graphOf(CROCHET_DEV))).toEqual([]);
	});

	it('lines every round up with its ancestry rather than falling back to even spacing', () => {
		const graph = graphOf(CROCHET_DEV);

		for (let index = 1; index < graph.rounds.length; index++) {
			expect(`R${index + 1}: ${consumesPreviousRoundExactly(graph, index)}`).toBe(`R${index + 1}: true`);
		}
	});

	it('builds the twelve shells of R3 and the twelve V-stitches of R4', () => {
		const graph = graphOf(crochetDevThrough(4));
		const r3 = round(graph, 3);
		const r4 = round(graph, 4);

		expect(r3.groups.filter((group) => group.motif?.size === 3)).toHaveLength(12);
		expect(r4.groups.filter((group) => group.motif?.alias === 'V2')).toHaveLength(12);
	});

	it('finds the center of a shell to work into', () => {
		const graph = graphOf(crochetDevThrough(4));
		const r3 = round(graph, 3);
		const centers = r3.places.filter((place) => place.motif?.size === 3 && place.motif.index === 1);

		expect(centers).toHaveLength(12);
		for (const center of centers) {
			const stitch = graph.byId.get(center.stitchIds[0] ?? '');
			expect(stitch?.targetStitchIds.length).toBeGreaterThan(0);
		}
	});

	it('grows the shells from three doubles to nine as the rounds go out', () => {
		const graph = graphOf(crochetDevThrough(11));
		const sizes = [3, 5, 7, 9, 9].map((size, index) => {
			const num = [3, 5, 7, 9, 11][index] ?? 3;
			return round(graph, num).groups.filter((group) => group.motif?.size === size).length;
		});

		expect(sizes).toEqual([12, 12, 12, 12, 12]);
	});
});

describe('a round that runs past the round below', () => {
	it('is reported with both numbers, before anything is drawn', () => {
		expect(() =>
			chart(`R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.
R3: [sc in next sc, sc in next sc, 5 dc in next ch-2 sp] x6, sl st to join.`),
		).toThrow(/skipOverrun/);
	});

	it('leaves a shorthand round that works twice into a stitch alone', () => {
		// An increase has always been written this way; it is not an overrun.
		expect(() => chart('R1: 6 sc in MR\nR2: [inc] x 6\nR3: 12 sc')).not.toThrow();
	});
});
