import type { CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, MIN_ARC, MIN_RADIUS } from './constants';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor } from './polar';
import { isSlSt, outputStitches, tagLoop, unroll } from './steps';

export function layoutRound(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);
	let radius = 0;
	let prevCount = -1;

	ast.rows.forEach((row, rowIndex) => {
		const units = unroll(row.steps);
		const join =
			units.length > 1 && isSlSt(units[units.length - 1])
				? units.pop()
				: undefined;
		if (units.length === 0) return;

		const stitchCount = units.reduce((sum, unit) => sum + outputStitches(unit), 0);
		radius = nextRadius(radius, prevCount, stitchCount, options.ringSpacing);
		const angleStep = 360 / units.length;
		const start = items.length;
		units.forEach((unit, i) => {
			placeUnitPolar(items, unit, radius, -90 - i * angleStep, options.rotation, rowIndex, i);
		});
		if (join) {
			placeUnitPolar(items, join, radius, -90 + angleStep / 2, options.rotation, rowIndex, undefined);
		}
		tagLoop(items, start, row.loop);
		prevCount = stitchCount;
	});

	let nextRoundMarker;
	if (options.showNextRoundMarker && ast.rows.length > 0) {
		nextRoundMarker = { x: 0, y: -radius, rotation: 0 };
	}

	return normalize(items, nextRoundMarker);
}

function nextRadius(
	prevRadius: number,
	prevCount: number,
	stitchCount: number,
	step: number,
): number {
	const circRadius = (stitchCount * MIN_ARC) / (2 * Math.PI);
	if (prevCount < 0) return Math.max(BASE_RADIUS, circRadius);
	if (stitchCount < prevCount) return Math.max(MIN_RADIUS, prevRadius - step);
	return Math.max(prevRadius + step, circRadius);
}
