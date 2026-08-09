import { describe, expect, it } from 'vitest';
import { LANGUAGE_PREFERENCES, normalizeLocale, resolveLocale, stitchName, t, TRANSLATION_KEYS } from '../src/i18n';

describe('plugin localization', () => {
	it('normalizes Obsidian language codes to supported locales', () => {
		expect(normalizeLocale('en-GB')).toBe('en');
		expect(normalizeLocale('zh')).toBe('zh-CN');
		expect(normalizeLocale('zh-CN')).toBe('zh-CN');
		expect(normalizeLocale('zh-Hant')).toBe('zh-TW');
		expect(normalizeLocale('zh-TW')).toBe('zh-TW');
		expect(normalizeLocale('ja-JP')).toBe('ja');
		expect(normalizeLocale('ko')).toBe('ko');
		expect(normalizeLocale('de-DE')).toBe('de');
		expect(normalizeLocale('fr')).toBe('fr');
		expect(normalizeLocale('es-MX')).toBe('es');
		// A language the plugin does not speak reads in English.
		expect(normalizeLocale('it')).toBe('en');
	});

	// Every locale has to answer for every string, or a chart in that language
	// would render a key instead of a word.
	it('translates every key in every locale it offers', () => {
		for (const preference of LANGUAGE_PREFERENCES) {
			if (preference === 'auto') continue;
			for (const key of TRANSLATION_KEYS) {
				expect(t(preference, key).length, `${preference} / ${key}`).toBeGreaterThan(0);
			}
		}
	});

	it('resolves explicit preferences before app language detection', () => {
		expect(resolveLocale('auto', 'zh-TW')).toBe('zh-TW');
		expect(resolveLocale('ja', 'zh-TW')).toBe('ja');
	});

	it('translates supported user-facing strings', () => {
		expect(t('en', 'tool.complete')).toBe('Complete current round');
		expect(t('zh-TW', 'tool.complete')).toBe('完成此圈 ✓');
		expect(t('zh-CN', 'tool.reset')).toBe('重置');
		expect(t('ja', 'chart.ariaLabel')).toBe('かぎ針編みチャート');
	});

	it('translates stitch abbreviations and round anchors into full localized names', () => {
		expect(stitchName('en', 'sc')).toBe('single crochet');
		expect(stitchName('zh-TW', 'sc')).toBe('短針');
		expect(stitchName('zh-CN', 'MR')).toBe('魔术环');
		expect(stitchName('ja', 'sl st')).toBe('引き抜き編み');
		expect(stitchName('zh-TW', 'ch ring')).toBe('鎖狀環');
	});

	it('falls back to the raw abbreviation for a stitch with no translation entry', () => {
		expect(stitchName('zh-TW', 'not-a-real-stitch')).toBe('not-a-real-stitch');
	});

	it('names the copy-the-skill setting in every locale', () => {
		expect(t('en', 'settings.skill.name')).toBe('Copy the pattern skill');
		expect(t('zh-TW', 'settings.skill.name')).toBe('複製織圖 skill');
		expect(t('zh-CN', 'settings.skill.copied')).toBe('已复制！');
		expect(t('ja', 'settings.skill.copied')).toBe('コピーしました！');
		expect(t('ko', 'settings.skill.name')).toBe('도안 skill 복사');
	});

	// Where to report something is only useful if it is readable, and the address
	// itself has to survive translation intact.
	it('names both ways to get in touch, in every locale', () => {
		for (const locale of ['en', 'zh-TW', 'zh-CN', 'ja'] as const) {
			expect(t(locale, 'settings.contact.desc')).toContain('crochet@kiyudesign.com');
			expect(t(locale, 'settings.contact.name').length).toBeGreaterThan(0);
			expect(t(locale, 'settings.contact.issue').length).toBeGreaterThan(0);
			expect(t(locale, 'settings.contact.mail').length).toBeGreaterThan(0);
			expect(t(locale, 'settings.contact.copy').length).toBeGreaterThan(0);
		}
	});
});
