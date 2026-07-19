import { describe, expect, it } from 'vitest';
import { calculateLayout, roundStitchCount, unitStitchCounts } from '../src/layout';
import { parse } from '../src/parser';
import type { CrochetAst, RowNode } from '../src/types';

const OPTIONS = {
	rotation: 'smart',
	ringSpacing: 30,
	showNextRoundMarker: true,
} as const;

function parseChart(source: string): CrochetAst {
	return parse(source) as CrochetAst;
}

function firstRow(source: string): RowNode {
	const row = parseChart(source).rows[0];
	expect(row).toBeDefined();
	if (!row) throw new Error('expected first row');
	return row;
}

function distance(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('crochet layout', () => {
	it('lays out flat rows in alternating directions aligned to the previous row end', () => {
		const layout = calculateLayout(parseChart('R1: 2 sc\nR2: sc\n'), OPTIONS);

		expect(layout.items).toHaveLength(3);
		expect(layout.items[2]?.x).toBe(layout.items[1]?.x);
		expect(layout.items[2]?.y).toBeLessThan(layout.items[1]?.y ?? 0);
	});

	it('connects consecutive flat rows with a vertical turn line at the shared edge', () => {
		const layout = calculateLayout(parseChart('R1: 2 sc\nR2: 3 sc\nR3: sc\n'), OPTIONS);

		expect(layout.rowConnectors).toHaveLength(2);
		const [first, second] = layout.rowConnectors ?? [];
		expect(first?.x).toBe(layout.items[1]?.x);
		expect(first?.fromY).toBe(layout.items[1]?.y);
		expect(first?.toY).toBe(layout.items[2]?.y);
		expect(second?.x).toBe(layout.items[4]?.x);
		expect(second?.fromY).toBe(layout.items[4]?.y);
		expect(second?.toY).toBe(layout.items[5]?.y);
	});

	it('does not add row connectors for round or spiral charts', () => {
		const round = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			OPTIONS,
		);
		const spiral = calculateLayout(
			parseChart('---\ntype: spiral\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			OPTIONS,
		);

		expect(round.rowConnectors).toBeUndefined();
		expect(spiral.rowConnectors).toBeUndefined();
	});

	it('fans grouped stitches within one flat row column', () => {
		const layout = calculateLayout(parseChart('R1: (dc, ch, dc)\n'), OPTIONS);
		const rotations = layout.items.map((item) => item.rotation);
		const xs = layout.items.map((item) => item.x);

		expect(layout.items).toHaveLength(3);
		expect(rotations).toEqual([-18, 0, 18]);
		expect(xs[1]).toBeCloseTo(((xs[0] ?? 0) + (xs[2] ?? 0)) / 2);
	});

	it('adds a magic-ring center anchor for round charts', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in MR
`),
			OPTIONS,
		);

		expect(layout.items[0]?.symbol).toBe('MR');
		expect(layout.items.filter((item) => item.symbol === 'sc')).toHaveLength(6);
	});

	it('adds a chain-ring center anchor for round charts', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in ch ring
`),
			OPTIONS,
		);

		expect(layout.items.slice(0, 6).every((item) => item.symbol === 'ch')).toBe(true);
		expect(layout.items.filter((item) => item.symbol === 'sc')).toHaveLength(6);
	});

	it('places trailing round slip stitch as a join and excludes it from stitch count', () => {
		const row = firstRow('R1: 6 sc, sl st in MR\n');
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc, sl st in MR
`),
			OPTIONS,
		);

		expect(roundStitchCount(row)).toBe(6);
		expect(layout.items.filter((item) => item.symbol === 'sl st')).toHaveLength(1);
	});

	it('adds a next round marker for round charts when enabled', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in MR
`),
			OPTIONS,
		);

		expect(layout.nextRoundMarker).toBeDefined();
		expect(layout.nextRoundMarker?.rotation).toBe(0);
		expect(layout.nextRoundMarker?.y).toBeLessThan(layout.height / 2);
	});

	it('does not add a next round marker for round charts when disabled', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in MR
`),
			{ ...OPTIONS, showNextRoundMarker: false },
		);

		expect(layout.nextRoundMarker).toBeUndefined();
	});

	it('does not add a next round marker for flat charts', () => {
		const layout = calculateLayout(parseChart('R1: 2 sc\n'), OPTIONS);
		expect(layout.nextRoundMarker).toBeUndefined();
	});

	it('does not add a next round marker for spiral charts', () => {
		const layout = calculateLayout(
			parseChart(`---
type: spiral
---
R1: 6 sc in MR
`),
			OPTIONS,
		);
		expect(layout.nextRoundMarker).toBeUndefined();
	});

	it('continues spiral charts across rows without resetting radius', () => {
		const layout = calculateLayout(
			parseChart(`---
type: spiral
---
R1: sc in MR
R2: sc
`),
			OPTIONS,
		);
		const center = layout.items[0];
		const first = layout.items[1];
		const second = layout.items[2];

		expect(center).toBeDefined();
		expect(first).toBeDefined();
		expect(second).toBeDefined();
		if (!center || !first || !second) throw new Error('expected spiral items');
		expect(distance(second, center)).toBeGreaterThan(distance(first, center));
	});

	it('tags flat items with their row and unit index, grouping fanned-out units together', () => {
		const layout = calculateLayout(parseChart('R1: sc, (dc, ch, dc)\nR2: sc\n'), OPTIONS);

		expect(layout.items.map((item) => [item.rowIndex, item.unitIndex])).toEqual([
			[0, 0],
			[0, 1],
			[0, 1],
			[0, 1],
			[1, 0],
		]);
	});

	it('tags round items with their row and unit index, including the join', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in MR
R2: [inc] x 3, sl st
`),
			OPTIONS,
		);

		const round1 = layout.items.filter((item) => item.rowIndex === 0);
		const round2 = layout.items.filter((item) => item.rowIndex === 1);
		expect(round1.map((item) => item.unitIndex)).toEqual([0, 1, 2, 3, 4, 5]);
		expect(round2.map((item) => item.unitIndex)).toEqual([0, 1, 2, undefined]);
	});

	it('reports one weight per unit, treating inc as a single unit worth 2 stitches', () => {
		const row = firstRow('R1: sc, inc, sc\n');

		expect(unitStitchCounts(row)).toEqual([1, 2, 1]);
	});

	it('excludes the trailing join from unitStitchCounts, matching roundStitchCount', () => {
		const row = firstRow('R1: 3 sc, sl st\n');

		expect(roundStitchCount(row)).toBe(3);
		expect(unitStitchCounts(row)).toEqual([1, 1, 1]);
	});
});
