import type { CrochetAst, GridPoint, RenderItem, SymbolRotation } from '../types';
import {
	CH_RING_COUNT,
	CH_RING_RADIUS,
	GROUP_FAN_ARC_DEG,
	hasFixedOrientation,
} from './constants';
import { flattenGroup, type LayoutUnit } from './steps';

export function pushCenterAnchor(ast: CrochetAst, items: RenderItem[]) {
	const anchor = ast.rows[0]?.anchor;
	if (anchor === 'MR') {
		items.push({ symbol: 'MR', x: 0, y: 0, rotation: 0 });
	} else if (anchor === 'ch ring') {
		for (let i = 0; i < CH_RING_COUNT; i++) {
			const phiDeg = -90 - i * (360 / CH_RING_COUNT);
			const rad = (phiDeg * Math.PI) / 180;
			items.push({
				symbol: 'ch',
				x: CH_RING_RADIUS * Math.cos(rad),
				y: CH_RING_RADIUS * Math.sin(rad),
				rotation: phiDeg + 90,
			});
		}
	}
}

export function placeUnitPolar(
	items: RenderItem[],
	unit: LayoutUnit,
	radius: number,
	phiDeg: number,
	rotation: SymbolRotation,
	rowIndex?: number,
	unitIndex?: number,
	glyphPoints?: readonly GridPoint[],
) {
	if (unit.type === 'StitchNode') {
		items.push(polarItem(unit.stitch, radius, phiDeg, rotation, rowIndex, unitIndex, unit.color, glyphPoints));
	} else {
		const children = flattenGroup(unit);
		const mid = (children.length - 1) / 2;
		children.forEach((stitch, i) => {
			items.push(
				polarItem(
					stitch,
					radius,
					phiDeg - (i - mid) * GROUP_FAN_ARC_DEG,
					rotation,
					rowIndex,
					unitIndex,
					unit.color,
				),
			);
		});
	}
}

function polarItem(
	symbol: string,
	radius: number,
	phiDeg: number,
	rotation: SymbolRotation,
	rowIndex?: number,
	unitIndex?: number,
	color?: string,
	glyphPoints?: readonly GridPoint[],
): RenderItem {
	const rad = (phiDeg * Math.PI) / 180;
	return {
		symbol,
		x: radius * Math.cos(rad),
		y: radius * Math.sin(rad),
		// glyphPoints are already absolute offsets, so a stretched glyph needs
		// no rotation of its own.
		rotation: glyphPoints !== undefined ? 0 : symbolAngle(symbol, phiDeg, rotation),
		rowIndex,
		unitIndex,
		color,
		glyphPoints,
	};
}

function symbolAngle(
	symbol: string,
	phiDeg: number,
	rotation: SymbolRotation,
): number {
	const outward = phiDeg + 90;
	if (rotation === 'none') return 0;
	if (rotation === 'all') return outward;
	return hasFixedOrientation(symbol) ? 0 : outward;
}
