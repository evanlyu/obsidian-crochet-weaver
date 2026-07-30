import type { ChartGridGuide, GridPoint } from '../types';
import { arcToDegrees } from './angles';

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
// per round) anchors *both* ends of a step on the seam of the round whose band
// it steps into, so the step lands beside that round's number and stays as close
// to radial as the gap allows.
//
// The gap is a length of arc, not an angle: a fixed angle is a longer and longer
// gap the further out the round is, which tips the step over from a short
// near-90° jog into a long slant across the band. Measuring it in px keeps every
// step equally steep — and the innermost boundary, where a few px of arc is a
// wide angle, is capped so it still reads as a ring.
const BAND_SEAM_GAP_ARC = 5;
const MAX_BAND_SEAM_GAP_DEG = 14;
const BAND_ARC_SEGMENTS = 120;

// The radii that divide the rounds into bands: n rounds give n+1 boundaries
// (the inner edge, each midpoint between neighbouring rounds, the outer edge),
// so round k occupies the band from boundary k to boundary k+1. Shaping symbols
// are sized from these too, so their ends land exactly on the drawn lines.
export function bandBoundaries(actualRadii: readonly number[], ringSpacing: number): number[] {
	const first = actualRadii[0];
	const last = actualRadii.at(-1);
	if (first === undefined || last === undefined) return [];

	const firstGap = (actualRadii[1] ?? first + ringSpacing) - first;
	const lastGap = last - (actualRadii[actualRadii.length - 2] ?? last - ringSpacing);

	const radii = [Math.max(first - firstGap / 2, 14)];
	for (let i = 0; i + 1 < actualRadii.length; i++) {
		radii.push(((actualRadii[i] ?? 0) + (actualRadii[i + 1] ?? 0)) / 2);
	}
	radii.push(last + lastGap / 2);
	return radii;
}

export function buildBandGuide(
	actualRadii: readonly number[],
	ringSpacing: number,
	seamAngles: readonly number[],
): ChartGridGuide | undefined {
	const radii = bandBoundaries(actualRadii, ringSpacing);
	if (radii.length === 0) return undefined;

	const gapAt = (r: number): number =>
		Math.min(arcToDegrees(BAND_SEAM_GAP_ARC, r), MAX_BAND_SEAM_GAP_DEG);
	const seamOf = (round: number): number =>
		seamAngles[Math.min(Math.max(round, 0), seamAngles.length - 1)] ?? -90;

	const points: GridPoint[] = [];
	const lastIndex = radii.length - 1;
	radii.forEach((r, k) => {
		// Boundary k is where round k's band starts, so it is entered by the step
		// out of round k-1 and left by the step out of round k. Each end of the
		// arc sits half a gap from the seam of the step it meets; the outermost
		// boundary is left by nothing and closes fully (a 360° sweep), so the
		// spiral ends on a clean ring instead of a dangling free end.
		const gap = gapAt(r);
		const startAngle = seamOf(k - 1) - gap / 2;
		const sweep = k === lastIndex ? 360 : turnDown(startAngle, seamOf(k) + gap / 2);
		for (let s = 0; s <= BAND_ARC_SEGMENTS; s++) {
			// Sweep with decreasing angle, matching stitch placement, so the
			// segment linking this arc's end to the next arc's start lands as a
			// short, near-radial step at the seam.
			const angle = ((startAngle - (sweep * s) / BAND_ARC_SEGMENTS) * Math.PI) / 180;
			points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
		}
	});

	return { circles: [], lines: [], polylines: [points] };
}

// How far an arc has to sweep, with decreasing angle, to get from `from` round
// to `to` — a near-full turn, never a hair over nothing when the two rounds'
// seams have drifted apart.
function turnDown(from: number, to: number): number {
	const sweep = (((from - to) % 360) + 360) % 360;
	return sweep < 180 ? sweep + 360 : sweep;
}
