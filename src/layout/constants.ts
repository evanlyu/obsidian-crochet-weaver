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

const FIXED_ORIENTATION = new Set(['sc', 'ch', 'sl st', 'MR', 'rsc']);

const SYMBOL_EXTENT: Record<string, number> = {
	'sl st': 3,
	sc: 6,
	ch: 6,
	MR: 6,
	inc: 6,
	dec: 6,
	rsc: 8,
	picot: 8,
	fpsc: 8,
	bpsc: 8,
	hdc: 9,
	bobble: 9,
	xhdc: 9,
	sc2tog: 9,
	sc3tog: 9,
	hdc2cl: 9,
	hdc3cl: 9,
	hdc5cl: 9,
	dc2cl: 9,
	dc3cl: 9,
	dc5cl: 9,
	'hdc popcorn': 9,
	dc: 10,
	popcorn: 10,
	fpdc: 10,
	bpdc: 10,
	fphdc: 10,
	bphdc: 10,
	xdc: 10,
	hdc2tog: 10,
	hdc3tog: 10,
	hdc4tog: 10,
	hdc5tog: 10,
	dc2tog: 10,
	dc3tog: 10,
	dc4tog: 10,
	dc5tog: 10,
	tr2cl: 10,
	tr3cl: 10,
	tr5cl: 10,
	tr: 11,
	xtr: 11,
	fptr: 12,
	bptr: 12,
	'tr popcorn': 12,
	dtr: 13,
};

export function hasFixedOrientation(symbol: string): boolean {
	return FIXED_ORIENTATION.has(symbol);
}

export function symbolExtent(symbol: string): number {
	return SYMBOL_EXTENT[symbol] ?? 8;
}
