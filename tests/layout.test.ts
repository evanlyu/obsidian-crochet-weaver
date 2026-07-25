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

	it('anchors the flat mesh guide to real stitch positions when rows drift off column 0', () => {
		// Symmetric increases push row 2 a half-stitch left of where row 1
		// started, so the mesh can't assume column 0 is the left edge.
		const layout = calculateLayout(parseChart('R1: sc, inc\nR2: sc, inc, sc\n'), { ...OPTIONS, grid: true });

		const xs = layout.items.map((item) => item.x);
		const verticalLineXs = (layout.gridGuide?.lines ?? [])
			.filter((line) => line.x1 === line.x2)
			.map((line) => line.x1);

		expect(Math.min(...xs)).toBeGreaterThanOrEqual(Math.min(...verticalLineXs));
		expect(Math.max(...xs)).toBeLessThanOrEqual(Math.max(...verticalLineXs));
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

describe('book-style round layout', () => {
	const BOOK = { ...OPTIONS, roundStyle: 'book' } as const;

	function angleOf(center: { x: number; y: number }, item: { x: number; y: number }): number {
		return (Math.atan2(item.y - center.y, item.x - center.x) * 180) / Math.PI;
	}

	function angleDiff(a: number, b: number): number {
		const d = Math.abs(a - b) % 360;
		return Math.min(d, 360 - d);
	}

	it('sits each increase directly above the previous-round stitch it is worked into', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = layout.items.filter((item) => item.rowIndex === 0);
		const round2 = layout.items.filter((item) => item.rowIndex === 1);

		expect(round2).toHaveLength(6);
		round2.forEach((inc, i) => {
			const parent = round1[i];
			if (!parent) throw new Error('expected parent stitch');
			expect(angleDiff(angleOf(center, inc), angleOf(center, parent))).toBeLessThan(0.01);
		});
	});

	it('centers a decrease between the two previous-round stitches it merges', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [dec] x 3\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = layout.items.filter((item) => item.rowIndex === 0);
		const round2 = layout.items.filter((item) => item.rowIndex === 1);

		expect(round2).toHaveLength(3);
		round2.forEach((dec, i) => {
			const left = round1[2 * i];
			const right = round1[2 * i + 1];
			if (!left || !right) throw new Error('expected parent stitches');
			const mid = (angleOf(center, left) + angleOf(center, right)) / 2;
			expect(angleDiff(angleOf(center, dec), mid)).toBeLessThan(0.01);
		});
	});

	it("aligns a plain round's stitches with the fanned-out children of the previous round's increases", () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: 12 sc\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = layout.items.filter((item) => item.rowIndex === 0);
		const round3 = layout.items.filter((item) => item.rowIndex === 2);

		// Each inc's two children straddle its parent by half an R3 step (15°
		// for 12 stitches), so R3's stitch pair 2i/2i+1 sits ±15° around R1
		// stitch i.
		round3.forEach((sc, j) => {
			const parent = round1[Math.floor(j / 2)];
			if (!parent) throw new Error('expected grandparent stitch');
			const offset = j % 2 === 0 ? 15 : -15;
			const expected = angleOf(center, parent) + offset;
			expect(angleDiff(angleOf(center, sc), expected)).toBeLessThan(0.01);
		});
	});

	it('encloses every round with one continuous spiral guide, without needing grid: on', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\n'),
			BOOK,
		);

		// A single open polyline, no closed circles or straight spokes.
		expect(layout.gridGuide?.circles).toHaveLength(0);
		expect(layout.gridGuide?.lines).toHaveLength(0);
		expect(layout.gridGuide?.polylines).toHaveLength(1);

		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const radiusOf = (rowIndex: number) => {
			const item = layout.items.find((i) => i.rowIndex === rowIndex);
			return Math.hypot((item?.x ?? 0) - center.x, (item?.y ?? 0) - center.y);
		};
		// The spiral winds from inside round 1 out past round 3: its per-point
		// radius spans below the innermost round and beyond the outermost.
		const polyline = layout.gridGuide?.polylines?.[0] ?? [];
		const radii = polyline.map((p) => Math.hypot(p.x - center.x, p.y - center.y));
		expect(Math.min(...radii)).toBeLessThan(radiusOf(0));
		expect(Math.max(...radii)).toBeGreaterThan(radiusOf(2));
		// Radius climbs overall (spiral), not one constant circle.
		expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(radiusOf(1) - radiusOf(0));
	});

	it('numbers each round with a label, and draws none in standard style', () => {
		const book = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			BOOK,
		);
		expect(book.labels?.map((label) => label.text)).toEqual(['1', '2']);

		const standard = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			OPTIONS,
		);
		expect(standard.labels).toBeUndefined();
	});
});

describe('color changes', () => {
	it('tags stitches with the nearest preceding color and marks only the first stitch of each new color', () => {
		const layout = calculateLayout(parseChart('R1: 8 sc, color white, 8 sc, color black, 8 sc\n'), OPTIONS);

		const colors = layout.items.map((item) => item.color);
		expect(colors.slice(0, 8)).toEqual(Array(8).fill(undefined));
		expect(colors.slice(8, 16)).toEqual(Array(8).fill('white'));
		expect(colors.slice(16, 24)).toEqual(Array(8).fill('black'));

		expect(layout.colorMarkers).toHaveLength(2);
		expect(layout.colorMarkers?.[0]).toMatchObject({ color: 'white' });
		expect(layout.colorMarkers?.[0]?.x).toBeCloseTo(layout.items[8]?.x ?? NaN);
		expect(layout.colorMarkers?.[0]?.y).toBeCloseTo(layout.items[8]?.y ?? NaN);
		expect(layout.colorMarkers?.[1]).toMatchObject({ color: 'black' });
		expect(layout.colorMarkers?.[1]?.x).toBeCloseTo(layout.items[16]?.x ?? NaN);
	});

	it('carries a color set in one row into later rows until changed again', () => {
		const layout = calculateLayout(parseChart('R1: color red, 2 sc\nR2: 2 sc\n'), OPTIONS);

		expect(layout.items.map((item) => item.color)).toEqual(['red', 'red', 'red', 'red']);
		expect(layout.colorMarkers).toHaveLength(1);
	});

	it('applies a group\'s color to every fanned-out child', () => {
		const layout = calculateLayout(parseChart('R1: color blue, (dc, ch, dc)\n'), OPTIONS);

		expect(layout.items.map((item) => item.color)).toEqual(['blue', 'blue', 'blue']);
	});

	it('propagates color through round and spiral layouts too', () => {
		const round = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: color green, [inc] x 6\n'),
			OPTIONS,
		);
		const round2 = round.items.filter((item) => item.rowIndex === 1);
		expect(round2.every((item) => item.color === 'green')).toBe(true);
		expect(round.items.filter((item) => item.rowIndex === 0).every((item) => item.color === undefined)).toBe(
			true,
		);

		const spiral = calculateLayout(
			parseChart('---\ntype: spiral\n---\nR1: color pink, sc in MR\nR2: sc\n'),
			OPTIONS,
		);
		expect(spiral.items.filter((item) => item.rowIndex !== undefined).every((item) => item.color === 'pink')).toBe(
			true,
		);
	});

	it('does not mark or color anything when no color step is used', () => {
		const layout = calculateLayout(parseChart('R1: 4 sc\n'), OPTIONS);

		expect(layout.items.every((item) => item.color === undefined)).toBe(true);
		expect(layout.colorMarkers).toBeUndefined();
	});
});
