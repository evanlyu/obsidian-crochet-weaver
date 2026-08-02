import { describe, expect, it } from 'vitest';
import { calculateLayout, roundStitchCount, unitStitchCounts } from '../src/layout';
import { symbolExtent } from '../src/layout/constants';
import { parse } from '../src/pattern/parser';
import type { CrochetAst, GridPoint, LayoutResult, RenderItem, RowNode, ShapingMark } from '../src/types';

const OPTIONS = {
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

// Do segments a1-a2 and b1-b2 properly cross? (Touching at a shared endpoint,
// which is how two connectors may legitimately meet at a stitch, is not a
// crossing.)
function segmentsCross(a1: GridPoint, a2: GridPoint, b1: GridPoint, b2: GridPoint): boolean {
	const side = (p: GridPoint, q: GridPoint, r: GridPoint) =>
		Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
	const d1 = side(a1, a2, b1);
	const d2 = side(a1, a2, b2);
	const d3 = side(b1, b2, a1);
	const d4 = side(b1, b2, a2);
	return d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0;
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

describe('traditional-Japanese round layout', () => {
	const BOOK = { ...OPTIONS, roundStyle: 'japanese' } as const;

	// How far the layout may move a stitch from the one it is worked into, as a
	// share of its round's stitch pitch: a fifth of a stitch to even out the
	// crowding shaping below it left (MAX_DRIFT_SHARE), and as much again where a
	// round closes its seam back to the one width it needs (SEAM_CLOSE_SHARE — see
	// closeSeam in layout/angles.ts). Both are spent beside the seam and neither
	// opposite it, so this is the worst case, not the usual one.
	const DRIFT_SHARE = 0.4;

	// That allowance in degrees, on a round of `count` stitches.
	function driftDegrees(count: number): number {
		return (360 / count) * DRIFT_SHARE;
	}

	function angleOf(center: { x: number; y: number }, item: { x: number; y: number }): number {
		return (Math.atan2(item.y - center.y, item.x - center.x) * 180) / Math.PI;
	}

	function angleDiff(a: number, b: number): number {
		const d = Math.abs(a - b) % 360;
		return Math.min(d, 360 - d);
	}

	// How far clockwise (the direction stitches are worked) it is from a to b.
	function clockwiseDelta(a: number, b: number): number {
		return (((a - b) % 360) + 360) % 360;
	}

	// Midpoint of the short way round. Averaging the two angles directly would
	// put the midpoint of 350° and 10° at 180°, on the opposite side of the chart.
	function midAngle(a: number, b: number): number {
		return a - clockwiseDelta(a, b) / 2;
	}

	function radiusOf(center: { x: number; y: number }, point: { x: number; y: number }): number {
		return Math.hypot(point.x - center.x, point.y - center.y);
	}

	// Every stitch symbol a round drew, in working order. A shaping step draws
	// no stitch symbols — its V or ∧ stands for them (see roundSteps).
	function round(layout: LayoutResult, rowIndex: number): RenderItem[] {
		return layout.items.filter((item) => item.rowIndex === rowIndex);
	}

	function marksOf(layout: LayoutResult, rowIndex: number): ShapingMark[] {
		return (layout.shapingMarks ?? []).filter((mark) => mark.rowIndex === rowIndex);
	}

	// Everything a round drew, in working order: a plain stitch at its symbol, a
	// shaping step at the mark standing for the stitches it made.
	function roundSteps(layout: LayoutResult, rowIndex: number): { x: number; y: number; unitIndex: number }[] {
		const items = round(layout, rowIndex)
			.filter((item) => item.unitIndex !== undefined)
			.map((item) => ({ x: item.x, y: item.y, unitIndex: item.unitIndex ?? 0 }));
		const marks = marksOf(layout, rowIndex).map((mark) => ({ x: mark.x, y: mark.y, unitIndex: mark.unitIndex }));
		return [...items, ...marks].sort((a, b) => a.unitIndex - b.unitIndex);
	}

	function stitchOf(layout: LayoutResult, id: string): RenderItem {
		const item = layout.items.find((candidate) => candidate.stitchId === id);
		if (!item) throw new Error(`expected stitch ${id}`);
		return item;
	}

	// The pointed end and the open ends of a V or ∧.
	function endpoints(mark: ShapingMark): { apex: GridPoint; arms: GridPoint[] } {
		const [first, apex, last] = mark.segments[0] ?? [];
		if (!first || !apex || !last) throw new Error('expected a three-point mark');
		return { apex, arms: [first, last, ...mark.segments.slice(1).map((segment) => segment[1] ?? apex)] };
	}

	// The radius a round's stitches sit at, whether they drew stitch symbols or
	// only shaping marks.
	function roundRadius(layout: LayoutResult, center: GridPoint, rowIndex: number): number {
		const step = roundSteps(layout, rowIndex)[0];
		if (!step) throw new Error(`expected round ${rowIndex} to have stitches`);
		return radiusOf(center, step);
	}

	// Spec test 4 / section 11: an increase makes two stitches out of one, and
	// its V stands for both of them.
	it('opens each increase V from the stitch below it out to the two it makes', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = round(layout, 0);
		const marks = marksOf(layout, 1);

		// The V's are the round's stitches; there are no separate symbols for them.
		expect(round(layout, 1)).toHaveLength(0);
		expect(marks).toHaveLength(6);
		marks.forEach((mark, i) => {
			const parent = round1[i];
			if (!parent) throw new Error('expected the stitch below');
			const { apex, arms } = endpoints(mark);
			const [left, right] = arms;
			if (!left || !right) throw new Error('expected two arms');
			// The point lines up with the stitch it is worked into, and the two
			// arms straddle it symmetrically — one stitch became two.
			expect(angleDiff(angleOf(center, apex), angleOf(center, parent))).toBeLessThan(0.01);
			const mid = midAngle(angleOf(center, left), angleOf(center, right));
			expect(angleDiff(angleOf(center, parent), mid)).toBeLessThan(driftDegrees(12));
			// Close enough together to read as one step worked into one stitch.
			expect(angleDiff(angleOf(center, left), angleOf(center, right))).toBeLessThan(360 / 12);
		});
	});

	// Spec sections 3 and 4: a shaping symbol belongs to its round — pointed end
	// toward the stitch below, open end toward the round above, drawn the height
	// of a stitch rather than the height of the band, and never reaching into a
	// neighbouring round.
	it('draws the increase V inside its own round, at a stitch\'s own height', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: inc, 5 sc\nR3: 8 sc\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		expect(layout.shapingMarks).toHaveLength(1);
		const mark = layout.shapingMarks?.[0];
		if (!mark) throw new Error('expected an increase mark');
		expect(mark.kind).toBe('increase');
		expect(mark.segments).toHaveLength(1);

		const { apex, arms } = endpoints(mark);
		const parent = stitchOf(layout, 'r0s0');
		const inner = (roundRadius(layout, center, 0) + roundRadius(layout, center, 1)) / 2;
		const outer = (roundRadius(layout, center, 1) + roundRadius(layout, center, 2)) / 2;

		// The point lines up with the stitch below, and the whole mark sits
		// inside this round's band — pointing the right way without crossing
		// into a neighbouring round.
		expect(angleDiff(angleOf(center, apex), angleOf(center, parent))).toBeLessThan(0.01);
		expect(radiusOf(center, apex)).toBeGreaterThan(inner);
		expect(radiusOf(center, apex)).toBeLessThan(roundRadius(layout, center, 1));
		for (const arm of arms) {
			expect(radiusOf(center, arm)).toBeGreaterThan(roundRadius(layout, center, 1));
			expect(radiusOf(center, arm)).toBeLessThan(outer);
			expect(radiusOf(center, arm)).toBeLessThan(roundRadius(layout, center, 2));
		}
		// ...and it is a stitch's symbol, so it is a stitch tall rather than a
		// band tall: a round of increases must not be drawn taller than a round
		// of plain stitches beside it.
		const height = Math.abs(radiusOf(center, apex) - radiusOf(center, arms[0]!));
		expect(height).toBeLessThanOrEqual(2 * symbolExtent('sc') + 0.01);
	});

	// Spec test 3 / section 5.5: the ∧ is the reverse — two ends on the stitches
	// it closed over, its point where the next round picks it up.
	it('draws the decrease ∧ inside its own round, over both stitches it merges', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: dec, 4 sc\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		// Four plain stitches drew symbols; the decrease drew its ∧ instead.
		expect(round(layout, 1)).toHaveLength(4);
		expect(layout.shapingMarks).toHaveLength(1);
		const mark = layout.shapingMarks?.[0];
		if (!mark) throw new Error('expected a decrease mark');
		expect(mark.kind).toBe('decrease');

		const { apex, arms } = endpoints(mark);
		const [footA, footB] = arms;
		if (!footA || !footB) throw new Error('expected two feet');
		const [parentA, parentB] = [stitchOf(layout, 'r0s0'), stitchOf(layout, 'r0s1')];
		const inner = (roundRadius(layout, center, 0) + roundRadius(layout, center, 1)) / 2;

		// It leans over the two stitches it closed over — one foot toward each,
		// centered between them — and reaches this round's inner edge without
		// crossing it. The opening is drawn no wider than those two stitches
		// really are apart, so the ∧ stays a symbol rather than two long lines.
		const across = clockwiseDelta(angleOf(center, parentA), angleOf(center, parentB));
		const open = clockwiseDelta(angleOf(center, footA), angleOf(center, footB));
		expect(open).toBeGreaterThan(0);
		expect(open).toBeLessThanOrEqual(across);
		expect(
			angleDiff(
				midAngle(angleOf(center, footA), angleOf(center, footB)),
				midAngle(angleOf(center, parentA), angleOf(center, parentB)),
			),
		).toBeLessThan(driftDegrees(5));
		expect(radiusOf(center, footA)).toBeGreaterThan(inner);
		expect(radiusOf(center, footA)).toBeLessThan(roundRadius(layout, center, 1));
		// ...and the point stands above them, further out, on this round.
		expect(radiusOf(center, apex)).toBeGreaterThan(radiusOf(center, footA));
		expect(radiusOf(center, apex)).toBeGreaterThan(roundRadius(layout, center, 1));
	});

	// An increase's stitches and a decrease's stitch belong to their round like
	// any other — nothing is left floating between two rounds.
	it('puts every step of a round on that round, at one shared radius', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 8 sc in MR\nR2: inc, sc, dec, sc, inc, dec\nR3: [sc, inc] x 4\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		for (const rowIndex of [0, 1, 2]) {
			const radii = roundSteps(layout, rowIndex).map((step) => radiusOf(center, step));
			const first = radii[0] ?? 0;
			expect(first).toBeGreaterThan(0);
			for (const radius of radii) expect(radius).toBeCloseTo(first, 9);
		}
	});

	// Spec section 5: a symbol is made smaller by narrowing the sector it takes
	// up, never by pulling its round closer to the one below it.
	it('keeps the gap between rounds independent of the shaping in them', () => {
		const gaps = (source: string) => {
			const layout = calculateLayout(parseChart(source), BOOK);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const first = round(layout, 0)[0];
			const second = round(layout, 1)[0];
			if (!first || !second) throw new Error('expected two rounds');
			return radiusOf(center, second) - radiusOf(center, first);
		};

		const plain = gaps('---\ntype: round\n---\nR1: 6 sc in MR\nR2: 6 sc\n');
		const increased = gaps('---\ntype: round\n---\nR1: 6 sc in MR\nR2: inc, 5 sc\n');
		const decreased = gaps('---\ntype: round\n---\nR1: 6 sc in MR\nR2: dec, 4 sc\n');

		expect(increased).toBeCloseTo(plain);
		expect(decreased).toBeCloseTo(plain);
		expect(plain).toBeCloseTo(OPTIONS.ringSpacing);
	});

	// The complaint this style exists to avoid: a shaping symbol adrift in the
	// gap between two rounds, reading as a ring of its own. Every part of every
	// mark stays inside the band of the round it belongs to.
	it('keeps every shaping symbol inside its own round, never in the gap between rounds', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [dec] x 6\nR4: 6 sc\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		expect(layout.shapingMarks).toHaveLength(12);
		layout.shapingMarks?.forEach((mark) => {
			const own = roundRadius(layout, center, mark.rowIndex);
			// The band runs halfway to the round below and halfway to the one above.
			const inner = (roundRadius(layout, center, mark.rowIndex - 1) + own) / 2;
			const outer = (own + roundRadius(layout, center, mark.rowIndex + 1)) / 2;
			for (const segment of mark.segments) {
				for (const point of segment) {
					expect(radiusOf(center, point)).toBeGreaterThan(inner);
					expect(radiusOf(center, point)).toBeLessThan(outer);
				}
			}
		});
	});

	describe('repeat grouping', () => {
		const LINKED = { ...OPTIONS, roundStyle: 'continuous' } as const;

		// Every stitch renders in continuous style, so the round's real spacing can be
		// read straight off the chart.
		function gapsOf(layout: LayoutResult, rowIndex: number): number[] {
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const stitches = round(layout, rowIndex);
			return stitches.map((stitch, i) =>
				clockwiseDelta(angleOf(center, stitch), angleOf(center, stitches[(i + 1) % stitches.length] ?? stitch)),
			);
		}

		// The gaps between neighbouring stitches, in px of arc, leaving out the
		// seam — that gap is reserved room rather than spacing (see layout/seam.ts).
		function pitchesOf(layout: LayoutResult, rowIndex: number): number[] {
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const radius = roundRadius(layout, center, rowIndex);
			return gapsOf(layout, rowIndex)
				.slice(0, -1)
				.map((gap) => (gap * Math.PI * radius) / 180);
		}

		// How unevenly a round is spaced: the widest gap between neighbouring
		// stitches over the narrowest.
		function unevenness(layout: LayoutResult, rowIndex: number): number {
			const pitches = pitchesOf(layout, rowIndex);
			return Math.max(...pitches) / Math.min(...pitches);
		}

		// A plain round works one stitch into each of the round below, so every
		// stitch belongs over the one it is worked into — but it also inherits that
		// round's crowding, and an increase always leaves some: its two stitches
		// take less room than two spread ones would, so the gaps beside them are
		// wider. So a plain round evens out as it goes, by a fraction of a stitch
		// each round, and never by enough to leave a stitch off its own.
		it('evens out the crowding a plain round inherits without leaving its columns', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: 18 sc\n'),
				LINKED,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const byId = new Map(layout.items.filter((item) => item.stitchId).map((item) => [item.stitchId, item]));
			const radius = roundRadius(layout, center, 3);
			const pitch = (2 * Math.PI * radius) / round(layout, 3).length;

			expect(unevenness(layout, 3)).toBeLessThan(unevenness(layout, 2));
			for (const stitch of round(layout, 3)) {
				const parent = byId.get(stitch.sourceStitchIds?.[0]);
				if (!parent) throw new Error('expected the stitch below');
				const drift = angleDiff(angleOf(center, stitch), angleOf(center, parent));
				expect((drift * Math.PI * radius) / 180).toBeLessThanOrEqual(pitch * DRIFT_SHARE);
			}
		});

		it('keeps a whole run of plain rounds in the same columns, closing up as it goes', () => {
			let source = '---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\n';
			for (let round = 4; round <= 8; round++) source += `R${round}: 18 sc\n`;
			const layout = calculateLayout(parseChart(source), LINKED);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const byId = new Map(layout.items.filter((item) => item.stitchId).map((item) => [item.stitchId, item]));

			// Every plain round is at least as even as the one below it, and none of
			// them reorders or leaves the column it inherited: each stitch stays
			// within a fraction of a stitch of the one it is worked into, so the
			// columns lean in over the rounds rather than jumping.
			for (let rowIndex = 3; rowIndex <= 7; rowIndex++) {
				expect(unevenness(layout, rowIndex)).toBeLessThanOrEqual(unevenness(layout, rowIndex - 1) + 1e-9);
				const radius = roundRadius(layout, center, rowIndex);
				const pitch = (2 * Math.PI * radius) / round(layout, rowIndex).length;
				for (const stitch of round(layout, rowIndex)) {
					const parent = byId.get(stitch.sourceStitchIds?.[0]);
					if (!parent) throw new Error('expected the stitch below');
					const drift = angleDiff(angleOf(center, stitch), angleOf(center, parent));
					expect((drift * Math.PI * radius) / 180).toBeLessThanOrEqual(pitch * DRIFT_SHARE);
				}
			}
			// And they do close up: by the last one the round is nearly even.
			expect(unevenness(layout, 7)).toBeLessThan(unevenness(layout, 2) * 0.9);
		});

		// Closing the repeats up must not cost the correspondence: a stitch still
		// has to sit under the stitch it is worked into, however tight its group
		// is, and that must not drift further out round after round.
		it('keeps every stitch under the one it is worked into, all the way out', () => {
			let source = '---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n';
			for (let round = 3; round <= 9; round++) source += `R${round}: [${round - 2} sc, inc] x 6\n`;
			const layout = calculateLayout(parseChart(source), LINKED);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const byId = new Map(layout.items.filter((item) => item.stitchId).map((item) => [item.stitchId, item]));

			const worstDrift = (rowIndex: number) => {
				const stitches = round(layout, rowIndex);
				const radius = roundRadius(layout, center, rowIndex);
				const pitch = (2 * Math.PI * radius) / stitches.length;
				let worst = 0;
				for (const stitch of stitches) {
					const parent = byId.get(stitch.sourceStitchIds?.[0]);
					if (!parent) throw new Error('expected the stitch below');
					const drift = angleDiff(angleOf(center, stitch), angleOf(center, parent));
					worst = Math.max(worst, (drift * Math.PI * radius) / 180 / pitch);
				}
				return worst;
			};

			// An increase's two stitches straddle the one they share, so they cannot
			// sit dead over it — half a stitch — and the layout may move a stitch a
			// further DRIFT_SHARE of one. Nothing may exceed the two together.
			for (let rowIndex = 1; rowIndex <= 8; rowIndex++) {
				expect(worstDrift(rowIndex)).toBeLessThan(0.5 + DRIFT_SHARE);
			}
			// And it stays there instead of creeping outward round after round,
			// which is what would really lose the correspondence: the outermost
			// round is no further off its own parents than an inner one, give or
			// take what closing the seam costs.
			expect(worstDrift(8)).toBeLessThanOrEqual(worstDrift(4) + DRIFT_SHARE);
		});

		// An increase makes two stitches where there was one, so it needs room —
		// but it must take that room from itself, never by pushing the stitches
		// after it off the ones they are worked into.
		it('never pushes the stitches after an increase off their own', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: [sc, inc, sc] x 6\n'),
				LINKED,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const byId = new Map(layout.items.filter((item) => item.stitchId).map((item) => [item.stitchId, item]));
			const radius = roundRadius(layout, center, 3);
			const stitches = round(layout, 3);
			const pitch = (2 * Math.PI * radius) / stitches.length;

			// The plain stitch that follows each increase, over its own parent.
			for (const stitch of stitches) {
				if (stitch.shaping !== undefined) continue;
				const parent = byId.get(stitch.sourceStitchIds?.[0]);
				if (!parent) throw new Error('expected the stitch below');
				const drift = angleDiff(angleOf(center, stitch), angleOf(center, parent));
				expect((drift * Math.PI * radius) / 180 / pitch).toBeLessThan(0.5);
			}
		});

		// Evenly, that is, around the part of the ring the stitches have: the seam
		// keeps room of its own for the round number and the step out to the next
		// round, so it is the one gap that is wider than a stitch's worth.
		it('spreads a round evenly when it is all one group', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: 6 sc\n'),
				LINKED,
			);

			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			for (const rowIndex of [0, 1]) {
				const gaps = gapsOf(layout, rowIndex);
				expect(gaps).toHaveLength(6);
				for (const gap of gaps.slice(0, -1)) expect(gap).toBeCloseTo(gaps[0] ?? 0);
				// The seam holds the round number and the step out, whatever the
				// stitches around it are doing.
				const radius = roundRadius(layout, center, rowIndex);
				const seam = ((gaps[gaps.length - 1] ?? 0) * Math.PI * radius) / 180;
				expect(seam).toBeGreaterThan(24);
			}
		});

		it('falls back to even spacing on a round too crowded to separate repeats', () => {
			// Every stitch is its own repeat here, so there is nothing to close up:
			// separating them would just be even spacing under another name.
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 12 sc in MR\nR2: [sc] x 12\n'),
				LINKED,
			);
			const gaps = gapsOf(layout, 1);

			expect(gaps).toHaveLength(12);
			for (const gap of gaps.slice(0, -1)) expect(gap).toBeCloseTo(gaps[0] ?? 0);
			expect(gaps[gaps.length - 1] ?? 0).toBeGreaterThan(gaps[0] ?? 0);
		});
	});

	// A mark reaches its stitches sideways rather than by growing: however far
	// apart they are, it opens no wider than the room those stitches themselves
	// take, and stays the height of one stitch.
	it('reaches its stitches by opening, never by growing taller', () => {
		for (const source of [
			'---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: [2 sc, dec] x 4\n',
			'---\ntype: round\n---\nR1: 24 sc in MR\nR2: [dec] x 12\nR3: [dec] x 6\n',
			'---\ntype: round\n---\nR1: 18 sc in MR\nR2: [sc3tog] x 6\n',
		]) {
			const layout = calculateLayout(parseChart(source), BOOK);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const marks = layout.shapingMarks ?? [];
			expect(marks.length).toBeGreaterThan(0);

			for (const mark of marks) {
				const { apex, arms } = endpoints(mark);
				const [first, last] = arms;
				if (!first || !last) throw new Error('expected two open ends');
				const width = distance(first, last);
				const height = Math.abs(radiusOf(center, apex) - radiusOf(center, first));
				// It reaches sideways as far as the stitches it spans take up —
				// one stitch's worth of the round each, so a 3-together may open
				// wider than a 2-together — and no further.
				expect(width).toBeLessThanOrEqual(20 * arms.length);
				// Its height is a stitch's height, whatever it had to reach.
				expect(height).toBeLessThanOrEqual(2 * symbolExtent('sc') + 0.01);
			}
		}
	});

	// Spec tests 4 and 5: a whole round of shaping, with no two symbols crossing.
	it('never lets two shaping connectors cross each other', () => {
		for (const source of [
			'---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\n',
			'---\ntype: round\n---\nR1: 12 sc in MR\nR2: [dec] x 6\n',
			'---\ntype: round\n---\nR1: 4 sc in MR\nR2: inc, inc, sc, sc\n',
		]) {
			const connectors = calculateLayout(parseChart(source), BOOK).shapingMarks ?? [];
			expect(connectors.length).toBeGreaterThan(1);

			const segments = connectors.flatMap((connector, index) =>
				connector.segments.flatMap((segment) =>
					segment.slice(1).map((point, i) => ({ index, a: segment[i] ?? point, b: point })),
				),
			);
			segments.forEach((first, i) => {
				segments.slice(i + 1).forEach((second) => {
					if (first.index === second.index) return;
					expect(segmentsCross(first.a, first.b, second.a, second.b)).toBe(false);
				});
			});
		}
	});

	// The progress tool counts steps, not stitches: an increase is one action
	// worth two stitches, and its mark answers to that step's index.
	it('tags each shaping mark with the step that made it, alongside the join', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 3, sl st\n'),
			BOOK,
		);
		const round2 = layout.items.filter((item) => item.rowIndex === 1);

		expect(layout.shapingMarks?.map((mark) => mark.unitIndex)).toEqual([0, 1, 2]);
		// Only the closing join drew a stitch symbol of its own.
		expect(round2.map((item) => item.symbol)).toEqual(['sl st']);
		expect(round2[0]?.unitIndex).toBeUndefined();
	});

	// Spec section 18: a shaping symbol is never a stock glyph here.
	it('never stamps the fixed inc/dec glyphs in a book-style chart', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [dec] x 6\n'),
			BOOK,
		);

		expect(layout.items.some((item) => item.symbol === 'inc' || item.symbol === 'dec')).toBe(false);
		expect(layout.shapingMarks).toHaveLength(12);
	});

	// Spec test 1: nothing to connect on a plain round.
	it('draws no shaping connectors when a round has no increases or decreases', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: 6 sc\n'),
			BOOK,
		);

		expect(layout.shapingMarks).toBeUndefined();
		expect(layout.items.some((item) => item.symbol === 'inc' || item.symbol === 'dec')).toBe(false);
	});

	// Spec test 5: a whole round of decreases stays readable.
	it('gathers each decrease over the two stitches it merges, all round', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 12 sc in MR\nR2: [dec] x 6\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = round(layout, 0);
		const marks = marksOf(layout, 1);

		expect(marks).toHaveLength(6);
		marks.forEach((mark, i) => {
			const left = round1[2 * i];
			const right = round1[2 * i + 1];
			if (!left || !right) throw new Error('expected parent stitches');
			const { apex, arms } = endpoints(mark);
			const [footA, footB] = arms;
			if (!footA || !footB) throw new Error('expected two feet');
			// Its point stands midway above the two stitches, one foot leaning
			// toward each, opening no wider than the two stitches themselves.
			const mid = midAngle(angleOf(center, left), angleOf(center, right));
			expect(angleDiff(angleOf(center, apex), mid)).toBeLessThan(driftDegrees(6));
			expect(angleDiff(midAngle(angleOf(center, footA), angleOf(center, footB)), mid)).toBeLessThan(
				driftDegrees(6),
			);
			expect(clockwiseDelta(angleOf(center, footA), angleOf(center, footB))).toBeLessThanOrEqual(
				clockwiseDelta(angleOf(center, left), angleOf(center, right)) + 1e-9,
			);
		});
	});

	// Spec test 6 / section 10: order is a property of the pattern, not the layout.
	it('keeps steps in working order around the circle through mixed shaping', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 8 sc in MR\nR2: inc, sc, dec, sc, inc, dec\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const steps = roundSteps(layout, 1);

		expect(steps.map((step) => step.unitIndex)).toEqual([0, 1, 2, 3, 4, 5]);
		// Walking the round clockwise from the first step visits them in the
		// order they are worked, and each step is a real gap forward.
		let swept = 0;
		steps.forEach((step, i) => {
			if (i === 0) return;
			const previous = steps[i - 1];
			if (!previous) throw new Error('expected previous step');
			const gap = clockwiseDelta(angleOf(center, previous), angleOf(center, step));
			expect(gap).toBeGreaterThan(0);
			swept += gap;
		});
		expect(swept).toBeLessThan(360);
	});

	// Spec section 6 / 8: shaping may not squash stitches into each other.
	it('keeps neighbouring steps apart even where shaping crowds a round', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 8 sc in MR\nR2: inc, sc, dec, sc, inc, dec\nR3: [sc, inc] x 4\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		for (const rowIndex of [1, 2]) {
			const steps = roundSteps(layout, rowIndex);
			const radius = roundRadius(layout, center, rowIndex);
			steps.forEach((step, i) => {
				const next = steps[(i + 1) % steps.length];
				if (!next) throw new Error('expected a next step');
				const gap = clockwiseDelta(angleOf(center, step), angleOf(center, next));
				// 14px of arc: symbols are ~12px wide, so they cannot overlap.
				expect((gap * Math.PI * radius) / 180).toBeGreaterThan(13.9);
			});
		}
	});

	// Spec test 7 / section 15: shaping either side of the round's seam.
	it('handles a decrease whose stitches sit either side of 0°', () => {
		// With 12 stitches starting at the top, the 10th sits at 0° and the 11th
		// at 330°: a decrease merging them must land between them near 345°, not
		// half a turn away at 165° where averaging the two raw angles would put it.
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 12 sc in MR\nR2: 9 sc, dec, sc\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');

		const child = marksOf(layout, 1).find((mark) => mark.unitIndex === 9);
		if (!child) throw new Error('expected the decrease mark');
		const parentA = stitchOf(layout, 'r0s9');
		const parentB = stitchOf(layout, 'r0s10');

		// The decrease is between the two stitches it merged: the two short hops
		// around it add up to the one hop from stitch to stitch.
		const toChild = clockwiseDelta(angleOf(center, parentA), angleOf(center, child));
		const fromChild = clockwiseDelta(angleOf(center, child), angleOf(center, parentB));
		const across = clockwiseDelta(angleOf(center, parentA), angleOf(center, parentB));
		expect(toChild).toBeGreaterThan(0);
		expect(fromChild).toBeGreaterThan(0);
		expect(toChild + fromChild).toBeCloseTo(across);
		expect(across).toBeLessThan(180);
	});

	it('centers a decrease between the two previous-round stitches it merges', () => {
		const layout = calculateLayout(
			parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: [dec] x 3\n'),
			BOOK,
		);
		const center = layout.items[0];
		if (!center) throw new Error('expected MR center');
		const round1 = layout.items.filter((item) => item.rowIndex === 0);
		const round2 = roundSteps(layout, 1);

		expect(round2).toHaveLength(3);
		round2.forEach((dec, i) => {
			const left = round1[2 * i];
			const right = round1[2 * i + 1];
			if (!left || !right) throw new Error('expected parent stitches');
			const mid = midAngle(angleOf(center, left), angleOf(center, right));
			expect(angleDiff(angleOf(center, dec), mid)).toBeLessThan(driftDegrees(3));
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

		// R2's six increases each split one R1 parent into two children (the
		// increases render as one V each, so their children only surface as
		// R3's twelve plain sc). Each R3 pair 2i / 2i+1 descends from R1 stitch
		// i and must straddle it — the parent sits at the pair's midpoint, give or
		// take the fraction of a stitch R3 evens itself out by.
		expect(round3).toHaveLength(12);
		const radius = roundRadius(layout, center, 2);
		const pitch = (2 * Math.PI * radius) / round3.length;
		round1.forEach((parent, i) => {
			const left = round3[2 * i];
			const right = round3[2 * i + 1];
			if (!left || !right) throw new Error('expected two grandchildren');
			const mid = midAngle(angleOf(center, left), angleOf(center, right));
			const off = (angleDiff(angleOf(center, parent), mid) * Math.PI * radius) / 180;
			expect(off).toBeLessThanOrEqual(pitch * DRIFT_SHARE);
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
		const radiusAt = (rowIndex: number) => roundRadius(layout, center, rowIndex);
		// The spiral winds from inside round 1 out past round 3: its per-point
		// radius spans below the innermost round and beyond the outermost.
		const polyline = layout.gridGuide?.polylines?.[0] ?? [];
		const radii = polyline.map((p) => Math.hypot(p.x - center.x, p.y - center.y));
		expect(Math.min(...radii)).toBeLessThan(radiusAt(0));
		expect(Math.max(...radii)).toBeGreaterThan(radiusAt(2));
		// Radius climbs overall (spiral), not one constant circle.
		expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(radiusAt(1) - radiusAt(0));
	});

	describe('continuous style', () => {
		const LINKED = { ...OPTIONS, roundStyle: 'continuous' } as const;

		it('shares its rounds and numbering with traditional Japanese style', () => {
			const source = '---\ntype: round\n---\nR1: 6 sc in MR\nR2: [sc, inc] x 3\nR3: 9 sc\n';
			const book = calculateLayout(parseChart(source), BOOK);
			const linked = calculateLayout(parseChart(source), LINKED);

			// Same rounds at the same radii, numbered the same, both enclosed by
			// the band guide. Only the spacing within a round can differ, and
			// only because traditional Japanese style draws the two stitches of an increase as
			// one V, which needs less room than the two symbols linked draws —
			// which also nudges where each round's seam falls.
			expect(linked.labels?.map((label) => label.text)).toEqual(book.labels?.map((label) => label.text));
			expect(linked.gridGuide?.polylines).toHaveLength(book.gridGuide?.polylines?.length ?? 0);
			const bookCenter = book.items[0];
			const linkedCenter = linked.items[0];
			if (!bookCenter || !linkedCenter) throw new Error('expected MR centers');
			for (const rowIndex of [0, 1, 2]) {
				expect(roundRadius(linked, linkedCenter, rowIndex)).toBeCloseTo(
					roundRadius(book, bookCenter, rowIndex),
				);
			}
		});

		it('draws every stitch an increase makes, and links both to the stitch below', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: inc, 5 sc\n'),
				LINKED,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			// Unlike traditional Japanese style, all seven stitches keep their own symbol.
			expect(round(layout, 1)).toHaveLength(7);
			const [childA, childB] = [stitchOf(layout, 'r1s0'), stitchOf(layout, 'r1s1')];
			expect(childA.sourceStitchIds).toEqual(['r0s0']);
			expect(childB.sourceStitchIds).toEqual(['r0s0']);

			expect(layout.shapingMarks).toHaveLength(1);
			const link = layout.shapingMarks?.[0];
			if (!link) throw new Error('expected an increase link');
			const { apex, arms } = endpoints(link);
			const parent = stitchOf(layout, 'r0s0');

			// The apex reaches out from the stitch below, each arm back to one of
			// the stitches worked into it — so the line crosses between rounds.
			expect(angleDiff(angleOf(center, apex), angleOf(center, parent))).toBeLessThan(0.01);
			expect(angleDiff(angleOf(center, arms[0] ?? apex), angleOf(center, childA))).toBeLessThan(0.01);
			expect(angleDiff(angleOf(center, arms[1] ?? apex), angleOf(center, childB))).toBeLessThan(0.01);
			expect(radiusOf(center, apex)).toBeGreaterThan(radiusOf(center, parent));
			expect(radiusOf(center, apex)).toBeLessThan(radiusOf(center, arms[0] ?? apex));
			expect(radiusOf(center, arms[0] ?? apex)).toBeLessThan(radiusOf(center, childA));
		});

		it('links a decrease down to each stitch it closed over', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: dec, 4 sc\n'),
				LINKED,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			expect(round(layout, 1)).toHaveLength(5);
			const link = layout.shapingMarks?.[0];
			if (!link) throw new Error('expected a decrease link');
			expect(link.kind).toBe('decrease');

			const { apex, arms } = endpoints(link);
			const child = stitchOf(layout, 'r1s0');
			const [parentA, parentB] = [stitchOf(layout, 'r0s0'), stitchOf(layout, 'r0s1')];
			expect(angleDiff(angleOf(center, apex), angleOf(center, child))).toBeLessThan(0.01);
			expect(angleDiff(angleOf(center, arms[0] ?? apex), angleOf(center, parentA))).toBeLessThan(0.01);
			expect(angleDiff(angleOf(center, arms[1] ?? apex), angleOf(center, parentB))).toBeLessThan(0.01);
			expect(radiusOf(center, apex)).toBeLessThan(radiusOf(center, child));
			expect(radiusOf(center, arms[0] ?? apex)).toBeGreaterThan(radiusOf(center, parentA));
		});

		// A tall N-together keeps the printed symbol it already has, and the link
		// says which two stitches it actually closed over — which the symbol
		// alone cannot.
		it('links an N-together decrease while keeping its own symbol', () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: 6 sc in MR\nR2: dc2tog, 4 dc\n'),
				LINKED,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			expect(round(layout, 1).map((item) => item.symbol)).toEqual(['dc2tog', 'dc', 'dc', 'dc', 'dc']);
			expect(layout.shapingMarks).toHaveLength(1);
			const { arms } = endpoints(layout.shapingMarks?.[0] as ShapingMark);
			expect(angleDiff(angleOf(center, arms[0] ?? center), angleOf(center, stitchOf(layout, 'r0s0')))).toBeLessThan(
				0.01,
			);
			expect(angleDiff(angleOf(center, arms[1] ?? center), angleOf(center, stitchOf(layout, 'r0s1')))).toBeLessThan(
				0.01,
			);
		});

		it('links nothing in the first round, which is worked into the ring', () => {
			const layout = calculateLayout(parseChart('---\ntype: round\n---\nR1: 6 sc in MR\n'), LINKED);

			expect(layout.shapingMarks).toBeUndefined();
		});
	});

	// The seam is room of its own, not just wherever a round happened to end: the
	// round's stitches leave it free, and what is drawn there is laid out inside
	// it in the order the round is worked (see layout/seam.ts).
	describe('the seam', () => {
		const SOURCE =
			'---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: [2 sc, inc] x 6\nR5: 24 sc\n';
		const ROUNDS = [0, 1, 2, 3, 4];

		// Where the guide steps from one band out to the next: the straight run
		// between the two rounded corners of each step, which is the one segment of
		// its continuous polyline that crosses most of the gap between two bands.
		// The corners themselves change radius a fraction of a px at a time.
		function guideSteps(layout: LayoutResult, center: GridPoint): { from: GridPoint; to: GridPoint }[] {
			const polyline = layout.gridGuide?.polylines?.[0] ?? [];
			const steps: { from: GridPoint; to: GridPoint }[] = [];
			for (let i = 1; i < polyline.length; i++) {
				const from = polyline[i - 1];
				const to = polyline[i];
				if (!from || !to) continue;
				if (Math.abs(radiusOf(center, to) - radiusOf(center, from)) > 5) steps.push({ from, to });
			}
			return steps;
		}

		it('keeps room of its own at every round, with no stitch in it', () => {
			// Linked style draws every stitch, so the gap the round really left at
			// its seam can be read straight off the chart.
			const layout = calculateLayout(parseChart(SOURCE), { ...OPTIONS, roundStyle: 'continuous' });
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			for (const rowIndex of ROUNDS) {
				const label = layout.labels?.[rowIndex];
				if (!label) throw new Error(`expected round ${rowIndex} to be numbered`);
				const stitches = round(layout, rowIndex);
				const radius = roundRadius(layout, center, rowIndex);
				const arc = (deg: number) => (deg * Math.PI * radius) / 180;
				const gaps = stitches.map((stitch, i) =>
					arc(clockwiseDelta(angleOf(center, stitch), angleOf(center, stitches[(i + 1) % stitches.length] ?? stitch))),
				);
				const seam = gaps[gaps.length - 1] ?? 0;

				// Room for the round number and the step out, at every round.
				expect(seam).toBeGreaterThan(24);
				// Half a round number plus half a stitch symbol: enough that the two
				// cannot touch, whichever digits the number has.
				const nearest = Math.min(
					...stitches.map((stitch) => arc(angleDiff(angleOf(center, stitch), angleOf(center, label)))),
				);
				expect(nearest).toBeGreaterThan(10);
			}
		});

		// A decrease is drawn down onto the stitches it closed over, and those sit
		// either side of the one it makes — so a round that opens or closes with one
		// draws out past its own first or last stitch. That reach is part of what
		// the seam has to be asked for, or the ∧ is drawn across the round's own
		// number and step.
		//
		// Read in continuous style, where every stitch draws a symbol, so the round's
		// first and last really are the ends of what it drew. The layout underneath
		// is the same one traditional Japanese style uses.
		it('keeps the shaping at either end of a round out of the seam', () => {
			const LINKED = { ...OPTIONS, roundStyle: 'continuous' } as const;
			for (const source of [
				'---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: 18 sc\nR5: [sc, dec] x 6\nR6: [dec] x 6\n',
				'---\ntype: round\n---\nR1: 12 sc in MR\nR2: 9 sc, dec, sc\nR3: 11 sc\n',
				'---\ntype: round\n---\nR1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6\nR4: [2 sc, inc] x 6\n',
			]) {
				const layout = calculateLayout(parseChart(source), LINKED);
				const center = layout.items[0];
				if (!center) throw new Error('expected MR center');

				const steps = guideSteps(layout, center);
				(layout.labels ?? []).forEach((label, rowIndex) => {
					const step = steps[rowIndex];
					if (!step) throw new Error(`expected round ${rowIndex} to step out`);
					const radius = roundRadius(layout, center, rowIndex);
					const margin = (180 * 6) / (Math.PI * radius); // 6px of arc, in degrees

					// The channel the round change is drawn in: from the step out to
					// the round number, which follows it. Nothing else belongs in it.
					const from = angleOf(center, step.to) + margin;
					const to = angleOf(center, label) - margin;
					const channel = clockwiseDelta(from, to);

					for (const mark of marksOf(layout, rowIndex)) {
						for (const segment of mark.segments) {
							for (const point of segment) {
								const into = clockwiseDelta(from, angleOf(center, point));
								expect(into > 0 && into < channel).toBe(false);
							}
						}
					}
				});
			}
		});

		it("numbers each round between the round-change step and the round's first stitch", () => {
			const layout = calculateLayout(parseChart(SOURCE), BOOK);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const steps = guideSteps(layout, center);
			expect(steps).toHaveLength(ROUNDS.length);

			for (const rowIndex of ROUNDS) {
				const label = layout.labels?.[rowIndex];
				const step = steps[rowIndex];
				const first = roundSteps(layout, rowIndex)[0];
				if (!label || !step || !first) throw new Error(`expected round ${rowIndex} to be complete`);

				// Working order runs clockwise here, so from the step the round number
				// comes first and the round's own stitches only after it.
				const toLabel = clockwiseDelta(angleOf(center, step.to), angleOf(center, label));
				const toFirst = clockwiseDelta(angleOf(center, step.to), angleOf(center, first));
				expect(toLabel).toBeGreaterThan(0);
				expect(toLabel).toBeLessThan(toFirst);
			}
		});

		it('steps out to the next round near radially, however large the round', () => {
			const layout = calculateLayout(parseChart(SOURCE), BOOK);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			for (const { from, to } of guideSteps(layout, center)) {
				const radial = radiusOf(center, to) - radiusOf(center, from);
				const mean = (radiusOf(center, to) + radiusOf(center, from)) / 2;
				const across =
					(((angleOf(center, to) - angleOf(center, from) + 540) % 360) - 180) * (Math.PI / 180) * mean;
				const fromRing = (Math.atan2(Math.abs(radial), Math.abs(across)) * 180) / Math.PI;
				expect(fromRing).toBeGreaterThan(70);
			}
		});
	});

	// Nothing about a chart's size is taken from stitch counts alone: a ring is as
	// long as the symbols on it and the seam in it need. So the same pattern
	// written in taller stitches is drawn on a larger ring rather than a crowded
	// one, and neither ring has two symbols overlapping.
	describe('ring sizing', () => {
		function neighbourGaps(layout: LayoutResult, rowIndex: number): number[] {
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');
			const radius = roundRadius(layout, center, rowIndex);
			const stitches = round(layout, rowIndex);
			return stitches.map((stitch, i) => {
				const next = stitches[(i + 1) % stitches.length] ?? stitch;
				const gap = clockwiseDelta(angleOf(center, stitch), angleOf(center, next));
				return (gap * Math.PI * radius) / 180;
			});
		}

		for (const [symbol, source] of [
			['sc', '---\ntype: round\n---\nR1: 12 sc in MR\n'],
			['dc', '---\ntype: round\n---\nR1: 12 dc in MR\n'],
			['dtr', '---\ntype: round\n---\nR1: 12 dtr in MR\n'],
		] as const) {
			it(`draws a round of ${symbol} on a ring long enough to hold it`, () => {
				const layout = calculateLayout(parseChart(source), BOOK);

				for (const gap of neighbourGaps(layout, 0)) {
					expect(gap).toBeGreaterThanOrEqual(2 * symbolExtent(symbol));
				}
			});
		}

		it('grows the ring with the stitches, for the same stitch count', () => {
			const center = (layout: LayoutResult) => layout.items[0];
			const radiusOfRound = (source: string) => {
				const layout = calculateLayout(parseChart(source), BOOK);
				const middle = center(layout);
				if (!middle) throw new Error('expected MR center');
				return roundRadius(layout, middle, 0);
			};

			expect(radiusOfRound('---\ntype: round\n---\nR1: 12 dtr in MR\n')).toBeGreaterThan(
				radiusOfRound('---\ntype: round\n---\nR1: 12 sc in MR\n'),
			);
		});

		it("makes room at the seam for the chains a round opens with, however many it writes", () => {
			const layout = calculateLayout(
				parseChart('---\ntype: round\n---\nR1: ch 3, 12 dc in MR, sl st\nR2: ch 3, [dc, inc] x 6, sl st\n'),
				BOOK,
			);
			const center = layout.items[0];
			if (!center) throw new Error('expected MR center');

			for (const rowIndex of [0, 1]) {
				// The chain and the join are the round's instructions: drawn at its
				// seam, with no unitIndex of their own.
				const seamItems = layout.items.filter(
					(item) => item.rowIndex === rowIndex && item.unitIndex === undefined,
				);
				expect(seamItems).toHaveLength(4);
				const radius = roundRadius(layout, center, rowIndex);
				for (let i = 1; i < seamItems.length; i++) {
					const before = seamItems[i - 1];
					const here = seamItems[i];
					if (!before || !here) throw new Error('expected two seam instructions');
					const apart =
						(angleDiff(angleOf(center, before), angleOf(center, here)) * Math.PI * radius) / 180;
					expect(apart).toBeGreaterThanOrEqual(symbolExtent('ch'));
				}
			}
		});
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

describe('sizing a round by what it draws', () => {
	function radiiOf(source: string, roundStyle: 'japanese' | 'continuous'): number[] {
		const layout = calculateLayout(parseChart(source), { ringSpacing: 30, grid: false, roundStyle });
		const centre = { x: layout.width / 2, y: layout.height / 2 };
		const byRound = new Map<number, number[]>();
		// A round whose stitches are all drawn as the V that stands for them has
		// no symbols of its own, so its marks are what says where it is.
		for (const drawn of [...layout.items, ...(layout.shapingMarks ?? [])]) {
			if (drawn.rowIndex === undefined) continue;
			const radius = Math.hypot(drawn.x - centre.x, drawn.y - centre.y);
			byRound.set(drawn.rowIndex, [...(byRound.get(drawn.rowIndex) ?? []), radius]);
		}
		return [...byRound.entries()]
			.sort((a, b) => a[0] - b[0])
			.map(([, radii]) => radii.reduce((sum, radius) => sum + radius, 0) / radii.length);
	}

	const doubling = '---\ntype: round\n---\nR1: 22 sc\nR2: [inc] x 22\n';

	it('does not push a round of increases out for stitches it does not draw', () => {
		// R2 doubles the stitch count but draws twenty-two V marks, not
		// forty-four symbols, so it grows by a ring spacing rather than by what
		// forty-four symbols would need.
		const [first, second] = radiiOf(doubling, 'japanese');

		expect(second! - first!).toBeLessThan(40);
	});

	it('still gives that round room for every symbol where every symbol is drawn', () => {
		const [, japanese] = radiiOf(doubling, 'japanese');
		const [, continuous] = radiiOf(doubling, 'continuous');

		expect(continuous!).toBeGreaterThan(japanese!);
	});

	it('keeps neighbouring stitches clear of each other either way', () => {
		for (const style of ['japanese', 'continuous'] as const) {
			const layout = calculateLayout(parseChart(doubling), { ringSpacing: 30, grid: false, roundStyle: style });
			// Book style draws this round entirely as marks, so what is checked
			// there is the round below it.
			const round = layout.items.filter((item) => item.rowIndex === (style === 'japanese' ? 0 : 1));
			for (let index = 1; index < round.length; index++) {
				const previous = round[index - 1];
				const current = round[index];
				const gap =
					distance(previous!, current!) - symbolExtent(previous!.symbol) - symbolExtent(current!.symbol);
				expect(`${style} gap ${gap > 0}`).toBe(`${style} gap true`);
			}
		}
	});
});

describe('how far apart a chart draws its rounds', () => {
	function bandOf(source: string, options: { ringSpacing?: number } = {}): number {
		const layout = calculateLayout(parseChart(source), { grid: false, roundStyle: 'japanese', ...options });
		const centre = { x: layout.width / 2, y: layout.height / 2 };
		const radii = new Map<number, number>();
		for (const drawn of [...layout.items, ...(layout.shapingMarks ?? [])]) {
			if (drawn.rowIndex === undefined) continue;
			const radius = Math.hypot(drawn.x - centre.x, drawn.y - centre.y);
			radii.set(drawn.rowIndex, Math.max(radii.get(drawn.rowIndex) ?? 0, radius));
		}
		const ordered = [...radii.entries()].sort((a, b) => a[0] - b[0]).map(([, radius]) => radius);
		return (ordered[2] ?? 0) - (ordered[1] ?? 0);
	}

	const short = '---\ntype: round\n---\nR1: 12 sc in MR\nR2: 12 sc\nR3: 12 sc\n';
	const tall = '---\ntype: round\n---\nR1: 12 dtr in MR\nR2: 12 dtr\nR3: 12 dtr\n';

	it('steps a round out by what its own stitches are tall', () => {
		// A round of single crochets sits closer to the round below than a round
		// of double trebles does, because that is what the stitches are.
		expect(bandOf(short)).toBeLessThan(bandOf(tall));
		expect(bandOf(short)).toBeLessThan(2 * symbolExtent('sc') + 8);
	});

	it('gives a round of short stitches a band it nearly fills', () => {
		// The band was three times the height of the stitches in it before this
		// was read off the stitches themselves.
		expect(bandOf(short)).toBeGreaterThan(symbolExtent('sc'));
	});

	it('uses the spacing a chart asks for instead', () => {
		expect(bandOf(short, { ringSpacing: 40 })).toBeCloseTo(40, 0);
	});
});

describe('a chart that names its own round spacing', () => {
	it('steps every round out by exactly that spacing where its symbols fit', () => {
		const layout = calculateLayout(
			parseChart(
				'---\ntype: round\n---\nR1: 4 sc, dec, 10 sc, dec, 6 sc, sl st\nR2: [inc] x 22, sl st\nR3: [10 sc, inc] x 4, sl st\nR4: 5 sc, [inc, 11 sc] x 3, inc, 6 sc, sl st\n',
			),
			{ ringSpacing: 20, grid: false, roundStyle: 'japanese' },
		);
		const centre = { x: layout.width / 2, y: layout.height / 2 };
		const radii = new Map<number, number[]>();
		for (const drawn of [...layout.items, ...(layout.shapingMarks ?? [])]) {
			if (drawn.rowIndex === undefined) continue;
			radii.set(drawn.rowIndex, [
				...(radii.get(drawn.rowIndex) ?? []),
				Math.hypot(drawn.x - centre.x, drawn.y - centre.y),
			]);
		}
		const ordered = [...radii.entries()]
			.sort((a, b) => a[0] - b[0])
			.map(([, rs]) => rs.reduce((sum, r) => sum + r, 0) / rs.length);

		// A round that doubles its stitch count used to jump out past the spacing
		// because every stitch was given an assumed 20px of ring whatever it drew.
		for (let index = 1; index < ordered.length; index++) {
			expect(ordered[index]! - ordered[index - 1]!).toBeCloseTo(20, 0);
		}
	});
});
