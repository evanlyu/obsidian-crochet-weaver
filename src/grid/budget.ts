import type { TranslationKey } from '../i18n';
import type { ResolvedGridOptions } from '../types';

export const GRID_BUDGET = {
	maxRounds: 40,
	maxColumns: 72,
	maxRows: 40,
} as const;

type GridBudget = typeof GRID_BUDGET;

export class GridBudgetError extends Error {
	readonly translationKey: TranslationKey;
	readonly translationParams: Record<string, string | number>;

	constructor(
		message: string,
		translationKey: TranslationKey,
		translationParams: Record<string, string | number>,
	) {
		super(message);
		this.name = 'GridBudgetError';
		this.translationKey = translationKey;
		this.translationParams = translationParams;
	}
}

export function validateGridBudget(
	options: ResolvedGridOptions,
	budget: GridBudget = GRID_BUDGET,
): void {
	if (options.shape === 'polar' && options.rounds > budget.maxRounds) {
		const params = { rounds: options.rounds, max: budget.maxRounds };
		throw new GridBudgetError(
			`Grid has too many rounds (${params.rounds}); maximum is ${params.max}.`,
			'budget.gridRounds',
			params,
		);
	}

	if (options.columns > budget.maxColumns) {
		const params = { columns: options.columns, max: budget.maxColumns };
		throw new GridBudgetError(
			`Grid has too many columns (${params.columns}); maximum is ${params.max}.`,
			'budget.gridColumns',
			params,
		);
	}

	if (options.shape === 'rect' && options.rows > budget.maxRows) {
		const params = { rows: options.rows, max: budget.maxRows };
		throw new GridBudgetError(
			`Grid has too many rows (${params.rows}); maximum is ${params.max}.`,
			'budget.gridRows',
			params,
		);
	}
}
