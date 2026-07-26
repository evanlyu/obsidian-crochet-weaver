import { describe, expect, it } from 'vitest';
import { renderCrochetError } from '../src/errors';
import { renderSVG } from '../src/render';
import type { LayoutResult, RenderOptions } from '../src/types';

const OPTIONS: RenderOptions = {
	scale: 1,
	strokeWidth: 1.5,
	highlightIncDec: true,
	highlightColor: '#8b5cf6',
	chartMarkerColor: '#1971c2',
};

function makeLayout(symbol: string): LayoutResult {
	return {
		width: 100,
		height: 80,
		items: [{ symbol, x: 20, y: 20, rotation: 0 }],
	};
}

// An increase: the stitch below it is worked into, and the V that stands for
// the two stitches it makes (those have no symbol of their own on the chart).
function shapedLayout(): LayoutResult {
	return {
		width: 100,
		height: 80,
		items: [{ symbol: 'sc', x: 20, y: 40, rotation: 0, rowIndex: 0, unitIndex: 0, stitchId: 'r0s0' }],
		shapingMarks: [
			{
				kind: 'increase',
				x: 20,
				y: 15,
				rotation: 0,
				rowIndex: 1,
				unitIndex: 0,
				segments: [[{ x: 10, y: 10 }, { x: 20, y: 30 }, { x: 30, y: 10 }]],
			},
		],
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

	it('accents N-together decreases when highlightIncDec is on, and not otherwise', () => {
		const highlighted = document.createElement('div');
		renderSVG(makeLayout('dc2tog'), highlighted, OPTIONS);
		expect(highlighted.querySelector('use')?.classList.contains('crochet-weaver-accent')).toBe(true);

		const plain = document.createElement('div');
		renderSVG(makeLayout('dc2tog'), plain, { ...OPTIONS, highlightIncDec: false });
		expect(plain.querySelector('use')?.classList.contains('crochet-weaver-accent')).toBe(false);

		const cluster = document.createElement('div');
		renderSVG(makeLayout('dc3cl'), cluster, OPTIONS);
		expect(cluster.querySelector('use')?.classList.contains('crochet-weaver-accent')).toBe(false);
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

	it('keeps stitch symbols and their loop markers on the theme default, even when the item carries a yarn color', () => {
		// Yarn color is only flagged via the color-marker ring (see below) — the
		// stitch symbols themselves always stay theme-colored, both so text-only
		// colors like "black" stay legible in a dark theme and so it doesn't
		// double up with the progress tool's own current-position highlight.
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0, loop: 'blo', color: 'white' }],
		};

		renderSVG(layout, container, OPTIONS);

		const use = container.querySelector('use');
		const loopMark = container.querySelector('path[d="M -4 9 Q 0 13 4 9"]');
		expect(use?.getAttribute('style')).toBeNull();
		expect(loopMark?.getAttribute('style')).toBeNull();
	});

	it('leaves uncolored items on the theme default (no inline color style)', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('use')?.getAttribute('style')).toBeNull();
	});

	it('draws a color-change marker as a hollow ring (not a fill) so it never hides the stitch symbol', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0, color: 'orange' }],
			colorMarkers: [{ x: 20, y: 20, color: 'orange' }],
		};

		renderSVG(layout, container, OPTIONS);

		const svg = container.querySelector('svg');
		const children = Array.from(svg?.children ?? []);
		const marker = svg?.querySelector('circle.crochet-weaver-color-marker');
		const use = svg?.querySelector('use');

		expect(marker?.getAttribute('cx')).toBe('20');
		expect(marker?.getAttribute('fill')).toBe('none');
		expect(marker?.getAttribute('style')).toContain('stroke: orange');
		expect(children.indexOf(marker as Element)).toBeLessThan(children.indexOf(use as Element));
	});

	it('draws round-number labels as text elements with the round-number class', () => {
		const container = document.createElement('div');
		const layout: LayoutResult = {
			width: 100,
			height: 80,
			items: [{ symbol: 'sc', x: 20, y: 20, rotation: 0 }],
			labels: [{ x: 40, y: 30, text: '3' }],
		};

		renderSVG(layout, container, OPTIONS);

		const label = container.querySelector('text.crochet-weaver-round-number');
		expect(label?.textContent).toBe('3');
		expect(label?.getAttribute('x')).toBe('40');
		expect(label?.getAttribute('fill')).toBe('currentColor');
	});

	it('draws no labels when the layout has none', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-round-number')).toBeNull();
	});

	it('draws no color markers when the layout has none', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-color-marker')).toBeNull();
	});

	it('renders no guide elements when the layout has no gridGuide', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-grid-guide')).toBeNull();
	});

	it('draws a shaping symbol as one open path through the points the layout gave it', () => {
		const container = document.createElement('div');

		renderSVG(shapedLayout(), container, OPTIONS);

		const path = container.querySelector('path.crochet-weaver-shaping');
		expect(path?.getAttribute('d')).toBe('M 10 10 L 20 30 L 30 10');
		expect(path?.getAttribute('fill')).toBe('none');
		expect(path?.getAttribute('stroke')).toBe('currentColor');
		expect(path?.getAttribute('stroke-width')).toBe('1.5');
		// Nothing about the shape comes from the shared symbol library.
		expect(container.querySelector('use[href*="sym-inc"]')).toBeNull();
	});

	it('draws increases and decreases in the configured highlight color', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('dc2tog'), container, { ...OPTIONS, highlightColor: '#ff8800' });

		const symbol = container.querySelector('use');
		expect(symbol?.classList.contains('crochet-weaver-accent')).toBe(true);
		expect(symbol?.getAttribute('style')).toContain('#ff8800');
	});

	it('accents shaping symbols only when increase/decrease highlighting is on', () => {
		const highlighted = document.createElement('div');
		renderSVG(shapedLayout(), highlighted, OPTIONS);
		expect(highlighted.querySelector('.crochet-weaver-shaping')?.classList.contains('crochet-weaver-accent')).toBe(
			true,
		);

		const plain = document.createElement('div');
		renderSVG(shapedLayout(), plain, { ...OPTIONS, highlightIncDec: false });
		expect(plain.querySelector('.crochet-weaver-shaping')?.classList.contains('crochet-weaver-accent')).toBe(false);
	});

	it('draws a loop marker on a shaping symbol, at its own place on the round', () => {
		const container = document.createElement('div');
		const layout = shapedLayout();
		const [mark] = layout.shapingMarks ?? [];
		if (!mark) throw new Error('expected a shaping mark');
		layout.shapingMarks = [{ ...mark, loop: 'blo' }];

		renderSVG(layout, container, OPTIONS);

		const loopMark = container.querySelector('path[d="M -4 9 Q 0 13 4 9"]');
		// Rotated with the mark, so the loop it means faces the round below.
		expect(loopMark?.getAttribute('transform')).toBe('translate(20 15) rotate(0)');
	});

	it('highlights a shaping symbol together with the step that made it', () => {
		const container = document.createElement('div');

		renderSVG(shapedLayout(), container, OPTIONS, 'en', { rowIndex: 1, unitIndex: 0 });

		const path = container.querySelector('path.crochet-weaver-shaping');
		expect(path?.classList.contains('crochet-weaver-stitch-highlight')).toBe(true);
		expect(path?.getAttribute('style')).toContain('#1971c2');
	});

	it('scales the drawing without detaching connector endpoints from their stitches', () => {
		const plain = document.createElement('div');
		const scaled = document.createElement('div');

		renderSVG(shapedLayout(), plain, OPTIONS);
		renderSVG(shapedLayout(), scaled, { ...OPTIONS, scale: 2.5 });

		const plainSvg = plain.querySelector('svg');
		const scaledSvg = scaled.querySelector('svg');
		// Scaling is applied to the drawing surface, so stitch and connector
		// coordinates — and therefore the connections between them — are identical.
		expect(scaledSvg?.getAttribute('viewBox')).toBe(plainSvg?.getAttribute('viewBox'));
		expect(scaledSvg?.getAttribute('width')).toBe('250');
		expect(scaledSvg?.getAttribute('height')).toBe('200');
		expect(scaled.querySelector('.crochet-weaver-shaping')?.getAttribute('d')).toBe(
			plain.querySelector('.crochet-weaver-shaping')?.getAttribute('d'),
		);
		expect(scaled.querySelector('use')?.getAttribute('transform')).toBe(
			plain.querySelector('use')?.getAttribute('transform'),
		);
	});

	it('draws no shaping paths when the layout has none', () => {
		const container = document.createElement('div');

		renderSVG(makeLayout('sc'), container, OPTIONS);

		expect(container.querySelector('.crochet-weaver-shaping')).toBeNull();
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
