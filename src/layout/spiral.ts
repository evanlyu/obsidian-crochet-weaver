import type { CrochetAst, LayoutOptions, LayoutResult, RenderItem } from '../types';
import { BASE_RADIUS, MIN_ARC } from './constants';
import { normalize } from './normalize';
import { placeUnitPolar, pushCenterAnchor } from './polar';
import { tagLoop, unroll } from './steps';

export function layoutSpiral(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const items: RenderItem[] = [];
	pushCenterAnchor(ast, items);
	let phi = -90;
	let swept = 0;

	ast.rows.forEach((row, rowIndex) => {
		const start = items.length;
		unroll(row.steps).forEach((unit, unitIndex) => {
			const radius = BASE_RADIUS + (swept / 360) * options.ringSpacing;
			placeUnitPolar(items, unit, radius, phi, options.rotation, rowIndex, unitIndex);
			const stepDeg = (MIN_ARC / radius) * (180 / Math.PI);
			phi -= stepDeg;
			swept += stepDeg;
		});
		tagLoop(items, start, row.loop);
	});

	return normalize(items);
}
