import type { ChartGridGuide, LayoutResult, RenderItem, RowConnector } from '../types';
import { PADDING, symbolExtent } from './constants';

export function normalize(
	items: RenderItem[],
	rowConnectors?: RowConnector[],
	gridGuide?: ChartGridGuide,
): LayoutResult {
	if (items.length === 0) {
		return { items, width: PADDING * 2, height: PADDING * 2, rowConnectors, gridGuide };
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
	};
	return {
		items,
		width: maxX - minX + PADDING * 2,
		height: maxY - minY + PADDING * 2,
		rowConnectors,
		gridGuide: shiftedGuide,
	};
}
