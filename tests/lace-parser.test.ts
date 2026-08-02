import { describe, expect, it } from 'vitest';
import { parseChart } from '../src/pattern/parse-chart';
import type { GroupNode, RowNode, StitchNode } from '../src/types';
import { CROCHET_DEV, crochetDevThrough } from './fixtures/crochet-dev';

function rows(source: string): RowNode[] {
	return parseChart(source).rows;
}

function round(source: string, num: number): RowNode {
	const row = rows(source).find((candidate) => candidate.num === num);
	if (row === undefined) throw new Error(`no round ${num} in the parsed pattern`);
	return row;
}

// One round on its own, with the frontmatter every round chart needs.
function chart(body: string): string {
	return `---\ntype: round\n---\n${body}\n`;
}

describe('lace pattern parsing: the crochet-dev marking style', () => {
	it('reads indented continuation lines as part of the round above them', () => {
		const parsed = rows(chart(`R1: MR, ch 3 (counts as dc), 23 dc in MR,
    sl st to top of beginning ch-3. (24 dc)`));

		expect(parsed).toHaveLength(1);
		expect(parsed[0]?.num).toBe(1);
		expect(parsed[0]?.anchor).toBe('MR');
	});

	it('ends a round at a blank line and starts the next one at its label', () => {
		const parsed = rows(chart(`R1: 6 sc in MR

R2: [sc,
     sc] x3,
    sl st to join.`));

		expect(parsed.map((row) => row.num)).toEqual([1, 2]);
	});

	it('accepts a final period on a round', () => {
		const parsed = round(chart('R1: 6 sc in MR.'), 1);

		expect(parsed.steps).toHaveLength(1);
	});

	it('parses every round of the source pattern', () => {
		const parsed = rows(CROCHET_DEV);

		expect(parsed.map((row) => row.num)).toEqual(
			Array.from({ length: 22 }, (_, index) => index + 1),
		);
	});
});

describe('lace pattern parsing: beginning chains, joins, and repositioning', () => {
	it('parses a beginning chain that says it counts', () => {
		const parsed = round(chart('R1: MR, ch 3 (counts as dc), 23 dc in MR, sl st to top of beginning ch-3.'), 1);

		expect(parsed.steps[1]).toMatchObject({
			type: 'StitchNode',
			stitch: 'ch',
			count: 3,
			beginning: { counts: true, as: 'dc' },
		});
	});

	it('parses a beginning chain that says it does not count', () => {
		const parsed = round(chart('R2: ch 1 (does not count as a st), 6 sc, sl st to first sc.'), 2);

		expect(parsed.steps[0]).toMatchObject({ type: 'StitchNode', stitch: 'ch', count: 1, beginning: { counts: false } });
	});

	it('counts an unannotated beginning chain when the round closes to its top', () => {
		const parsed = round(chart('R3: ch 3, 5 dc, sl st to top of beginning ch-3.'), 3);

		expect(parsed.steps[0]).toMatchObject({ type: 'StitchNode', stitch: 'ch', count: 3, beginning: { counts: true } });
	});

	it('does not count an unannotated beginning chain when the round closes elsewhere', () => {
		const parsed = round(chart('R3: ch 1, 6 sc, sl st to first sc.'), 3);

		expect(parsed.steps[0]).toMatchObject({ type: 'StitchNode', stitch: 'ch', count: 1, beginning: { counts: false } });
	});

	it('parses the three written join forms', () => {
		const beginning = round(chart('R1: ch 3, 5 dc, sl st to top of beginning ch-3.'), 1);
		const firstSc = round(chart('R1: ch 1, 6 sc, sl st to first sc.'), 1);
		const generic = round(chart('R1: ch 1, 6 sc, sl st to join.'), 1);

		expect(beginning.steps.at(-1)).toMatchObject({ type: 'JoinNode', target: 'beginning-ch' });
		expect(firstSc.steps.at(-1)).toMatchObject({ type: 'JoinNode', target: 'first-sc' });
		expect(generic.steps.at(-1)).toMatchObject({ type: 'JoinNode', target: 'join' });
	});

	it('parses a repositioning slip stitch with its target', () => {
		const parsed = round(chart('R3: sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp, sl st to join.'), 3);

		expect(parsed.steps[0]).toMatchObject({
			type: 'RepositionNode',
			target: { kind: 'next', type: 'ch-1 sp' },
		});
	});

	it('keeps a mid-round slip stitch an ordinary stitch', () => {
		const parsed = round(chart('R1: 3 sc, sl st, 3 sc, sl st to join.'), 1);

		expect(parsed.steps[1]).toMatchObject({ type: 'StitchNode', stitch: 'sl st' });
	});
});

describe('lace pattern parsing: turns, targets, and aliases', () => {
	it('parses a leading turn', () => {
		const parsed = round(chart('R4: turn, 12 sc, sl st to join.'), 4);

		expect(parsed.steps[0]).toMatchObject({ type: 'TurnNode' });
		expect(parsed.turn).toBe(true);
	});

	it('parses every bounded target form', () => {
		const parsed = round(
			chart(`R4: sc in same st, sc in same ch-1 sp, sc in next sc, sc in next dc,
    sc in next ch-1 sp, sc in next ch-2 sp, sc in next ch-3 sp, sc in next picot,
    sc in center dc of next 7-dc shell, sl st to join.`),
			4,
		);
		const targets = parsed.steps
			.filter((step): step is StitchNode => step.type === 'StitchNode')
			.map((step) => step.target);

		expect(targets).toEqual([
			{ kind: 'same', type: 'st' },
			{ kind: 'same', type: 'ch-1 sp' },
			{ kind: 'next', type: 'sc' },
			{ kind: 'next', type: 'dc' },
			{ kind: 'next', type: 'ch-1 sp' },
			{ kind: 'next', type: 'ch-2 sp' },
			{ kind: 'next', type: 'ch-3 sp' },
			{ kind: 'next', type: 'picot' },
			{ kind: 'shell-center', size: 7 },
		]);
	});

	it('keeps a quantity-targeted shell as one step', () => {
		const parsed = round(chart('R5: 5 dc in next ch-2 sp, sl st to join.'), 5);

		expect(parsed.steps[0]).toMatchObject({
			type: 'StitchNode',
			stitch: 'dc',
			count: 5,
			motif: true,
			target: { kind: 'next', type: 'ch-2 sp' },
		});
	});

	it('expands V2 and V3 into their written stitches, keeping the alias', () => {
		const parsed = round(chart('R4: V2 in next sc, V3 in next sc, sl st to join.'), 4);
		const [v2, v3] = parsed.steps as GroupNode[];

		expect(v2).toMatchObject({ type: 'GroupNode', alias: 'V2', target: { kind: 'next', type: 'sc' } });
		expect(v2?.children).toMatchObject([
			{ stitch: 'dc', count: 1 },
			{ stitch: 'ch', count: 2 },
			{ stitch: 'dc', count: 1 },
		]);
		expect(v3?.children).toMatchObject([
			{ stitch: 'dc', count: 1 },
			{ stitch: 'ch', count: 3 },
			{ stitch: 'dc', count: 1 },
		]);
	});

	it('parses a written group with a target', () => {
		const parsed = round(chart('R4: (dc, ch 2, dc) in next sc, sl st to join.'), 4);

		expect(parsed.steps[0]).toMatchObject({
			type: 'GroupNode',
			target: { kind: 'next', type: 'sc' },
		});
	});

	it('still parses the ring anchor rather than reading "in MR" as a target', () => {
		const parsed = round(chart('R1: 6 sc in MR'), 1);

		expect(parsed.anchor).toBe('MR');
		expect(parsed.steps[0]).toMatchObject({ type: 'StitchNode', stitch: 'sc', count: 6 });
	});

	it('parses an explicit skip', () => {
		const parsed = round(chart('R2: 3 sc, skip 2, 3 sc, sl st to join.'), 2);

		expect(parsed.steps[1]).toMatchObject({ type: 'SkipNode', count: 2 });
	});
});

describe('lace pattern parsing: count annotations and source repeats', () => {
	it('parses a plain total annotation', () => {
		const parsed = round(chart('R1: MR, ch 3 (counts as dc), 23 dc in MR, sl st to top of beginning ch-3. (24 dc)'), 1);

		expect(parsed.count).toMatchObject({ total: 24 });
	});

	it('parses a summed annotation', () => {
		const parsed = round(
			chart('R2: ch 1 (does not count as a st), 6 sc, sl st to first sc.\n    (24 sc + 24 ch-1 sp = 48 sts)'),
			2,
		);

		expect(parsed.count).toMatchObject({ total: 48 });
	});

	it('parses a per-repeat annotation', () => {
		const parsed = round(chart('R3: 12 sc, sl st to join.\n    (12 reps, 4 sts per rep)'), 3);

		expect(parsed.count).toMatchObject({ reps: 12, perRep: 4, total: 48 });
	});

	it('expands a single-round source repeat, keeping where it came from', () => {
		const parsed = rows(chart(`R1: 6 sc in MR

R2: turn, 6 sc, sl st to join.

R3: repeat R2.`));

		expect(parsed).toHaveLength(3);
		expect(parsed[2]?.num).toBe(3);
		expect(parsed[2]?.source).toMatchObject({ repeatOf: 2 });
		expect(parsed[2]?.steps).toEqual(parsed[1]?.steps);
	});

	it('expands a range source repeat written with either dash', () => {
		for (const dash of ['-', '–']) {
			const parsed = rows(chart(`R1: 6 sc in MR

R2: turn, 6 sc, sl st to join.

R3: turn, 6 sc, sl st to join.

R4${dash}R5: repeat R2${dash}R3.`));

			expect(parsed.map((row) => row.num)).toEqual([1, 2, 3, 4, 5]);
			expect(parsed[3]?.source).toMatchObject({ repeatOf: 2 });
			expect(parsed[4]?.source).toMatchObject({ repeatOf: 3 });
		}
	});

	it('expands the source pattern out to twenty-two real rounds', () => {
		const parsed = rows(CROCHET_DEV);

		expect(parsed).toHaveLength(22);
		expect(parsed[14]?.source).toMatchObject({ repeatOf: 11 });
		expect(parsed[21]?.source).toMatchObject({ repeatOf: 14 });
	});
});

describe('lace pattern parsing: malformed input', () => {
	const bad: Array<[string, string]> = [
		['a target that names no stitch or space', 'R2: sc in next thing, sl st to join.'],
		['an even shell center', 'R2: sc in center dc of next 4-dc shell, sl st to join.'],
		['a malformed join', 'R2: 6 sc, sl st to the end.'],
		['a skip without a count', 'R2: 3 sc, skip, 3 sc.'],
		['a source repeat of nothing', 'R2: repeat.'],
		['a backwards source-repeat range', 'R2: 6 sc\n\nR3-R4: repeat R5-R6.'],
	];

	for (const [what, source] of bad) {
		it(`reports ${what}`, () => {
			expect(() => parseChart(chart(source))).toThrow();
		});
	}
});

describe('lace pattern parsing: rounds that are not lace', () => {
	it('leaves an ordinary shorthand pattern unchanged', () => {
		const parsed = rows(chart('R1: 6 sc in MR\nR2: [inc] x 6\nR3: [sc, inc] x 6'));

		expect(parsed).toHaveLength(3);
		expect(parsed[1]?.steps[0]).toMatchObject({ type: 'RepeatNode', count: 6 });
		expect(parsed[0]?.count).toBeUndefined();
		expect(parsed[0]?.turn).toBeUndefined();
	});

	it('reads the first rounds of the source pattern without the repeats', () => {
		const parsed = rows(crochetDevThrough(5));

		expect(parsed.map((row) => row.num)).toEqual([1, 2, 3, 4, 5]);
	});
});
