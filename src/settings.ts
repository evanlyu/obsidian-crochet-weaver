import { PluginSettingTab, Setting, type App, type ButtonComponent, type SettingDefinitionItem } from 'obsidian';
import { AI_PATTERN_AUTHORING_DOCS } from './ai-doc-content';
import { t, type Locale, type LanguagePreference, type TranslationKey } from './i18n';
import type CrochetWeaverPlugin from './main';
import type { GridShape, PanelPosition, PatternTextStyle, SymbolRotation } from './types';
import {
	getLocalizedSettingDefinitions,
	GRID_COLUMNS_OPTIONS,
	GRID_ROUNDS_OPTIONS,
	GRID_ROWS_OPTIONS,
	RING_SPACING_OPTIONS,
	SCALE_OPTIONS,
	STROKE_WIDTH_OPTIONS,
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

export class CrochetWeaverSettingTab extends PluginSettingTab {
	plugin: CrochetWeaverPlugin;

	constructor(app: App, plugin: CrochetWeaverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const locale = this.plugin.getLocale();
		return [
			...getLocalizedSettingDefinitions(locale),
			{
				name: t(locale, 'settings.aiDocs.name'),
				desc: t(locale, 'settings.aiDocs.desc'),
				render: (setting) => addAiDocsButtons(setting, locale),
			},
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

		new Setting(containerEl)
			.setName(t(locale, 'settings.language.name'))
			.setDesc(t(locale, 'settings.language.desc'))
			.addDropdown((dd) =>
				dd
					.addOption('auto', t(locale, 'settings.language.auto'))
					.addOption('en', t(locale, 'settings.language.en'))
					.addOption('zh-TW', t(locale, 'settings.language.zhTW'))
					.addOption('zh-CN', t(locale, 'settings.language.zhCN'))
					.addOption('ja', t(locale, 'settings.language.ja'))
					.setValue(this.plugin.settings.languagePreference)
					.onChange(async (value) => {
						this.plugin.settings.languagePreference = value as LanguagePreference;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.scale.name'))
			.setDesc(t(locale, 'settings.scale.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...SCALE_OPTIONS];
				const currentValue = this.plugin.settings.scale;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.scale = Number(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(locale, 'settings.stroke.name'))
			.setDesc(t(locale, 'settings.stroke.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...STROKE_WIDTH_OPTIONS];
				const currentValue = this.plugin.settings.strokeWidth;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.strokeWidth = Number(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(locale, 'settings.spacing.name'))
			.setDesc(t(locale, 'settings.spacing.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...RING_SPACING_OPTIONS];
				const currentValue = this.plugin.settings.ringSpacing;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.ringSpacing = Number(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(locale, 'settings.highlight.name'))
			.setDesc(t(locale, 'settings.highlight.desc'))
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.highlightIncDec)
					.onChange(async (value) => {
						this.plugin.settings.highlightIncDec = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.chartMarkerColor.name'))
			.setDesc(t(locale, 'settings.chartMarkerColor.desc'))
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.chartMarkerColor)
					.onChange(async (value) => {
						this.plugin.settings.chartMarkerColor = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.showTool.name'))
			.setDesc(t(locale, 'settings.showTool.desc'))
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showTool)
					.onChange(async (value) => {
						this.plugin.settings.showTool = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.showPatternText.name'))
			.setDesc(t(locale, 'settings.showPatternText.desc'))
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showPatternText)
					.onChange(async (value) => {
						this.plugin.settings.showPatternText = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.patternTextStyle.name'))
			.setDesc(t(locale, 'settings.patternTextStyle.desc'))
			.addDropdown((dd) =>
				dd
					.addOption('raw', t(locale, 'settings.patternTextStyle.raw'))
					.addOption('readable', t(locale, 'settings.patternTextStyle.readable'))
					.setValue(this.plugin.settings.patternTextStyle)
					.onChange(async (value) => {
						this.plugin.settings.patternTextStyle = value as PatternTextStyle;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.panelPosition.name'))
			.setDesc(t(locale, 'settings.panelPosition.desc'))
			.addDropdown((dd) =>
				dd
					.addOption('right', t(locale, 'settings.panelPosition.right'))
					.addOption('left', t(locale, 'settings.panelPosition.left'))
					.addOption('below', t(locale, 'settings.panelPosition.below'))
					.setValue(this.plugin.settings.panelPosition)
					.onChange(async (value) => {
						this.plugin.settings.panelPosition = value as PanelPosition;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.showGrid.name'))
			.setDesc(t(locale, 'settings.showGrid.desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showGrid)
					.onChange(async (value) => {
						this.plugin.settings.showGrid = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.rotation.name'))
			.setDesc(t(locale, 'settings.rotation.desc'))
			.addDropdown((dd) =>
				dd
					.addOption('smart', t(locale, 'settings.rotation.smart'))
					.addOption('all', t(locale, 'settings.rotation.all'))
					.addOption('none', t(locale, 'settings.rotation.none'))
					.setValue(this.plugin.settings.symbolRotation)
					.onChange(async (value) => {
						this.plugin.settings.symbolRotation = value as SymbolRotation;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.gridDefaultShape.name'))
			.setDesc(t(locale, 'settings.gridDefaultShape.desc'))
			.addDropdown((dd) =>
				dd
					.addOption('polar', t(locale, 'settings.gridDefaultShape.polar'))
					.addOption('rect', t(locale, 'settings.gridDefaultShape.rect'))
					.setValue(this.plugin.settings.gridDefaultShape)
					.onChange(async (value) => {
						this.plugin.settings.gridDefaultShape = value as GridShape;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.gridDefaultRounds.name'))
			.setDesc(t(locale, 'settings.gridDefaultRounds.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...GRID_ROUNDS_OPTIONS];
				const currentValue = this.plugin.settings.gridDefaultRounds;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.gridDefaultRounds = Number(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(locale, 'settings.gridDefaultColumns.name'))
			.setDesc(t(locale, 'settings.gridDefaultColumns.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...GRID_COLUMNS_OPTIONS];
				const currentValue = this.plugin.settings.gridDefaultColumns;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.gridDefaultColumns = Number(value);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t(locale, 'settings.gridDefaultRows.name'))
			.setDesc(t(locale, 'settings.gridDefaultRows.desc'))
			.addDropdown((dd) => {
				const options: number[] = [...GRID_ROWS_OPTIONS];
				const currentValue = this.plugin.settings.gridDefaultRows;
				if (!options.includes(currentValue)) {
					options.push(currentValue);
					options.sort((a, b) => a - b);
				}
				options.forEach((opt) => {
					dd.addOption(opt.toString(), opt.toString());
				});
				return dd
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						this.plugin.settings.gridDefaultRows = Number(value);
						await this.plugin.saveSettings();
					});
			});

		addAiDocsButtons(
			new Setting(containerEl)
				.setName(t(locale, 'settings.aiDocs.name'))
				.setDesc(t(locale, 'settings.aiDocs.desc')),
			locale,
		);
	}
}
