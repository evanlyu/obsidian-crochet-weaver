import { describe, expect, it } from 'vitest';
import { validateChartBudget } from '../src/budget';
import { calculateLayout } from '../src/layout';
import { parse } from '../src/parser';
import { renderCrochetTool } from '../src/tool';
import type { CrochetAst } from '../src/types';

const OPTIONS = {
	rotation: 'smart',
	ringSpacing: 30,
	showNextRoundMarker: true,
} as const;

function parseChart(source: string): CrochetAst {
	return parse(source) as CrochetAst;
}

describe('chart budget validation', () => {
	it('accepts ordinary documented patterns', () => {
		const ast = parseChart('R1: [sc, inc] x 6\nR2: 18 sc\n');

		expect(() => validateChartBudget(ast)).not.toThrow();
		expect(() => calculateLayout(ast, OPTIONS)).not.toThrow();
	});

	it('rejects excessive stitch quantities before expansion', () => {
		const ast = parseChart('R1: 1000000000 sc\n');

		expect(() => validateChartBudget(ast)).toThrow(/too many/i);
		expect(() => calculateLayout(ast, OPTIONS)).toThrow(/too many/i);
	});

	it('rejects excessive repeat counts before expansion', () => {
		const ast = parseChart('R1: [sc, inc] x 1000000000\n');

		expect(() => validateChartBudget(ast)).toThrow(/repeat/i);
	});

	it('renders controlled tool errors for oversized patterns', () => {
		const container = document.createElement('div');

		renderCrochetTool('R1: 1000000000 sc\n', container, {
			getProgress: () => 0,
			setProgress: async () => undefined,
			getStitchProgress: () => 0,
			setStitchProgress: async () => undefined,
		}, 'zh-TW');

		expect(container.querySelector('.crochet-weaver-error')).not.toBeNull();
		expect(container.textContent).toContain('針數過多');
	});
});
