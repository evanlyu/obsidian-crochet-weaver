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
	let minSlotX = Infinity;
	let maxSlotX = -Infinity;

	ast.rows.forEach((row, rowIndex) => {
		const y = -rowIndex * ROW_HEIGHT;
		let x = rowIndex === 0 ? 0 : prevRowEndX;
		if (rowIndex > 0) {
			rowConnectors.push({ x: prevRowEndX, fromY: prevRowY, toY: y });
		}
		const start = items.length;
		const units = unroll(row.steps);

		units.forEach((unit, unitIndex) => {
			minSlotX = Math.min(minSlotX, x);
			maxSlotX = Math.max(maxSlotX, x);
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

	const gridGuide = options.grid
		? buildMeshGuide(ast.rows.length, minSlotX, maxSlotX, options.gridCount, options.gridColumns)
		: undefined;
	return normalize(items, rowConnectors, gridGuide);
}

// A plain row/column mesh over the chart's real extent. Flat rows alternate
// direction (boustrophedon), so a row that's wider than the one before it
// can drift the mesh's left edge past column 0 in either direction — the
// mesh is anchored to stitches' real min/max x, not assumed to start where
// row 0 did, or every row past the first would draw outside it.
function buildMeshGuide(
	actualRows: number,
	minSlotX: number,
	maxSlotX: number,
	gridCount: number | undefined,
	gridColumns: number | undefined,
): ChartGridGuide | undefined {
	if (actualRows === 0) return undefined;

	const hasStitches = Number.isFinite(minSlotX) && Number.isFinite(maxSlotX);
	const realMinX = hasStitches ? minSlotX : 0;
	const actualColumns = hasStitches ? Math.round((maxSlotX - realMinX) / STITCH_WIDTH) + 1 : 0;

	const rows = Math.max(actualRows, gridCount ?? 0);
	const columns = Math.max(actualColumns, gridColumns ?? 0, 1);

	const yMax = ROW_HEIGHT / 2;
	const yMin = -(rows - 1) * ROW_HEIGHT - ROW_HEIGHT / 2;
	const xMin = realMinX - STITCH_WIDTH / 2;
	const xMax = xMin + columns * STITCH_WIDTH;

	const horizontal = Array.from({ length: rows + 1 }, (_, i) => {
		const y = -i * ROW_HEIGHT + ROW_HEIGHT / 2;
		return { x1: xMin, y1: y, x2: xMax, y2: y };
	});
	const vertical = Array.from({ length: columns + 1 }, (_, j) => {
		const x = xMin + j * STITCH_WIDTH;
		return { x1: x, y1: yMin, x2: x, y2: yMax };
	});

	return { circles: [], lines: [...horizontal, ...vertical] };
}
