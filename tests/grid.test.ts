import { describe, expect, it } from 'vitest';
import { GRID_BUDGET, GridBudgetError, validateGridBudget } from '../src/grid/budget';
import { renderGridError } from '../src/grid/errors';
import { calculateGridLayout } from '../src/grid/layout';
import { resolveGridOptions } from '../src/grid/options';
import { GridParseError, parseGridConfig } from '../src/grid/parse';
import { renderGrid } from '../src/grid/render';
import type { CrochetWeaverSettings } from '../src/settings/tab';
import type { ResolvedGridOptions } from '../src/grid/types';

const SETTINGS: CrochetWeaverSettings = {
	languagePreference: 'auto',
	roundChartStyle: 'radial',
	scale: 1,
	strokeWidth: 1.5,
	ringSpacing: 30,
	highlightIncDec: false,
	highlightColor: '#8b5cf6',
	chartMarkerColor: '#1971c2',
	showTool: false,
	showPatternText: false,
	patternTextStyle: 'raw',
	panelPosition: 'right',
	showGrid: false,
	gridDefaultShape: 'polar',
	gridDefaultRounds: 6,
	gridDefaultColumns: 12,
	gridDefaultRows: 6,
	progress: {},
	stitchProgress: {},
};

describe('parseGridConfig', () => {
	it('parses an empty block to an empty config', () => {
		expect(parseGridConfig('')).toEqual({});
		expect(parseGridConfig('\n\n  \n')).toEqual({});
	});

	it('parses flat key: value lines, lowercasing keys', () => {
		expect(parseGridConfig('Shape: rect\nrounds: 8\ncolumns: 10\n')).toEqual({
			shape: 'rect',
			rounds: '8',
			columns: '10',
		});
	});

	it('ignores unknown keys (validated later by option resolution)', () => {
		expect(parseGridConfig('foo: bar\n')).toEqual({ foo: 'bar' });
	});

	it('throws a GridParseError with a 1-based line number for a malformed line', () => {
		expect(() => parseGridConfig('shape: polar\nnot a config line\n')).toThrow(GridParseError);
		try {
			parseGridConfig('shape: polar\nnot a config line\n');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(GridParseError);
			expect((error as GridParseError).line).toBe(2);
		}
	});
});

describe('resolveGridOptions', () => {
	it('uses global settings when config is empty', () => {
		expect(resolveGridOptions({}, SETTINGS)).toEqual({
			shape: 'polar',
			rounds: 6,
			columns: 12,
			rows: 6,
			scale: 1,
			strokeWidth: 1.5,
			ringSpacing: 30,
		});
	});

	it('applies valid config overrides', () => {
		const resolved = resolveGridOptions(
			{ shape: 'rect', rounds: '10', columns: '20', rows: '9', scale: '2', stroke: '3', spacing: '40' },
			SETTINGS,
		);
		expect(resolved).toEqual({
			shape: 'rect',
			rounds: 10,
			columns: 20,
			rows: 9,
			scale: 2,
			strokeWidth: 3,
			ringSpacing: 40,
		});
	});

	it('falls back to global settings for invalid overrides', () => {
		const resolved = resolveGridOptions(
			{ shape: 'triangle', rounds: '-1', columns: '0', rows: 'abc' },
			SETTINGS,
		);
		expect(resolved.shape).toBe(SETTINGS.gridDefaultShape);
		expect(resolved.rounds).toBe(SETTINGS.gridDefaultRounds);
		expect(resolved.columns).toBe(SETTINGS.gridDefaultColumns);
		expect(resolved.rows).toBe(SETTINGS.gridDefaultRows);
	});
});

describe('validateGridBudget', () => {
	const base: ResolvedGridOptions = {
		shape: 'polar',
		rounds: 6,
		columns: 12,
		rows: 6,
		scale: 1,
		strokeWidth: 1.5,
		ringSpacing: 30,
	};

	it('accepts ordinary grids', () => {
		expect(() => validateGridBudget(base)).not.toThrow();
		expect(() => validateGridBudget({ ...base, shape: 'rect' })).not.toThrow();
	});

	it('rejects excessive rounds for polar grids', () => {
		expect(() => validateGridBudget({ ...base, rounds: GRID_BUDGET.maxRounds + 1 })).toThrow(GridBudgetError);
	});

	it('rejects excessive columns for either shape', () => {
		expect(() => validateGridBudget({ ...base, columns: GRID_BUDGET.maxColumns + 1 })).toThrow(GridBudgetError);
	});

	it('rejects excessive rows for rect grids only', () => {
		const oversizedRows = { ...base, shape: 'rect' as const, rows: GRID_BUDGET.maxRows + 1 };
		expect(() => validateGridBudget(oversizedRows)).toThrow(GridBudgetError);
		expect(() => validateGridBudget({ ...oversizedRows, shape: 'polar' })).not.toThrow();
	});
});

describe('calculateGridLayout', () => {
	it('lays out a polar grid with one ring circle per round and one spoke per column', () => {
		const options: ResolvedGridOptions = {
			shape: 'polar',
			rounds: 5,
			columns: 8,
			rows: 6,
			scale: 1,
			strokeWidth: 1.5,
			ringSpacing: 30,
		};

		const layout = calculateGridLayout(options);

		expect(layout.circles).toHaveLength(5);
		expect(layout.lines).toHaveLength(8);
		expect(layout.circles.at(-1)?.r).toBe(5 * 30);
		expect(layout.width).toBe(layout.height);
	});

	it('lays out a rect grid with rows+1 horizontal and columns+1 vertical lines, no circles', () => {
		const options: ResolvedGridOptions = {
			shape: 'rect',
			rounds: 5,
			columns: 4,
			rows: 3,
			scale: 1,
			strokeWidth: 1.5,
			ringSpacing: 20,
		};

		const layout = calculateGridLayout(options);

		expect(layout.circles).toHaveLength(0);
		expect(layout.lines).toHaveLength((3 + 1) + (4 + 1));
	});
});

describe('renderGrid', () => {
	it('renders an SVG with class crochet-weaver-grid containing the right element counts', () => {
		const container = document.createElement('div');
		const options: ResolvedGridOptions = {
			shape: 'polar',
			rounds: 4,
			columns: 10,
			rows: 6,
			scale: 1,
			strokeWidth: 1.5,
			ringSpacing: 30,
		};

		renderGrid(calculateGridLayout(options), container, options);

		const svg = container.querySelector('svg.crochet-weaver-grid');
		expect(svg).not.toBeNull();
		expect(svg?.querySelectorAll('circle')).toHaveLength(4);
		expect(svg?.querySelectorAll('line')).toHaveLength(10);
	});

	it('localizes the aria-label', () => {
		const container = document.createElement('div');
		const options: ResolvedGridOptions = {
			shape: 'rect',
			rounds: 6,
			columns: 5,
			rows: 5,
			scale: 1,
			strokeWidth: 1.5,
			ringSpacing: 30,
		};

		renderGrid(calculateGridLayout(options), container, options, 'ja');

		expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('空白のかぎ針編み下描きグリッド');
	});
});

describe('renderGridError', () => {
	it('renders a localized parse error box with the offending line number', () => {
		const container = document.createElement('div');

		renderGridError(new GridParseError('bad', 3), container, 'zh-TW');

		expect(container.querySelector('.crochet-weaver-error-title')?.textContent).toBe('鉤織網格錯誤');
		expect(container.textContent).toContain('第 3 行');
	});

	it('renders a localized budget error box', () => {
		const container = document.createElement('div');
		const error = new GridBudgetError('too many rounds', 'budget.gridRounds', { rounds: 99, max: 40 });

		renderGridError(error, container, 'en');

		expect(container.textContent).toContain('too many rounds (99)');
	});
});
