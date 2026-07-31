import type { ColorMarker, CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { arcToDegrees } from './angles';
import { BASE_RADIUS, symbolArc, symbolExtent, SYMBOL_CLEARANCE } from './constants';
import { buildRingGuide } from './grid-guide';
import { normalize } from './normalize';
import { centerExtent, placeUnitPolar, pushCenterAnchor } from './polar';
import { firstDrawnSymbol, tagLoop, unitSymbols, unroll, type ColorState, type LayoutUnit } from './steps';

// How much of the spiral one step of the pattern takes, as arc length in px:
// the room every symbol it draws needs. A group draws several, so it advances
// the spiral by all of them rather than by one stitch's worth.
function unitArc(unit: LayoutUnit): number {
	return unitSymbols(unit).reduce((total, symbol) => total + symbolArc(symbol), 0);
}

export function layoutSpiral(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);
	let phi = -90;
	let swept = 0;
	// A spiral has no discrete rounds; the guide ring for row N approximates
	// "round N" as the radius reached by the end of that row.
	const rowEndRadii: number[] = [];
	let lastRowUnitCount = 0;
	const colorState: ColorState = {};
	const colorMarkers: ColorMarker[] = [];
	let previousColor: string | undefined;

	// Where the spiral starts: outside whatever the chart's center anchor is drawn
	// as, with room for the first symbol beside it, so the first stitches are never
	// laid over the ring they are worked into.
	const innerRadius = Math.max(
		BASE_RADIUS,
		centerExtent(ast) + symbolExtent(firstDrawnSymbol(ast)) + SYMBOL_CLEARANCE,
	);

	ast.rows.forEach((row, rowIndex) => {
		const start = items.length;
		const units = unroll(row.steps, colorState);
		let radius = innerRadius;
		units.forEach((unit, unitIndex) => {
			radius = innerRadius + (swept / 360) * options.ringSpacing;
			const itemStart = items.length;
			placeUnitPolar(items, unit, radius, phi, rowIndex, unitIndex);
			if (unit.color !== undefined && unit.color !== previousColor) {
				const first = items[itemStart];
				if (first) colorMarkers.push({ x: first.x, y: first.y, color: unit.color });
				previousColor = unit.color;
			}
			const stepDeg = arcToDegrees(unitArc(unit), radius);
			phi -= stepDeg;
			swept += stepDeg;
		});
		tagLoop(items, start, row.loop);
		if (units.length > 0) {
			rowEndRadii.push(radius);
			lastRowUnitCount = units.length;
		}
	});

	const gridGuide = options.grid
		? buildRingGuide(rowEndRadii, lastRowUnitCount, options.ringSpacing, options.gridCount, options.gridColumns)
		: undefined;
	return normalize(items, undefined, gridGuide, colorMarkers);
}
