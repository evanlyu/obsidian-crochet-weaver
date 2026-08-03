import { describe, expect, it } from 'vitest';
import {
	type GraphStitch,
	type StitchMappingGroup,
} from '../src/layout/graph';
import { buildShapingMark } from '../src/layout/shaping';

function stitch(id: string, angle: number, roundIndex: number): GraphStitch {
	const radians = angle * Math.PI / 180;
	return {
		id,
		roundIndex,
		stitchIndex: 0,
		unitIndex: 0,
		symbol: 'sc',
		sourceStitchIds: ['source'],
		targetStitchIds: [],
		sourceSlots: [0],
		shaping: 'increase',
		groupIndex: 0,
		layout: {
			angle,
			radius: 40,
			x: 40 * Math.cos(radians),
			y: 40 * Math.sin(radians),
			rotation: angle + 90,
		},
	};
}

function bearing(point: { x: number; y: number }): number {
	return Math.atan2(point.y, point.x) * 180 / Math.PI;
}

describe('increase shaping marks', () => {
	it('keeps all three V points aimed at the parent and the two stitches it makes', () => {
		const parent = stitch('parent', 0, 0);
		const children = [
			stitch('left', 18, 1),
			stitch('right', -42, 1),
		];
		const group: StitchMappingGroup = {
			type: 'increase',
			roundIndex: 1,
			unitIndex: 0,
			sourceIds: [parent.id],
			targetIds: children.map((child) => child.id),
			mark: 'increase',
		};

		const mark = buildShapingMark(group, [parent], children, {
			inner: 20,
			outer: 60,
			radius: 40,
		});
		const [first, apex, last] = mark?.segments[0] ?? [];
		if (!first || !apex || !last) throw new Error('expected a three-point increase V');

		expect(bearing(apex)).toBeCloseTo(parent.layout?.angle ?? 0, 6);
		expect(bearing(first)).toBeCloseTo(children[0]?.layout?.angle ?? 0, 6);
		expect(bearing(last)).toBeCloseTo(children[1]?.layout?.angle ?? 0, 6);
	});
});
