import { t, type Locale } from '../i18n';
import { wrapScrollable } from '../render/scroll-pan';
import type { GridLayoutResult, ResolvedGridOptions } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderGrid(
	layout: GridLayoutResult,
	el: HTMLElement,
	options: ResolvedGridOptions,
	locale: Locale = 'en',
): void {
	const doc = el.ownerDocument;
	const svg = doc.createElementNS(SVG_NS, 'svg');
	svg.classList.add('crochet-weaver-grid');
	svg.setAttribute('role', 'img');
	svg.setAttribute('aria-label', t(locale, 'grid.ariaLabel'));
	svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
	svg.setAttribute('width', String(layout.width * options.scale));
	svg.setAttribute('height', String(layout.height * options.scale));

	for (const circle of layout.circles) {
		const circleEl = doc.createElementNS(SVG_NS, 'circle');
		circleEl.setAttribute('cx', String(circle.cx));
		circleEl.setAttribute('cy', String(circle.cy));
		circleEl.setAttribute('r', String(circle.r));
		circleEl.setAttribute('fill', 'none');
		circleEl.setAttribute('stroke', 'currentColor');
		circleEl.setAttribute('stroke-width', String(options.strokeWidth));
		svg.appendChild(circleEl);
	}

	for (const line of layout.lines) {
		const lineEl = doc.createElementNS(SVG_NS, 'line');
		lineEl.setAttribute('x1', String(line.x1));
		lineEl.setAttribute('y1', String(line.y1));
		lineEl.setAttribute('x2', String(line.x2));
		lineEl.setAttribute('y2', String(line.y2));
		lineEl.setAttribute('stroke', 'currentColor');
		lineEl.setAttribute('stroke-width', String(options.strokeWidth));
		svg.appendChild(lineEl);
	}

	wrapScrollable(el, svg);
}
