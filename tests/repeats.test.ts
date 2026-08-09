import { describe, expect, it } from 'vitest';
import { calculateLayout, roundStitchCount } from '../src/layout';
import { parseChart } from '../src/pattern/parse-chart';
import type { RepeatNode, StitchNode } from '../src/types';

function chart(rows: string): ReturnType<typeof parseChart> {
	return parseChart(`---\ntype: round\n---\n${rows}`);
}

// What a round is written as, one entry per step.
function steps(rows: string, roundIndex: number): string[] {
	return (chart(rows).rows[roundIndex]?.steps ?? []).map((step) => {
		if (step.type === 'StitchNode') return `${step.stitch}x${step.count}`;
		if (step.type === 'RepeatNode') return `repeat x${String(step.count)}`;
		return step.type;
	});
}

// Everything a round draws, in the order it is drawn.
function drawn(rows: string, rowIndex: number): string[] {
	const layout = calculateLayout(chart(rows), { ringSpacing: 30, grid: false });
	return layout.items.filter((item) => item.rowIndex === rowIndex).map((item) => item.symbol);
}

describe('writing a round', () => {
	it('takes a stitch count before or after the name, with or without a space', () => {
		expect(steps('R1: 6 sc\n', 0)).toEqual(['scx6']);
		expect(steps('R1: sc6\n', 0)).toEqual(['scx6']);
		expect(steps('R1: sc 6\n', 0)).toEqual(['scx6']);
		expect(steps('R1: ch, ch1, ch 1, ch2, ch 3\n', 0)).toEqual(['chx1', 'chx1', 'chx1', 'chx2', 'chx3']);
		// A stitch whose own name has digits in it is still one stitch.
		expect(steps('R1: dc2tog, hdc3tog, tr5cl\n', 0)).toEqual(['dc2togx1', 'hdc3togx1', 'tr5clx1']);
		expect(steps('R1: dc12\n', 0)).toEqual(['dcx12']);
	});

	it('reads every spelling of a slip stitch as the same stitch', () => {
		for (const written of ['sl st', 'slst', 'sl-st', 'sl_st']) {
			expect(steps(`R1: 3 sc, ${written}\n`, 0)).toEqual(['scx3', 'sl stx1']);
		}
	});

	// Spec case 4 / section 3: the chain a round opens with is part of the
	// pattern and has to reach the chart.
	it('keeps the chain a round opens with, and draws it', () => {
		const rows = 'R1: mr, ch, sc6, slst\nR2: ch, 6 sc, sl st\n';

		expect(steps(rows, 1)).toEqual(['chx1', 'scx6', 'sl stx1']);
		expect(drawn(rows, 1)).toEqual(['ch', 'sc', 'sc', 'sc', 'sc', 'sc', 'sc', 'sl st']);
	});

	// Neither is a stitch of the fabric: the next round works into the six
	// single crochets, not into the chain or the join.
	it('leaves the opening chain and the closing join out of the round\'s count', () => {
		const rounds = chart('R1: mr, ch, sc6, slst\n').rows;

		expect(roundStitchCount(rounds[0]!)).toBe(6);
	});

	it('draws the magic ring a first round names as a step', () => {
		const layout = calculateLayout(chart('R1: mr, ch, sc6, slst\n'), { ringSpacing: 30, grid: false });

		expect(layout.items[0]?.symbol).toBe('MR');
	});
});

describe('repeats', () => {
	// Spec case 1: a bare "rep" runs until the round below is used up.
	it('works out a bare rep from the round below', () => {
		const rows = 'R1: mr, ch, sc6, slst\nR2: ch, [2 sc, inc] rep, sl st\n';

		// Six stitches below, three worked into per go: two goes.
		expect(steps(rows, 1)).toEqual(['chx1', 'repeat x2', 'sl stx1']);
		expect(roundStitchCount(chart(rows).rows[1]!)).toBe(8);
		// Drawn as worked, chain first and join last.
		expect(drawn(rows, 1)).toEqual(['ch', 'sc', 'sc', 'inc', 'sc', 'sc', 'inc', 'sl st']);
	});

	// Spec cases 2 and 3: the same repeat written three ways.
	it('reads rep 2, rep2 and x2 as the same repeat', () => {
		const written = ['[2 sc, inc] rep 2', '[2 sc, inc] rep2', '[2 sc, inc] x2', '[2 sc, inc] x 2'];

		for (const repeat of written) {
			expect(steps(`R1: mr, ch, sc6, slst\nR2: ch, ${repeat}, slst\n`, 1)).toEqual([
				'chx1',
				'repeat x2',
				'sl stx1',
			]);
		}
	});

	// The written form is kept: a repeat still reads as a repeat, not as the
	// stitches it came out as.
	it('keeps the repeat in the pattern rather than expanding it', () => {
		const round = chart('R1: mr, ch, sc6, slst\nR2: ch, [2 sc, inc] rep, slst\n').rows[1];
		const repeat = round?.steps[1] as RepeatNode;

		expect(repeat.type).toBe('RepeatNode');
		expect(repeat.count).toBe(2);
		expect(repeat.children.map((child) => (child as StitchNode).stitch)).toEqual(['sc', 'inc']);
		// The opening chain stays outside it — only the bracket repeats.
		expect((round?.steps[0] as StitchNode).stitch).toBe('ch');
	});

	// Spec case 5: a decrease works into two, so a repeat containing one uses
	// up the round below twice as fast.
	it('counts a decrease as working into two stitches when sizing a rep', () => {
		const rows = 'R1: mr, ch, sc12, slst\nR2: ch, [sc, dec] rep, slst\n';

		// Twelve below, three worked into per go: four goes, eight stitches.
		expect(steps(rows, 1)).toEqual(['chx1', 'repeat x4', 'sl stx1']);
		expect(roundStitchCount(chart(rows).rows[1]!)).toBe(8);
	});

	// Spec case 6: it must say so rather than quietly dropping the remainder.
	it('refuses to guess when the round below does not divide evenly', () => {
		expect(() => chart('R1: mr, ch, sc7, slst\nR2: ch, [2 sc, inc] rep, slst\n')).toThrow(
			/does not divide evenly/,
		);
	});

	it('refuses a bare rep with no round before it to work into', () => {
		expect(() => chart('R1: ch, [2 sc, inc] rep, slst\n')).toThrow(/needs a round before it/);
	});
});
