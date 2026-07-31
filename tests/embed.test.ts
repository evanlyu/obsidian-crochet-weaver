import { describe, expect, it } from 'vitest';
import { renderEmbeddedChart } from '../src/panel/embed';
import type { CrochetAst, LayoutResult } from '../src/types';
import type { ResolvedOptions, PanelOptions } from '../src/settings/options';
import type { ProgressStore } from '../src/panel/tool';

describe('renderEmbeddedChart', () => {
	const ast: CrochetAst = {
		type: 'CrochetChart',
		config: { type: 'flat' },
		rows: [],
	};
	const layout: LayoutResult = { width: 100, height: 100, items: [] };
	const opts: ResolvedOptions = {
		ringSpacing: 30,
		grid: false,
		scale: 1,
		strokeWidth: 1.5,
		highlightIncDec: false,
		highlightColor: '#8b5cf6',
		chartMarkerColor: '#1971c2',
	};
	const store: ProgressStore = {
		getProgress: () => 0,
		setProgress: async () => {},
		getStitchProgress: () => 0,
		setStitchProgress: async () => {},
	};

	it('appends panel before chart when position is left', () => {
		const el = document.createElement('div');
		const panel: PanelOptions = { showTool: true, showText: false, position: 'left', textStyle: 'raw' };

		renderEmbeddedChart(el, 'R1: sc', ast, layout, opts, panel, 'en', store);

		const wrapper = el.querySelector('.crochet-weaver-chart-row');
		if (!(wrapper instanceof HTMLElement)) throw new Error('Expected embedded chart wrapper');

		const children = Array.from(wrapper.children);
		const [panelChild, chartChild] = children;
		expect(children.length).toBe(2);
		expect(panelChild).toBeInstanceOf(HTMLElement);
		expect(chartChild).toBeInstanceOf(HTMLElement);
		expect(panelChild?.classList.contains('crochet-tool')).toBe(true);
		expect(chartChild?.classList.contains('crochet-weaver-chart-container')).toBe(true);
	});

	it('appends chart before panel when position is right', () => {
		const el = document.createElement('div');
		const panel: PanelOptions = { showTool: true, showText: false, position: 'right', textStyle: 'raw' };

		renderEmbeddedChart(el, 'R1: sc', ast, layout, opts, panel, 'en', store);

		const wrapper = el.querySelector('.crochet-weaver-chart-row');
		if (!(wrapper instanceof HTMLElement)) throw new Error('Expected embedded chart wrapper');

		const children = Array.from(wrapper.children);
		const [chartChild, panelChild] = children;
		expect(children.length).toBe(2);
		expect(chartChild).toBeInstanceOf(HTMLElement);
		expect(panelChild).toBeInstanceOf(HTMLElement);
		expect(chartChild?.classList.contains('crochet-weaver-chart-container')).toBe(true);
		expect(panelChild?.classList.contains('crochet-tool')).toBe(true);
	});
});
