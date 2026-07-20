import { validateChartBudget } from './budget';
import { layoutFlat } from './layout/flat';
import { layoutRound } from './layout/round';
import { roundStitchCount, unitStitchCounts } from './layout/steps';
import { layoutSpiral } from './layout/spiral';
import type { CrochetAst, LayoutOptions, LayoutResult } from './types';

export { roundStitchCount, unitStitchCounts };

export function calculateLayout(
	ast: CrochetAst,
	options: LayoutOptions,
): LayoutResult {
	validateChartBudget(ast);
	switch (ast.config.type) {
		case 'flat':
			return layoutFlat(ast, options);
		case 'round':
			return layoutRound(ast, options);
		case 'spiral':
			return layoutSpiral(ast, options);
		default:
			throw new Error(`Unknown layout mode: ${ast.config.type}`);
	}
}
