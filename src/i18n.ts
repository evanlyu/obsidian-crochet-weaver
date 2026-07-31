import { de } from './i18n/de';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { ja } from './i18n/ja';
import { ko } from './i18n/ko';
import { zh_CN } from './i18n/zh-CN';
import { zh_TW } from './i18n/zh-TW';

import type { TranslationKey } from './i18n/keys';

export type { TranslationKey };
export { TRANSLATION_KEYS } from './i18n/keys';

export type Locale = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'de' | 'fr' | 'es';
export type LanguagePreference = 'auto' | Locale;

export const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = [
	'auto',
	'en',
	'zh-TW',
	'zh-CN',
	'ja',
	'ko',
	'de',
	'fr',
	'es',
] as const;

const DEFAULT_LOCALE: Locale = 'en';

// One file per language (src/i18n/), gathered here so a lookup is a plain index
// by locale.
const STRINGS: Record<Locale, Record<TranslationKey, string>> = {
	en,
	'zh-TW': zh_TW,
	'zh-CN': zh_CN,
	ja,
	ko,
	de,
	fr,
	es,
};

export interface LocalizedError extends Error {
	readonly translationKey: TranslationKey;
	readonly translationParams: Record<string, string | number>;
}

export function normalizeLocale(language: string | undefined): Locale {
	if (!language) return DEFAULT_LOCALE;
	const normalized = language.toLowerCase();
	if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja';
	if (normalized === 'zh-tw' || normalized === 'zh-hant' || normalized === 'zh-hk') return 'zh-TW';
	if (normalized === 'zh' || normalized === 'zh-cn' || normalized === 'zh-hans') return 'zh-CN';
	if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko';
	if (normalized === 'de' || normalized.startsWith('de-')) return 'de';
	if (normalized === 'fr' || normalized.startsWith('fr-')) return 'fr';
	if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
	if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
	return DEFAULT_LOCALE;
}

export function normalizeLanguagePreference(value: unknown): LanguagePreference | undefined {
	return LANGUAGE_PREFERENCES.includes(value as LanguagePreference)
		? (value as LanguagePreference)
		: undefined;
}

export function resolveLocale(
	preference: LanguagePreference,
	detectedLanguage: string | undefined,
): Locale {
	return preference === 'auto' ? normalizeLocale(detectedLanguage) : preference;
}

export function t(
	locale: Locale,
	key: TranslationKey,
	params: Record<string, string | number> = {},
): string {
	const template = STRINGS[locale][key] ?? en[key];
	return template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}

// Full, localized name for a stitch abbreviation or round anchor (e.g. "sc"
// -> "single crochet", "MR" -> "魔術環"), for the readable pattern-text style.
// Falls back to the raw abbreviation for anything without a translation
// entry (e.g. a future stitch symbol added before its name is translated).
export function stitchName(locale: Locale, stitch: string): string {
	const key = `stitch.${stitch}`;
	const table = STRINGS[locale] as Record<string, string | undefined>;
	const fallbackTable = STRINGS.en as Record<string, string | undefined>;
	return table[key] ?? fallbackTable[key] ?? stitch;
}

export function isLocalizedError(error: unknown): error is LocalizedError {
	return (
		error instanceof Error &&
		'translationKey' in error &&
		'translationParams' in error
	);
}
