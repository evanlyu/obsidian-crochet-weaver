import type { CrochetAst, LayoutResult, RenderItem, RowConnector } from '../types';
import { GROUP_FAN_ANGLE, GROUP_FAN_SPREAD, ROW_HEIGHT, STITCH_WIDTH } from './constants';
import { normalize } from './normalize';
import { flattenGroup, tagLoop, unroll } from './steps';

export function layoutFlat(ast: CrochetAst): LayoutResult {
	const items: RenderItem[] = [];
	const rowConnectors: RowConnector[] = [];
	let direction = 1;
	let prevRowEndX = 0;
	let prevRowY = 0;

	ast.rows.forEach((row, rowIndex) => {
		const y = -rowIndex * ROW_HEIGHT;
		let x = rowIndex === 0 ? 0 : prevRowEndX;
		if (rowIndex > 0) {
			rowConnectors.push({ x: prevRowEndX, fromY: prevRowY, toY: y });
		}
		const start = items.length;

		unroll(row.steps).forEach((unit, unitIndex) => {
			if (unit.type === 'StitchNode') {
				items.push({ symbol: unit.stitch, x, y, rotation: 0, rowIndex, unitIndex });
			} else {
				const children = flattenGroup(unit);
				const mid = (children.length - 1) / 2;
				children.forEach((stitch, i) => {
					items.push({
						symbol: stitch,
						x: x + (i - mid) * GROUP_FAN_SPREAD,
						y,
						rotation: (i - mid) * GROUP_FAN_ANGLE,
						rowIndex,
						unitIndex,
					});
				});
			}
			prevRowEndX = x;
			x += STITCH_WIDTH * direction;
		});

		tagLoop(items, start, row.loop);
		direction *= -1;
		prevRowY = y;
	});

	return normalize(items, rowConnectors);
}
