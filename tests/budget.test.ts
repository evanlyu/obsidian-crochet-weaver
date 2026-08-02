import { describe, expect, it } from 'vitest';
import { GRID_GUIDE_BUDGET, validateChartBudget, validateGridGuideBudget } from '../src/pattern/budget';
import { calculateLayout } from '../src/layout';
import { parse } from '../src/pattern/parser';
import { parseChart as parsePattern } from '../src/pattern/parse-chart';
import { renderCrochetTool } from '../src/panel/tool';
import type { CrochetAst } from '../src/types';

const OPTIONS = {
	rotation: 'smart',
	ringSpacing: 30,
	grid: false,
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

describe('grid guide budget validation', () => {
	it('ignores gridCount/gridColumns when the guide is disabled', () => {
		expect(() =>
			validateGridGuideBudget('round', { grid: false, gridCount: 999999, gridColumns: 999999 }),
		).not.toThrow();
	});

	it('accepts ordinary overrides within the limit', () => {
		expect(() => validateGridGuideBudget('round', { grid: true, gridCount: 10, gridColumns: 20 })).not.toThrow();
		expect(() => validateGridGuideBudget('flat', { grid: true, gridCount: 10, gridColumns: 20 })).not.toThrow();
	});

	it('rejects excessive rounds for round/spiral charts', () => {
		expect(() =>
			validateGridGuideBudget('round', { grid: true, gridCount: GRID_GUIDE_BUDGET.maxRounds + 1 }),
		).toThrow(/rounds/i);
		expect(() =>
			validateGridGuideBudget('spiral', { grid: true, gridCount: GRID_GUIDE_BUDGET.maxRounds + 1 }),
		).toThrow(/rounds/i);
	});

	it('rejects excessive rows for flat charts', () => {
		expect(() =>
			validateGridGuideBudget('flat', { grid: true, gridCount: GRID_GUIDE_BUDGET.maxRows + 1 }),
		).toThrow(/rows/i);
	});

	it('rejects excessive columns for any chart type', () => {
		expect(() =>
			validateGridGuideBudget('round', { grid: true, gridColumns: GRID_GUIDE_BUDGET.maxColumns + 1 }),
		).toThrow(/columns/i);
	});
});

describe('chart budget: rounds written as repeats of other rounds', () => {
	it('reports a repeat range that would expand past the row limit', () => {
		expect(() => parsePattern('R1: 6 sc in MR\n\nR2-R9999: repeat R1.\n')).toThrow(/too many rows/);
	});

	it('counts the stitches an expanded round draws', () => {
		const ast = parsePattern('R1: 6 sc in MR\n\nR2: 6 sc\n\nR3-R6: repeat R2.\n');

		expect(ast.rows).toHaveLength(6);
		expect(() => validateChartBudget(ast)).not.toThrow();
	});

	it('counts a motif by the stitches it makes, and an instruction as at most one', () => {
		const ast = parsePattern('R1: 6 sc in MR\n\nR2: turn, skip 1, 9 dc in next ch-2 sp, sl st to join.\n');

		expect(() => validateChartBudget(ast)).not.toThrow();
	});

	it('still reports a motif quantity beyond the stitch limit', () => {
		expect(() => validateChartBudget(parsePattern('R1: 5000 dc in next ch-2 sp\n'))).toThrow(/Stitch count/);
	});
});
