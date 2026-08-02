// The stitch symbols: what each one is drawn as, and how much room it takes.
//
// Both in one place because they are two halves of one fact. The layout has to
// know how wide a symbol is to keep two of them apart, to size a ring long
// enough to hold a round of them, and to leave the seam room beside the stitches
// either side of it; the renderer has to know the shape to stamp. Kept in
// separate files, adding a stitch meant editing both and nothing caught a miss.
//
// Symbols are centered at (0, 0) and based on common JIS/CYC notation, and use
// currentColor so a chart follows Obsidian's light and dark themes.

export interface SymbolSpec {
	// How far the symbol reaches from its center, in px: the layout's idea of how
	// much of a round or a row it occupies.
	extent: number;
	paths?: string[];
	ellipse?: { rx: number; ry: number };
	circle?: { r: number; filled?: boolean };
}

export const SYMBOLS: Record<string, SymbolSpec> = {
	// Chain: hollow ellipse.
	ch: { extent: 6, ellipse: { rx: 6, ry: 3 } },
	// Single crochet: X.
	sc: { extent: 6, paths: ['M -4 -4 L 4 4 M 4 -4 L -4 4'] },
	// Half double crochet: T shape.
	hdc: { extent: 9, paths: ['M -5 -7 L 5 -7 M 0 -7 L 0 7'] },
	// Double crochet: T shape with one yarn-over slash.
	dc: { extent: 10, paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 8 M -3 0 L 3 -4'] },
	// Treble crochet: T shape with two yarn-over slashes.
	tr: { extent: 11, paths: ['M -5 -10 L 5 -10 M 0 -10 L 0 10 M -3 -1 L 3 -5 M -3 5 L 3 1'] },
	// Double treble crochet: T shape with three yarn-over slashes.
	dtr: {
		extent: 13,
		paths: [
			'M -5 -12 L 5 -12 M 0 -12 L 0 12 M -3 -3 L 3 -7 M -3 3 L 3 -1 M -3 9 L 3 5',
		],
	},
	// Slip stitch: filled dot.
	'sl st': { extent: 3, circle: { r: 2.5, filled: true } },
	// Increase: V shape, sized to match sc's footprint so it doesn't read as a tall stitch.
	inc: { extent: 6, paths: ['M -4 -4 L 0 4 L 4 -4'] },
	// Decrease: inverted V shape, same footprint as inc.
	dec: { extent: 6, paths: ['M -4 4 L 0 -4 L 4 4'] },
	// Magic ring: hollow circle.
	MR: { extent: 6, circle: { r: 6 } },
	// Bobble: bundled puff shape.
	bobble: {
		extent: 9,
		paths: ['M 0 8 L -4 -3 M 0 8 L 0 -6 M 0 8 L 4 -3 M -4 -3 Q 0 -9 4 -3'],
	},
	// Popcorn: cupped puff with top knot.
	popcorn: { extent: 10, paths: ['M -5 7 C -7 -7 7 -7 5 7 M 0 -7 L 0 -10'] },
	// Front post double crochet: double crochet with front post hook.
	fpdc: {
		extent: 10,
		paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 6 M -3 -1 L 3 -5 M 0 6 Q 7 7 7 1'],
	},
	// Back post double crochet: double crochet with back post hook.
	bpdc: {
		extent: 10,
		paths: ['M -5 -8 L 5 -8 M 0 -8 L 0 6 M -3 -1 L 3 -5 M 0 6 Q -7 7 -7 1'],
	},
	// Picot (ch-3): a small chain loop pinched onto a stem.
	picot: { extent: 8, paths: ['M 0 8 L 0 2', 'M 0 2 C -6 2 -6 -8 0 -8 C 6 -8 6 2 0 2'] },
	// Reverse single crochet (crab stitch): X with a wave above.
	rsc: { extent: 10, paths: ['M -4 -3 L 4 5 M 4 -3 L -4 5', 'M -4 -8 Q 0 -12 4 -8'] },
	// Post single crochet: sc's X on a short stem ending in the post hook.
	fpsc: { extent: 8, paths: ['M -4 -8 L 4 0 M 4 -8 L -4 0', 'M 0 0 L 0 4 M 0 4 Q 7 5 7 -1'] },
	bpsc: { extent: 8, paths: ['M -4 -8 L 4 0 M 4 -8 L -4 0', 'M 0 0 L 0 4 M 0 4 Q -7 5 -7 -1'] },
	// Post half double crochet: hdc's T with the post hook at the base.
	fphdc: { extent: 10, paths: ['M -5 -9 L 5 -9 M 0 -9 L 0 5 M 0 5 Q 7 6 7 0'] },
	bphdc: { extent: 10, paths: ['M -5 -9 L 5 -9 M 0 -9 L 0 5 M 0 5 Q -7 6 -7 0'] },
	// Post treble crochet: tr's two yarn-over slashes plus the post hook.
	fptr: { extent: 12, paths: ['M -5 -11 L 5 -11 M 0 -11 L 0 7 M -3 -4 L 3 -8 M -3 2 L 3 -2 M 0 7 Q 7 8 7 2'] },
	bptr: { extent: 12, paths: ['M -5 -11 L 5 -11 M 0 -11 L 0 7 M -3 -4 L 3 -8 M -3 2 L 3 -2 M 0 7 Q -7 8 -7 2'] },
	// Crossed stitches: two legs crossing, with yarn-over ticks per height.
	xhdc: { extent: 9, paths: ['M -6 -8 L -2 -8 M 2 -8 L 6 -8', 'M -4 -8 L 4 8 M 4 -8 L -4 8'] },
	xdc: {
		extent: 10,
		paths: ['M -6 -8 L -2 -8 M 2 -8 L 6 -8', 'M -4 -8 L 4 8 M 4 -8 L -4 8', 'M -4 -3 L -1 -5 M 1 -5 L 4 -3'],
	},
	xtr: {
		extent: 11,
		paths: [
			'M -6 -10 L -2 -10 M 2 -10 L 6 -10',
			'M -4 -10 L 4 10 M 4 -10 L -4 10',
			'M -4 -6 L -1 -8 M 1 -8 L 4 -6',
			'M -3 -1 L 0 -3 M 0 -3 L 3 -1',
		],
	},
	// N-together decreases: legs converging to a joined top (apex X at sc
	// height, top bar at hdc/dc heights, yarn-over ticks at dc height).
	sc2tog: { extent: 9, paths: ['M -4 8 L 0 -2 M 4 8 L 0 -2', 'M -3 -3 L 3 -9 M 3 -3 L -3 -9'] },
	sc3tog: { extent: 9, paths: ['M -4 8 L 0 -2 M 0 8 L 0 -2 M 4 8 L 0 -2', 'M -3 -3 L 3 -9 M 3 -3 L -3 -9'] },
	hdc2tog: { extent: 10, paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 4 9'] },
	hdc3tog: { extent: 10, paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 0 9 M 0 -9 L 4 9'] },
	hdc4tog: { extent: 10, paths: ['M -6 -9 L 6 -9', 'M 0 -9 L -6 9 M 0 -9 L -2 9 M 0 -9 L 2 9 M 0 -9 L 6 9'] },
	hdc5tog: { extent: 10, paths: ['M -6 -9 L 6 -9', 'M 0 -9 L -6 9 M 0 -9 L -3 9 M 0 -9 L 0 9 M 0 -9 L 3 9 M 0 -9 L 6 9'] },
	dc2tog: { extent: 10, paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 4 9', 'M -4 1 L -1 -1 M 1 -1 L 4 1'] },
	dc3tog: {
		extent: 10,
		paths: ['M -5 -9 L 5 -9', 'M 0 -9 L -4 9 M 0 -9 L 0 9 M 0 -9 L 4 9', 'M -4 1 L -1 -1 M -1 1 L 1 -1 M 1 -1 L 4 1'],
	},
	dc4tog: {
		extent: 10,
		paths: [
			'M -6 -9 L 6 -9',
			'M 0 -9 L -6 9 M 0 -9 L -2 9 M 0 -9 L 2 9 M 0 -9 L 6 9',
			'M -5 1 L -2 -1 M -2 1 L 0 -1 M 0 -1 L 2 1 M 2 -1 L 5 1',
		],
	},
	dc5tog: {
		extent: 10,
		paths: [
			'M -6 -9 L 6 -9',
			'M 0 -9 L -6 9 M 0 -9 L -3 9 M 0 -9 L 0 9 M 0 -9 L 3 9 M 0 -9 L 6 9',
			'M -5 1 L -2 -1 M -3 1 L 0 -1 M 0 1 L 3 -1 M 2 -1 L 5 1',
		],
	},
	// Clusters/puffs: an oval bundle with interior legs by stitch count and
	// yarn-over bars by height (none for hdc, one for dc, two for tr).
	hdc2cl: { extent: 9, ellipse: { rx: 4, ry: 9 } },
	hdc3cl: { extent: 9, ellipse: { rx: 5, ry: 9 }, paths: ['M 0 -7 L 0 7'] },
	hdc5cl: { extent: 9, ellipse: { rx: 6, ry: 9 }, paths: ['M 0 -8 L 0 8 M -3 -6 L -3 6 M 3 -6 L 3 6'] },
	dc2cl: { extent: 9, ellipse: { rx: 4, ry: 9 }, paths: ['M -3 0 L 3 0'] },
	dc3cl: { extent: 9, ellipse: { rx: 5, ry: 9 }, paths: ['M 0 -7 L 0 7', 'M -4 0 L 4 0'] },
	dc5cl: { extent: 9, ellipse: { rx: 6, ry: 9 }, paths: ['M 0 -8 L 0 8 M -3 -6 L -3 6 M 3 -6 L 3 6', 'M -5 0 L 5 0'] },
	tr2cl: { extent: 10, ellipse: { rx: 4, ry: 10 }, paths: ['M -3 -3 L 3 -3 M -3 3 L 3 3'] },
	tr3cl: { extent: 10, ellipse: { rx: 5, ry: 10 }, paths: ['M 0 -8 L 0 8', 'M -4 -3 L 4 -3 M -4 3 L 4 3'] },
	tr5cl: {
		extent: 10,
		ellipse: { rx: 6, ry: 10 },
		paths: ['M 0 -9 L 0 9 M -3 -7 L -3 7 M 3 -7 L 3 7', 'M -5 -3 L 5 -3 M -5 3 L 5 3'],
	},
	// Popcorn family at other heights (plain `popcorn` stays the dc popcorn).
	'hdc popcorn': { extent: 9, paths: ['M -5 6 C -7 -6 7 -6 5 6 M 0 -6 L 0 -9'] },
	'tr popcorn': { extent: 12, paths: ['M -5 9 C -8 -9 8 -9 5 9 M 0 -9 L 0 -12 M -3 1 L 3 -3'] },
};

// How far a symbol reaches from its own center, in px. The default is for a name
// the library does not know — the parser rejects those, so it is a floor rather
// than a guess anything real relies on.
const DEFAULT_EXTENT = 8;

export function symbolExtent(symbol: string): number {
	return SYMBOLS[symbol]?.extent ?? DEFAULT_EXTENT;
}

// How far a symbol reaches across, and how far along itself, measured from what
// it is actually drawn as.
//
// A stitch is not square. A double crochet is a tall thin stem; a chain is a
// wide flat oval. Sized by one number, the tall stitches ask a round for as much
// width as they have height, and a round of them is pushed out until the fabric
// it draws has come apart. So the two are measured separately, off the shapes
// themselves rather than kept by hand beside them.
const SPANS = new Map<string, { across: number; along: number }>();

export function symbolHalfWidth(symbol: string): number {
	return spanOf(symbol).across;
}

export function symbolHalfHeight(symbol: string): number {
	return spanOf(symbol).along;
}

function spanOf(symbol: string): { across: number; along: number } {
	const known = SPANS.get(symbol);
	if (known !== undefined) return known;

	const spec = SYMBOLS[symbol];
	const extent = spec?.extent ?? DEFAULT_EXTENT;
	let span = { across: extent, along: extent };
	if (spec?.ellipse !== undefined) {
		span = { across: spec.ellipse.rx, along: spec.ellipse.ry };
	} else if (spec?.circle !== undefined) {
		span = { across: spec.circle.r, along: spec.circle.r };
	} else if (spec?.paths !== undefined) {
		const numbers = spec.paths.flatMap((path) => path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
		let across = 0;
		let along = 0;
		for (let index = 0; index + 1 < numbers.length; index += 2) {
			across = Math.max(across, Math.abs(numbers[index] ?? 0));
			along = Math.max(along, Math.abs(numbers[index + 1] ?? 0));
		}
		if (across > 0 || along > 0) span = { across: across || extent, along: along || extent };
	}
	SPANS.set(symbol, span);
	return span;
}

// Every stitch name that has a chart glyph. Tests sweep this list through the
// parser and the renderer to keep the grammar and the symbol library in sync.
export function supportedSymbolNames(): readonly string[] {
	return Object.keys(SYMBOLS);
}
