import { isLocalizedError, t, type Locale } from './i18n';

interface ParseErrorLocation {
	readonly location?: {
		readonly start?: {
			readonly line: number;
			readonly column: number;
		};
	};
}

export function renderCrochetError(error: unknown, el: HTMLElement, locale: Locale = 'en'): void {
	const box = el.createDiv({ cls: 'crochet-weaver-error' });
	box.createDiv({ cls: 'crochet-weaver-error-title', text: t(locale, 'error.title') });
	const loc = hasParseErrorLocation(error) ? error.location?.start : undefined;
	const message = localizedErrorMessage(error, locale);
	box.createDiv({
		text: loc ? t(locale, 'error.location', { line: loc.line, column: loc.column, message }) : message,
	});
}

function localizedErrorMessage(error: unknown, locale: Locale): string {
	if (isLocalizedError(error)) {
		return t(locale, error.translationKey, error.translationParams);
	}
	return error instanceof Error ? error.message : String(error);
}

function hasParseErrorLocation(value: unknown): value is ParseErrorLocation {
	if (!isRecord(value)) return false;
	const location = value.location;
	if (!isRecord(location)) return false;
	const start = location.start;
	return (
		isRecord(start) &&
		typeof start.line === 'number' &&
		typeof start.column === 'number'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
