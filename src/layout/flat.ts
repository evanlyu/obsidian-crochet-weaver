import type { ChartGridGuide, CrochetAst, LayoutOptions, LayoutResult, RenderItem, RowConnector } from '../types';
import { GROUP_FAN_ANGLE, GROUP_FAN_SPREAD, ROW_HEIGHT, STITCH_WIDTH } from './constants';
import { normalize } from './normalize';
import { flattenGroup, tagLoop, unroll } from './steps';

export function layoutFlat(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const items: RenderItem[] = [];
	const rowConnectors: RowConnector[] = [];
	let direction = 1;
	let prevRowEndX = 0;
	let prevRowY = 0;
	let maxUnitsInRow = 0;

	ast.rows.forEach((row, rowIndex) => {
		const y = -rowIndex * ROW_HEIGHT;
		let x = rowIndex === 0 ? 0 : prevRowEndX;
		if (rowIndex > 0) {
			rowConnectors.push({ x: prevRowEndX, fromY: prevRowY, toY: y });
		}
		const start = items.length;
		const units = unroll(row.steps);

		units.forEach((unit, unitIndex) => {
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
		maxUnitsInRow = Math.max(maxUnitsInRow, units.length);
	});

	const gridGuide = options.grid
		? buildMeshGuide(ast.rows.length, maxUnitsInRow, options.gridCount, options.gridColumns)
		: undefined;
	return normalize(items, rowConnectors, gridGuide);
}

// A plain row/column mesh over the chart's real extent — a reference frame,
// not a claim that every individual stitch (past row 0) sits on an
// intersection, since rows alternate direction and can differ in length.
function buildMeshGuide(
	actualRows: number,
	actualColumns: number,
	gridCount: number | undefined,
	gridColumns: number | undefined,
): ChartGridGuide | undefined {
	if (actualRows === 0) return undefined;

	const rows = Math.max(actualRows, gridCount ?? 0);
	const columns = Math.max(actualColumns, gridColumns ?? 0, 1);

	const yMax = ROW_HEIGHT / 2;
	const yMin = -(rows - 1) * ROW_HEIGHT - ROW_HEIGHT / 2;
	const xMin = -STITCH_WIDTH / 2;
	const xMax = (columns - 1) * STITCH_WIDTH + STITCH_WIDTH / 2;

	const horizontal = Array.from({ length: rows + 1 }, (_, i) => {
		const y = -i * ROW_HEIGHT + ROW_HEIGHT / 2;
		return { x1: xMin, y1: y, x2: xMax, y2: y };
	});
	const vertical = Array.from({ length: columns + 1 }, (_, j) => {
		const x = j * STITCH_WIDTH - STITCH_WIDTH / 2;
		return { x1: x, y1: yMin, x2: x, y2: yMax };
	});

	return { circles: [], lines: [...horizontal, ...vertical] };
}
