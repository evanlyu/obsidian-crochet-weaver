import type { GridPoint, ShapingMark } from '../types';
import { arcToDegrees, shortestAngleDelta } from './angles';
import { symbolArc, symbolHalfHeight } from './constants';
import type { GraphStitch, StitchMappingGroup } from './graph';
import { symbolAngle } from './polar';

// The band a round occupies: from the guide line it is worked up from to the
// one the next round is worked up from.
export interface RoundBand {
	inner: number;
	outer: number;
	// Where the round's stitches are centred, for the mark's own anchor.
	radius: number;
}

// How much of the band a mark leaves free at each end, where it is drawn across
// the band at all.
const BAND_INSET_SHARE = 0.16;
const MIN_BAND_INSET = 1.5;

// A mark is a stitch symbol of its round, so it is drawn the height of one —
// the same as the stitches beside it, not the height of the whole band. Where
// it has to reach two stitches that are far apart it reaches sideways: a chart
// says which stitches a V joins by where its arms end, and saying it by growing
// taller instead would make one round's symbols taller than another's for no
// reason a reader could see.
const MARK_HEIGHT_SHARE = 1;

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
	// As tall as the stitch it stands for, centred on the round, and never
	// taller than the band has room for.
	const own = Math.min(
		2 * symbolHalfHeight(point.symbol) * MARK_HEIGHT_SHARE,
		band.outer - band.inner - 2 * inset,
	);
	const apexRadius = band.radius + (kind === 'increase' ? -own / 2 : own / 2);
	const openRadius = band.radius + (kind === 'increase' ? own / 2 : -own / 2);

	// Draw the opening no wider than the symbol wants to be, closing it around
	// the pointed end — which keeps its exact angle, since that is what says
	// which stitch this is worked into. Each end is measured from that point
	// along the shortest arc: the two ends of a mark can be on either side of
	// the round's seam (a round that works past the end of the one below picks
	// its next stitch up a whole turn later), and there they are neighbours on
	// the chart however far apart their angles count.
	const apexAngle = point.layout.angle;
	const offsets = openAngles.map((angle) => shortestAngleDelta(apexAngle, angle));
	// The widest a mark may open, in px: one stitch's room for each stitch on its
	// open side, taken from those stitches' own symbols. Its height does not come
	// into it — reaching further is how a mark says which stitches it joins.
	const widest = open.reduce((total, stitch) => total + symbolArc(stitch.symbol), 0);
	const maxSpan = arcToDegrees(widest, openRadius);
	const span = Math.max(...offsets) - Math.min(...offsets);
	const squeeze = span > maxSpan ? maxSpan / span : 1;
	// Closing the opening is not enough on its own: where a round cannot follow
	// its ancestry (it does not work into the round below exactly once each, so
	// it is spread evenly instead), a mark's ends can sit well off to one side
	// of its point, and it would be drawn as a long thin spike. Slide the whole
	// opening back under the point, keeping the ends' separation and order.
	const scaled = offsets.map((offset) => offset * squeeze);
	const half = maxSpan / 2;
	const low = Math.min(...scaled);
	const high = Math.max(...scaled);
	const slide = low < -half ? -half - low : high > half ? half - high : 0;

	const apex = polar(apexAngle, apexRadius);
	const arms = scaled.map((offset) => polar(apexAngle + offset + slide, openRadius));
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
		rotation: symbolAngle(anchorAngle),
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
