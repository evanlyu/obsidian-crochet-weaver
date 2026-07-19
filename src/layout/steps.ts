import type { AstNode, GroupNode, RenderItem, RowNode, StitchNode } from '../types';

export type LayoutUnit = StitchNode | GroupNode;

export function unroll(steps: AstNode[]): LayoutUnit[] {
	const result: LayoutUnit[] = [];
	for (const step of steps) {
		if (step.type === 'RepeatNode') {
			for (let i = 0; i < step.count; i++) {
				result.push(...unroll(step.children));
			}
		} else if (step.type === 'StitchNode') {
			for (let i = 0; i < step.count; i++) {
				result.push({ ...step, count: 1 });
			}
		} else {
			result.push(step);
		}
	}
	return result;
}

export function flattenGroup(group: GroupNode): string[] {
	const names: string[] = [];
	for (const child of unroll(group.children)) {
		if (child.type === 'StitchNode') names.push(child.stitch);
		else names.push(...flattenGroup(child));
	}
	return names;
}

export function outputStitches(unit: LayoutUnit): number {
	if (unit.type === 'GroupNode') {
		return flattenGroup(unit).reduce((sum, name) => sum + stitchWeight(name), 0);
	}
	return stitchWeight(unit.stitch);
}

export function roundStitchCount(row: RowNode): number {
	return poppedUnits(row).reduce((sum, unit) => sum + outputStitches(unit), 0);
}

// Per-unit output-stitch weights for a row, in the same order/indexing as
// rendered items and roundStitchCount — lets a counter advance by whichever
// unit is next (an `inc` is one physical stitch worth 2 output stitches; you
// don't crochet it in two clicks).
export function unitStitchCounts(row: RowNode): number[] {
	return poppedUnits(row).map(outputStitches);
}

function poppedUnits(row: RowNode): LayoutUnit[] {
	const units = unroll(row.steps);
	if (units.length > 1 && isSlSt(units[units.length - 1])) units.pop();
	return units;
}

export function isSlSt(unit: LayoutUnit | undefined): boolean {
	return unit?.type === 'StitchNode' && unit.stitch === 'sl st';
}

export function tagLoop(items: RenderItem[], start: number, loop?: 'blo' | 'flo') {
	if (!loop) return;
	for (const item of items.slice(start)) item.loop = loop;
}

function stitchWeight(stitch: string): number {
	return stitch === 'inc' ? 2 : 1;
}
