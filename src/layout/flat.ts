import type {
	ChartGridGuide,
	ColorMarker,
	CrochetAst,
	LayoutOptions,
	LayoutResult,
	RenderItem,
	RowConnector,
} from '../types';
import { GROUP_FAN_ANGLE, GROUP_FAN_SPREAD, ROW_HEIGHT, symbolArc } from './constants';
import { normalize } from './normalize';
import { flattenGroup, tagLoop, unitSymbols, unroll, type ColorState } from './steps';

// How far apart a flat chart's stitches sit, in px: the chart's own pitch, or
// what its widest symbol needs, whichever is larger. One pitch for the whole
// chart rather than per stitch, so its rows still line up in columns and the
// mesh guide still has columns to draw — but a chart of doubles or trebles is
// spaced for the symbols it actually draws instead of for single crochet.
function chartPitch(ast: CrochetAst): number {
	let pitch = 0;
	for (const row of ast.rows) {
		for (const unit of unroll(row.steps)) {
			for (const symbol of unitSymbols(unit)) pitch = Math.max(pitch, symbolArc(symbol));
		}
	}
	return Math.max(symbolArc('sc'), pitch);
}

export function layoutFlat(ast: CrochetAst, options: LayoutOptions): LayoutResult {
	const stitchWidth = chartPitch(ast);
	// Rows are as far apart as the chart's own row height, or as the symbols need
	// if those are taller than it — a row of trebles is taller than a row of
	// single crochet, and its rows must not touch.
	const rowHeight = Math.max(ROW_HEIGHT, stitchWidth);
	const items: RenderItem[] = [];
	const rowConnectors: RowConnector[] = [];
	let direction = 1;
	let prevRowEndX = 0;
	let prevRowY = 0;
	let minSlotX = Infinity;
	let maxSlotX = -Infinity;
	const colorState: ColorState = {};
	const colorMarkers: ColorMarker[] = [];
	let previousColor: string | undefined;

	ast.rows.forEach((row, rowIndex) => {
		const y = -rowIndex * rowHeight;
		let x = rowIndex === 0 ? 0 : prevRowEndX;
		if (rowIndex > 0) {
			rowConnectors.push({ x: prevRowEndX, fromY: prevRowY, toY: y });
		}
		const start = items.length;
		const units = unroll(row.steps, colorState);

		units.forEach((unit, unitIndex) => {
			minSlotX = Math.min(minSlotX, x);
			maxSlotX = Math.max(maxSlotX, x);
			const itemStart = items.length;
			if (unit.type === 'StitchNode') {
				items.push({ symbol: unit.stitch, x, y, rotation: 0, rowIndex, unitIndex, color: unit.color });
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
						color: unit.color,
					});
				});
			}
			if (unit.color !== undefined && unit.color !== previousColor) {
				const first = items[itemStart];
				if (first) colorMarkers.push({ x: first.x, y: first.y, color: unit.color });
				previousColor = unit.color;
			}
			prevRowEndX = x;
			x += stitchWidth * direction;
		});

		tagLoop(items, start, row.loop);
		direction *= -1;
		prevRowY = y;
	});

	const gridGuide = options.grid
		? buildMeshGuide(ast.rows.length, minSlotX, maxSlotX, stitchWidth, rowHeight, options.gridCount, options.gridColumns)
		: undefined;
	return normalize(items, rowConnectors, gridGuide, colorMarkers);
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
	stitchWidth: number,
	rowHeight: number,
	gridCount: number | undefined,
	gridColumns: number | undefined,
): ChartGridGuide | undefined {
	if (actualRows === 0) return undefined;

	const hasStitches = Number.isFinite(minSlotX) && Number.isFinite(maxSlotX);
	const realMinX = hasStitches ? minSlotX : 0;
	const actualColumns = hasStitches ? Math.round((maxSlotX - realMinX) / stitchWidth) + 1 : 0;

	const rows = Math.max(actualRows, gridCount ?? 0);
	const columns = Math.max(actualColumns, gridColumns ?? 0, 1);

	const yMax = rowHeight / 2;
	const yMin = -(rows - 1) * rowHeight - rowHeight / 2;
	const xMin = realMinX - stitchWidth / 2;
	const xMax = xMin + columns * stitchWidth;

	const horizontal = Array.from({ length: rows + 1 }, (_, i) => {
		const y = -i * rowHeight + rowHeight / 2;
		return { x1: xMin, y1: y, x2: xMax, y2: y };
	});
	const vertical = Array.from({ length: columns + 1 }, (_, j) => {
		const x = xMin + j * stitchWidth;
		return { x1: x, y1: yMin, x2: x, y2: yMax };
	});

	return { circles: [], lines: [...horizontal, ...vertical] };
}
