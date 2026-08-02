import type { TranslationKey } from '../i18n';

// A fact about the pattern that stops it from being charted: a round that
// repeats a round that was never written, a target that is not there to work
// into, a count that contradicts what the round is made of. Thrown before any
// coordinate exists, so the reader is told what is wrong with the pattern
// rather than shown a chart that quietly drew something else.
export class PatternError extends Error {
	readonly translationKey: TranslationKey;
	readonly translationParams: Record<string, string | number>;

	constructor(translationKey: TranslationKey, translationParams: Record<string, string | number> = {}) {
		super(`${translationKey}: ${JSON.stringify(translationParams)}`);
		this.name = 'PatternError';
		this.translationKey = translationKey;
		this.translationParams = translationParams;
	}
}
