import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CROCHET_WEAVER_PATTERN_SKILL, patternSkill, SKILL_LOCALES, type SkillLocale } from '../src/skill-content';

const SKILL_PATHS: Record<SkillLocale, string> = {
	en: 'skills/crochet-weaver-pattern/SKILL.md',
	'zh-TW': 'skills/crochet-weaver-pattern/SKILL.zh-TW.md',
	'zh-CN': 'skills/crochet-weaver-pattern/SKILL.zh-CN.md',
	ja: 'skills/crochet-weaver-pattern/SKILL.ja.md',
};

describe('crochet-weaver-pattern skill', () => {
	// The plugin speaks more languages than the skill is written in; those get the
	// English one rather than nothing.
	it('falls back to English for a language the skill has not been written in', () => {
		expect(patternSkill('ko')).toBe(CROCHET_WEAVER_PATTERN_SKILL.en);
		expect(patternSkill('de')).toBe(CROCHET_WEAVER_PATTERN_SKILL.en);
		expect(patternSkill('es')).toBe(CROCHET_WEAVER_PATTERN_SKILL.en);
		expect(patternSkill('ja')).toBe(CROCHET_WEAVER_PATTERN_SKILL.ja);
	});

	it('bundles every language it claims to speak', () => {
		expect([...SKILL_LOCALES]).toEqual(Object.keys(SKILL_PATHS));
		for (const locale of SKILL_LOCALES) {
			expect(CROCHET_WEAVER_PATTERN_SKILL[locale].length).toBeGreaterThan(1000);
		}
	});

	// The bundled copy is generated from the files, so a SKILL file edited without
	// re-running the generator is caught here instead of shipping stale.
	it('matches skills/crochet-weaver-pattern/SKILL*.md byte-for-byte', () => {
		for (const [locale, path] of Object.entries(SKILL_PATHS) as [SkillLocale, string][]) {
			const onDisk = readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
			expect(CROCHET_WEAVER_PATTERN_SKILL[locale]).toBe(onDisk);
		}
	});

	// What makes it a skill rather than a document: the frontmatter an agent reads
	// to decide whether this is the thing to load.
	it('opens with skill frontmatter naming itself and when to use it', () => {
		for (const locale of SKILL_LOCALES) {
			const skill = CROCHET_WEAVER_PATTERN_SKILL[locale];
			expect(skill.startsWith('---\nname: crochet-weaver-pattern\ndescription: ')).toBe(true);
			const frontmatter = skill.slice(0, skill.indexOf('\n---', 4));
			expect(frontmatter).toContain('Crochet Weaver');
			expect(frontmatter.length).toBeGreaterThan(120);
		}
	});

	it('keeps crochet syntax tokens verbatim (untranslated) across every locale', () => {
		for (const locale of SKILL_LOCALES) {
			const skill = CROCHET_WEAVER_PATTERN_SKILL[locale];
			expect(skill).toContain('R1: 6 sc in MR');
			expect(skill).toContain('R2: [inc] x 6');
			expect(skill).toContain('```crochet');
		}
	});
});
