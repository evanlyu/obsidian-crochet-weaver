import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { t, type Locale } from '../src/i18n';
import { calculateLayout } from '../src/layout';
import { PatternError } from '../src/pattern/pattern-error';
import { parseChart } from '../src/pattern/parse-chart';
import { patternSkill } from '../src/skill-content';

const LOCALES: Locale[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'de', 'fr', 'es'];

function blocksOf(file: string): Array<{ kind: string; source: string }> {
	const text = readFileSync(file, 'utf8');
	return [...text.matchAll(/```(crochet(?:-tool)?)\n([\s\S]*?)```/g)].map((match) => ({
		kind: match[1] ?? '',
		source: match[2] ?? '',
	}));
}

describe('what the plugin says when a lace pattern does not work out', () => {
	const failures: Array<[string, string]> = [
		['a repeat of a round that was never written', 'R1: 6 sc in MR\n\nR2: repeat R9.\n'],
		['a repeat range of a different length', 'R1: 6 sc in MR\n\nR2: 6 sc\n\nR3-R5: repeat R1-R2.\n'],
	];

	for (const [what, source] of failures) {
		it(`reports ${what} in every language`, () => {
			let error: unknown;
			try {
				parseChart(`---\ntype: round\n---\n${source}`);
			} catch (thrown) {
				error = thrown;
			}

			expect(error).toBeInstanceOf(PatternError);
			const pattern = error as PatternError;
			for (const locale of LOCALES) {
				const message = t(locale, pattern.translationKey, pattern.translationParams);
				expect(message.length).toBeGreaterThan(0);
				// A message that still has a placeholder in it was never filled in.
				expect(message).not.toMatch(/\{[a-z]+\}/i);
			}
		});
	}

	it('names the round and both numbers when a count does not match', () => {
		expect(() => parseChart('---\ntype: round\n---\nR1: 6 sc in MR. (7 sc)\n')).not.toThrow();
		const message = t('en', 'pattern.countMismatch', { round: 1, stated: 7, actual: 6 });

		expect(message).toContain('7');
		expect(message).toContain('6');
	});
});

describe('the lace example note', () => {
	const blocks = blocksOf('examples/lace.md');

	it('has a block for each thing it teaches', () => {
		expect(blocks.length).toBeGreaterThanOrEqual(6);
	});

	for (const [index, block] of blocks.entries()) {
		it(`renders block ${index + 1}`, () => {
			const ast = parseChart(block.source);
			expect(ast.rows.length).toBeGreaterThan(0);
			if (block.kind === 'crochet') {
				const result = calculateLayout(ast, { ringSpacing: 34, grid: false, roundStyle: 'japanese' });
				expect(result.items.length).toBeGreaterThan(0);
			}
		});
	}
});

describe('the pattern skill', () => {
	for (const locale of ['en', 'zh-TW', 'zh-CN', 'ja'] as const) {
		it(`teaches the written lace forms in ${locale}`, () => {
			const skill = patternSkill(locale);

			for (const form of [
				'in next ch-2 sp',
				'in same st',
				'center dc of next 7-dc shell',
				'sl st into next ch-1 sp',
				'ch 3 (counts as dc)',
				'ch 1 (does not count as a st)',
				'sl st to top of beginning ch-3',
				'V2',
				'turn',
				'repeat R11',
			]) {
				expect(`${locale} teaches ${form}: ${skill.includes(form)}`).toBe(`${locale} teaches ${form}: true`);
			}
		});
	}

	it('says what a beginning chain with no note is worth', () => {
		expect(patternSkill('en')).toContain('closes to the top of it');
	});
});
