import { describe, expect, it } from 'vitest';
import { parse } from '../src/parser';
import type { AstNode, CrochetAst, GroupNode, RepeatNode } from '../src/types';

function parseChart(source: string): CrochetAst {
	return parse(source) as CrochetAst;
}

function expectStitch(node: unknown, stitch: string, count: number): void {
	expect(node).toMatchObject({ type: 'StitchNode', stitch, count });
}

function expectGroup(node: AstNode | undefined): asserts node is GroupNode {
	expect(node?.type).toBe('GroupNode');
}

function expectRepeat(node: AstNode | undefined): asserts node is RepeatNode {
	expect(node?.type).toBe('RepeatNode');
}

describe('crochet pattern parser', () => {
	it('parses documents without frontmatter with flat defaults', () => {
		const ast = parseChart('R1: 6 sc\n');

		expect(ast.type).toBe('CrochetChart');
		expect(ast.config).toEqual({ type: 'flat' });
		expect(ast.rows).toHaveLength(1);
		expectStitch(ast.rows[0]?.steps[0], 'sc', 6);
	});

	it('parses flat frontmatter config values', () => {
		const ast = parseChart(`---
type: round
scale: 1.5
spacing: 40
highlight: on
---
R1: 6 sc in MR
`);

		expect(ast.config).toMatchObject({
			type: 'round',
			scale: '1.5',
			spacing: '40',
			highlight: 'on',
		});
		expect(ast.rows[0]?.anchor).toBe('MR');
	});

	for (const label of ['R7', 'Row 7']) {
		it(`parses ${label} row labels`, () => {
			const ast = parseChart(`${label}: sc\n`);

			expect(ast.rows[0]?.num).toBe(7);
		});
	}

	it('parses row loop modifiers and round anchors', () => {
		const ast = parseChart(`R1: blo, 6 sc in MR
R2: flo, 6 sc in ch ring
`);

		expect(ast.rows[0]).toMatchObject({ loop: 'blo', anchor: 'MR' });
		expect(ast.rows[1]).toMatchObject({ loop: 'flo', anchor: 'ch ring' });
	});

	it('parses a join right after the anchor on row 1', () => {
		const ast = parseChart(`R1: 6 sc in MR, sl st
R2: 6 sc in ch ring, sl st
`);

		expect(ast.rows[0]?.anchor).toBe('MR');
		expect(ast.rows[0]?.steps).toHaveLength(2);
		expectStitch(ast.rows[0]?.steps[0], 'sc', 6);
		expectStitch(ast.rows[0]?.steps[1], 'sl st', 1);

		expect(ast.rows[1]?.anchor).toBe('ch ring');
		expect(ast.rows[1]?.steps).toHaveLength(2);
		expectStitch(ast.rows[1]?.steps[1], 'sl st', 1);
	});

	// The exhaustive grammar/symbol sweep lives in tests/stitches.test.ts;
	// this covers one representative of each naming family.
	it('parses representative stitch names from every family', () => {
		const stitches = [
			'ch',
			'sc',
			'hdc',
			'dc',
			'tr',
			'dtr',
			'sl st',
			'fpdc',
			'bpdc',
			'bobble',
			'popcorn',
			'inc',
			'dec',
			'MR',
			'picot',
			'rsc',
			'fpsc',
			'bptr',
			'xdc',
			'sc2tog',
			'hdc4tog',
			'dc2tog',
			'hdc3cl',
			'dc5cl',
			'tr2cl',
			'hdc popcorn',
			'tr popcorn',
		];
		const ast = parseChart(`R1: ${stitches.join(', ')}\n`);

		expect(ast.rows[0]?.steps).toHaveLength(stitches.length);
		stitches.forEach((stitch, index) => {
			expectStitch(ast.rows[0]?.steps[index], stitch, 1);
		});
	});

	it('parses quantities, groups, nested groups, and repeats', () => {
		const ast = parseChart('R1: 10 ch, (dc, ch, (dc, ch)), [sc, inc] x 6\n');
		const steps = ast.rows[0]?.steps ?? [];
		const quantity = steps[0];
		const group = steps[1];
		const repeat = steps[2];

		expect(quantity).toMatchObject({ type: 'StitchNode', stitch: 'ch', count: 10 });
		expectGroup(group);
		expect(group.children).toHaveLength(3);
		expectRepeat(repeat);
		expect(repeat.count).toBe(6);
		expect(repeat.children).toHaveLength(2);
	});

	it('rejects unsupported stitch words', () => {
		expect(() => parseChart('R1: chain\n')).toThrow();
	});

	it('rejects incomplete repeat blocks', () => {
		expect(() => parseChart('R1: [sc, inc]\n')).toThrow();
	});
});
