export const STITCH_WIDTH = 20;
export const ROW_HEIGHT = 30;
export const PADDING = 14;
export const GROUP_FAN_ANGLE = 18;
export const GROUP_FAN_SPREAD = 7;

export const BASE_RADIUS = 22;
export const MIN_ARC = STITCH_WIDTH;
export const GROUP_FAN_ARC_DEG = 8;
export const CH_RING_RADIUS = 12;
export const CH_RING_COUNT = 6;

const FIXED_ORIENTATION = new Set(['sc', 'ch', 'sl st', 'MR']);

const SYMBOL_EXTENT: Record<string, number> = {
	'sl st': 3,
	sc: 6,
	ch: 6,
	MR: 6,
	inc: 6,
	dec: 6,
	hdc: 9,
	bobble: 9,
	dc: 10,
	popcorn: 10,
	fpdc: 10,
	bpdc: 10,
	tr: 11,
	dtr: 13,
};

export function hasFixedOrientation(symbol: string): boolean {
	return FIXED_ORIENTATION.has(symbol);
}

export function symbolExtent(symbol: string): number {
	return SYMBOL_EXTENT[symbol] ?? 8;
}
