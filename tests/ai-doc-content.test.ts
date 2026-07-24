import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_PATTERN_AUTHORING_DOCS } from '../src/ai-doc-content';
import type { Locale } from '../src/i18n';

const DOC_PATHS: Record<Locale, string> = {
	en: 'docs/ai-pattern-authoring.md',
	'zh-TW': 'docs/ai-pattern-authoring.zh-TW.md',
	'zh-CN': 'docs/ai-pattern-authoring.zh-CN.md',
	ja: 'docs/ai-pattern-authoring.ja.md',
};

describe('AI pattern-authoring doc content', () => {
	it('has non-empty content for all four locales', () => {
		for (const locale of Object.keys(DOC_PATHS) as Locale[]) {
			expect(AI_PATTERN_AUTHORING_DOCS[locale].length).toBeGreaterThan(1000);
		}
	});

	it('matches docs/ai-pattern-authoring*.md byte-for-byte, so the two stay in sync', () => {
		for (const [locale, path] of Object.entries(DOC_PATHS) as [Locale, string][]) {
			const onDisk = readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
			expect(AI_PATTERN_AUTHORING_DOCS[locale]).toBe(onDisk);
		}
	});

	it('keeps crochet syntax tokens verbatim (untranslated) across every locale', () => {
		for (const locale of Object.keys(DOC_PATHS) as Locale[]) {
			const doc = AI_PATTERN_AUTHORING_DOCS[locale];
			expect(doc).toContain('R1: 6 sc in MR');
			expect(doc).toContain('R2: [inc] x 6');
			expect(doc).toContain('```crochet');
		}
	});
});
