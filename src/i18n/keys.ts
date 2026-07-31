// The set of strings the plugin can say, taken from the English file: the only
// place a key is introduced. Its own module so a language file can be typed
// against it without pulling in every other language.
import { en } from './en';

export type TranslationKey = keyof typeof en;

// Every key, for anything that wants to check a locale for gaps at runtime.
export const TRANSLATION_KEYS = Object.keys(en) as readonly TranslationKey[];
