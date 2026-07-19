import { PluginSettingTab, Setting, type App } from 'obsidian';
import { t, type LanguagePreference } from './i18n';
import type CrochetWeaverPlugin from './main';
import type { PanelPosition, SymbolRotation } from './types';
import {
	getLocalizedSettingDefinitions,
	RING_SPACING_OPTIONS,
	SCALE_OPTIONS,
	STROKE_WIDTH_OPTIONS,
	type CrochetSettingDefinition,
} from './settings-data';

export {
	DEFAULT_SETTINGS,
	SETTING_DEFINITIONS,
	normalizeSettings,
	type CrochetSettingDefinition,
	type CrochetWeaverSettings,
} from './settings-data';

export class CrochetWeaverSettingTab extends PluginSettingTab {
	plugin: CrochetWeaverPlugin;

	constructor(app: App, plugin: CrochetWeaverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): readonly CrochetSettingDefinition[] {
		return getLocalizedSettingDefinitions(this.plugin.getLocale());
	}

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
			.setName(t(locale, 'settings.nextRoundMarker.name'))
			.setDesc(t(locale, 'settings.nextRoundMarker.desc'))
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showNextRoundMarker)
					.onChange(async (value) => {
						this.plugin.settings.showNextRoundMarker = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t(locale, 'settings.nextRoundMarkerColor.name'))
			.setDesc(t(locale, 'settings.nextRoundMarkerColor.desc'))
			.addColorPicker((picker) =>
				picker
					.setValue(this.plugin.settings.nextRoundMarkerColor)
					.onChange(async (value) => {
						this.plugin.settings.nextRoundMarkerColor = value;
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
	}
}
