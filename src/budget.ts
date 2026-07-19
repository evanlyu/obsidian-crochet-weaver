import type { TranslationKey } from './i18n';
import type { AstNode, CrochetAst } from './types';

export const CHART_BUDGET = {
	maxRows: 200,
	maxStitchCount: 1000,
	maxRepeatCount: 500,
	maxRenderItems: 5000,
	maxDepth: 8,
} as const;

type ChartBudget = typeof CHART_BUDGET;

export class ChartBudgetError extends Error {
	readonly translationKey: TranslationKey;
	readonly translationParams: Record<string, string | number>;

	constructor(
		message: string,
		translationKey: TranslationKey,
		translationParams: Record<string, string | number>,
	) {
		super(message);
		this.name = 'ChartBudgetError';
		this.translationKey = translationKey;
		this.translationParams = translationParams;
	}
}

export function validateChartBudget(
	ast: CrochetAst,
	budget: ChartBudget = CHART_BUDGET,
): void {
	if (ast.rows.length > budget.maxRows) {
		const params = { rows: ast.rows.length, max: budget.maxRows };
		throw new ChartBudgetError(
			`Pattern has too many rows (${params.rows}); maximum is ${params.max}.`,
			'budget.rows',
			params,
		);
	}

	let totalItems = 0;
	for (const row of ast.rows) {
		totalItems += estimateSteps(row.steps, 1, budget);
		if (totalItems > budget.maxRenderItems) {
			const params = { max: budget.maxRenderItems };
			throw new ChartBudgetError(
				`Pattern has too many rendered stitches; maximum is ${params.max}.`,
				'budget.renderItems',
				params,
			);
		}
	}
}

function estimateSteps(
	steps: readonly AstNode[],
	depth: number,
	budget: ChartBudget,
): number {
	let total = 0;
	for (const step of steps) {
		total += estimateNode(step, depth, budget);
		if (total > budget.maxRenderItems) return total;
	}
	return total;
}

function estimateNode(
	node: AstNode,
	depth: number,
	budget: ChartBudget,
): number {
	if (depth > budget.maxDepth) {
		const params = { max: budget.maxDepth };
		throw new ChartBudgetError(
			`Pattern nesting is too deep; maximum depth is ${params.max}.`,
			'budget.depth',
			params,
		);
	}

	switch (node.type) {
		case 'StitchNode': {
			assertPositiveCount(node.count, 'stitch');
			if (node.count > budget.maxStitchCount) {
				const params = { count: node.count, max: budget.maxStitchCount };
				throw new ChartBudgetError(
					`Stitch count is too many (${params.count}); maximum is ${params.max}.`,
					'budget.stitchCount',
					params,
				);
			}
			return node.count;
		}
		case 'GroupNode':
			return estimateSteps(node.children, depth + 1, budget);
		case 'RepeatNode': {
			assertPositiveCount(node.count, 'repeat');
			if (node.count > budget.maxRepeatCount) {
				const params = { count: node.count, max: budget.maxRepeatCount };
				throw new ChartBudgetError(
					`Repeat count is too high (${params.count}); maximum is ${params.max}.`,
					'budget.repeatCount',
					params,
				);
			}
			return node.count * estimateSteps(node.children, depth + 1, budget);
		}
	}
}

function assertPositiveCount(count: number, label: string): void {
	if (!Number.isInteger(count) || count < 1) {
		const params = { label, count };
		throw new ChartBudgetError(
			`Invalid ${label} count (${count}); count must be a positive integer.`,
			'budget.invalidCount',
			params,
		);
	}
}
