import { t, type Locale } from './i18n';
import type { ChartHighlight, LayoutResult, RenderOptions } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Standard crochet symbols centered at (0, 0), based on common JIS/CYC notation.
// Symbols use currentColor so they follow Obsidian light and dark themes.
interface SymbolSpec {
	paths?: string[];
	ellipse?: { rx: number; ry: number };
	circle?: { r: number; filled?: boolean };
}

interface SymbolDefContext {
	readonly doc: Document;
	readonly uid: string;
	readonly strokeWidth: number;
}

const SYMBOLS: Record<string, SymbolSpec> = {
	// Chain: hollow ellipse.
	ch: { ellipse: { rx: 6, ry: 3 } },
	// Single crochet: X.
	sc: { paths: ['M -4 -4 L 4 4 M 4 -4 L -4 4'] },
	// Half double crochet: T shape.
	hdc: { paths: ['M -5 -7 L 5 -7 M 0 -7 L 0 7'] },
	// Double crochet: T shape with one yarn-over slash.
	dc: { paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 8 M -3 0 L 3 -4'] },
	// Treble crochet: T shape with two yarn-over slashes.
	tr: { paths: ['M -5 -10 L 5 -10 M 0 -10 L 0 10 M -3 -1 L 3 -5 M -3 5 L 3 1'] },
	// Double treble crochet: T shape with three yarn-over slashes.
	dtr: {
		paths: [
			'M -5 -12 L 5 -12 M 0 -12 L 0 12 M -3 -3 L 3 -7 M -3 3 L 3 -1 M -3 9 L 3 5',
		],
	},
	// Slip stitch: filled dot.
	'sl st': { circle: { r: 2.5, filled: true } },
	// Increase: V shape, sized to match sc's footprint so it doesn't read as a tall stitch.
	inc: { paths: ['M -4 -4 L 0 4 L 4 -4'] },
	// Decrease: inverted V shape, same footprint as inc.
	dec: { paths: ['M -4 4 L 0 -4 L 4 4'] },
	// Magic ring: hollow circle.
	MR: { circle: { r: 6 } },
	// Bobble: bundled puff shape.
	bobble: {
		paths: ['M 0 8 L -4 -3 M 0 8 L 0 -6 M 0 8 L 4 -3 M -4 -3 Q 0 -9 4 -3'],
	},
	// Popcorn: cupped puff with top knot.
	popcorn: { paths: ['M -5 7 C -7 -7 7 -7 5 7 M 0 -7 L 0 -10'] },
	// Front post double crochet: double crochet with front post hook.
	fpdc: {
		paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 6 M -3 -1 L 3 -5 M 0 6 Q 7 7 7 1'],
	},
	// Back post double crochet: double crochet with back post hook.
	bpdc: {
		paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 6 M -3 -1 L 3 -5 M 0 6 Q -7 7 -7 1'],
	},
};

const ACCENT_STITCHES = new Set(['inc', 'dec']);

const BLO_MARK = 'M -4 9 Q 0 13 4 9';
const FLO_MARK = 'M -4 9 Q 0 5 4 9';
const ROW_CONNECTOR_GAP = 10;

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

	for (const item of layout.items) {
		const transform = `translate(${item.x} ${item.y}) rotate(${item.rotation})`;

		const use = doc.createElementNS(SVG_NS, 'use');
		use.setAttribute('href', `#${symbolId(uid, item.symbol)}`);
		use.setAttribute('transform', transform);
		if (options.highlightIncDec && ACCENT_STITCHES.has(item.symbol)) {
			use.classList.add('crochet-weaver-accent');
		}
		if (highlight && item.rowIndex === highlight.rowIndex) {
			const isTarget = highlight.unitIndex !== undefined && item.unitIndex === highlight.unitIndex;
			use.classList.add(
				isTarget ? 'crochet-weaver-stitch-highlight' : 'crochet-weaver-row-highlight',
			);
			use.style.setProperty('color', options.chartMarkerColor);
		}
		svg.appendChild(use);
		if (item.loop) {
			const mark = doc.createElementNS(SVG_NS, 'path');
			mark.setAttribute('d', item.loop === 'blo' ? BLO_MARK : FLO_MARK);
			mark.setAttribute('transform', transform);
			mark.setAttribute('stroke', 'currentColor');
			mark.setAttribute('stroke-width', String(options.strokeWidth));
			mark.setAttribute('fill', 'none');
			mark.setAttribute('stroke-linecap', 'round');
			svg.appendChild(mark);
		}
	}

	if (layout.nextRoundMarker) {
		const marker = doc.createElementNS(SVG_NS, 'path');
		marker.classList.add('crochet-weaver-next-round-marker');
		marker.setAttribute('d', 'M -3 -12 L 0 -9 L 3 -12 M 0 -9 L 0 -16');
		marker.setAttribute(
			'transform',
			`translate(${layout.nextRoundMarker.x} ${layout.nextRoundMarker.y}) rotate(${layout.nextRoundMarker.rotation})`
		);
		marker.setAttribute('stroke', options.nextRoundMarkerColor);
		marker.setAttribute('stroke-width', String(options.strokeWidth));
		marker.setAttribute('fill', 'none');
		marker.setAttribute('stroke-linecap', 'round');
		marker.setAttribute('stroke-linejoin', 'round');
		svg.appendChild(marker);
	}

	el.appendChild(svg);
}

function symbolId(uid: string, name: string): string {
	return `${uid}-sym-${name.replace(/\s+/g, '-')}`;
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
