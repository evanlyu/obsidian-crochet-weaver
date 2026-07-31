import {
	PluginSettingTab,
	Setting,
	type App,
	type ButtonComponent,
	type SettingDefinitionItem,
	type SettingGroupItem,
} from 'obsidian';
import { patternSkill, SKILL_LOCALES, type SkillLocale } from '../skill-content';
import { t, type Locale, type TranslationKey } from '../i18n';
import type CrochetWeaverPlugin from '../main';
import {
	getLocalizedSettingGroups,
	type CrochetSettingDefinition,
	type CrochetWeaverSettings,
} from '../settings/data';

// Where to say something about the plugin — in the open, or privately. Shown as
// a row of its own rather than only in the README, since the settings page is
// where someone already is when a chart will not come out the way they expected.
const ISSUES_URL = 'https://github.com/evanlyu/obsidian-crochet-weaver/issues';
const CONTACT_EMAIL = 'crochet@kiyudesign.com';

// One button per doc language, reusing the same language-name strings the
// language-preference dropdown uses so the labels stay consistent.
const SKILL_LANGUAGE_KEYS: Readonly<Record<SkillLocale, TranslationKey>> = {
	en: 'settings.language.en',
	'zh-TW': 'settings.language.zhTW',
	'zh-CN': 'settings.language.zhCN',
	ja: 'settings.language.ja',
};

// Adds one "copy to clipboard" button per language the skill is written in, to
// an existing Setting row. Shared between the declarative getSettingDefinitions()
// path and the pre-1.13.0 manual display() fallback.
function addSkillButtons(setting: Setting, uiLocale: Locale): void {
	for (const skillLocale of SKILL_LOCALES) {
		setting.addButton((button) => {
			const label = t(uiLocale, SKILL_LANGUAGE_KEYS[skillLocale]);
			button.setButtonText(label).onClick(() => {
				void copySkill(skillLocale, uiLocale, button, label);
			});
		});
	}
}

// Both ways to reach it: the issue tracker, a mail client, and — for anywhere
// that has neither — the address on the clipboard.
function addContactButtons(setting: Setting, locale: Locale): void {
	setting.addButton((button) =>
		button
			.setButtonText(t(locale, 'settings.contact.issue'))
			.setCta()
			.onClick(() => {
				window.open(ISSUES_URL);
			}),
	);
	setting.addButton((button) =>
		button
			.setButtonText(t(locale, 'settings.contact.mail'))
			.onClick(() => {
				window.open(`mailto:${CONTACT_EMAIL}`);
			}),
	);
	setting.addButton((button) => {
		const label = t(locale, 'settings.contact.copy');
		button.setButtonText(label).onClick(() => {
			void copyContact(locale, button, label);
		});
	});
}

async function copyContact(locale: Locale, button: ButtonComponent, label: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(CONTACT_EMAIL);
	} catch {
		// Clipboard access can be denied by the OS; the address is in the
		// description either way.
		return;
	}
	button.setButtonText(t(locale, 'settings.contact.copied'));
	window.setTimeout(() => {
		button.setButtonText(label);
	}, 1500);
}

async function copySkill(
	skillLocale: SkillLocale,
	uiLocale: Locale,
	button: ButtonComponent,
	label: string,
): Promise<void> {
	try {
		await navigator.clipboard.writeText(patternSkill(skillLocale));
	} catch {
		// Clipboard access can be denied by the OS; nothing more we can do here.
		return;
	}
	button.setButtonText(t(uiLocale, 'settings.skill.copied'));
	window.setTimeout(() => {
		button.setButtonText(label);
	}, 1500);
}

export {
	DEFAULT_SETTINGS,
	SETTING_DEFINITIONS,
	normalizeSettings,
	type CrochetSettingDefinition,
	type CrochetWeaverSettings,
} from '../settings/data';

// These settings back numeric dropdowns: Obsidian's dropdown control only persists
// strings, so values round-trip through String()/Number() at the get/set boundary.
type NumberSettingKey =
	| 'scale'
	| 'strokeWidth'
	| 'ringSpacing'
	| 'gridDefaultRounds'
	| 'gridDefaultColumns'
	| 'gridDefaultRows';
const NUMBER_KEYS: ReadonlySet<NumberSettingKey> = new Set([
	'scale',
	'strokeWidth',
	'ringSpacing',
	'gridDefaultRounds',
	'gridDefaultColumns',
	'gridDefaultRows',
]);

function isNumberSettingKey(key: string): key is NumberSettingKey {
	return NUMBER_KEYS.has(key as NumberSettingKey);
}

function skillDefinition(locale: Locale): SettingGroupItem {
	return {
		name: t(locale, 'settings.skill.name'),
		desc: t(locale, 'settings.skill.desc'),
		render: (setting: Setting) => addSkillButtons(setting, locale),
	};
}

function contactDefinition(locale: Locale): SettingGroupItem {
	return {
		name: t(locale, 'settings.contact.name'),
		desc: t(locale, 'settings.contact.desc'),
		aliases: [CONTACT_EMAIL, ISSUES_URL],
		render: (setting: Setting) => addContactButtons(setting, locale),
	};
}

export class CrochetWeaverSettingTab extends PluginSettingTab {
	plugin: CrochetWeaverPlugin;

	constructor(app: App, plugin: CrochetWeaverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const locale = this.plugin.getLocale();
		return [
			// What the page opens on: what these settings are, before any control.
			{ name: t(locale, 'settings.intro.name'), desc: t(locale, 'settings.intro.desc') },
			...getLocalizedSettingGroups(locale).map((group) => ({
				type: 'group' as const,
				heading: group.heading,
				items: [
					...(group.items as readonly SettingGroupItem[]),
					// The reference is something you copy once, from the same place
					// as the rest of the set-once settings.
					...(group.id === 'general' ? [skillDefinition(locale), contactDefinition(locale)] : []),
				],
			})),
		];
	}

	getControlValue(key: string): unknown {
		if (isNumberSettingKey(key)) return String(this.plugin.settings[key]);
		return this.plugin.settings[key as keyof CrochetWeaverSettings];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings as unknown as Record<string, unknown>;
		settings[key] = isNumberSettingKey(key) ? Number(value) : value;
		await this.plugin.saveSettings();
	}

	// Fallback for Obsidian versions before 1.13.0, which don't know about
	// getSettingDefinitions() and only ever call display(). Ignored by newer
	// versions once getSettingDefinitions() returns a non-empty array.
	display(): void {
		const { containerEl } = this;
		const locale = this.plugin.getLocale();
		containerEl.empty();

		new Setting(containerEl).setName(t(locale, 'settings.intro.name')).setDesc(t(locale, 'settings.intro.desc')).setHeading();

		for (const group of getLocalizedSettingGroups(locale)) {
			new Setting(containerEl).setName(group.heading).setHeading();
			for (const definition of group.items) this.renderSetting(containerEl, definition);
			if (group.id === 'general') {
				addSkillButtons(
					new Setting(containerEl)
						.setName(t(locale, 'settings.skill.name'))
						.setDesc(t(locale, 'settings.skill.desc')),
					locale,
				);
				addContactButtons(
					new Setting(containerEl)
						.setName(t(locale, 'settings.contact.name'))
						.setDesc(t(locale, 'settings.contact.desc')),
					locale,
				);
			}
		}
	}

	// One row, built from the same definition the declarative path hands Obsidian
	// — so the fallback can never drift from it in wording, order or options.
	private renderSetting(containerEl: HTMLElement, definition: CrochetSettingDefinition): void {
		const setting = new Setting(containerEl).setName(definition.name).setDesc(definition.desc);
		const { control } = definition;
		const save = async (value: unknown): Promise<void> => {
			await this.setControlValue(control.key, value);
			// The whole page is written in the chosen language, so changing it
			// rewrites the page.
			if (control.key === 'languagePreference') this.display();
		};

		if (control.type === 'toggle') {
			setting.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings[control.key]).onChange((value) => void save(value)),
			);
			return;
		}
		if (control.type === 'color') {
			setting.addColorPicker((picker) =>
				picker.setValue(this.plugin.settings[control.key]).onChange((value) => void save(value)),
			);
			return;
		}
		setting.addDropdown((dropdown) => {
			for (const [value, label] of Object.entries(control.options)) dropdown.addOption(value, label);
			dropdown.setValue(String(this.getControlValue(control.key))).onChange((value) => void save(value));
		});
	}
}
