import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseChart } from '../src/pattern/parse-chart';

const README_PATHS = [
	'README.md',
	'README.zh-TW.md',
	'README.zh-CN.md',
	'README.ja.md',
] as const;
const SKILL_PATHS = [
	'skills/crochet-weaver-pattern/SKILL.md',
	'skills/crochet-weaver-pattern/SKILL.zh-TW.md',
	'skills/crochet-weaver-pattern/SKILL.zh-CN.md',
	'skills/crochet-weaver-pattern/SKILL.ja.md',
] as const;
const CURRENT_FRONTMATTER_KEYS = [
	'type',
	'id',
	'scale',
	'stroke',
	'spacing',
	'highlight',
	'style',
	'lace',
	'sector',
	'wholeRounds',
	'grid',
	'rounds',
	'rows',
	'columns',
	'tool',
	'text',
	'readable',
	'position',
] as const;

function read(path: string): string {
	return readFileSync(path, 'utf8');
}

function crochetBlocks(markdown: string): string[] {
	return [...markdown.matchAll(/```crochet\n[\s\S]*?```/g)].map((match) => match[0]);
}

function crochetSources(markdown: string): string[] {
	return [...markdown.matchAll(/```crochet\n([\s\S]*?)```/g)].map((match) => {
		const source = match[1] ?? '';
		const indents = source
			.split('\n')
			.filter((line) => line.trim().length > 0)
			.map((line) => line.match(/^\s*/)?.[0].length ?? 0);
		const indent = indents.length > 0 ? Math.min(...indents) : 0;
		return source
			.split('\n')
			.map((line) => line.slice(indent))
			.join('\n');
	});
}

describe('localized README contract', () => {
	for (const path of README_PATHS) {
		it(`${path} documents the current chart options and names`, () => {
			const contents = read(path);

			for (const key of CURRENT_FRONTMATTER_KEYS) {
				expect(contents, `${path} documents ${key}`).toContain(`${key}:`);
			}
			for (const style of ['radial', 'japanese', 'continuous']) {
				expect(contents, `${path} documents ${style}`).toContain(`\`${style}\``);
			}
			expect(contents).not.toContain('`standard`');
		});

		it(`${path} documents beginning-chain and weighted-progress behavior`, () => {
			const contents = read(path);

			expect(contents).toContain('ch 3 (counts as dc)');
			expect(contents).toContain('ch 1 (does not count as a st)');
			expect(contents).toContain('inc');
			expect(contents).toContain('+2');
		});

		it(`${path} keeps every crochet example executable`, () => {
			const examples = crochetSources(read(path));

			expect(examples.length).toBeGreaterThan(0);
			for (const [index, example] of examples.entries()) {
				expect(() => parseChart(example), `${path} example ${index + 1}`).not.toThrow();
			}
		});
	}
});

describe('localized pattern-skill contract', () => {
	const skills = SKILL_PATHS.map(read);

	for (const [index, path] of SKILL_PATHS.entries()) {
		it(`${path} covers every current chart option`, () => {
			const contents = skills[index] ?? '';

			for (const key of CURRENT_FRONTMATTER_KEYS) {
				expect(contents, `${path} documents ${key}`).toContain(`\`${key}\``);
			}
			expect(contents).toContain('ch 3 (counts as dc)');
			expect(contents).toContain('ch 1 (does not count as a st)');
			expect(contents).toContain('color <name>');
			expect(contents).toContain('next <place>');
			expect(contents).toContain('+2');
		});

		it(`${path} keeps every crochet example executable`, () => {
			const examples = crochetSources(skills[index] ?? '');

			expect(examples.length).toBeGreaterThan(0);
			for (const [exampleIndex, example] of examples.entries()) {
				expect(() => parseChart(example), `${path} example ${exampleIndex + 1}`).not.toThrow();
			}
		});
	}

	it('keeps every crochet code example byte-identical across locales', () => {
		const expected = crochetBlocks(skills[0] ?? '');

		expect(expected.length).toBeGreaterThan(0);
		for (const contents of skills.slice(1)) {
			expect(crochetBlocks(contents)).toEqual(expected);
		}
	});
});
