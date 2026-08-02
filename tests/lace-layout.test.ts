import { describe, expect, it } from 'vitest';
import { calculateLayout } from '../src/layout';
import { parseChart } from '../src/pattern/parse-chart';
import type { LayoutResult, RenderItem, RoundStyle } from '../src/types';
import { crochetDevThrough } from './fixtures/crochet-dev';

function layout(body: string, style: RoundStyle = 'japanese', lace = true): LayoutResult {
	return calculateLayout(parseChart(`---\ntype: round\n---\n${body}\n`), {
		ringSpacing: 34,
		grid: false,
		roundStyle: style,
		lace,
	});
}

function laceLayout(last: number, style: RoundStyle = 'japanese', lace = true): LayoutResult {
	return calculateLayout(parseChart(crochetDevThrough(last)), {
		ringSpacing: 34,
		grid: false,
		roundStyle: style,
		lace,
	});
}

function centerOf(result: LayoutResult): { x: number; y: number } {
	return { x: result.width / 2, y: result.height / 2 };
}

function radiusOf(result: LayoutResult, item: RenderItem): number {
	const center = centerOf(result);
	return Math.hypot(item.x - center.x, item.y - center.y);
}

function angleOf(result: LayoutResult, item: RenderItem): number {
	const center = centerOf(result);
	return (Math.atan2(item.y - center.y, item.x - center.x) * 180) / Math.PI;
}

// Everything a round draws as a stitch: the ones stamped from the symbol
// library, and the ones a fan draws itself (see layout/lace.ts). Both are
// stitches of the chart, so a test that asks what a round drew wants both.
interface DrawnStitch {
	symbol: string;
	x: number;
	y: number;
	rotation: number;
	unitIndex?: number;
	stitchId?: string;
	sourceStitchIds?: readonly string[];
	fanned: boolean;
}

function itemsOfRound(result: LayoutResult, roundIndex: number): DrawnStitch[] {
	const stamped: DrawnStitch[] = result.items
		.filter((item) => item.rowIndex === roundIndex)
		.map((item) => ({ ...item, fanned: false }));
	const fanned: DrawnStitch[] = (result.motifStitches ?? [])
		.filter((stitch) => stitch.rowIndex === roundIndex)
		.map((stitch) => ({ ...stitch, fanned: true }));
	// Back into the order the round was worked in.
	return [...stamped, ...fanned].sort((a, b) => stitchOrder(a) - stitchOrder(b));
}

function stitchOrder(stitch: DrawnStitch): number {
	return Number(/s(\d+)$/.exec(stitch.stitchId ?? '')?.[1] ?? 0);
}

// How far round the chart the round runs, and which way.
function windingOf(result: LayoutResult, roundIndex: number): number {
	const angles = itemsOfRound(result, roundIndex).map((item) => angleOf(result, item));
	let total = 0;
	for (let index = 1; index < angles.length; index++) {
		total += (((angles[index] ?? 0) - (angles[index - 1] ?? 0) + 540) % 360) - 180;
	}
	return total;
}

describe('a chain run is drawn as the curve it hangs in', () => {
	it('draws every chain of the run, and nothing in place of them', () => {
		const result = layout(`R1: 6 sc in MR
R2: [sc, ch 3] x6, sl st to join.`);
		const chains = itemsOfRound(result, 1).filter((item) => item.symbol === 'ch');

		expect(chains).toHaveLength(18);
	});

	it('bows the run away from the centre, between the stitches it bridges', () => {
		const result = layout(`R1: 6 sc in MR
R2: [sc, ch 3] x6, sl st to join.`);
		const round = itemsOfRound(result, 1);
		const stitches = round.filter((item) => item.symbol === 'sc');
		const chains = round.filter((item) => item.symbol === 'ch');
		const ring = stitches.reduce((sum, item) => sum + radiusOf(result, item), 0) / stitches.length;
		const middles = chains.filter((_, index) => index % 3 === 1);

		for (const middle of middles) {
			expect(radiusOf(result, middle)).toBeGreaterThan(ring);
		}
	});

	it('keeps the run inside its own round band', () => {
		// Measured against the band lines an ordinary book-style chart draws.
		const result = laceLayout(5, 'japanese', false);
		const guide = (result.gridGuide?.polylines ?? []).flat();
		const outermost = Math.max(
			...guide.map((point) => Math.hypot(point.x - result.width / 2, point.y - result.height / 2)),
		);

		for (const item of result.items) {
			expect(radiusOf(result, item)).toBeLessThanOrEqual(outermost + 12);
		}
	});
});

describe('a group worked into one place is drawn as one motif', () => {
	it('draws a shell as stitches of its own, each leaning its own way', () => {
		const result = laceLayout(5);
		const shell = itemsOfRound(result, 4).filter((item) => item.symbol === 'dc');

		expect(shell.length).toBe(60);
		// Every stitch of a fan is drawn rather than stamped...
		expect(shell.every((stitch) => stitch.fanned)).toBe(true);
		// ...and no two of them lean the same way.
		const rotations = new Set(shell.slice(0, 5).map((item) => Math.round(item.rotation)));
		expect(rotations.size).toBe(5);
	});

	it('stands every stitch of a shell on the one place below it', () => {
		const result = laceLayout(5);
		const shell = (result.motifStitches ?? []).filter((stitch) => stitch.rowIndex === 4).slice(0, 5);
		// The stem is the first segment, and its foot is where the fan stands.
		const feet = shell.map((stitch) => {
			const foot = stitch.segments[0]?.[0];
			return `${Math.round(foot?.x ?? 0)},${Math.round(foot?.y ?? 0)}`;
		});

		expect(new Set(feet).size).toBe(1);
	});

	it('draws each stitch of a fan as a stem with the bars that name it', () => {
		const result = laceLayout(5);
		const double = (result.motifStitches ?? []).find((stitch) => stitch.symbol === 'dc');

		// A double crochet: the stem, the bar across its head, one bar down it.
		expect(double?.segments).toHaveLength(3);
		expect(double?.segments[0]).toHaveLength(2);
	});

	it('draws the written number of stitches in every shell, round after round', () => {
		const result = laceLayout(9);
		// R3's first shell opens with the beginning chain, which is drawn as its
		// chains rather than as the double it stands for.
		const shells = [
			{ round: 2, size: 3, replaced: 1 },
			{ round: 4, size: 5, replaced: 0 },
			{ round: 6, size: 7, replaced: 0 },
			{ round: 8, size: 9, replaced: 0 },
		];

		for (const { round, size, replaced } of shells) {
			const doubles = itemsOfRound(result, round).filter((item) => item.symbol === 'dc');
			expect(`R${round + 1}: ${doubles.length}`).toBe(`R${round + 1}: ${size * 12 - replaced}`);
		}
	});

	it('keeps a shell together over the place below it', () => {
		const result = laceLayout(5);
		const round = itemsOfRound(result, 4);
		const shells: RenderItem[][] = [];
		for (const item of round) {
			if (item.symbol !== 'dc') continue;
			const last = shells[shells.length - 1];
			if (last === undefined || last[0]?.sourceStitchIds?.[0] !== item.sourceStitchIds?.[0]) shells.push([item]);
			else last.push(item);
		}

		expect(shells).toHaveLength(12);
		for (const shell of shells) {
			expect(shell).toHaveLength(5);
			// Every stitch of a shell shares the one place it is worked into.
			expect(new Set(shell.map((item) => item.sourceStitchIds?.[0])).size).toBe(1);
		}
	});

	it('draws the first shell of R3 as one motif of three, not a chain and two doubles', () => {
		const result = laceLayout(3);
		const round = itemsOfRound(result, 2);
		// Two drawn doubles, plus the beginning chain that stands for the third.
		const first = round.filter((item) => item.symbol === 'dc').slice(0, 2);

		expect(new Set(first.map((item) => item.sourceStitchIds?.[0])).size).toBe(1);
	});
});

describe('a round that turns is drawn the other way round', () => {
	it('turns the chart around where a round reads the round below backwards', () => {
		const result = laceLayout(6);
		const winding = [0, 1, 2, 3, 4, 5].map((round) => Math.sign(windingOf(result, round)));
		const forward = winding[0] ?? 0;

		// R1-R3 are worked the same way round; R4 turns and reads R3 backwards,
		// so it is drawn the other way about — and R5, turning again, reads R4
		// forwards and stays with it.
		expect(winding.slice(0, 3)).toEqual([forward, forward, forward]);
		expect(winding[3]).toBe(-forward);
		expect(winding[4]).toBe(-forward);
		expect(winding[5]).toBe(forward);
	});

	it('keeps the stitches of a motif in the order they are written', () => {
		const result = laceLayout(6);
		const shells = itemsOfRound(result, 4).filter((item) => item.symbol === 'dc');

		expect(shells.map((item) => item.unitIndex).slice(0, 5)).toEqual([
			shells[0]?.unitIndex,
			shells[0]?.unitIndex,
			shells[0]?.unitIndex,
			shells[0]?.unitIndex,
			shells[0]?.unitIndex,
		]);
	});
});

describe('what a round opens and closes with', () => {
	it('draws the beginning chain at the seam, and the stitch it stands for only once', () => {
		const result = layout('R1: MR, ch 3 (counts as dc), 11 dc in MR, sl st to top of beginning ch-3.');
		const round = itemsOfRound(result, 0);

		expect(round.filter((item) => item.symbol === 'ch')).toHaveLength(3);
		// Eleven written doubles: the twelfth is what the beginning chain stands for.
		expect(round.filter((item) => item.symbol === 'dc')).toHaveLength(11);
		expect(round.filter((item) => item.symbol === 'sl st')).toHaveLength(1);
	});

	it('draws the slip stitch a round moves across with', () => {
		const result = layout(`R1: 6 sc in MR
R2: [sc, ch 1] x6, sl st to join.
R3: sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp, sc in next ch-1 sp,
    [3 dc in next ch-1 sp, sc in next ch-1 sp] x2, sl st to top of beginning ch-3.`);
		const round = itemsOfRound(result, 2);

		expect(round.filter((item) => item.symbol === 'sl st')).toHaveLength(2);
	});
});

describe('lace in the other round styles', () => {
	it('draws connectors from a stitch to the place below it in continuous style', () => {
		const result = laceLayout(5, 'continuous');

		expect((result.shapingMarks ?? []).length).toBeGreaterThan(0);
		for (const mark of result.shapingMarks ?? []) {
			for (const segment of mark.segments) {
				for (const point of segment) {
					expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
				}
			}
		}
	});

	it('spreads a round evenly in radial style, as it always has', () => {
		const result = layout('R1: 6 sc in MR\nR2: 12 sc', 'radial');
		const round = itemsOfRound(result, 1);
		const gaps: number[] = [];
		for (let index = 1; index < round.length; index++) {
			const previous = round[index - 1];
			const current = round[index];
			if (previous === undefined || current === undefined) continue;
			gaps.push(Math.abs(((angleOf(result, current) - angleOf(result, previous) + 540) % 360) - 180));
		}
		const first = gaps[0] ?? 0;

		for (const gap of gaps) expect(Math.abs(gap - first)).toBeLessThan(0.5);
	});

	it('leaves an ordinary shorthand chart alone', () => {
		const plain = layout(`R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6`, 'japanese', false);

		// Six single crochets drawn as themselves; the six increases are drawn as
		// the V that stands for their pairs.
		expect(itemsOfRound(plain, 2)).toHaveLength(6);
		expect(plain.shapingMarks?.length).toBeGreaterThan(0);
	});
});

describe('a chart told it is lace', () => {
	function laceMode(last: number): LayoutResult {
		return calculateLayout(parseChart(crochetDevThrough(last).replace('style: japanese', 'style: japanese\nlace: on')), {
			ringSpacing: 34,
			grid: false,
			roundStyle: 'japanese',
			lace: true,
		});
	}

	it('draws no lines around its rounds', () => {
		expect(laceMode(5).gridGuide).toBeUndefined();
		// ...where an ordinary book-style chart draws its band spiral.
		expect(laceLayout(5, 'japanese', false).gridGuide?.polylines?.length).toBeGreaterThan(0);
	});

	it('numbers no rounds', () => {
		expect(laceMode(5).labels).toBeUndefined();
		expect(laceLayout(5, 'japanese', false).labels).toHaveLength(5);
	});

	it('draws its symbols larger, and sizes the chart for them', () => {
		const lace = laceMode(5);
		// The same chart, drawn the same way, at the symbols' own size.
		const plain = calculateLayout(parseChart(crochetDevThrough(5)), {
			ringSpacing: 34,
			grid: false,
			roundStyle: 'japanese',
		});
		const bars = (result: LayoutResult): number => {
			const stitch = (result.motifStitches ?? [])[0];
			const bar = stitch?.segments[1];
			const [from, to] = [bar?.[0], bar?.[1]];
			return Math.hypot((to?.x ?? 0) - (from?.x ?? 0), (to?.y ?? 0) - (from?.y ?? 0));
		};

		expect(bars(lace)).toBeGreaterThan(bars(plain));
		expect(lace.width).toBeGreaterThan(plain.width);
	});

	it('still draws every stitch of the pattern', () => {
		const lace = laceMode(5);
		const plain = laceLayout(5);

		expect(lace.items.length + (lace.motifStitches?.length ?? 0)).toBe(
			plain.items.length + (plain.motifStitches?.length ?? 0),
		);
	});
});

describe('a chart drawn as one wedge of itself', () => {
	function wedge(degrees: number): LayoutResult {
		return calculateLayout(parseChart(crochetDevThrough(5)), {
			ringSpacing: 34,
			grid: false,
			roundStyle: 'japanese',
			lace: true,
			sector: degrees,
		});
	}

	function drawn(result: LayoutResult): number {
		return result.items.length + (result.motifStitches?.length ?? 0);
	}

	const whole = calculateLayout(parseChart(crochetDevThrough(5)), {
		ringSpacing: 34,
		grid: false,
		roundStyle: 'japanese',
		lace: true,
	});

	it('keeps about as much of the chart as the wedge is of the circle', () => {
		const share = drawn(wedge(90)) / drawn(whole);

		expect(share).toBeGreaterThan(0.15);
		expect(share).toBeLessThan(0.45);
	});

	it('draws more of the chart the wider the wedge', () => {
		expect(drawn(wedge(180))).toBeGreaterThan(drawn(wedge(90)));
		expect(drawn(wedge(90))).toBeGreaterThan(drawn(wedge(45)));
	});

	it('keeps every stitch of a motif that falls in the wedge, or none of it', () => {
		const sizes = new Map<string, number>();
		for (const stitch of wedge(90).motifStitches ?? []) {
			// The first round stands on the ring at the middle: every stitch of it
			// has its own foot there, so there are no motifs to keep whole.
			if (stitch.rowIndex === 0) continue;
			const foot = stitch.segments[0]?.[0];
			const key = `${stitch.rowIndex}:${Math.round(foot?.x ?? 0)},${Math.round(foot?.y ?? 0)}`;
			sizes.set(key, (sizes.get(key) ?? 0) + 1);
		}

		// R3's shells are three doubles (one of them drawn as its beginning
		// chain), R4's V-stitches two, R5's shells five: a fan is never left
		// half drawn at the edge of the wedge.
		for (const [key, size] of sizes) {
			expect(`${key}: ${[2, 3, 4, 5].includes(size)}`).toBe(`${key}: true`);
		}
	});

	it('opens the wedge upward from the centre', () => {
		const quarter = wedge(90);
		// A cropped chart is no longer centred on its own middle, so the middle
		// is found from the ring the piece starts at.
		const ring = quarter.items.find((item) => item.symbol === 'MR');
		const centre = { x: ring?.x ?? 0, y: ring?.y ?? 0 };
		const angles = [...quarter.items, ...(quarter.motifStitches ?? [])].map(
			(item) => (Math.atan2(item.y - centre.y, item.x - centre.x) * 180) / Math.PI,
		);

		// Everything drawn is within half the wedge of straight up, either way —
		// bar what is drawn at the middle, which belongs to no direction, and
		// bar a motif standing on the edge, which is kept whole rather than
		// sliced, so its outer stitches may lean a little past the boundary.
		for (const [index, angle] of angles.entries()) {
			const item = [...quarter.items, ...(quarter.motifStitches ?? [])][index];
			if (Math.hypot((item?.x ?? 0) - centre.x, (item?.y ?? 0) - centre.y) < 30) continue;
			const fromUp = Math.abs((((angle + 90) % 360) + 540) % 360 - 180);
			expect(fromUp).toBeLessThan(60);
		}
	});

	it('draws the first rounds whole and fans out only after them', () => {
		const asked = calculateLayout(parseChart(crochetDevThrough(5)), {
			ringSpacing: 34,
			grid: false,
			roundStyle: 'japanese',
			lace: true,
			sector: 90,
			wholeRounds: 3,
		});
		const rounds = new Map<number, number>();
		for (const item of [...asked.items, ...(asked.motifStitches ?? [])]) {
			if (item.rowIndex === undefined) continue;
			rounds.set(item.rowIndex, (rounds.get(item.rowIndex) ?? 0) + 1);
		}
		const whole = calculateLayout(parseChart(crochetDevThrough(5)), {
			ringSpacing: 34,
			grid: false,
			roundStyle: 'japanese',
			lace: true,
		});
		const all = new Map<number, number>();
		for (const item of [...whole.items, ...(whole.motifStitches ?? [])]) {
			if (item.rowIndex === undefined) continue;
			all.set(item.rowIndex, (all.get(item.rowIndex) ?? 0) + 1);
		}

		// The first three rounds keep every stitch; the rounds after them do not.
		for (const round of [0, 1, 2]) expect(`R${round + 1}: ${rounds.get(round)}`).toBe(`R${round + 1}: ${all.get(round)}`);
		for (const round of [3, 4]) expect(rounds.get(round) ?? 0).toBeLessThan(all.get(round) ?? 0);
	});

	it('leaves a chart alone when no wedge is asked for', () => {
		expect(drawn(whole)).toBeGreaterThan(drawn(wedge(90)));
	});
});
