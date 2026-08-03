import { CENTER_RING, JOINING_STITCH, makesSpace } from '../render/symbols';
import type { AstNode, BeginningChain, CrochetAst, RawCrochetAst, RowNode, RowRepeatNode } from '../types';
import { CHART_BUDGET, ChartBudgetError } from './budget';
import { PatternError } from './pattern-error';

// Two things a written pattern leaves for the reader to work out, settled here
// so nothing downstream has to: rounds written as a repeat of earlier rounds,
// and what a round's opening chain is worth.

export function expandPattern(ast: RawCrochetAst): CrochetAst {
	const rows = expandRowRepeats(ast.rows);
	return {
		type: 'CrochetChart',
		config: ast.config,
		rows: rows.map((row) => resolveBeginningChain(markOpeningSlipStitches(row))),
	};
}

function expandRowRepeats(entries: readonly (RowNode | RowRepeatNode)[]): RowNode[] {
	const rows: RowNode[] = [];
	const byNum = new Map<number, RowNode>();

	for (const entry of entries) {
		if (entry.type === 'Row') {
			rows.push(entry);
			byNum.set(entry.num, entry);
			continue;
		}
		// A range expands into real rounds, so the row budget is checked before
		// the expansion rather than on its result: "R2-R9999: repeat R1" is
		// reported as too many rounds, not built and then measured.
		assertRowBudget(rows.length + (entry.to - entry.from + 1));
		for (const row of expandOne(entry, byNum)) {
			rows.push(row);
			byNum.set(row.num, row);
		}
	}
	return rows;
}

function assertRowBudget(rows: number): void {
	if (rows <= CHART_BUDGET.maxRows) return;
	throw new ChartBudgetError(
		`Pattern has too many rows (${rows}); maximum is ${CHART_BUDGET.maxRows}.`,
		'budget.rows',
		{ rows, max: CHART_BUDGET.maxRows },
	);
}

function expandOne(repeat: RowRepeatNode, byNum: ReadonlyMap<number, RowNode>): RowNode[] {
	const wanted = repeat.to - repeat.from + 1;
	const sourceLength = repeat.sourceTo - repeat.sourceFrom + 1;
	if (wanted < 1 || sourceLength < 1) {
		throw new PatternError('pattern.repeatRange', {
			round: `R${repeat.from}`,
			source: `R${repeat.sourceFrom}`,
		});
	}
	if (wanted % sourceLength !== 0) {
		throw new PatternError('pattern.repeatRangeLength', {
			round: `R${repeat.from}-R${repeat.to}`,
			source: `R${repeat.sourceFrom}-R${repeat.sourceTo}`,
		});
	}

	const rows: RowNode[] = [];
	for (let offset = 0; offset < wanted; offset++) {
		const sourceNum = repeat.sourceFrom + (offset % sourceLength);
		const source = byNum.get(sourceNum);
		if (source === undefined) {
			throw new PatternError('pattern.repeatMissing', {
				round: `R${repeat.from + offset}`,
				source: `R${sourceNum}`,
			});
		}
		rows.push({ ...source, num: repeat.from + offset, source: { repeatOf: sourceNum } });
	}
	return rows;
}

// What the round's opening chain is worth, where the pattern did not say it
// outright: closing to the top of that chain is the pattern saying it stood in
// for a stitch, and closing anywhere else is it saying the chain was only
// height. A chain that opens no round — one written mid-round — stays an
// ordinary stitch, which is what a mesh or a shell is made of.
function resolveBeginningChain(row: RowNode): RowNode {
	const index = openingChainIndex(row.steps);
	if (index < 0) return row;

	const opening = row.steps[index];
	if (opening?.type !== 'StitchNode' || opening.beginning !== undefined) return row;

	const beginning: BeginningChain = { counts: closesToBeginningChain(row.steps) };
	const steps = [...row.steps];
	steps[index] = { ...opening, beginning };
	return { ...row, steps };
}

// A bare slip stitch at the front of a round is the short form of moving to
// where that round begins. It is worked and drawn, but it is not a stitch of
// the fabric. Mark it before resolving the opening chain so "sl st, ch, ..."
// recognizes both instructions as the round's opening.
function markOpeningSlipStitches(row: RowNode): RowNode {
	const steps = [...row.steps];
	let changed = false;
	for (const [index, step] of steps.entries()) {
		if (step.type === 'TurnNode' || step.type === 'RepositionNode') continue;
		if (step.type !== 'StitchNode') break;
		if (step.stitch === CENTER_RING) continue;
		if (step.stitch !== JOINING_STITCH || step.target !== undefined) break;
		steps[index] = { ...step, instruction: 'reposition' };
		changed = true;
	}
	return changed ? { ...row, steps } : row;
}

// Which step opens the round, if any: the first chain written before the round
// works a stitch of its own. A turn, a magic ring, or a repositioning slip
// stitch may come first — none of them is a stitch of the fabric.
function openingChainIndex(steps: readonly AstNode[]): number {
	for (const [index, step] of steps.entries()) {
		if (step.type === 'TurnNode' || step.type === 'RepositionNode') continue;
		if (step.type !== 'StitchNode') return -1;
		if (step.stitch === CENTER_RING) continue;
		if (step.instruction === 'reposition') continue;
		return makesSpace(step.stitch) && step.target === undefined ? index : -1;
	}
	return -1;
}

function closesToBeginningChain(steps: readonly AstNode[]): boolean {
	for (let index = steps.length - 1; index >= 0; index--) {
		const step = steps[index];
		if (step?.type === 'JoinNode') return step.target === 'beginning-ch';
	}
	return false;
}
