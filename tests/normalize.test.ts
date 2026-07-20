import { describe, expect, it } from 'vitest';
import { normalize } from '../src/layout/normalize';
import { PADDING } from '../src/layout/constants';
import type { RenderItem } from '../src/types';

describe('normalize with a grid guide', () => {
	const item: RenderItem = { symbol: 'sc', x: 0, y: 0, rotation: 0 };

	it('passes an undefined gridGuide through unchanged', () => {
		const result = normalize([{ ...item }]);
		expect(result.gridGuide).toBeUndefined();
	});

	it('shifts guide circles and lines by the same offset as items', () => {
		const items: RenderItem[] = [{ ...item, x: 0, y: 0 }];
		const result = normalize(items, undefined, {
			circles: [{ cx: 0, cy: 0, r: 10 }],
			lines: [{ x1: 0, y1: 0, x2: 10, y2: 0 }],
		});

		const dx = result.items[0]!.x - 0;
		const dy = result.items[0]!.y - 0;
		expect(result.gridGuide?.circles[0]).toEqual({ cx: dx, cy: dy, r: 10 });
		expect(result.gridGuide?.lines[0]).toEqual({ x1: dx, y1: dy, x2: 10 + dx, y2: dy });
	});

	it('expands the bounding box to include a guide larger than the stitch items', () => {
		const items: RenderItem[] = [{ ...item, x: 0, y: 0 }];
		const withoutGuide = normalize([{ ...items[0]! }]);
		const withGuide = normalize([{ ...items[0]! }], undefined, {
			circles: [{ cx: 0, cy: 0, r: 200 }],
			lines: [],
		});

		expect(withGuide.width).toBeGreaterThan(withoutGuide.width);
		expect(withGuide.height).toBeGreaterThan(withoutGuide.height);
		expect(withGuide.width).toBeCloseTo(400 + PADDING * 2);
	});
});
