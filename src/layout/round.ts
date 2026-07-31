import type { ColorMarker, CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, symbolArc, symbolExtent, SYMBOL_CLEARANCE } from './constants';
import { buildRingGuide } from './grid-guide';
import { normalize } from './normalize';
import { centerExtent, placeUnitPolar, pushCenterAnchor } from './polar';
import { layoutRoundGraph } from './round-graph';
import { placeSeam, seamArc, type SeamContents } from './seam';
import {
	firstDrawnSymbol,
	outputStitches,
	roundInstructions,
	tagLoop,
	unitSymbols,
	unroll,
	type ColorState,
	type LayoutUnit,
} from './steps';

export function layoutRound(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const style = options.roundStyle;
	if (style === 'japanese' || style === 'continuous') {
		return layoutRoundGraph(ast, options, style, (previousRadius, previousCount, circumference) =>
			nextRadius(previousRadius, previousCount, circumference, options.ringSpacing, innerRadiusOf(ast)),
		);
	}
	return layoutRoundStandard(ast, options);
}

// Closest the first round may sit to the middle: the chart's own base radius, or
// far enough out to clear whatever its center anchor is drawn as, whichever is
// larger — so round 1 is never laid over the ring it is worked into, however big
// that ring and those first stitches are drawn.
function innerRadiusOf(ast: CrochetAst): number {
	return Math.max(BASE_RADIUS, centerExtent(ast) + symbolExtent(firstDrawnSymbol(ast)) + SYMBOL_CLEARANCE);
}

function symbolsOf(units: readonly LayoutUnit[]): string[] {
	return units.flatMap(unitSymbols);
}

// How much of the ring these units need: the room each symbol they draw takes.
function unitsArc(units: readonly LayoutUnit[]): number {
	return symbolsOf(units).reduce((total, symbol) => total + symbolArc(symbol), 0);
}

// Standard style: each round's units spread evenly around the circle, starting
// at the top. Stitch-to-stitch correspondence is only implied by the counts —
// use style: book for the parent-aligned drawing.
function layoutRoundStandard(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const innerRadius = innerRadiusOf(ast);
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
		// Even spacing still has a seam — the round's last unit and its first are
		// a step apart, and the chain and join are drawn in that step — so the ring
		// is sized to hold both what the round draws and what its seam does.
		const drawn = symbolsOf(units);
		const seam: SeamContents = {
			lastStitch: drawn[drawn.length - 1] ?? 'sc',
			firstStitch: drawn[0] ?? 'sc',
			start: symbolsOf(opening),
			end: symbolsOf(end),
		};
		radius = nextRadius(radius, prevCount, unitsArc(units) + seamArc(seam), options.ringSpacing, innerRadius);

		const angleStep = 360 / units.length;
		const start = items.length;
		// Drawn as worked: opening chain, then the round's stitches, then the join
		// that closes it. The chain and the join share the round's seam, laid out
		// there by the same rules the graph-driven styles use (layout/seam.ts) so
		// neither lands on a stitch or on the other.
		const region = placeSeam(seam, -90 - (units.length - 1) * angleStep, -90 - 360, radius);
		opening.forEach((unit, index) => {
			placeUnitPolar(items, unit, radius, region.start[index] ?? region.step, rowIndex, undefined);
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
			placeUnitPolar(items, unit, radius, region.end[index] ?? region.step, rowIndex, undefined);
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
//
// `circumference` is how long the ring has to be to draw this round — measured
// from the round's own symbols and from what it draws at its seam, not from a
// stitch count times an assumed slot width — so a round is never asked to fit
// into a ring shorter than what it draws.
export function nextRadius(
	prevRadius: number,
	prevCount: number,
	circumference: number,
	step: number,
	innerRadius: number,
): number {
	const fitRadius = circumference / (2 * Math.PI);
	if (prevCount < 0) return Math.max(innerRadius, fitRadius);
	return Math.max(prevRadius + step, fitRadius);
}
