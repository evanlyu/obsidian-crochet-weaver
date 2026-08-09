import { describe, expect, it } from 'vitest';
import { calculateLayout } from '../src/layout';
import { buildStitchGraph, validateStitchGraph, type StitchGraph, type StitchRound } from '../src/layout/graph';
import { rowWrittenCount, validateWrittenCounts } from '../src/pattern/count';
import { parseChart } from '../src/pattern/parse-chart';
import type { CrochetAst } from '../src/types';
import { CROCHET_DEV } from './fixtures/crochet-dev';

// The pattern this change exists for, taken exactly as it is written in the
// note it came from. Everything here asks one question: does the plugin read
// the pattern the way the maker wrote it?

const ast: CrochetAst = parseChart(CROCHET_DEV);
const graph: StitchGraph = buildStitchGraph(ast);

function round(num: number): StitchRound {
	const found = graph.rounds.find((candidate) => candidate.num === num);
	if (found === undefined) throw new Error(`no round ${num}`);
	return found;
}

function shellsOf(num: number, size: number): number {
	return round(num).groups.filter((group) => group.motif?.size === size).length;
}

describe('the crochet-dev hat crown, R1 through R3', () => {
	it('reads R1 as twenty-four doubles closed to the top of its beginning chain', () => {
		const r1 = round(1);

		expect(rowWrittenCount(ast.rows[0]!)).toBe(24);
		expect(r1.places).toHaveLength(24);
		expect(r1.end).toHaveLength(1);
	});

	it('reads R2 as twenty-four single crochets and twenty-four chain spaces', () => {
		const r2 = round(2);

		expect(rowWrittenCount(ast.rows[1]!)).toBe(48);
		expect(r2.places.filter((place) => place.kind === 'space')).toHaveLength(24);
		expect(r2.places.filter((place) => place.type === 'sc')).toHaveLength(24);
	});

	it('works R2 into the stitch its own join closed to, then along R1', () => {
		expect(round(2).consumed).toBe(24);
		expect(validateStitchGraph(graph).filter((issue) => issue.roundIndex <= 2)).toEqual([]);
	});

	it('reads R3 as twelve three-double shells, the first opened by its beginning chain', () => {
		const r3 = round(3);

		expect(shellsOf(3, 3)).toBe(12);
		expect(rowWrittenCount(ast.rows[2]!)).toBe(48);
		expect(r3.groups[0]?.targetIds).toHaveLength(3);
	});
});

describe('the crochet-dev hat crown, R4 through R10', () => {
	it('turns every round from R4 on, alternating the side facing the maker', () => {
		expect(graph.rounds.slice(3, 10).map((r) => r.side)).toEqual(['WS', 'RS', 'WS', 'RS', 'WS', 'RS', 'WS']);
	});

	it('builds a V-stitch with a space of its own in every even round', () => {
		for (const num of [4, 6, 8]) {
			expect(`R${num}: ${shellsOf(num, 4)}`).toBe(`R${num}: 12`);
		}
		for (const num of [10, 12]) {
			expect(`R${num}: ${shellsOf(num, 5)}`).toBe(`R${num}: 12`);
		}
	});

	it('grows the shells: five, seven, then nine doubles worked into one space', () => {
		expect(shellsOf(5, 5)).toBe(12);
		expect(shellsOf(7, 7)).toBe(12);
		expect(shellsOf(9, 9)).toBe(12);
	});

	it('finds the centre of the shell below and the picot beside it', () => {
		// R4 works into the centre of each of R3's three-double shells.
		const centers = round(3).places.filter((place) => place.motif?.size === 3 && place.motif.index === 1);
		expect(centers).toHaveLength(12);

		// R5 works into each picot R4 made.
		expect(round(4).places.filter((place) => place.type === 'picot')).toHaveLength(12);
	});

	it('agrees with every count R4 through R10 prints', () => {
		for (const row of ast.rows.slice(3, 10)) {
			expect(`R${row.num}: ${rowWrittenCount(row)}`).toBe(`R${row.num}: ${row.count?.total}`);
		}
	});
});

describe('the crochet-dev hat crown, R11 through R22', () => {
	it('expands every round written as a repeat, naming where it came from', () => {
		expect(ast.rows).toHaveLength(22);
		// Each round names the round the note told it to repeat: R17 repeats R13,
		// which is itself a copy of R11.
		expect(ast.rows.slice(12).map((row) => row.source?.repeatOf)).toEqual([
			11, 12, 11, 12, 13, 14, 11, 12, 13, 14,
		]);
	});

	it('works the expanded rounds out to R22 without a mapping fault', () => {
		expect(validateStitchGraph(graph)).toEqual([]);
		for (const r of graph.rounds.slice(10)) {
			expect(`R${r.num}: ${r.consumed}`).toBe(`R${r.num}: ${graph.rounds[r.roundIndex - 1]?.places.length}`);
		}
	});

	it('keeps turning through the expanded rounds', () => {
		expect(graph.rounds.slice(10).map((r) => r.side)).toEqual([
			'RS', 'WS', 'RS', 'WS', 'RS', 'WS', 'RS', 'WS', 'RS', 'WS', 'RS', 'WS',
		]);
	});
});

describe('the whole pattern', () => {
	it('checks out against the counts it prints', () => {
		expect(() => validateWrittenCounts(ast.rows)).not.toThrow();
	});

	it('draws as a chart, in both graph-driven styles', () => {
		for (const style of ['japanese', 'continuous'] as const) {
			const result = calculateLayout(ast, { ringSpacing: 34, grid: false, roundStyle: style });

			expect(result.items.length + (result.motifStitches?.length ?? 0)).toBeGreaterThan(2000);
			expect(Number.isFinite(result.width) && Number.isFinite(result.height)).toBe(true);
			// Twenty-two rounds, each numbered at its own seam.
			expect(result.labels).toHaveLength(22);
			for (const item of [...result.items, ...(result.motifStitches ?? [])]) {
				expect(Number.isFinite(item.x) && Number.isFinite(item.y)).toBe(true);
			}
		}
	});

	it('draws every round further out than the one before it', () => {
		const result = calculateLayout(ast, { ringSpacing: 34, grid: false, roundStyle: 'japanese' });
		const center = { x: result.width / 2, y: result.height / 2 };
		const radii = new Map<number, number>();
		for (const item of [...result.items, ...(result.motifStitches ?? [])]) {
			if (item.rowIndex === undefined) continue;
			const radius = Math.hypot(item.x - center.x, item.y - center.y);
			radii.set(item.rowIndex, Math.max(radii.get(item.rowIndex) ?? 0, radius));
		}
		const ordered = [...radii.entries()].sort((a, b) => a[0] - b[0]).map(([, radius]) => radius);

		for (let index = 1; index < ordered.length; index++) {
			expect(ordered[index]).toBeGreaterThan(ordered[index - 1] ?? 0);
		}
	});

	it('draws no chart syntax for the finishing notes', () => {
		// The note's button loop and sewing lines are not rows of the chart.
		expect(ast.rows.every((row) => row.steps.length > 0)).toBe(true);
		expect(ast.rows.map((row) => row.num)).toEqual(Array.from({ length: 22 }, (_, index) => index + 1));
	});
});
