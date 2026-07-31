import {
	PluginSettingTab,
	Setting,
	type App,
	type ButtonComponent,
	type SettingDefinitionItem,
	type SettingGroupItem,
} from 'obsidian';
import { AI_PATTERN_AUTHORING_DOCS } from './ai-doc-content';
import { t, type Locale, type TranslationKey } from './i18n';
import type CrochetWeaverPlugin from './main';
import {
	getLocalizedSettingGroups,
	type CrochetSettingDefinition,
	type CrochetWeaverSettings,
} from './settings-data';

// One button per doc language, reusing the same language-name strings the
// language-preference dropdown uses so the labels stay consistent.
const AI_DOC_LANGUAGES: ReadonlyArray<{ readonly locale: Locale; readonly nameKey: TranslationKey }> = [
	{ locale: 'en', nameKey: 'settings.language.en' },
	{ locale: 'zh-TW', nameKey: 'settings.language.zhTW' },
	{ locale: 'zh-CN', nameKey: 'settings.language.zhCN' },
	{ locale: 'ja', nameKey: 'settings.language.ja' },
];

// Adds one "copy to clipboard" button per doc language to an existing
// Setting row. Shared between the declarative getSettingDefinitions() path
// and the pre-1.13.0 manual display() fallback.
function addAiDocsButtons(setting: Setting, uiLocale: Locale): void {
	for (const { locale: docLocale, nameKey } of AI_DOC_LANGUAGES) {
		setting.addButton((button) => {
			const label = t(uiLocale, nameKey);
			button.setButtonText(label).onClick(() => {
				void copyAiDoc(docLocale, uiLocale, button, label);
			});
		});
	}
}

async function copyAiDoc(docLocale: Locale, uiLocale: Locale, button: ButtonComponent, label: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(AI_PATTERN_AUTHORING_DOCS[docLocale]);
	} catch {
		// Clipboard access can be denied by the OS; nothing more we can do here.
		return;
	}
	button.setButtonText(t(uiLocale, 'settings.aiDocs.copied'));
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
} from './settings-data';

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

function aiDocsDefinition(locale: Locale): SettingGroupItem {
	return {
		name: t(locale, 'settings.aiDocs.name'),
		desc: t(locale, 'settings.aiDocs.desc'),
		render: (setting: Setting) => addAiDocsButtons(setting, locale),
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
					...(group.id === 'general' ? [aiDocsDefinition(locale)] : []),
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
				addAiDocsButtons(
					new Setting(containerEl)
						.setName(t(locale, 'settings.aiDocs.name'))
						.setDesc(t(locale, 'settings.aiDocs.desc')),
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
