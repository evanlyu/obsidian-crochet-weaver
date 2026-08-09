import { describe, expect, it } from 'vitest';
import { rowWrittenCount, validateWrittenCount, writtenUnitWeights } from '../src/pattern/count';
import { parseChart } from '../src/pattern/parse-chart';
import type { RowNode } from '../src/types';
import { CROCHET_DEV, crochetDevThrough } from './fixtures/crochet-dev';

function chart(body: string): RowNode[] {
	return parseChart(`---\ntype: round\n---\n${body}\n`).rows;
}

function round(source: string, num: number): RowNode {
	const row = parseChart(source).rows.find((candidate) => candidate.num === num);
	if (row === undefined) throw new Error(`no round ${num}`);
	return row;
}

describe('what a round is worth as written', () => {
	it('counts a beginning chain as the one stitch it replaces', () => {
		const r1 = round(CROCHET_DEV, 1);

		expect(rowWrittenCount(r1)).toBe(24);
	});

	it('counts a beginning chain that does not count as nothing, and every ordinary chain as one', () => {
		const r2 = round(CROCHET_DEV, 2);

		expect(rowWrittenCount(r2)).toBe(48);
	});

	it('counts a repositioning slip stitch, a join and a turn as nothing', () => {
		const [row] = chart('R1: sl st into next ch-1 sp, turn, 6 sc, skip 1, sl st to join.');

		expect(rowWrittenCount(row as RowNode)).toBe(6);
	});

	it('counts a picot as nothing and a V as its own stitches', () => {
		const [v2] = chart('R1: V2 in next sc, picot.');
		const [v3] = chart('R1: V3 in next sc.');

		expect(rowWrittenCount(v2 as RowNode)).toBe(4);
		expect(rowWrittenCount(v3 as RowNode)).toBe(5);
	});

	it('counts a quantity-targeted shell as its own stitches', () => {
		const [row] = chart('R1: 9 dc in next ch-3 sp, sc in next picot.');

		expect(rowWrittenCount(row as RowNode)).toBe(10);
	});

	it('agrees with every count the source pattern prints', () => {
		for (const row of parseChart(CROCHET_DEV).rows) {
			if (row.count === undefined) continue;
			expect(`R${row.num}: ${rowWrittenCount(row)}`).toBe(`R${row.num}: ${row.count.total}`);
		}
	});

	it('reports a round that contradicts its own printed count', () => {
		expect(() => validateWrittenCount(round(`---\ntype: round\n---\nR1: 6 sc in MR. (7 sc)\n`, 1))).toThrow(
			/countMismatch/,
		);
	});

	it('leaves a round that prints no count alone', () => {
		expect(() => validateWrittenCount(round(`---\ntype: round\n---\nR1: 6 sc in MR\n`, 1))).not.toThrow();
	});
});

describe('what the maker works through, one instruction at a time', () => {
	it('gives one entry per stitch of a plain round', () => {
		const [row] = chart('R1: 6 sc in MR');

		expect(writtenUnitWeights(row as RowNode)).toEqual([1, 1, 1, 1, 1, 1]);
	});

	it('advances once for a motif, by what the motif is worth', () => {
		const [row] = chart('R5: 5 dc in next ch-2 sp, sc in next picot, V3 in next sc.');

		expect(writtenUnitWeights(row as RowNode)).toEqual([5, 1, 5]);
	});

	it('spreads a repeat into its goes', () => {
		const [row] = chart('R3: [3 dc in next ch-1 sp, sc in next ch-1 sp] x2.');

		expect(writtenUnitWeights(row as RowNode)).toEqual([3, 1, 3, 1]);
	});

	it('adds up to what the round is worth', () => {
		for (const row of parseChart(crochetDevThrough(12)).rows) {
			const weights = writtenUnitWeights(row);
			expect(`R${row.num}: ${weights.reduce((sum, weight) => sum + weight, 0)}`).toBe(
				`R${row.num}: ${rowWrittenCount(row)}`,
			);
		}
	});
});
