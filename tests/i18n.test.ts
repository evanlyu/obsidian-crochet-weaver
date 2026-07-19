import { describe, expect, it } from 'vitest';
import { normalizeLocale, resolveLocale, t } from '../src/i18n';

describe('plugin localization', () => {
	it('normalizes Obsidian language codes to supported locales', () => {
		expect(normalizeLocale('en-GB')).toBe('en');
		expect(normalizeLocale('zh')).toBe('zh-CN');
		expect(normalizeLocale('zh-CN')).toBe('zh-CN');
		expect(normalizeLocale('zh-Hant')).toBe('zh-TW');
		expect(normalizeLocale('zh-TW')).toBe('zh-TW');
		expect(normalizeLocale('ja-JP')).toBe('ja');
		expect(normalizeLocale('fr')).toBe('en');
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
});
