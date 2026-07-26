import { describe, expect, it } from 'vitest';
import { calculateLayout } from '../src/layout';
import { parse } from '../src/parser';
import { renderSVG, supportedSymbolNames } from '../src/render';
import type { CrochetAst, RenderOptions } from '../src/types';

const LAYOUT_OPTIONS = { rotation: 'none', ringSpacing: 30, grid: false } as const;
const RENDER_OPTIONS: RenderOptions = {
	scale: 1,
	strokeWidth: 1.5,
	highlightIncDec: false,
	highlightColor: '#8b5cf6',
	chartMarkerColor: '#1971c2',
};

function parseChart(source: string): CrochetAst {
	return parse(source) as CrochetAst;
}

// Every glyph in the symbol library must be parseable as a stitch name, and
// every parsed stitch must render a <use> that resolves to a real symbol
// definition — this sweep is what keeps grammar.peggy, SYMBOLS, and the
// layout extents from drifting apart as the library grows.
describe('stitch symbol library', () => {
	for (const name of supportedSymbolNames()) {
		it(`parses, lays out, and renders "${name}"`, () => {
			const ast = parseChart(`R1: ${name}\n`);
			expect(ast.rows[0]?.steps[0]).toMatchObject({ type: 'StitchNode', stitch: name, count: 1 });

			const container = document.createElement('div');
			renderSVG(calculateLayout(ast, LAYOUT_OPTIONS), container, RENDER_OPTIONS);

			const svg = container.querySelector('svg');
			const href = svg?.querySelector('use')?.getAttribute('href') ?? '';
			expect(href).not.toBe('');
			expect(svg?.querySelector(`g[id="${href.slice(1)}"]`)).not.toBeNull();
		});
	}

	it('parses every symbol name in one row without prefix shadowing', () => {
		const names = supportedSymbolNames();
		const ast = parseChart(`R1: ${names.join(', ')}\n`);

		expect(ast.rows[0]?.steps.map((step) => (step.type === 'StitchNode' ? step.stitch : step.type))).toEqual([
			...names,
		]);
	});

	it('accepts quantity prefixes on digit-containing names', () => {
		const ast = parseChart('R1: 3 dc2tog, 2 hdc popcorn, 4 tr5cl\n');

		expect(ast.rows[0]?.steps[0]).toMatchObject({ stitch: 'dc2tog', count: 3 });
		expect(ast.rows[0]?.steps[1]).toMatchObject({ stitch: 'hdc popcorn', count: 2 });
		expect(ast.rows[0]?.steps[2]).toMatchObject({ stitch: 'tr5cl', count: 4 });
	});

	it('still parses short names that are prefixes of longer ones', () => {
		const ast = parseChart('R1: sc, sc2tog, dc, dc3cl, hdc, hdc popcorn, tr, tr2cl\n');

		expect(
			ast.rows[0]?.steps.map((step) => (step.type === 'StitchNode' ? step.stitch : step.type)),
		).toEqual(['sc', 'sc2tog', 'dc', 'dc3cl', 'hdc', 'hdc popcorn', 'tr', 'tr2cl']);
	});
});
