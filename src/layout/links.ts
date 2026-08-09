import type { GridPoint, ShapingMark } from '../types';
import { symbolExtent } from './constants';
import { symbolAngle } from './polar';
import type { GraphStitch, StitchMappingGroup } from './graph';

// Connection points on a stitch symbol. Links start and end here rather than at
// the symbol's center, so a line meets the stitch it points at without running
// through the middle of the glyph.
interface StitchAnchor {
	// Toward the chart center (where the round below is), and away from it
	// (where the round above is).
	inward: GridPoint;
	outward: GridPoint;
}

// Smallest slice of the gap between two rounds a link must keep for itself.
// Tall symbols (a dc is 10px half-height) would otherwise eat the whole gap on
// a tightly spaced chart and leave the V with no visible opening.
const MAX_ANCHOR_SHARE = 0.35;

// How far out from a stitch its connection points sit, as a share of the
// symbol's bounding half-size. Under 1 because that bound has padding in it:
// reaching the full extent leaves a visible gap between the symbol and the line
// touching it. Landing just inside the drawn strokes attaches the two.
const SYMBOL_TOUCH_SHARE = 0.7;

// Builds the link an increase or decrease draws between rounds.
//
// This is the alternative to the book style's in-round V and ∧ (see
// layout/shaping.ts): here the stitches keep their own symbols on their round,
// and the shaping is shown by lines drawn to the stitch below they are worked
// into — one stitch on the single side, two or more on the split side, meeting
// at an apex on the shared one. Every end sits on a stitch that exists, so the
// shape leans, opens and stretches with the real geometry rather than being a
// stock glyph.
export function buildStitchLink(
	group: StitchMappingGroup,
	sources: readonly GraphStitch[],
	targets: readonly GraphStitch[],
): ShapingMark | undefined {
	if (group.type === 'normal') return undefined;
	const single = group.type === 'increase' ? sources[0] : targets[0];
	const split = group.type === 'increase' ? targets : sources;
	// One shared stitch on one side and at least two on the other is what makes
	// a link drawable; anything else keeps its own symbol and no line.
	if (single?.layout === undefined || split.length < 2) return undefined;
	if ((group.type === 'increase' ? sources.length : targets.length) !== 1) return undefined;

	const splitLayout = split[0]?.layout;
	if (splitLayout === undefined) return undefined;
	const bandWidth = Math.abs(splitLayout.radius - single.layout.radius);

	// The apex reaches across the gap toward the round the split stitches are in.
	const apex = anchorOf(single, bandWidth)[group.type === 'increase' ? 'outward' : 'inward'];
	const arms: GridPoint[] = [];
	for (const stitch of split) {
		if (stitch.layout === undefined) return undefined;
		arms.push(anchorOf(stitch, bandWidth)[group.type === 'increase' ? 'inward' : 'outward']);
	}

	const first = arms[0];
	const last = arms[arms.length - 1];
	if (first === undefined || last === undefined) return undefined;
	const segments: GridPoint[][] = [[first, apex, last]];
	for (const arm of arms.slice(1, -1)) segments.push([apex, arm]);

	return {
		kind: group.type === 'increase' ? 'increase' : 'decrease',
		segments,
		// The link belongs to the stitches on the split side; its anchor is the
		// middle of them, on their own round.
		...midpoint(arms),
		rotation: symbolAngle(splitLayout.angle),
		rowIndex: group.roundIndex,
		unitIndex: group.unitIndex,
	};
}

function anchorOf(stitch: GraphStitch, bandWidth: number): StitchAnchor {
	const layout = stitch.layout;
	if (layout === undefined) return { inward: { x: 0, y: 0 }, outward: { x: 0, y: 0 } };
	const reach = Math.min(
		symbolExtent(stitch.symbol) * SYMBOL_TOUCH_SHARE,
		Math.max(0, bandWidth) * MAX_ANCHOR_SHARE,
	);
	const radians = (layout.angle * Math.PI) / 180;
	return {
		inward: { x: (layout.radius - reach) * Math.cos(radians), y: (layout.radius - reach) * Math.sin(radians) },
		outward: { x: (layout.radius + reach) * Math.cos(radians), y: (layout.radius + reach) * Math.sin(radians) },
	};
}

function midpoint(points: readonly GridPoint[]): GridPoint {
	const first = points[0] ?? { x: 0, y: 0 };
	const last = points[points.length - 1] ?? first;
	return { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 };
}
