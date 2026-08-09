import type { AstNode, RowNode } from '../types';
import { PatternError } from './pattern-error';

// What a round is worth as written, which is not the same as how many stitches
// of fabric it makes.
//
// A pattern's own count — "(24 sc + 24 ch-1 sp = 48 sts)" — counts what the
// maker works: every chain of a mesh counts, even though nothing is worked into
// a chain and the round above sees only the space it made. The other number,
// how many stitches the round leaves for the next round to work into, is what
// the graph and the chart's sizing are built from (see layout/steps.ts).
//
// Keeping them apart is what lets a lace round be checked against the count the
// pattern prints, and shown in the progress panel as the maker counts it, while
// the chart still draws the fabric the round actually makes.

// Instructions that are worked and drawn but that no pattern counts: the join
// that closes a round, the ring it starts from, and a picot, which is an
// embellishment on a stitch rather than a stitch of its own.
const UNCOUNTED = new Set(['sl st', 'MR', 'picot']);

export function writtenWeight(step: AstNode): number {
	switch (step.type) {
		case 'StitchNode': {
			// A beginning chain is worth the one stitch it stands in for, or
			// nothing — never the number of chains it took to get there.
			if (step.beginning !== undefined) return step.beginning.counts ? 1 : 0;
			if (UNCOUNTED.has(step.stitch)) return 0;
			if (step.stitch === 'inc') return 2 * step.count;
			return step.count;
		}
		case 'GroupNode':
			return step.children.reduce((sum, child) => sum + writtenWeight(child), 0);
		case 'RepeatNode':
			return (step.count ?? 1) * step.children.reduce((sum, child) => sum + writtenWeight(child), 0);
		case 'ColorChangeNode':
		case 'JoinNode':
		case 'RepositionNode':
		case 'TurnNode':
		case 'SkipNode':
			return 0;
	}
}

export function rowWrittenCount(row: RowNode): number {
	return row.steps.reduce((sum, step) => sum + writtenWeight(step), 0);
}

// One entry per written instruction the maker works through, with what each is
// worth. A repeat is spread into its goes, so the counter walks the round the
// way it is crocheted; a motif written as one instruction ("5 dc in next ch-2
// sp") stays one entry worth five, because it is one thing to work.
export function writtenUnitWeights(row: RowNode): number[] {
	return row.steps.flatMap(unitWeights);
}

function unitWeights(step: AstNode): number[] {
	if (step.type === 'RepeatNode') {
		const inner = step.children.flatMap(unitWeights);
		return Array.from({ length: step.count ?? 1 }, () => inner).flat();
	}
	// A beginning chain is one instruction however many chains it takes, and a
	// motif is one instruction however many stitches it makes.
	if (step.type === 'StitchNode' && step.motif !== true && step.beginning === undefined && step.count > 1) {
		// "23 dc" is twenty-three stitches to work, one at a time.
		return Array.from({ length: step.count }, () => writtenWeight({ ...step, count: 1 }));
	}
	const weight = writtenWeight(step);
	return weight === 0 ? [] : [weight];
}

// Checks a round against the count the pattern prints for it. Only rounds that
// state a count are checked — saying nothing is not a mistake — and the report
// names the round and both numbers, because the useful thing to know is which
// of the two is wrong.
export function validateWrittenCount(row: RowNode): void {
	const stated = row.count?.total;
	if (stated === undefined) return;
	const actual = rowWrittenCount(row);
	if (actual !== stated) {
		throw new PatternError('pattern.countMismatch', { round: row.num, stated, actual });
	}
}

export function validateWrittenCounts(rows: readonly RowNode[]): void {
	for (const row of rows) validateWrittenCount(row);
}
