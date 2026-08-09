import type { RenderItem } from '../types';
import { symbolExtent, SYMBOL_CLEARANCE } from './constants';

type PositionedSymbol = Pick<RenderItem, 'symbol' | 'x' | 'y' | 'scale'>;

// Largest uniform scale at which every pair keeps proportional breathing room.
// Graph placement uses this as a collision signal: any value below one means
// the configured symbol size needs angular clearance. It never becomes a
// per-round render scale, because the user's symbol-size setting is global.
export function tangentialSymbolScale(items: readonly PositionedSymbol[]): number {
	let scale = 1;
	for (let firstIndex = 0; firstIndex < items.length; firstIndex++) {
		for (let secondIndex = firstIndex + 1; secondIndex < items.length; secondIndex++) {
			const first = items[firstIndex];
			const second = items[secondIndex];
			if (!first || !second) continue;
			const distance = Math.hypot(first.x - second.x, first.y - second.y);
			const needed =
				symbolExtent(first.symbol) * (first.scale ?? 1) +
				symbolExtent(second.symbol) * (second.scale ?? 1) +
				SYMBOL_CLEARANCE;
			if (needed <= 0) continue;
			scale = Math.min(scale, distance / needed);
		}
	}
	return Math.max(0, scale);
}
