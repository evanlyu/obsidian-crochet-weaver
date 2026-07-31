import type { AstNode, CrochetAst, GroupNode, RenderItem, RowNode, StitchNode } from '../types';

export type LayoutUnit = StitchNode | GroupNode;

// Tracks the yarn color a ColorChangeNode set, threaded through one or more
// unroll() calls. Pass the same object across a chart's rows so a color set
// in one row still applies to the next, matching how yarn color persists
// until explicitly changed again.
export interface ColorState {
	current?: string;
}

// ColorChangeNode carries no width of its own: it sets colorState.current
// and is dropped, tagging every StitchNode/GroupNode unit produced from here
// on (in this call and, via a shared colorState, later rows) with .color.
export function unroll(steps: AstNode[], colorState: ColorState = {}): LayoutUnit[] {
	const result: LayoutUnit[] = [];
	for (const step of steps) {
		if (step.type === 'ColorChangeNode') {
			colorState.current = step.color;
		} else if (step.type === 'RepeatNode') {
			// count is filled in by resolveRepeats before the chart is read.
			for (let i = 0; i < (step.count ?? 1); i++) {
				result.push(...unroll(step.children, colorState));
			}
		} else if (step.type === 'StitchNode') {
			for (let i = 0; i < step.count; i++) {
				result.push({ ...step, count: 1, color: colorState.current });
			}
		} else {
			result.push({ ...step, color: colorState.current });
		}
	}
	return result;
}

// The stitch symbols one unit draws, in order. A group draws one per stitch it
// names, so a shell takes a shell's worth of the chart rather than one stitch's.
export function unitSymbols(unit: LayoutUnit): string[] {
	return unit.type === 'GroupNode' ? flattenGroup(unit) : [unit.stitch];
}

// The first symbol a chart draws, whatever step it comes from. What is drawn
// around the chart's center is kept clear of it.
export function firstDrawnSymbol(ast: CrochetAst): string {
	for (const row of ast.rows) {
		const symbol = unroll(row.steps).flatMap(unitSymbols)[0];
		if (symbol !== undefined) return symbol;
	}
	return 'sc';
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

// How many previous-round stitches a unit is worked into, for book-style
// parent-aligned placement: decreases consume their together-count (`dec` is
// the sc 2-together), a group fans many stitches into one parent, everything
// else is worked into a single stitch.
export function consumedStitches(unit: LayoutUnit): number {
	if (unit.type === 'GroupNode') return 1;
	if (NO_FABRIC_STITCH.has(unit.stitch)) return 0;
	if (unit.stitch === 'dec') return 2;
	const together = /(\d)tog$/.exec(unit.stitch);
	return together ? Number(together[1]) : 1;
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

// What a round is made of, split into the three things a chart draws in order.
//
// A round usually opens with a turning chain and closes with a slip stitch
// joining it back to its own start. Neither is a stitch of the fabric: nothing
// is worked into them, they add nothing to the round's count, and the round
// above does not work into them — but they are part of the pattern and have to
// be drawn. Everything between them is the round's real stitches.
//
// Only the leading chain and the closing join are treated this way. A chain in
// the middle of a round is a real stitch (it is what a shell or a lace mesh is
// made of), and so is a slip stitch worked mid-round.
export interface RoundInstructions {
	start: LayoutUnit[];
	stitches: LayoutUnit[];
	end: LayoutUnit[];
}

export function roundInstructions(units: readonly LayoutUnit[]): RoundInstructions {
	let first = 0;
	while (first < units.length && opensRound(units[first])) first++;
	let last = units.length;
	while (last > first && isSlSt(units[last - 1])) last--;
	return {
		start: units.slice(0, first),
		stitches: units.slice(first, last),
		end: units.slice(last),
	};
}

// The chain that starts a round, and the magic ring a first round is worked
// into when it is written as a step ("R1: mr, ch, sc6, slst") rather than as
// an anchor ("R1: 6 sc in MR").
function opensRound(unit: LayoutUnit | undefined): boolean {
	return unit?.type === 'StitchNode' && (unit.stitch === 'ch' || unit.stitch === 'MR');
}

function poppedUnits(row: RowNode): LayoutUnit[] {
	return roundInstructions(unroll(row.steps)).stitches;
}

export function isSlSt(unit: LayoutUnit | undefined): boolean {
	return unit?.type === 'StitchNode' && unit.stitch === 'sl st';
}

export function tagLoop(items: RenderItem[], start: number, loop?: 'blo' | 'flo') {
	if (!loop) return;
	for (const item of items.slice(start)) item.loop = loop;
}

// Stitches of the fabric per written stitch. An increase makes two; a chain,
// a slip stitch and the magic ring make none — they are worked, and drawn, but
// nothing is worked into them and they add nothing for the next round to work
// into.
const NO_FABRIC_STITCH = new Set(['ch', 'sl st', 'MR']);

function stitchWeight(stitch: string): number {
	if (stitch === 'inc') return 2;
	return NO_FABRIC_STITCH.has(stitch) ? 0 : 1;
}
