import type { TranslationKey } from '../i18n';
import { consumedStitches, outputStitches, roundInstructions, unroll } from '../layout/steps';
import type { AstNode, CrochetAst, RepeatNode, RowNode } from '../types';

// Works out how many times a bare "rep" repeats.
//
// "[2 sc, inc] rep" means "keep going until the round below is used up", which
// the parser cannot know: it can only see one row at a time. So the count is
// left null there and filled in here, where the rounds are read in order and
// each one's stitch count is known.
//
// The parsed tree is never modified — a repeat keeps the pattern as written, so
// an editor or exporter can still see "rep" rather than the number it came out
// as. This returns a copy with the counts filled in.

export class RepeatResolutionError extends Error {
	readonly translationKey: TranslationKey;
	readonly translationParams: Record<string, string | number>;

	constructor(message: string, translationKey: TranslationKey, translationParams: Record<string, string | number>) {
		super(message);
		this.name = 'RepeatResolutionError';
		this.translationKey = translationKey;
		this.translationParams = translationParams;
	}
}

export function resolveRepeats(ast: CrochetAst): CrochetAst {
	if (!ast.rows.some((row) => hasAutoRepeat(row.steps))) return ast;

	let available = 0;
	const rows = ast.rows.map((row) => {
		const resolved: RowNode = { ...row, steps: resolveSteps(row.steps, row, available) };
		available = countStitches(resolved);
		return resolved;
	});
	return { ...ast, rows };
}

function resolveSteps(steps: AstNode[], row: RowNode, available: number): AstNode[] {
	return steps.map((step) => {
		if (step.type !== 'RepeatNode') return step;
		const children = resolveSteps(step.children, row, available);
		return { ...step, children, count: step.count ?? autoCount({ ...step, children }, row, available) };
	});
}

// How many times a group fits into what the round below left, given how many
// of its stitches one go at the group works into.
function autoCount(repeat: RepeatNode, row: RowNode, available: number): number {
	const units = unroll(repeat.children);
	const perRepeat = units.reduce((sum, unit) => sum + consumedStitches(unit), 0);

	if (available === 0 || perRepeat === 0) {
		throw new RepeatResolutionError(
			`R${row.num}: "rep" needs a round before it to work into.`,
			'error.repeatNoPrevious',
			{ row: row.num },
		);
	}
	if (available % perRepeat !== 0) {
		throw new RepeatResolutionError(
			`R${row.num}: each repeat works into ${perRepeat} stitches, but the round below has ${available}, which does not divide evenly.`,
			'error.repeatUneven',
			{ row: row.num, perRepeat, available },
		);
	}
	return available / perRepeat;
}

// A round's stitch count: what the next round has to work into. The turning
// chain that opens a round and the slip stitch that closes it are instructions,
// not stitches of the fabric, so neither is counted (see roundInstructions).
function countStitches(row: RowNode): number {
	return roundInstructions(unroll(row.steps)).stitches.reduce((sum, unit) => sum + outputStitches(unit), 0);
}

function hasAutoRepeat(steps: readonly AstNode[]): boolean {
	return steps.some(
		(step) => step.type === 'RepeatNode' && (step.count === null || hasAutoRepeat(step.children)),
	);
}
