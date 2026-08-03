import type { CrochetAst, RenderItem } from '../types';
import { CENTER_RING } from '../render/symbols';
import { arcToDegrees } from './angles';
import { CH_RING_COUNT, chRingRadius, OPENING_TURN_SCALE, symbolExtent, SYMBOL_CLEARANCE } from './constants';
import { flattenGroup, type LayoutUnit } from './steps';

export function pushCenterAnchor(ast: CrochetAst, items: RenderItem[]) {
	const anchor = ast.rows[0]?.anchor ?? writtenAnchor(ast);
	if (anchor === CENTER_RING) {
		items.push({ symbol: 'MR', x: 0, y: 0, rotation: 0 });
	} else if (anchor === 'ch ring') {
		const ringRadius = chRingRadius();
		for (let i = 0; i < CH_RING_COUNT; i++) {
			const phiDeg = -90 - i * (360 / CH_RING_COUNT);
			const rad = (phiDeg * Math.PI) / 180;
			items.push({
				symbol: 'ch',
				x: ringRadius * Math.cos(rad),
				y: ringRadius * Math.sin(rad),
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
	// What the round opens with, rather than a stitch of it: drawn a quarter
	// turn round, lying across the ring instead of along it, and a little
	// smaller than the stitches — it is the turn up to the first stitch, not a
	// stitch standing in the ring (see placeStart in layout/seam.ts).
	opening = false,
) {
	if (unit.type === 'StitchNode') {
		items.push(polarItem(unit.stitch, radius, phiDeg, rowIndex, unitIndex, unit.color, opening));
	} else {
		const children = flattenGroup(unit);
		const mid = (children.length - 1) / 2;
		const fan = fanStep(children, radius);
		children.forEach((stitch, i) => {
			items.push(polarItem(stitch, radius, phiDeg - (i - mid) * fan, rowIndex, unitIndex, unit.color, opening));
		});
	}
}

// How far apart the stitches of a group fan out around the one place they are
// all worked into, in degrees. Taken from the symbols themselves at the radius
// they are drawn on — a fan of five doubles needs more room than one of two
// chains, and the same arc is a wider angle on a small round than on a large
// one — rather than a fixed angle that is too tight for one and too loose for
// the other.
function fanStep(children: readonly string[], radius: number): number {
	if (radius <= 0 || children.length < 2) return 0;
	let arc = 0;
	for (let i = 0; i + 1 < children.length; i++) {
		const here = children[i];
		const next = children[i + 1];
		if (here === undefined || next === undefined) continue;
		arc = Math.max(arc, symbolExtent(here) + symbolExtent(next) + SYMBOL_CLEARANCE);
	}
	return arcToDegrees(arc, radius);
}

// How far the chart's center anchor reaches out from the middle: a magic ring's
// own radius, a chain ring's outer edge, or nothing where a chart has neither.
// What is drawn around the center is kept outside it.
export function centerExtent(ast: CrochetAst): number {
	const anchor = ast.rows[0]?.anchor ?? writtenAnchor(ast);
	if (anchor === CENTER_RING) return symbolExtent(CENTER_RING);
	if (anchor === 'ch ring') return chRingRadius() + symbolExtent('ch');
	return 0;
}

function polarItem(
	symbol: string,
	radius: number,
	phiDeg: number,
	rowIndex?: number,
	unitIndex?: number,
	color?: string,
	opening = false,
): RenderItem {
	const rad = (phiDeg * Math.PI) / 180;
	return {
		symbol,
		x: radius * Math.cos(rad),
		y: radius * Math.sin(rad),
		rotation: symbolAngle(phiDeg) + (opening ? QUARTER_TURN : 0),
		rowIndex,
		unitIndex,
		color,
		...(opening ? { turned: true, scale: OPENING_TURN_SCALE } : {}),
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
	return opens?.type === 'StitchNode' && opens.stitch === CENTER_RING ? CENTER_RING : undefined;
}

export function symbolAngle(phiDeg: number): number {
	return phiDeg + 90;
}

// Turning a symbol from lying along the round to lying across it.
export const QUARTER_TURN = 90;
