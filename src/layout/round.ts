import type { ChartLabel, ColorMarker, CrochetAst, GridPoint, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, MIN_ARC } from './constants';
import { buildBandGuide, buildRingGuide } from './grid-guide';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor } from './polar';
import { consumedStitches, isSlSt, outputStitches, tagLoop, unroll, type ColorState, type LayoutUnit } from './steps';

export function layoutRound(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const book = options.roundStyle === 'book';
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);
	let radius = 0;
	let prevRadius = 0;
	let prevCount = -1;
	let lastUnitCount = 0;
	const roundRadii: number[] = [];
	const seamAngles: number[] = [];
	const colorState: ColorState = {};
	const colorMarkers: ColorMarker[] = [];
	const labels: ChartLabel[] = [];
	let previousColor: string | undefined;
	// Book style is a stitch graph: each round's stitches are positioned from
	// the previous round's stitches they are worked into, so this holds the
	// previous round's per-output-stitch angles in working order (an increase
	// contributed two, a decrease one). It is undefined before round 1.
	let prevOutAngles: number[] | undefined;

	ast.rows.forEach((row, rowIndex) => {
		const units = unroll(row.steps, colorState);
		const join =
			units.length > 1 && isSlSt(units[units.length - 1])
				? units.pop()
				: undefined;
		if (units.length === 0) return;

		const stitchCount = units.reduce((sum, unit) => sum + outputStitches(unit), 0);
		radius = nextRadius(radius, prevCount, stitchCount, options.ringSpacing);

		let centers: number[];
		let glyphs: (readonly GridPoint[] | undefined)[];
		let seamAngle: number;
		if (book) {
			const placed = placeBookRound(units, prevOutAngles, stitchCount, radius, prevRadius);
			centers = placed.centers;
			glyphs = placed.glyphs;
			prevOutAngles = placed.outAngles;
			seamAngle = placed.seamAngle;
		} else {
			const angleStep = 360 / units.length;
			centers = units.map((_, i) => -90 - i * angleStep);
			glyphs = units.map(() => undefined);
			seamAngle = -90 + angleStep / 2;
		}

		const start = items.length;
		units.forEach((unit, i) => {
			const itemStart = items.length;
			placeUnitPolar(items, unit, radius, centers[i] ?? -90, options.rotation, rowIndex, i, book ? glyphs[i] : undefined);
			if (unit.color !== undefined && unit.color !== previousColor) {
				const first = items[itemStart];
				if (first) colorMarkers.push({ x: first.x, y: first.y, color: unit.color });
				previousColor = unit.color;
			}
		});
		if (join) {
			const joinAngle = book ? seamAngle : -90 + 360 / units.length / 2;
			placeUnitPolar(items, join, radius, joinAngle, options.rotation, rowIndex, undefined);
		}
		tagLoop(items, start, row.loop);
		if (book) {
			// Round number in the seam gap, nudged inward when a join dot
			// already occupies the gap at the ring radius itself.
			const labelAngle = (seamAngle * Math.PI) / 180;
			const labelRadius = join ? radius - options.ringSpacing * 0.35 : radius;
			labels.push({
				x: labelRadius * Math.cos(labelAngle),
				y: labelRadius * Math.sin(labelAngle),
				text: String(row.num),
			});
		}
		prevCount = stitchCount;
		prevRadius = radius;
		lastUnitCount = units.length;
		roundRadii.push(radius);
		seamAngles.push(seamAngle);
	});

	// Book style always draws its band spiral (it is the style); the standard
	// ring guide with spokes stays behind the grid option. The guide's default
	// spoke count matches units.length (rendered angular slots), not the
	// stitch-weighted count nextRadius uses — an inc occupies one slot even
	// though it outputs 2 stitches.
	const gridGuide = book
		? buildBandGuide(roundRadii, options.ringSpacing, seamAngles)
		: options.grid
			? buildRingGuide(roundRadii, lastUnitCount, options.ringSpacing, options.gridCount, options.gridColumns)
			: undefined;
	return normalize(items, undefined, gridGuide, colorMarkers, book ? labels : undefined);
}

interface PlacedRound {
	// One render-anchor angle per unit (degrees, continuous — not wrapped).
	centers: number[];
	// One optional connector glyph per unit (offsets from that unit's item x/y).
	glyphs: (readonly GridPoint[] | undefined)[];
	// This round's per-output-stitch angles in working order, for the next
	// round to be worked into.
	outAngles: number[];
	// Angle of the round's starting seam, for the round number label.
	seamAngle: number;
}

// Positions one round following the layout spec's priorities. Stitch order
// and parent/child relationships come from the crochet graph (each unit
// consumes parents from the previous round and produces children into this
// one). The round is spread to fill the circle so it stays readable and
// gap-free (even spacing is the lowest-priority fallback, but it prevents the
// clustering that pure per-stitch ancestry compounds into), and its *phase*
// (rotation) is chosen so plain stitches sit over their parents and each
// increase/decrease lands where its parent(s) are — preserving continuity.
// The increase/decrease connectors are then built from the real parent and
// child angles: an increase is a compressed "V" whose two children read as
// one group with its apex on the shared parent, a decrease a "∧" centred on
// the two parents it merges. Even spacing is sacrificed locally at shaping
// via these symbols, not by scattering the whole round.
function placeBookRound(
	units: readonly LayoutUnit[],
	prevOut: number[] | undefined,
	outCount: number,
	radius: number,
	prevRadius: number,
): PlacedRound {
	const outStep = 360 / outCount;

	// Each unit's centre in output-stitch slots (an increase spans two slots).
	const outPositions: number[] = [];
	let slot = 0;
	for (const unit of units) {
		const width = outputStitches(unit);
		outPositions.push(slot + (width - 1) / 2);
		slot += width;
	}

	// Phase: rotate the evenly spaced round so every unit sits over the
	// previous-round stitch(es) it is worked into. With no parents (round 1)
	// the first stitch starts at the top.
	let phase = -90;
	if (prevOut !== undefined && prevOut.length > 0) {
		let cursor = 0;
		let phaseSum = 0;
		units.forEach((unit, i) => {
			const consumed = consumedStitches(unit);
			const parentMid = mean(prevOut.slice(cursor, cursor + consumed));
			cursor += consumed;
			phaseSum += parentMid + (outPositions[i] ?? 0) * outStep;
		});
		phase = phaseSum / units.length;
	}

	const centers = outPositions.map((position) => phase - position * outStep);
	// This round's per-output-stitch angles (evenly spaced) for the next round.
	const outAngles = Array.from({ length: outCount }, (_, k) => phase - k * outStep);

	const glyphs: (readonly GridPoint[] | undefined)[] = [];
	let cursor = 0;
	units.forEach((unit, i) => {
		const consumed = consumedStitches(unit);
		const width = outputStitches(unit);
		const parents = prevOut !== undefined ? prevOut.slice(cursor, cursor + consumed) : [];
		cursor += consumed;
		const center = centers[i] ?? -90;

		if (width === 2 && consumed === 1 && isInc(unit)) {
			// Increase: compressed V — two children close together as one group,
			// apex on the shared parent (one round in).
			const parentAngle = parents.length > 0 ? parents[0]! : center;
			glyphs.push(splitGlyph(center, parentAngle, radius, prevRadius));
		} else if (width === 1 && consumed >= 2 && isDec(unit)) {
			// Decrease: ∧ gathered at the child, legs to the two parents it merges.
			glyphs.push(mergeGlyph(center, parents.length >= 2 ? parents : [center, center], radius, prevRadius));
		} else {
			glyphs.push(undefined);
		}
	});

	return { centers, glyphs, outAngles, seamAngle: phase + outStep / 2 };
}

function isInc(unit: LayoutUnit): boolean {
	return unit.type === 'StitchNode' && unit.stitch === 'inc';
}

function isDec(unit: LayoutUnit): boolean {
	return unit.type === 'StitchNode' && (unit.stitch === 'dec' || /\dtog$/.test(unit.stitch));
}

// px position of a stitch at (angleDeg, r).
function polar(angleDeg: number, r: number): GridPoint {
	const a = (angleDeg * Math.PI) / 180;
	return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

// Radial reach (px) of a shaping arm toward a neighbouring round, kept short of
// the half-band gap so nothing crosses the spiral guide line.
const BOOK_APEX_REACH = 8;

// Half the on-screen gap (px) between an increase's two children — small, so
// the pair reads as one compressed "V" group like a printed chart.
const BOOK_INCREASE_HALF_PX = 6;

// Max tangential (sideways) reach of a decrease leg, px. The two merged parents
// can sit a wide angle apart on a late decrease round (stitch count drops but
// the radius still grows), so cap how far the ∧ opens — it only needs to point
// at them, not literally bridge the whole gap.
const BOOK_MAX_LEG = 13;

// Clamps a point's sideways (tangential) distance from the radial line through
// `centerDeg`, leaving its radial distance untouched.
function clampTangent(p: GridPoint, centerDeg: number, maxTangent: number): GridPoint {
	const a = (centerDeg * Math.PI) / 180;
	const cos = Math.cos(a);
	const sin = Math.sin(a);
	const radial = p.x * cos + p.y * sin;
	let tang = -p.x * sin + p.y * cos;
	tang = Math.max(-maxTangent, Math.min(maxTangent, tang));
	return { x: radial * cos - tang * sin, y: radial * sin + tang * cos };
}

// Increase connector: a compressed V. The two arms end on a tight pair sitting
// just outward of the stitch (so they read as one group, not two spread
// stitches), and the apex points inward at the shared parent one round in.
// When the round is parent-aligned the apex is straight inward; on an
// irregular round it leans toward the real parent angle (clamped so it can't
// run away). Offsets are from the unit's anchor at (centerDeg, radius).
function splitGlyph(
	centerDeg: number,
	parentAngle: number,
	radius: number,
	parentRadius: number,
): readonly GridPoint[] {
	void parentRadius;
	const a = (centerDeg * Math.PI) / 180;
	const cos = Math.cos(a);
	const sin = Math.sin(a);
	// tangential (sideways) and radial (outward) unit vectors at this stitch.
	const outward = 4;
	const child = (sign: number): GridPoint => ({
		x: outward * cos + sign * BOOK_INCREASE_HALF_PX * -sin,
		y: outward * sin + sign * BOOK_INCREASE_HALF_PX * cos,
	});
	const anchor = polar(centerDeg, radius);
	const apex = clampTangent(sub(polar(parentAngle, radius - BOOK_APEX_REACH), anchor), centerDeg, BOOK_MAX_LEG);
	return [child(1), apex, child(-1)];
}

// Decrease connector: apex on the one child (nudged outward), legs point inward
// toward the two-or-more parents it merges — at each parent's real *angle* so
// the ∧ visibly gathers them into one, but at a band-bounded inner radius so
// it stays clear of the guide line (the parents themselves sit a round in).
function mergeGlyph(centerDeg: number, parents: number[], radius: number, parentRadius: number): readonly GridPoint[] {
	void parentRadius;
	const anchor = polar(centerDeg, radius);
	const apex = polar(centerDeg, radius + BOOK_APEX_REACH);
	const legRadius = radius - BOOK_APEX_REACH;
	const first = parents[0] ?? centerDeg;
	const last = parents[parents.length - 1] ?? centerDeg;
	return [
		clampTangent(sub(polar(first, legRadius), anchor), centerDeg, BOOK_MAX_LEG),
		sub(apex, anchor),
		clampTangent(sub(polar(last, legRadius), anchor), centerDeg, BOOK_MAX_LEG),
	];
}

function sub(a: GridPoint, b: GridPoint): GridPoint {
	return { x: a.x - b.x, y: a.y - b.y };
}

function mean(values: readonly number[]): number {
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Every round moves outward by at least one ring-spacing step, even a decrease
// round: a decrease just spreads fewer stitches around a same-or-larger ring,
// matching how published crochet charts draw decreases. Shrinking the ring
// instead would tuck it back inside earlier, larger rounds.
function nextRadius(
	prevRadius: number,
	prevCount: number,
	stitchCount: number,
	step: number,
): number {
	const circRadius = (stitchCount * MIN_ARC) / (2 * Math.PI);
	if (prevCount < 0) return Math.max(BASE_RADIUS, circRadius);
	return Math.max(prevRadius + step, circRadius);
}
