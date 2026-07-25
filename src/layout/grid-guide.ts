import type { ChartGridGuide, GridPoint } from '../types';

// Shared by round and spiral layouts: given the real ring radius reached at
// each round (or, for spiral, at each row boundary) and the last round's
// rendered unit count, build a background guide of concentric rings
// (extended past the real rounds by ringSpacing when gridCount asks for more)
// and evenly spaced spokes (defaulting to one per rendered unit in the
// outermost round — an inc is one angular slot even though it outputs 2
// stitches, matching how the real layout spaces units by angle).
export function buildRingGuide(
	actualRadii: readonly number[],
	lastUnitCount: number,
	ringSpacing: number,
	gridCount: number | undefined,
	gridColumns: number | undefined,
): ChartGridGuide | undefined {
	const lastActualRadius = actualRadii.at(-1);
	if (lastActualRadius === undefined) return undefined;

	const targetCount = Math.max(actualRadii.length, gridCount ?? 0);
	const radii = Array.from({ length: targetCount }, (_, i) => {
		const actual = actualRadii[i];
		return actual !== undefined ? actual : lastActualRadius + (i - actualRadii.length + 1) * ringSpacing;
	});
	const outerRadius = radii.at(-1) ?? lastActualRadius;

	const circles = radii.map((r) => ({ cx: 0, cy: 0, r }));

	const columns = Math.max(1, gridColumns ?? lastUnitCount);
	const angleStep = 360 / columns;
	const lines = Array.from({ length: columns }, (_, k) => {
		const angle = ((-90 + k * angleStep) * Math.PI) / 180;
		return { x1: 0, y1: 0, x2: outerRadius * Math.cos(angle), y2: outerRadius * Math.sin(angle) };
	});

	return { circles, lines };
}

// Book-style round charts: the separators *between* rounds (at the midpoint
// of each ring gap, plus an inner and outer boundary) drawn as one
// continuous spiral rather than closed circles — real crochet-in-the-round
// is a single spiralling line, and Japanese pattern books draw it that way,
// with each round's band stepping out to the next at the starting seam.
// Each band boundary is a near-full arc with a small gap at its seam; the
// gap is bridged to the next boundary out, so the whole guide is one open
// polyline that winds from the center outward. `seamAngles` (degrees, one
// per round) places each step at that round's real seam so the steps line
// up under the round numbers.
const BAND_SEAM_GAP_DEG = 16;
const BAND_ARC_SEGMENTS = 120;

export function buildBandGuide(
	actualRadii: readonly number[],
	ringSpacing: number,
	seamAngles: readonly number[],
): ChartGridGuide | undefined {
	const first = actualRadii[0];
	const last = actualRadii.at(-1);
	if (first === undefined || last === undefined) return undefined;

	const firstGap = (actualRadii[1] ?? first + ringSpacing) - first;
	const lastGap = last - (actualRadii[actualRadii.length - 2] ?? last - ringSpacing);

	// n rounds -> n+1 boundary radii (inner edge, each midpoint, outer edge).
	const radii = [Math.max(first - firstGap / 2, 14)];
	for (let i = 0; i + 1 < actualRadii.length; i++) {
		radii.push(((actualRadii[i] ?? 0) + (actualRadii[i + 1] ?? 0)) / 2);
	}
	radii.push(last + lastGap / 2);

	// Seam angle for each boundary: the inner/outer edges reuse the nearest
	// round's seam; a between-rounds boundary averages the two it divides.
	const seamAt = (k: number): number => {
		if (k <= 0) return seamAngles[0] ?? -90;
		if (k >= actualRadii.length) return seamAngles[actualRadii.length - 1] ?? -90;
		return ((seamAngles[k - 1] ?? -90) + (seamAngles[k] ?? -90)) / 2;
	};

	const points: GridPoint[] = [];
	const lastIndex = radii.length - 1;
	radii.forEach((r, k) => {
		// Every boundary leaves a small seam gap and steps out to the next one;
		// the outermost closes fully (a full 360° sweep), so the spiral ends on
		// a clean ring instead of a dangling free end.
		const sweep = k === lastIndex ? 360 : 360 - BAND_SEAM_GAP_DEG;
		const startAngle = seamAt(k) - BAND_SEAM_GAP_DEG / 2;
		for (let s = 0; s <= BAND_ARC_SEGMENTS; s++) {
			// Sweep clockwise (decreasing angle), matching stitch placement, so
			// the segment linking this arc's end to the next arc's start lands
			// as a short radial step at the seam.
			const angle = ((startAngle - (sweep * s) / BAND_ARC_SEGMENTS) * Math.PI) / 180;
			points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
		}
	});

	return { circles: [], lines: [], polylines: [points] };
}
