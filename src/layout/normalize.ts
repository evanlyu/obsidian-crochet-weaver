import type {
	ChartGridGuide,
	ChartLabel,
	ColorMarker,
	LayoutResult,
	RenderItem,
	RowConnector,
	ShapingMark,
} from '../types';
import { COLOR_MARKER_RADIUS, LABEL_EXTENT, PADDING, symbolExtent } from './constants';

export function normalize(
	items: RenderItem[],
	rowConnectors?: RowConnector[],
	gridGuide?: ChartGridGuide,
	colorMarkers?: ColorMarker[],
	labels?: ChartLabel[],
	shapingMarks?: ShapingMark[],
): LayoutResult {
	if (items.length === 0) {
		return {
			items,
			width: PADDING * 2,
			height: PADDING * 2,
			rowConnectors,
			gridGuide,
			colorMarkers: emptyToUndefined(colorMarkers),
			labels: emptyToUndefined(labels),
			shapingMarks: emptyToUndefined(shapingMarks),
		};
	}
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	for (const item of items) {
		const extent = symbolExtent(item.symbol);
		minX = Math.min(minX, item.x - extent);
		maxX = Math.max(maxX, item.x + extent);
		minY = Math.min(minY, item.y - extent);
		maxY = Math.max(maxY, item.y + extent);
	}
	for (const circle of gridGuide?.circles ?? []) {
		minX = Math.min(minX, circle.cx - circle.r);
		maxX = Math.max(maxX, circle.cx + circle.r);
		minY = Math.min(minY, circle.cy - circle.r);
		maxY = Math.max(maxY, circle.cy + circle.r);
	}
	for (const line of gridGuide?.lines ?? []) {
		minX = Math.min(minX, line.x1, line.x2);
		maxX = Math.max(maxX, line.x1, line.x2);
		minY = Math.min(minY, line.y1, line.y2);
		maxY = Math.max(maxY, line.y1, line.y2);
	}
	for (const polyline of gridGuide?.polylines ?? []) {
		for (const point of polyline) {
			minX = Math.min(minX, point.x);
			maxX = Math.max(maxX, point.x);
			minY = Math.min(minY, point.y);
			maxY = Math.max(maxY, point.y);
		}
	}
	for (const marker of colorMarkers ?? []) {
		minX = Math.min(minX, marker.x - COLOR_MARKER_RADIUS);
		maxX = Math.max(maxX, marker.x + COLOR_MARKER_RADIUS);
		minY = Math.min(minY, marker.y - COLOR_MARKER_RADIUS);
		maxY = Math.max(maxY, marker.y + COLOR_MARKER_RADIUS);
	}
	for (const label of labels ?? []) {
		minX = Math.min(minX, label.x - LABEL_EXTENT);
		maxX = Math.max(maxX, label.x + LABEL_EXTENT);
		minY = Math.min(minY, label.y - LABEL_EXTENT);
		maxY = Math.max(maxY, label.y + LABEL_EXTENT);
	}
	for (const mark of shapingMarks ?? []) {
		for (const segment of mark.segments) {
			for (const point of segment) {
				minX = Math.min(minX, point.x);
				maxX = Math.max(maxX, point.x);
				minY = Math.min(minY, point.y);
				maxY = Math.max(maxY, point.y);
			}
		}
	}
	const dx = PADDING - minX;
	const dy = PADDING - minY;
	for (const item of items) {
		item.x += dx;
		item.y += dy;
	}
	for (const connector of rowConnectors ?? []) {
		connector.x += dx;
		connector.fromY += dy;
		connector.toY += dy;
	}
	const shiftedGuide: ChartGridGuide | undefined = gridGuide && {
		circles: gridGuide.circles.map((circle) => ({ cx: circle.cx + dx, cy: circle.cy + dy, r: circle.r })),
		lines: gridGuide.lines.map((line) => ({
			x1: line.x1 + dx,
			y1: line.y1 + dy,
			x2: line.x2 + dx,
			y2: line.y2 + dy,
		})),
		polylines: gridGuide.polylines?.map((polyline) => polyline.map((point) => ({ x: point.x + dx, y: point.y + dy }))),
	};
	const shiftedMarkers = colorMarkers?.map((marker) => ({ ...marker, x: marker.x + dx, y: marker.y + dy }));
	const shiftedLabels = labels?.map((label) => ({ ...label, x: label.x + dx, y: label.y + dy }));
	const shiftedShaping = shapingMarks?.map((mark) => ({
		...mark,
		x: mark.x + dx,
		y: mark.y + dy,
		segments: mark.segments.map((segment) => segment.map((point) => ({ x: point.x + dx, y: point.y + dy }))),
	}));
	return {
		items,
		width: maxX - minX + PADDING * 2,
		height: maxY - minY + PADDING * 2,
		rowConnectors,
		gridGuide: shiftedGuide,
		colorMarkers: emptyToUndefined(shiftedMarkers),
		labels: emptyToUndefined(shiftedLabels),
		shapingMarks: emptyToUndefined(shiftedShaping),
	};
}

function emptyToUndefined<T>(values: T[] | undefined): T[] | undefined {
	return values && values.length > 0 ? values : undefined;
}
