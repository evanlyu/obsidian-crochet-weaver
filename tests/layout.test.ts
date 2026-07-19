import { describe, expect, it } from 'vitest';
import { calculateLayout, roundStitchCount, unitStitchCounts } from '../src/layout';
import { parse } from '../src/parser';
import type { CrochetAst, RowNode } from '../src/types';

const OPTIONS = {
	rotation: 'smart',
	ringSpacing: 30,
	grid: false,
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

	it('keeps each round farther out than the last even through a later decrease', () => {
		const layout = calculateLayout(
			parseChart(`---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [dec] x 6
`),
			OPTIONS,
		);

		const center = { x: layout.items[0]?.x ?? 0, y: layout.items[0]?.y ?? 0 };
		const radiusOf = (rowIndex: number) => {
			const item = layout.items.find((i) => i.rowIndex === rowIndex);
			return Math.hypot((item?.x ?? 0) - center.x, (item?.y ?? 0) - center.y);
		};

		const r1 = radiusOf(0);
		const r2 = radiusOf(1);
		const r3 = radiusOf(2);
		const r4 = radiusOf(3);

		expect(r2).toBeGreaterThan(r1);
		expect(r3).toBeGreaterThan(r2);
		expect(r4).toBeGreaterThan(r3);
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

describe('grid guide overlay', () => {
	const roundSource = `---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
`;

	it('draws no guide when grid is disabled', () => {
		const layout = calculateLayout(parseChart(roundSource), OPTIONS);
		expect(layout.gridGuide).toBeUndefined();
	});

	it('aligns round-chart guide rings to each round\'s real radius by default', () => {
		const layout = calculateLayout(parseChart(roundSource), { ...OPTIONS, grid: true });
		const center = { x: layout.items[0]?.x ?? 0, y: layout.items[0]?.y ?? 0 };
		const radiusOf = (rowIndex: number) => {
			const item = layout.items.find((i) => i.rowIndex === rowIndex);
			return Math.hypot((item?.x ?? 0) - center.x, (item?.y ?? 0) - center.y);
		};
		const radii = layout.gridGuide?.circles.map((c) => c.r) ?? [];

		expect(radii).toHaveLength(3);
		expect(radii[0]).toBeCloseTo(radiusOf(0));
		expect(radii[1]).toBeCloseTo(radiusOf(1));
		expect(radii[2]).toBeCloseTo(radiusOf(2));
	});

	it('defaults round-chart guide spokes to the last round\'s rendered unit count', () => {
		const layout = calculateLayout(parseChart(roundSource), { ...OPTIONS, grid: true });
		// R3 is [sc, inc] x 6 = 12 rendered units (an inc is one angular slot,
		// even though it outputs 2 stitches).
		expect(layout.gridGuide?.lines).toHaveLength(12);
	});

	it('extends round-chart guide rings beyond the real round count, stepping by ringSpacing', () => {
		const layout = calculateLayout(parseChart(roundSource), { ...OPTIONS, grid: true, gridCount: 5 });
		const radii = layout.gridGuide?.circles.map((c) => c.r) ?? [];

		expect(radii).toHaveLength(5);
		expect(radii[3]).toBeCloseTo((radii[2] ?? 0) + OPTIONS.ringSpacing);
		expect(radii[4]).toBeCloseTo((radii[3] ?? 0) + OPTIONS.ringSpacing);
	});

	it('ignores a rounds override below the real round count', () => {
		const layout = calculateLayout(parseChart(roundSource), { ...OPTIONS, grid: true, gridCount: 1 });
		expect(layout.gridGuide?.circles).toHaveLength(3);
	});

	it('lets gridColumns override the default spoke count', () => {
		const layout = calculateLayout(parseChart(roundSource), { ...OPTIONS, grid: true, gridColumns: 20 });
		expect(layout.gridGuide?.lines).toHaveLength(20);
	});

	it('builds a spiral guide from each row\'s end-of-row radius and last row\'s unit count', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: spiral\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			{ ...OPTIONS, grid: true },
		);

		expect(layout.gridGuide?.circles).toHaveLength(2);
		// R2 is [inc] x 6 = 6 rendered units (each inc is one angular slot).
		expect(layout.gridGuide?.lines).toHaveLength(6);
	});

	it('builds a flat mesh guide sized to the real rows and widest row by default', () => {
		const layout = calculateLayout(
			parseChart('R1: 4 sc\nR2: 6 sc\n'),
			{ ...OPTIONS, grid: true },
		);

		expect(layout.gridGuide?.circles).toHaveLength(0);
		// 2 rows -> 3 horizontal lines, 6 columns (widest row) -> 7 vertical lines.
		expect(layout.gridGuide?.lines).toHaveLength(3 + 7);
	});

	it('extends the flat mesh guide beyond the real extent, never below it', () => {
		const grown = calculateLayout(
			parseChart('R1: 4 sc\nR2: 6 sc\n'),
			{ ...OPTIONS, grid: true, gridCount: 5, gridColumns: 10 },
		);
		expect(grown.gridGuide?.lines).toHaveLength((5 + 1) + (10 + 1));

		const shrunk = calculateLayout(
			parseChart('R1: 4 sc\nR2: 6 sc\n'),
			{ ...OPTIONS, grid: true, gridCount: 1, gridColumns: 1 },
		);
		expect(shrunk.gridGuide?.lines).toHaveLength((2 + 1) + (6 + 1));
	});
});
