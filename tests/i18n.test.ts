import { describe, expect, it } from 'vitest';
import { normalizeLocale, resolveLocale, stitchName, t } from '../src/i18n';

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

	it('translates the AI-docs settings copy for all four locales', () => {
		expect(t('en', 'settings.aiDocs.name')).toBe('Copy AI pattern-authoring instructions');
		expect(t('zh-TW', 'settings.aiDocs.name')).toBe('複製提供給 AI 的說明');
		expect(t('zh-CN', 'settings.aiDocs.copied')).toBe('已复制！');
		expect(t('ja', 'settings.aiDocs.copied')).toBe('コピーしました！');
	});
});
