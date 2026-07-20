import { PADDING } from '../layout/constants';
import type { GridLayoutResult, ResolvedGridOptions } from '../types';

export function calculateGridLayout(options: ResolvedGridOptions): GridLayoutResult {
	return options.shape === 'polar' ? layoutPolarGrid(options) : layoutRectGrid(options);
}

// Rounds concentric ring circles spaced by ringSpacing, plus columns radial
// spokes from the center to the outermost ring, evenly spaced by angle.
function layoutPolarGrid(options: ResolvedGridOptions): GridLayoutResult {
	const outerRadius = options.rounds * options.ringSpacing;
	const size = outerRadius * 2 + PADDING * 2;
	const center = size / 2;

	const circles = Array.from({ length: options.rounds }, (_, i) => ({
		cx: center,
		cy: center,
		r: (i + 1) * options.ringSpacing,
	}));

	const angleStep = 360 / options.columns;
	const lines = Array.from({ length: options.columns }, (_, k) => {
		const angle = ((-90 + k * angleStep) * Math.PI) / 180;
		return {
			x1: center,
			y1: center,
			x2: center + outerRadius * Math.cos(angle),
			y2: center + outerRadius * Math.sin(angle),
		};
	});

	return { width: size, height: size, circles, lines };
}

// A rows-by-columns mesh: rows+1 horizontal lines and columns+1 vertical
// lines, each cell sized by ringSpacing (reused here as the cell size).
function layoutRectGrid(options: ResolvedGridOptions): GridLayoutResult {
	const cellSize = options.ringSpacing;
	const gridWidth = options.columns * cellSize;
	const gridHeight = options.rows * cellSize;
	const width = gridWidth + PADDING * 2;
	const height = gridHeight + PADDING * 2;

	const horizontal = Array.from({ length: options.rows + 1 }, (_, i) => {
		const y = PADDING + i * cellSize;
		return { x1: PADDING, y1: y, x2: PADDING + gridWidth, y2: y };
	});
	const vertical = Array.from({ length: options.columns + 1 }, (_, j) => {
		const x = PADDING + j * cellSize;
		return { x1: x, y1: PADDING, x2: x, y2: PADDING + gridHeight };
	});

	return { width, height, circles: [], lines: [...horizontal, ...vertical] };
}
