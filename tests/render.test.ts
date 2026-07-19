import { describe, expect, it } from 'vitest';
import { renderCrochetError } from '../src/errors';
import { renderSVG } from '../src/render';
import type { LayoutResult, RenderOptions } from '../src/types';

const OPTIONS: RenderOptions = {
	scale: 1,
	strokeWidth: 1.5,
	highlightIncDec: true,
	chartMarkerColor: '#1971c2',
};

function makeLayout(symbol: string): LayoutResult {
	return {
		width: 100,
		height: 80,
		items: [{ symbol, x: 20, y: 20, rotation: 0 }],
	};
}

describe('SVG rendering', () => {
	it('renders a crochet chart SVG with local symbol references', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		const svg = container.querySelector('svg.crochet-weaver-chart');
		const use = svg?.querySelector('use');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 100 80');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toBe('Crochet stitch chart');
		expect(use?.getAttribute('href')).toMatch(/^#cw\d+-sym-sc$/);
	});

	it('localizes chart accessibility labels', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS, 'ja');

		expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('かぎ針編みチャート');
	});

	it('uses unique symbol ids for multiple chart instances', () => {
		const first = document.createElement('div');
		const second = document.createElement('div');

		renderSVG(makeLayout('sc'), first, OPTIONS);
		renderSVG(makeLayout('sc'), second, OPTIONS);

		expect(first.querySelector('use')?.getAttribute('href')).not.toBe(
			second.querySelector('use')?.getAttribute('href'),
		);
	});

	it('marks highlighted increases and loop markers', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'inc', x: 20, y: 20, rotation: 0, loop: 'blo' }],
		};

		renderSVG(layout, container, OPTIONS);

		expect(container.querySelector('use')?.classList.contains('crochet-weaver-accent')).toBe(true);
		expect(container.querySelector('path[d="M -4 9 Q 0 13 4 9"]')).not.toBeNull();
	});

	it('groups the loop marker with its stitch under the current-position highlight', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0, rowIndex: 0, unitIndex: 0, loop: 'blo' }],
		};

		renderSVG(layout, container, OPTIONS, 'en', { rowIndex: 0, unitIndex: 0 });

		const mark = container.querySelector('path[d="M -4 9 Q 0 13 4 9"]');
		expect(mark?.classList.contains('crochet-weaver-stitch-highlight')).toBe(true);
		expect(mark?.getAttribute('style')).toContain('#1971c2');
	});

	it('does not highlight the loop marker outside the current position', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0, rowIndex: 1, unitIndex: 0, loop: 'flo' }],
		};

		renderSVG(layout, container, OPTIONS, 'en', { rowIndex: 0, unitIndex: 0 });

		const mark = container.querySelector('path[d="M -4 9 Q 0 5 4 9"]');
		expect(mark?.classList.contains('crochet-weaver-row-highlight')).toBe(false);
		expect(mark?.classList.contains('crochet-weaver-stitch-highlight')).toBe(false);
	});

	it('recolors items in the highlighted row via a class and inline color on the symbol itself', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [
				{ symbol: 'sc', x: 10, y: 10, rotation: 0, rowIndex: 0, unitIndex: 0 },
				{ symbol: 'sc', x: 30, y: 10, rotation: 0, rowIndex: 1, unitIndex: 0 },
			],
		};

		renderSVG(layout, container, OPTIONS, 'en', { rowIndex: 0 });

		const uses = container.querySelectorAll('use');
		expect(uses[0]?.classList.contains('crochet-weaver-row-highlight')).toBe(true);
		expect(uses[0]?.getAttribute('style')).toContain('#1971c2');
		expect(uses[1]?.classList.contains('crochet-weaver-row-highlight')).toBe(false);
		expect(container.querySelector('.crochet-weaver-stitch-highlight')).toBeNull();
	});

	it('marks the target unit with the stronger stitch-highlight class instead', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [
				{ symbol: 'sc', x: 10, y: 10, rotation: 0, rowIndex: 0, unitIndex: 0 },
				{ symbol: 'sc', x: 30, y: 10, rotation: 0, rowIndex: 0, unitIndex: 1 },
			],
		};

		renderSVG(layout, container, OPTIONS, 'en', { rowIndex: 0, unitIndex: 1 });

		const uses = container.querySelectorAll('use');
		expect(uses[0]?.classList.contains('crochet-weaver-row-highlight')).toBe(true);
		expect(uses[1]?.classList.contains('crochet-weaver-stitch-highlight')).toBe(true);
	});

	it('draws no highlight when no target is given', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 10, y: 10, rotation: 0, rowIndex: 0, unitIndex: 0 }],
		};

		renderSVG(layout, container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-row-highlight')).toBeNull();
		expect(container.querySelector('.crochet-weaver-stitch-highlight')).toBeNull();
	});

	it('draws a gapped, arrow-tipped connector line for each row turn', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0 }],
			rowConnectors: [{ x: 20, fromY: 20, toY: 50 }],
		};

		renderSVG(layout, container, OPTIONS);

		const line = container.querySelector('.crochet-weaver-row-connector');
		expect(line).not.toBeNull();
		expect(line?.getAttribute('x1')).toBe('20');
		expect(line?.getAttribute('x2')).toBe('20');
		expect(Number(line?.getAttribute('y1'))).toBeGreaterThan(20);
		expect(Number(line?.getAttribute('y2'))).toBeLessThan(50);
		expect(line?.getAttribute('stroke')).toBe('currentColor');
		expect(line?.getAttribute('marker-end')).toMatch(/^url\(#cw\d+-row-connector-arrow\)$/);
		expect(container.querySelector('marker path')).not.toBeNull();
	});

	it('clamps the connector gap for a short row turn instead of drawing a negative line', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0 }],
			rowConnectors: [{ x: 20, fromY: 20, toY: 26 }],
		};

		renderSVG(layout, container, OPTIONS);

		const line = container.querySelector('.crochet-weaver-row-connector');
		const y1 = Number(line?.getAttribute('y1'));
		const y2 = Number(line?.getAttribute('y2'));
		expect(y1).toBeLessThan(y2);
		expect(y1).toBeGreaterThanOrEqual(20);
		expect(y2).toBeLessThanOrEqual(26);
	});

	it('draws the grid guide layer before the stitch symbols, using the guide class', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0 }],
			gridGuide: {
				circles: [{ cx: 50, cy: 40, r: 20 }],
				lines: [{ x1: 0, y1: 0, x2: 100, y2: 0 }],
			},
		};

		renderSVG(layout, container, OPTIONS);

		const svg = container.querySelector('svg');
		const children = Array.from(svg?.children ?? []);
		const guideCircle = svg?.querySelector('circle.crochet-weaver-grid-guide');
		const guideLine = svg?.querySelector('line.crochet-weaver-grid-guide');
		const use = svg?.querySelector('use');

		expect(guideCircle?.getAttribute('r')).toBe('20');
		expect(guideLine?.getAttribute('x2')).toBe('100');
		expect(children.indexOf(guideCircle as Element)).toBeLessThan(children.indexOf(use as Element));
	});

	it('renders no guide elements when the layout has no gridGuide', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-grid-guide')).toBeNull();
	});

	it('renders parse locations in error boxes with a generic localized message instead of raw PEG text', () => {
		const container = document.createElement('div');
		const error = Object.assign(new Error('Expected "R" or "Round" but "x" found.'), {
			location: { start: { line: 2, column: 4 } },
		});

		renderCrochetError(error, container, 'zh-TW');

		expect(container.querySelector('.crochet-weaver-error-title')?.textContent).toBe('織圖語法錯誤');
		expect(container.textContent).toContain('第 2 行第 4 欄');
		expect(container.textContent).toContain('無法解析的語法或未知的針目');
		expect(container.textContent).not.toContain('Expected');
	});
});
