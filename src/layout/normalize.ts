import type { LayoutResult, NextRoundMarker, RenderItem, RowConnector } from '../types';
import { PADDING, symbolExtent } from './constants';

const NEXT_ROUND_MARKER_EXTENT = 18;

export function normalize(
	items: RenderItem[],
	nextRoundMarker?: NextRoundMarker,
	rowConnectors?: RowConnector[],
): LayoutResult {
	if (items.length === 0) {
		return { items, width: PADDING * 2, height: PADDING * 2, nextRoundMarker, rowConnectors };
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
	if (nextRoundMarker) {
		const extent = NEXT_ROUND_MARKER_EXTENT;
		minX = Math.min(minX, nextRoundMarker.x - extent);
		maxX = Math.max(maxX, nextRoundMarker.x + extent);
		minY = Math.min(minY, nextRoundMarker.y - extent);
		maxY = Math.max(maxY, nextRoundMarker.y + extent);
	}
	const dx = PADDING - minX;
	const dy = PADDING - minY;
	for (const item of items) {
		item.x += dx;
		item.y += dy;
	}
	if (nextRoundMarker) {
		nextRoundMarker.x += dx;
		nextRoundMarker.y += dy;
	}
	for (const connector of rowConnectors ?? []) {
		connector.x += dx;
		connector.fromY += dy;
		connector.toY += dy;
	}
	return {
		items,
		width: maxX - minX + PADDING * 2,
		height: maxY - minY + PADDING * 2,
		nextRoundMarker,
		rowConnectors,
	};
}
