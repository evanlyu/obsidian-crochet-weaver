import type { CrochetAst, RenderItem } from '../types';
import { CH_RING_COUNT, CH_RING_RADIUS, GROUP_FAN_ARC_DEG } from './constants';
import { flattenGroup, type LayoutUnit } from './steps';

export function pushCenterAnchor(ast: CrochetAst, items: RenderItem[]) {
	const anchor = ast.rows[0]?.anchor ?? writtenAnchor(ast);
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
	rowIndex?: number,
	unitIndex?: number,
) {
	if (unit.type === 'StitchNode') {
		items.push(polarItem(unit.stitch, radius, phiDeg, rowIndex, unitIndex, unit.color));
	} else {
		const children = flattenGroup(unit);
		const mid = (children.length - 1) / 2;
		children.forEach((stitch, i) => {
			items.push(
				polarItem(stitch, radius, phiDeg - (i - mid) * GROUP_FAN_ARC_DEG, rowIndex, unitIndex, unit.color),
			);
		});
	}
}

function polarItem(
	symbol: string,
	radius: number,
	phiDeg: number,
	rowIndex?: number,
	unitIndex?: number,
	color?: string,
): RenderItem {
	const rad = (phiDeg * Math.PI) / 180;
	return {
		symbol,
		x: radius * Math.cos(rad),
		y: radius * Math.sin(rad),
		rotation: symbolAngle(phiDeg),
		rowIndex,
		unitIndex,
		color,
	};
}

// Every symbol on a round or spiral chart faces outward, so its base sits
// against the round below and its top faces the round above — which is how the
// stitch is really worked, and what makes a back- or front-loop marker point at
// the loop it means instead of at the bottom of the page.
export // A first round may name its centre as a step ("R1: mr, ch, sc6, slst")
// instead of as an anchor ("R1: 6 sc in MR"); both mean the same ring.
function writtenAnchor(ast: CrochetAst): 'MR' | undefined {
	const opens = ast.rows[0]?.steps[0];
	return opens?.type === 'StitchNode' && opens.stitch === 'MR' ? 'MR' : undefined;
}

export function symbolAngle(phiDeg: number): number {
	return phiDeg + 90;
}
