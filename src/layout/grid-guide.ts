import type { ChartGridGuide } from '../types';

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

// Book-style round charts: separator circles *between* rounds (at the
// midpoint of each ring gap, plus an inner and outer boundary), so every
// round's symbols sit enclosed in their own annular band the way Japanese
// pattern books draw them — unlike buildRingGuide's rings, which pass
// through the stitches themselves.
export function buildBandGuide(actualRadii: readonly number[], ringSpacing: number): ChartGridGuide | undefined {
	const first = actualRadii[0];
	const last = actualRadii.at(-1);
	if (first === undefined || last === undefined) return undefined;

	const firstGap = (actualRadii[1] ?? first + ringSpacing) - first;
	const lastGap = last - (actualRadii[actualRadii.length - 2] ?? last - ringSpacing);

	const radii = [Math.max(first - firstGap / 2, 14)];
	for (let i = 0; i + 1 < actualRadii.length; i++) {
		radii.push(((actualRadii[i] ?? 0) + (actualRadii[i + 1] ?? 0)) / 2);
	}
	radii.push(last + lastGap / 2);

	return { circles: radii.map((r) => ({ cx: 0, cy: 0, r })), lines: [] };
}
