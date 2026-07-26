import type { GridPoint, ShapingMark } from '../types';
import type { GraphStitch, StitchMappingGroup } from './graph';

// The band a round occupies: from the guide line it is worked up from to the
// one the next round is worked up from.
export interface RoundBand {
	inner: number;
	outer: number;
	// Where the round's stitches are centred, for the mark's own anchor.
	radius: number;
}

// How much of the band a mark leaves free at each end. It still reads as
// spanning its round — reaching the edge it is worked up from and the edge the
// next round is worked from — but stops short of the guide lines, so a stack of
// increases on consecutive rounds reads as separate symbols instead of merging
// into one long zigzag across the chart.
const BAND_INSET_SHARE = 0.16;
const MIN_BAND_INSET = 1.5;

// Builds the V of an increase or the ∧ of a decrease.
//
// Printed charts draw these as stitch symbols of their own round, in line with
// the plain stitches, rather than as lines running between rounds: the pointed
// end sits on the round's inner edge, in line with the stitch below it is
// worked into, and the open end reaches the outer edge at each stitch it
// produces. So the mark is built from angles — whose stitch each end lines up
// with — and from the round's band, which fixes its height. It replaces the
// symbols of the stitches it makes; those stitches still exist in the graph,
// and are what the next round is worked into.
export function buildShapingMark(
	group: StitchMappingGroup,
	sources: readonly GraphStitch[],
	targets: readonly GraphStitch[],
	band: RoundBand,
): ShapingMark | undefined {
	const kind = group.mark;
	if (kind === undefined) return undefined;

	// One stitch on the pointed side, two or more fanning out on the open side.
	const point = kind === 'increase' ? sources[0] : targets[0];
	const open = kind === 'increase' ? targets : sources;
	if (point?.layout === undefined || open.length < 2) return undefined;

	const openAngles: number[] = [];
	for (const stitch of open) {
		if (stitch.layout === undefined) return undefined;
		openAngles.push(stitch.layout.angle);
	}

	// An increase opens outward (its two stitches are in this round, and the
	// next round is worked into them); a decrease opens inward, onto the
	// stitches of the round below that it closed over.
	const inset = Math.max(MIN_BAND_INSET, (band.outer - band.inner) * BAND_INSET_SHARE);
	const apexRadius = kind === 'increase' ? band.inner + inset : band.outer - inset;
	const openRadius = kind === 'increase' ? band.outer - inset : band.inner + inset;

	const apex = polar(point.layout.angle, apexRadius);
	const arms = openAngles.map((angle) => polar(angle, openRadius));
	const first = arms[0];
	const last = arms[arms.length - 1];
	if (first === undefined || last === undefined) return undefined;

	const segments: GridPoint[][] = [[first, apex, last]];
	for (const arm of arms.slice(1, -1)) segments.push([apex, arm]);

	// The mark's anchor is its own stitch position on the round: the middle of
	// the stitches it stands for.
	const anchorAngle = kind === 'increase' ? midAngle(openAngles) : point.layout.angle;

	return {
		kind,
		segments,
		...polar(anchorAngle, band.radius),
		rowIndex: group.roundIndex,
		unitIndex: group.unitIndex,
	};
}

function midAngle(angles: readonly number[]): number {
	const first = angles[0] ?? 0;
	const last = angles[angles.length - 1] ?? first;
	return (first + last) / 2;
}

function polar(angleDeg: number, radius: number): GridPoint {
	const radians = (angleDeg * Math.PI) / 180;
	return { x: radius * Math.cos(radians), y: radius * Math.sin(radians) };
}
