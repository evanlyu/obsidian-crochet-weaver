import type { ColorMarker, CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, MIN_ARC } from './constants';
import { buildRingGuide } from './grid-guide';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor } from './polar';
import { layoutRoundGraph } from './round-graph';
import { outputStitches, roundInstructions, tagLoop, unroll, type ColorState } from './steps';

export function layoutRound(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const style = options.roundStyle;
	if (style === 'book' || style === 'linked') {
		return layoutRoundGraph(ast, options, style, (previousRadius, previousCount, stitchCount) =>
			nextRadius(previousRadius, previousCount, stitchCount, options.ringSpacing),
		);
	}
	return layoutRoundStandard(ast, options);
}

// Standard style: each round's units spread evenly around the circle, starting
// at the top. Stitch-to-stitch correspondence is only implied by the counts —
// use style: book for the parent-aligned drawing.
function layoutRoundStandard(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);
	let radius = 0;
	let prevCount = -1;
	let lastUnitCount = 0;
	const roundRadii: number[] = [];
	const colorState: ColorState = {};
	const colorMarkers: ColorMarker[] = [];
	let previousColor: string | undefined;

	ast.rows.forEach((row, rowIndex) => {
		const { start: opening, stitches: units, end } = roundInstructions(unroll(row.steps, colorState));
		if (units.length === 0) return;

		const stitchCount = units.reduce((sum, unit) => sum + outputStitches(unit), 0);
		radius = nextRadius(radius, prevCount, stitchCount, options.ringSpacing);

		const angleStep = 360 / units.length;
		const start = items.length;
		// Drawn as worked: opening chain, then the round's stitches, then the
		// join that closes it.
		opening.forEach((unit, index) => {
			placeUnitPolar(items, unit, radius, -90 + angleStep * (0.55 - 0.2 * index), rowIndex, undefined);
		});
		units.forEach((unit, i) => {
			const itemStart = items.length;
			placeUnitPolar(items, unit, radius, -90 - i * angleStep, rowIndex, i);
			if (unit.color !== undefined && unit.color !== previousColor) {
				const first = items[itemStart];
				if (first) colorMarkers.push({ x: first.x, y: first.y, color: unit.color });
				previousColor = unit.color;
			}
		});
		end.forEach((unit, index) => {
			placeUnitPolar(items, unit, radius, -90 + angleStep * (0.3 + 0.2 * index), rowIndex, undefined);
		});
		tagLoop(items, start, row.loop);
		prevCount = stitchCount;
		lastUnitCount = units.length;
		roundRadii.push(radius);
	});

	// The guide's default spoke count matches units.length (rendered angular
	// slots), not the stitch-weighted count nextRadius uses — an inc occupies
	// one slot even though it outputs 2 stitches.
	const gridGuide = options.grid
		? buildRingGuide(roundRadii, lastUnitCount, options.ringSpacing, options.gridCount, options.gridColumns)
		: undefined;
	return normalize(items, undefined, gridGuide, colorMarkers);
}

// Every round moves outward by at least one ring-spacing step, even a decrease
// round: a decrease just spreads fewer stitches around a same-or-larger ring,
// matching how published crochet charts draw decreases. Shrinking the ring
// instead would tuck it back inside earlier, larger rounds.
export function nextRadius(
	prevRadius: number,
	prevCount: number,
	stitchCount: number,
	step: number,
): number {
	const circRadius = (stitchCount * MIN_ARC) / (2 * Math.PI);
	if (prevCount < 0) return Math.max(BASE_RADIUS, circRadius);
	return Math.max(prevRadius + step, circRadius);
}
