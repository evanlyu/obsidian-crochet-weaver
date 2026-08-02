import { validateChartBudget } from '../pattern/budget';
import { layoutFlat } from '../layout/flat';
import { layoutRound } from '../layout/round';
import { roundStitchCount, unitStitchCounts } from '../layout/steps';
import { layoutSpiral } from '../layout/spiral';
import { LACE_SYMBOL_SCALE, type CrochetAst, type LayoutOptions, type LayoutResult } from '../types';
import { withSymbolScale } from './constants';

export { roundStitchCount, unitStitchCounts };

export function calculateLayout(
	ast: CrochetAst,
	options: LayoutOptions,
): LayoutResult {
	validateChartBudget(ast);
	// Everything that measures anything measures it at the same size (see
	// layout/constants.ts), so the scale is set once, around the whole layout.
	return withSymbolScale(options.lace === true ? LACE_SYMBOL_SCALE : 1, () => {
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
	});
}
