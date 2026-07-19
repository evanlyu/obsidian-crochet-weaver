import { isLocalizedError, t, type Locale } from '../i18n';
import { GridParseError } from './parse';

export function renderGridError(error: unknown, el: HTMLElement, locale: Locale = 'en'): void {
	const box = el.createDiv({ cls: 'crochet-weaver-error' });
	box.createDiv({ cls: 'crochet-weaver-error-title', text: t(locale, 'error.gridTitle') });
	const message =
		error instanceof GridParseError
			? t(locale, 'error.gridParseMessage', { line: error.line })
			: localizedErrorMessage(error, locale);
	box.createDiv({ text: message });
}

function localizedErrorMessage(error: unknown, locale: Locale): string {
	if (isLocalizedError(error)) return t(locale, error.translationKey, error.translationParams);
	return error instanceof Error ? error.message : String(error);
}
