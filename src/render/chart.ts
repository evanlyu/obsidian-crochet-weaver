import { t, type Locale } from '../i18n';
import { SYMBOLS, type SymbolSpec } from '../render/symbols';
import { COLOR_MARKER_RADIUS } from '../layout/constants';
import { wrapScrollable } from '../render/scroll-pan';
export { supportedSymbolNames } from '../render/symbols';
import type { ChartHighlight, GridPoint, LayoutResult, RenderOptions } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface SymbolDefContext {
	readonly doc: Document;
	readonly uid: string;
	readonly strokeWidth: number;
}

const ACCENT_STITCHES = new Set([
	'inc',
	'dec',
	'sc2tog',
	'sc3tog',
	'hdc2tog',
	'hdc3tog',
	'hdc4tog',
	'hdc5tog',
	'dc2tog',
	'dc3tog',
	'dc4tog',
	'dc5tog',
]);

const BLO_MARK = 'M -4 9 Q 0 13 4 9';
const FLO_MARK = 'M -4 9 Q 0 5 4 9';
const ROW_CONNECTOR_GAP = 10;

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

let instanceCounter = 0;

export function renderSVG(
	layout: LayoutResult,
	el: HTMLElement,
	options: RenderOptions,
	locale: Locale = 'en',
	highlight?: ChartHighlight,
) {
	const uid = `cw${++instanceCounter}`;
	const doc = el.ownerDocument;
	const svg = doc.createElementNS(SVG_NS, 'svg');
	svg.classList.add('crochet-weaver-chart');
	svg.setAttribute('role', 'img');
	svg.setAttribute('aria-label', t(locale, 'chart.ariaLabel'));
	svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
	svg.setAttribute('width', String(layout.width * options.scale));
	svg.setAttribute('height', String(layout.height * options.scale));

	const defs = doc.createElementNS(SVG_NS, 'defs');
	const symbolContext: SymbolDefContext = { doc, uid, strokeWidth: options.strokeWidth };
	for (const [name, spec] of Object.entries(SYMBOLS)) {
		defs.appendChild(createSymbolDef(symbolContext, name, spec));
	}
	const rowConnectors = layout.rowConnectors ?? [];
	const arrowId = `${uid}-row-connector-arrow`;
	if (rowConnectors.length > 0) {
		defs.appendChild(createArrowMarker(doc, arrowId));
	}
	svg.appendChild(defs);

	if (layout.gridGuide) {
		for (const circle of layout.gridGuide.circles) {
			const circleEl = doc.createElementNS(SVG_NS, 'circle');
			circleEl.classList.add('crochet-weaver-grid-guide');
			circleEl.setAttribute('cx', String(circle.cx));
			circleEl.setAttribute('cy', String(circle.cy));
			circleEl.setAttribute('r', String(circle.r));
			circleEl.setAttribute('fill', 'none');
			circleEl.setAttribute('stroke', 'currentColor');
			circleEl.setAttribute('stroke-width', String(options.strokeWidth));
			svg.appendChild(circleEl);
		}
		for (const line of layout.gridGuide.lines) {
			const lineEl = doc.createElementNS(SVG_NS, 'line');
			lineEl.classList.add('crochet-weaver-grid-guide');
			lineEl.setAttribute('x1', String(line.x1));
			lineEl.setAttribute('y1', String(line.y1));
			lineEl.setAttribute('x2', String(line.x2));
			lineEl.setAttribute('y2', String(line.y2));
			lineEl.setAttribute('stroke', 'currentColor');
			lineEl.setAttribute('stroke-width', String(options.strokeWidth));
			svg.appendChild(lineEl);
		}
		for (const polyline of layout.gridGuide.polylines ?? []) {
			if (polyline.length === 0) continue;
			const pathEl = doc.createElementNS(SVG_NS, 'path');
			pathEl.classList.add('crochet-weaver-grid-guide');
			pathEl.setAttribute('d', polylinePath(polyline));
			pathEl.setAttribute('fill', 'none');
			pathEl.setAttribute('stroke', 'currentColor');
			pathEl.setAttribute('stroke-width', String(options.strokeWidth));
			svg.appendChild(pathEl);
		}
	}

	// Book-style round numbers along the starting seam.
	for (const label of layout.labels ?? []) {
		const textEl = doc.createElementNS(SVG_NS, 'text');
		textEl.classList.add('crochet-weaver-round-number');
		textEl.setAttribute('x', String(label.x));
		textEl.setAttribute('y', String(label.y));
		textEl.setAttribute('text-anchor', 'middle');
		textEl.setAttribute('dominant-baseline', 'central');
		textEl.setAttribute('fill', 'currentColor');
		textEl.textContent = label.text;
		svg.appendChild(textEl);
	}

	// A hollow ring, not a filled dot: a fill would hide the stitch symbol it's
	// flagging, and read as a second "current position" marker next to the
	// progress tool's own highlight. Drawn before the stitches so the symbol's
	// own strokes stay on top wherever the ring crosses them.
	for (const marker of layout.colorMarkers ?? []) {
		const markerEl = doc.createElementNS(SVG_NS, 'circle');
		markerEl.classList.add('crochet-weaver-color-marker');
		markerEl.setAttribute('cx', String(marker.x));
		markerEl.setAttribute('cy', String(marker.y));
		markerEl.setAttribute('r', String(COLOR_MARKER_RADIUS));
		markerEl.setAttribute('fill', 'none');
		markerEl.setAttribute('stroke-width', String(options.strokeWidth * 1.3));
		markerEl.style.setProperty('stroke', marker.color);
		svg.appendChild(markerEl);
	}

	for (const connector of rowConnectors) {
		const direction = Math.sign(connector.toY - connector.fromY) || 1;
		const gap = Math.min(ROW_CONNECTOR_GAP, Math.abs(connector.toY - connector.fromY) / 3);
		const line = doc.createElementNS(SVG_NS, 'line');
		line.classList.add('crochet-weaver-row-connector');
		line.setAttribute('x1', String(connector.x));
		line.setAttribute('y1', String(connector.fromY + direction * gap));
		line.setAttribute('x2', String(connector.x));
		line.setAttribute('y2', String(connector.toY - direction * gap));
		line.setAttribute('stroke', 'currentColor');
		line.setAttribute('stroke-width', String(options.strokeWidth));
		line.setAttribute('marker-end', `url(#${arrowId})`);
		svg.appendChild(line);
	}

	// Increase/decrease symbols. Each is stretched to its own round's band and
	// to the angles of the stitches it stands for, so it can't be stamped from
	// a shared <defs> glyph the way the fixed symbols are.
	for (const mark of layout.shapingMarks ?? []) {
		for (const segment of mark.segments) {
			if (segment.length < 2) continue;
			const path = doc.createElementNS(SVG_NS, 'path');
			path.classList.add('crochet-weaver-shaping');
			path.setAttribute('d', polylinePath(segment));
			path.setAttribute('fill', 'none');
			path.setAttribute('stroke', 'currentColor');
			path.setAttribute('stroke-width', String(options.strokeWidth));
			path.setAttribute('stroke-linejoin', 'round');
			path.setAttribute('stroke-linecap', 'round');
			if (options.highlightIncDec) accent(path, options.highlightColor);
			applyCurrentPositionHighlight(path, mark.rowIndex, mark.unitIndex, highlight, options.chartMarkerColor);
			svg.appendChild(path);
		}
		if (mark.loop) {
			const loopMark = doc.createElementNS(SVG_NS, 'path');
			loopMark.setAttribute('d', mark.loop === 'blo' ? BLO_MARK : FLO_MARK);
			loopMark.setAttribute('transform', `translate(${mark.x} ${mark.y}) rotate(${mark.rotation})`);
			loopMark.setAttribute('stroke', 'currentColor');
			loopMark.setAttribute('stroke-width', String(options.strokeWidth));
			loopMark.setAttribute('fill', 'none');
			loopMark.setAttribute('stroke-linecap', 'round');
			applyCurrentPositionHighlight(loopMark, mark.rowIndex, mark.unitIndex, highlight, options.chartMarkerColor);
			svg.appendChild(loopMark);
		}
	}

	// The stitches of a fan, drawn rather than stamped: each stands on the one
	// place its group is worked into and reaches out to its own head, so no two
	// are the same length or lean the same way (see layout/lace.ts).
	for (const stitch of layout.motifStitches ?? []) {
		for (const segment of stitch.segments) {
			if (segment.length < 2) continue;
			const path = doc.createElementNS(SVG_NS, 'path');
			path.classList.add('crochet-weaver-motif-stitch');
			path.setAttribute('d', polylinePath(segment));
			path.setAttribute('fill', 'none');
			path.setAttribute('stroke', 'currentColor');
			path.setAttribute('stroke-width', String(options.strokeWidth));
			path.setAttribute('stroke-linejoin', 'round');
			path.setAttribute('stroke-linecap', 'round');
			applyCurrentPositionHighlight(path, stitch.rowIndex, stitch.unitIndex, highlight, options.chartMarkerColor);
			svg.appendChild(path);
		}
		if (stitch.loop) {
			const loopMark = doc.createElementNS(SVG_NS, 'path');
			loopMark.setAttribute('d', stitch.loop === 'blo' ? BLO_MARK : FLO_MARK);
			loopMark.setAttribute('transform', `translate(${stitch.x} ${stitch.y}) rotate(${stitch.rotation})`);
			loopMark.setAttribute('stroke', 'currentColor');
			loopMark.setAttribute('stroke-width', String(options.strokeWidth));
			loopMark.setAttribute('fill', 'none');
			loopMark.setAttribute('stroke-linecap', 'round');
			applyCurrentPositionHighlight(loopMark, stitch.rowIndex, stitch.unitIndex, highlight, options.chartMarkerColor);
			svg.appendChild(loopMark);
		}
	}

	const symbolScale = options.symbolScale ?? 1;
	for (const item of layout.items) {
		const own = (item.scale ?? 1) * symbolScale;
		const transform = `translate(${item.x} ${item.y}) rotate(${item.rotation})${own === 1 ? '' : ` scale(${own})`}`;

		if (item.centerLabel !== undefined) {
			const textEl = doc.createElementNS(SVG_NS, 'text');
			textEl.classList.add('crochet-weaver-center-label');
			textEl.setAttribute('x', '0');
			textEl.setAttribute('y', '0');
			textEl.setAttribute('transform', transform);
			textEl.setAttribute('text-anchor', 'middle');
			textEl.setAttribute('dominant-baseline', 'central');
			textEl.setAttribute('fill', 'currentColor');
			textEl.textContent = item.centerLabel;
			svg.appendChild(textEl);
			continue;
		}

		const symbolEl = doc.createElementNS(SVG_NS, 'use');
		symbolEl.setAttribute('href', `#${symbolId(uid, item.symbol)}`);
		symbolEl.setAttribute('transform', transform);
		// A graph-driven increase or decrease renders as the plain stitches it
		// really makes, and the shaping is carried by the connector between them
		// — which is what gets accented. Accenting the stitches too would put
		// half an amigurumi chart in the accent color.
		if (options.highlightIncDec && item.shaping === undefined && ACCENT_STITCHES.has(item.symbol)) {
			accent(symbolEl, options.highlightColor);
		}
		applyCurrentPositionHighlight(symbolEl, item.rowIndex, item.unitIndex, highlight, options.chartMarkerColor);
		svg.appendChild(symbolEl);
		if (item.loop) {
			const mark = doc.createElementNS(SVG_NS, 'path');
			mark.setAttribute('d', item.loop === 'blo' ? BLO_MARK : FLO_MARK);
			mark.setAttribute('transform', `translate(${item.x} ${item.y}) rotate(${item.rotation})`);
			applyCurrentPositionHighlight(mark, item.rowIndex, item.unitIndex, highlight, options.chartMarkerColor);
			mark.setAttribute('stroke', 'currentColor');
			mark.setAttribute('stroke-width', String(options.strokeWidth));
			mark.setAttribute('fill', 'none');
			mark.setAttribute('stroke-linecap', 'round');
			svg.appendChild(mark);
		}
	}

	wrapScrollable(el, svg);
}

function symbolId(uid: string, name: string): string {
	return `${uid}-sym-${name.replace(/\s+/g, '-')}`;
}

// Groups everything one pattern step drew — its stitch symbols, its blo/flo
// loop markers, and the connector of an increase or decrease — under one
// highlight, so the whole step lights up as "the current position."
function applyCurrentPositionHighlight(
	node: SVGElement,
	rowIndex: number | undefined,
	unitIndex: number | undefined,
	highlight: ChartHighlight | undefined,
	chartMarkerColor: string,
): void {
	if (!highlight || rowIndex !== highlight.rowIndex) return;
	const isTarget = highlight.unitIndex !== undefined && unitIndex === highlight.unitIndex;
	node.classList.add(isTarget ? 'crochet-weaver-stitch-highlight' : 'crochet-weaver-row-highlight');
	node.style.setProperty('color', chartMarkerColor);
}

// Increases and decreases in the configured highlight color. The class stays
// on for anything styling them, with the color set inline so a chart follows
// the setting rather than the theme's accent.
function accent(node: SVGElement, color: string): void {
	node.classList.add('crochet-weaver-accent');
	node.style.setProperty('color', color);
}

function polylinePath(points: readonly GridPoint[]): string {
	return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${round2(point.x)} ${round2(point.y)}`).join(' ');
}

function createArrowMarker(doc: Document, id: string): SVGMarkerElement {
	const marker = doc.createElementNS(SVG_NS, 'marker');
	marker.setAttribute('id', id);
	marker.setAttribute('viewBox', '0 0 10 10');
	marker.setAttribute('refX', '7');
	marker.setAttribute('refY', '5');
	marker.setAttribute('markerWidth', '4.5');
	marker.setAttribute('markerHeight', '4.5');
	marker.setAttribute('orient', 'auto-start-reverse');
	const arrowhead = doc.createElementNS(SVG_NS, 'path');
	arrowhead.setAttribute('d', 'M 2 1 L 7 5 L 2 9');
	arrowhead.setAttribute('fill', 'none');
	arrowhead.setAttribute('stroke', 'currentColor');
	arrowhead.setAttribute('stroke-width', '1.5');
	arrowhead.setAttribute('stroke-linecap', 'round');
	arrowhead.setAttribute('stroke-linejoin', 'round');
	marker.appendChild(arrowhead);
	return marker;
}

function createSymbolDef(
	context: SymbolDefContext,
	name: string,
	spec: SymbolSpec,
): SVGGElement {
	const g = context.doc.createElementNS(SVG_NS, 'g');
	g.setAttribute('id', symbolId(context.uid, name));
	g.setAttribute('stroke', 'currentColor');
	g.setAttribute('stroke-width', String(context.strokeWidth));
	g.setAttribute('fill', 'none');

	if (spec.ellipse) {
		const ellipse = context.doc.createElementNS(SVG_NS, 'ellipse');
		ellipse.setAttribute('cx', '0');
		ellipse.setAttribute('cy', '0');
		ellipse.setAttribute('rx', String(spec.ellipse.rx));
		ellipse.setAttribute('ry', String(spec.ellipse.ry));
		g.appendChild(ellipse);
	}
	if (spec.circle) {
		const circle = context.doc.createElementNS(SVG_NS, 'circle');
		circle.setAttribute('cx', '0');
		circle.setAttribute('cy', '0');
		circle.setAttribute('r', String(spec.circle.r));
		if (spec.circle.filled) {
			circle.setAttribute('fill', 'currentColor');
			circle.setAttribute('stroke', 'none');
		}
		g.appendChild(circle);
	}
	for (const d of spec.paths ?? []) {
		const path = context.doc.createElementNS(SVG_NS, 'path');
		path.setAttribute('d', d);
		g.appendChild(path);
	}
	return g;
}
