import { t, type Locale } from './i18n';
import { COLOR_MARKER_RADIUS } from './layout/constants';
import { wrapScrollable } from './scroll-pan';
import type { ChartHighlight, LayoutResult, RenderItem, RenderOptions } from './types';

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
	// Picot (ch-3): a small chain loop pinched onto a stem.
	picot: { paths: ['M 0 8 L 0 2', 'M 0 2 C -6 2 -6 -8 0 -8 C 6 -8 6 2 0 2'] },
	// Reverse single crochet (crab stitch): X with a wave above.
	rsc: { paths: ['M -4 -3 L 4 5 M 4 -3 L -4 5', 'M -4 -8 Q 0 -12 4 -8'] },
	// Post single crochet: sc's X on a short stem ending in the post hook.
	fpsc: { paths: ['M -4 -8 L 4 0 M 4 -8 L -4 0', 'M 0 0 L 0 4 M 0 4 Q 7 5 7 -1'] },
	bpsc: { paths: ['M -4 -8 L 4 0 M 4 -8 L -4 0', 'M 0 0 L 0 4 M 0 4 Q -7 5 -7 -1'] },
	// Post half double crochet: hdc's T with the post hook at the base.
	fphdc: { paths: ['M -5 -9 L 5 -9 M 0 -9 L 0 5 M 0 5 Q 7 6 7 0'] },
	bphdc: { paths: ['M -5 -9 L 5 -9 M 0 -9 L 0 5 M 0 5 Q -7 6 -7 0'] },
	// Post treble crochet: tr's two yarn-over slashes plus the post hook.
	fptr: { paths: ['M -5 -11 L 5 -11 M 0 -11 L 0 7 M -3 -4 L 3 -8 M -3 2 L 3 -2 M 0 7 Q 7 8 7 2'] },
	bptr: { paths: ['M -5 -11 L 5 -11 M 0 -11 L 0 7 M -3 -4 L 3 -8 M -3 2 L 3 -2 M 0 7 Q -7 8 -7 2'] },
	// Crossed stitches: two legs crossing, with yarn-over ticks per height.
	xhdc: { paths: ['M -6 -8 L -2 -8 M 2 -8 L 6 -8', 'M -4 -8 L 4 8 M 4 -8 L -4 8'] },
	xdc: {
		paths: ['M -6 -8 L -2 -8 M 2 -8 L 6 -8', 'M -4 -8 L 4 8 M 4 -8 L -4 8', 'M -4 -3 L -1 -5 M 1 -5 L 4 -3'],
	},
	xtr: {
		paths: [
			'M -6 -10 L -2 -10 M 2 -10 L 6 -10',
			'M -4 -10 L 4 10 M 4 -10 L -4 10',
			'M -4 -6 L -1 -8 M 1 -8 L 4 -6',
			'M -3 -1 L 0 -3 M 0 -3 L 3 -1',
		],
	},
	// N-together decreases: legs converging to a joined top (apex X at sc
	// height, top bar at hdc/dc heights, yarn-over ticks at dc height).
	sc2tog: { paths: ['M -4 8 L 0 -2 M 4 8 L 0 -2', 'M -3 -3 L 3 -9 M 3 -3 L -3 -9'] },
	sc3tog: { paths: ['M -4 8 L 0 -2 M 0 8 L 0 -2 M 4 8 L 0 -2', 'M -3 -3 L 3 -9 M 3 -3 L -3 -9'] },
	hdc2tog: { paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 4 9'] },
	hdc3tog: { paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 0 9 M 0 -9 L 4 9'] },
	hdc4tog: { paths: ['M -6 -9 L 6 -9', 'M 0 -9 L -6 9 M 0 -9 L -2 9 M 0 -9 L 2 9 M 0 -9 L 6 9'] },
	hdc5tog: { paths: ['M -6 -9 L 6 -9', 'M 0 -9 L -6 9 M 0 -9 L -3 9 M 0 -9 L 0 9 M 0 -9 L 3 9 M 0 -9 L 6 9'] },
	dc2tog: { paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 4 9', 'M -4 1 L -1 -1 M 1 -1 L 4 1'] },
	dc3tog: {
		paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 0 9 M 0 -9 L 4 9', 'M -4 1 L -1 -1 M -1 1 L 1 -1 M 1 -1 L 4 1'],
	},
	dc4tog: {
		paths: [
			'M -6 -9 L 6 -9',
			'M 0 -9 L -6 9 M 0 -9 L -2 9 M 0 -9 L 2 9 M 0 -9 L 6 9',
			'M -5 1 L -2 -1 M -2 1 L 0 -1 M 0 -1 L 2 1 M 2 -1 L 5 1',
		],
	},
	dc5tog: {
		paths: [
			'M -6 -9 L 6 -9',
			'M 0 -9 L -6 9 M 0 -9 L -3 9 M 0 -9 L 0 9 M 0 -9 L 3 9 M 0 -9 L 6 9',
			'M -5 1 L -2 -1 M -3 1 L 0 -1 M 0 1 L 3 -1 M 2 -1 L 5 1',
		],
	},
	// Clusters/puffs: an oval bundle with interior legs by stitch count and
	// yarn-over bars by height (none for hdc, one for dc, two for tr).
	hdc2cl: { ellipse: { rx: 4, ry: 9 } },
	hdc3cl: { ellipse: { rx: 5, ry: 9 }, paths: ['M 0 -7 L 0 7'] },
	hdc5cl: { ellipse: { rx: 6, ry: 9 }, paths: ['M 0 -8 L 0 8 M -3 -6 L -3 6 M 3 -6 L 3 6'] },
	dc2cl: { ellipse: { rx: 4, ry: 9 }, paths: ['M -3 0 L 3 0'] },
	dc3cl: { ellipse: { rx: 5, ry: 9 }, paths: ['M 0 -7 L 0 7', 'M -4 0 L 4 0'] },
	dc5cl: { ellipse: { rx: 6, ry: 9 }, paths: ['M 0 -8 L 0 8 M -3 -6 L -3 6 M 3 -6 L 3 6', 'M -5 0 L 5 0'] },
	tr2cl: { ellipse: { rx: 4, ry: 10 }, paths: ['M -3 -3 L 3 -3 M -3 3 L 3 3'] },
	tr3cl: { ellipse: { rx: 5, ry: 10 }, paths: ['M 0 -8 L 0 8', 'M -4 -3 L 4 -3 M -4 3 L 4 3'] },
	tr5cl: {
		ellipse: { rx: 6, ry: 10 },
		paths: ['M 0 -9 L 0 9 M -3 -7 L -3 7 M 3 -7 L 3 7', 'M -5 -3 L 5 -3 M -5 3 L 5 3'],
	},
	// Popcorn family at other heights (plain `popcorn` stays the dc popcorn).
	'hdc popcorn': { paths: ['M -5 6 C -7 -6 7 -6 5 6 M 0 -6 L 0 -9'] },
	'tr popcorn': { paths: ['M -5 9 C -8 -9 8 -9 5 9 M 0 -9 L 0 -12 M -3 1 L 3 -3'] },
};

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

// Every stitch name that has a chart glyph. Tests sweep this list through the
// parser and renderer to keep the grammar and the symbol library in sync.
export function supportedSymbolNames(): readonly string[] {
	return Object.keys(SYMBOLS);
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

	for (const item of layout.items) {
		const transform = `translate(${item.x} ${item.y}) rotate(${item.rotation})`;

		const use = doc.createElementNS(SVG_NS, 'use');
		use.setAttribute('href', `#${symbolId(uid, item.symbol)}`);
		use.setAttribute('transform', transform);
		if (options.highlightIncDec && ACCENT_STITCHES.has(item.symbol)) {
			use.classList.add('crochet-weaver-accent');
		}
		applyCurrentPositionHighlight(use, item, highlight, options.chartMarkerColor);
		svg.appendChild(use);
		if (item.loop) {
			const mark = doc.createElementNS(SVG_NS, 'path');
			mark.setAttribute('d', item.loop === 'blo' ? BLO_MARK : FLO_MARK);
			mark.setAttribute('transform', transform);
			applyCurrentPositionHighlight(mark, item, highlight, options.chartMarkerColor);
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

// Groups a stitch symbol with its own blo/flo loop marker under one highlight:
// both should light up together as "the current position," not just the symbol.
function applyCurrentPositionHighlight(
	node: SVGElement,
	item: RenderItem,
	highlight: ChartHighlight | undefined,
	chartMarkerColor: string,
): void {
	if (!highlight || item.rowIndex !== highlight.rowIndex) return;
	const isTarget = highlight.unitIndex !== undefined && item.unitIndex === highlight.unitIndex;
	node.classList.add(isTarget ? 'crochet-weaver-stitch-highlight' : 'crochet-weaver-row-highlight');
	node.style.setProperty('color', chartMarkerColor);
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
