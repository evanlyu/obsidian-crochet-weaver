import type { CrochetAst, LayoutResult, ChartHighlight } from './types';
import type { ResolvedOptions, PanelOptions } from './options';
import type { Locale } from './i18n';
import { renderSVG } from './render';
import { renderCrochetTool, renderCrochetPatternText, type ProgressStore } from './tool';

export function renderEmbeddedChart(
	el: HTMLElement,
	source: string,
	ast: CrochetAst,
	layout: LayoutResult,
	opts: ResolvedOptions,
	panel: PanelOptions,
	locale: Locale,
	store: ProgressStore,
): void {
	if (panel.showTool) {
		const wrapper = el.createDiv({
			cls: `crochet-weaver-chart-row crochet-weaver-panel-${panel.position}`,
		});
		const chartContainer = wrapper.ownerDocument.createElement('div');
		chartContainer.className = 'crochet-weaver-chart-container';

		const paintChart = (highlight: ChartHighlight | undefined) => {
			chartContainer.empty();
			renderSVG(layout, chartContainer, opts, locale, highlight);
		};

		if (panel.position === 'left') {
			renderCrochetTool(source, wrapper, store, locale, paintChart);
			wrapper.appendChild(chartContainer);
		} else {
			wrapper.appendChild(chartContainer);
			renderCrochetTool(source, wrapper, store, locale, paintChart);
		}
	} else if (panel.showText) {
		const wrapper = el.createDiv({
			cls: `crochet-weaver-chart-row crochet-weaver-panel-${panel.position}`,
		});
		const chartContainer = wrapper.ownerDocument.createElement('div');
		chartContainer.className = 'crochet-weaver-chart-container';

		if (panel.position === 'left') {
			renderCrochetPatternText(source, wrapper, locale);
			wrapper.appendChild(chartContainer);
		} else {
			wrapper.appendChild(chartContainer);
			renderCrochetPatternText(source, wrapper, locale);
		}
		renderSVG(layout, chartContainer, opts, locale);
	} else {
		renderSVG(layout, el, opts, locale);
	}
}
