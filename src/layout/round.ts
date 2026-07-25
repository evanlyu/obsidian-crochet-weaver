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
	let prevCount = -1;
	let lastUnitCount = 0;
	const roundRadii: number[] = [];
	const seamAngles: number[] = [];
	const colorState: ColorState = {};
	const colorMarkers: ColorMarker[] = [];
	const labels: ChartLabel[] = [];
	let previousColor: string | undefined;
	// Book style: the previous round's output-stitch layout (first stitch's
	// angle plus its count), so the next round can phase itself over the
	// stitches it consumes.
	let prevRing: BookRing | undefined;

	ast.rows.forEach((row, rowIndex) => {
		const units = unroll(row.steps, colorState);
		const join =
			units.length > 1 && isSlSt(units[units.length - 1])
				? units.pop()
				: undefined;
		if (units.length === 0) return;

		const stitchCount = units.reduce((sum, unit) => sum + outputStitches(unit), 0);
		radius = nextRadius(radius, prevCount, stitchCount, options.ringSpacing);
		const outStep = 360 / stitchCount;

		let centers: number[];
		// The seam gap sits counterclockwise of the round's first stitch; in
		// book style it drifts with the increases, like the diagonal run of
		// round numbers in a printed chart.
		let seamAngle = -90 + outStep / 2;
		const parentStep = prevRing !== undefined && prevRing.outputCount > 0 ? 360 / prevRing.outputCount : undefined;
		if (book) {
			const placed = placeBookRound(units, prevRing, outStep);
			centers = placed.centers;
			prevRing = { phase: placed.phase, outputCount: stitchCount };
			seamAngle = placed.phase + outStep / 2;
		} else {
			const angleStep = 360 / units.length;
			centers = units.map((_, i) => -90 - i * angleStep);
		}

		const start = items.length;
		units.forEach((unit, i) => {
			const itemStart = items.length;
			const glyph = book
				? bookGlyph(unit, radius, centers[i] ?? -90, outStep, parentStep, options.ringSpacing)
				: undefined;
			placeUnitPolar(items, unit, radius, centers[i] ?? -90, options.rotation, rowIndex, i, glyph);
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

// The previous round's output-stitch layout: outputs sit evenly spaced, so
// the first stitch's angle (phase) plus the count describes every position.
interface BookRing {
	phase: number;
	outputCount: number;
}

// How far each arm/apex reaches from the stitch, in px. Kept short of the
// half-band gap (~ringSpacing/2) so nothing touches the spiral guide line;
// the reach only sets the length, while the *direction* points at the real
// neighbouring stitch, so a short segment still aims correctly.
const BOOK_GLYPH_REACH = 8.5;

// Builds the increase/decrease connector for a book-style round: three
// offset points (arm, apex, arm) forming a V/∧ whose apex points at the one
// stitch on the single side and whose two arms point at the two stitches on
// the split side. The arms aim at the *actual* neighbouring-round positions
// (an inc's two next-round children at ±outStep/2 one round out; a dec's two
// parents at ±parentStep/2 one round in), so the symbol is genuinely
// asymmetric when those positions are — it is not a stock symmetric glyph.
function bookGlyph(
	unit: LayoutUnit,
	radius: number,
	centerDeg: number,
	outStep: number,
	parentStep: number | undefined,
	ringSpacing: number,
): GridPoint[] | undefined {
	if (unit.type !== 'StitchNode') return undefined;
	const isInc = unit.stitch === 'inc';
	const isDec = unit.stitch === 'dec';
	if (!isInc && !isDec) return undefined;
	if (isDec && parentStep === undefined) return undefined;

	const centerRad = (centerDeg * Math.PI) / 180;
	const px = radius * Math.cos(centerRad);
	const py = radius * Math.sin(centerRad);

	// Unit offset toward a stitch at angular offset `deltaDeg` (from this
	// stitch's angle) and radius `targetRadius`, scaled to BOOK_GLYPH_REACH.
	const toward = (deltaDeg: number, targetRadius: number): GridPoint => {
		const a = ((centerDeg + deltaDeg) * Math.PI) / 180;
		const dx = targetRadius * Math.cos(a) - px;
		const dy = targetRadius * Math.sin(a) - py;
		const len = Math.hypot(dx, dy) || 1;
		return { x: (dx / len) * BOOK_GLYPH_REACH, y: (dy / len) * BOOK_GLYPH_REACH };
	};

	if (isInc) {
		// Apex toward the one parent (one round in); arms toward the two
		// next-round stitches worked into its two outputs (one round out).
		const half = outStep / 2;
		return [toward(half, radius + ringSpacing), toward(0, radius - ringSpacing), toward(-half, radius + ringSpacing)];
	}
	// dec: apex toward the one continuing stitch (one round out); legs toward
	// the two parents it merges (one round in).
	const half = (parentStep as number) / 2;
	return [toward(half, radius - ringSpacing), toward(0, radius + ringSpacing), toward(-half, radius - ringSpacing)];
}

// Book-style placement for one round. Output stitches are always spaced
// evenly (as printed charts draw them — pure per-stitch genealogy compounds
// local density round over round until symbols collide), and the round's
// *phase* is chosen so each unit sits as close as possible to the
// previous-round stitch(es) it consumes. For evenly distributed shaping —
// the overwhelming pattern-book case — that phase makes the alignment
// exact: an inc's two children straddle it, a dec sits centered between the
// parents it merges, and plain stitches stack straight above their parents.
// The first round (no parents) starts its first stitch at the top.
function placeBookRound(
	units: readonly LayoutUnit[],
	parents: BookRing | undefined,
	outStep: number,
): { centers: number[]; phase: number } {
	// Each unit's center in output-stitch positions (an inc spans 2 slots).
	const outPositions: number[] = [];
	let outCursor = 0;
	for (const unit of units) {
		const width = outputStitches(unit);
		outPositions.push(outCursor + (width - 1) / 2);
		outCursor += width;
	}

	let phase = -90;
	if (parents !== undefined && parents.outputCount > 0) {
		const parentStep = 360 / parents.outputCount;
		// Scale consumption onto the real parent count so a round that doesn't
		// consume its predecessor exactly (pattern licence, uncounted chains…)
		// still distributes over the full circle instead of drifting.
		const totalConsumed = units.reduce((sum, unit) => sum + consumedStitches(unit), 0);
		const scale = parents.outputCount / totalConsumed;
		let consumedBefore = 0;
		let phaseSum = 0;
		units.forEach((unit, i) => {
			const consumed = consumedStitches(unit);
			const parentMid = (consumedBefore + (consumed - 1) / 2) * scale;
			consumedBefore += consumed;
			const desiredCenter = parents.phase - parentMid * parentStep;
			phaseSum += desiredCenter + (outPositions[i] ?? 0) * outStep;
		});
		phase = phaseSum / units.length;
	}

	return {
		centers: outPositions.map((position) => phase - position * outStep),
		phase,
	};
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
