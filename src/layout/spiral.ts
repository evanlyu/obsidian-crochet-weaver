import type { ColorMarker, CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, MIN_ARC } from './constants';
import { buildRingGuide } from './grid-guide';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor } from './polar';
import { tagLoop, unroll, type ColorState } from './steps';

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

	ast.rows.forEach((row, rowIndex) => {
		const start = items.length;
		const units = unroll(row.steps, colorState);
		let radius = BASE_RADIUS;
		units.forEach((unit, unitIndex) => {
			radius = BASE_RADIUS + (swept / 360) * options.ringSpacing;
			const itemStart = items.length;
			placeUnitPolar(items, unit, radius, phi, rowIndex, unitIndex);
			if (unit.color !== undefined && unit.color !== previousColor) {
				const first = items[itemStart];
				if (first) colorMarkers.push({ x: first.x, y: first.y, color: unit.color });
				previousColor = unit.color;
			}
			const stepDeg = (MIN_ARC / radius) * (180 / Math.PI);
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
