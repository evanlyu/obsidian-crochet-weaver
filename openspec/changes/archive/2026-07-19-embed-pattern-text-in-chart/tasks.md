## 1. Types and settings model

- [x] 1.1 Add `PanelPosition = 'left' | 'right' | 'below'` to `src/types.ts`
- [x] 1.2 Add `showTool: boolean`, `showPatternText: boolean`, `panelPosition: PanelPosition` to `CrochetWeaverSettings` and their defaults (`false`, `false`, `'right'`) to `DEFAULT_SETTINGS` (`src/settings-data.ts`)
- [x] 1.3 Add setting definitions (two toggles, one dropdown) for the three new settings in `getLocalizedSettingDefinitions`, extending `CrochetSettingDefinition`'s control key unions (`src/settings-data.ts`)
- [x] 1.4 Validate and normalize the three new settings in `normalizeSettings`, falling back to defaults on malformed input (`src/settings-data.ts`)

## 2. Localization

- [x] 2.1 Add `settings.showTool.*`, `settings.showPatternText.*`, `settings.panelPosition.*` (name/desc + left/right/below option labels) for `en`, `zh-TW`, `zh-CN`, `ja` (`src/i18n.ts`)

## 3. Settings UI

- [x] 3.1 Add toggle controls for `showTool` and `showPatternText`, and a dropdown for `panelPosition`, in the settings tab (`src/settings.ts`)

## 4. Pattern-text rendering

- [x] 4.1 Add `renderCrochetPatternText(source, el, locale)` to `src/tool.ts`, reusing existing private row-serialization helpers, rendering non-interactive rows under `.crochet-pattern-text`

## 5. Option resolution and wiring

- [x] 5.1 Replace `resolveShowTool` in `src/options.ts` with `resolvePanelOptions(ast, settings): { showTool: boolean; showText: boolean; position: PanelPosition }`, resolving `tool`/`text`/`position` frontmatter over `showTool`/`showPatternText`/`panelPosition` settings
- [x] 5.2 Update `src/main.ts`'s `crochet` processor to call `resolvePanelOptions`, apply tool-over-text precedence, and render into a `crochet-weaver-chart-row crochet-weaver-panel-<position>` wrapper when a panel is shown

## 6. Layout styling

- [x] 6.1 Rename `.crochet-weaver-with-tool` to `.crochet-weaver-chart-row` in `styles.css` and add `.crochet-weaver-panel-left` (row-reverse) / `.crochet-weaver-panel-below` (column) variants
- [x] 6.2 Add `.crochet-pattern-text` panel styles (title, row list, badge/steps/count) mirroring `.crochet-tool`'s non-interactive parts, included in the chart-row flex sizing rules

## 7. Tests

- [x] 7.1 Update/extend `tests/options.test.ts` for `resolvePanelOptions`: global defaults, frontmatter overrides, invalid-value fallback, tool-over-text precedence
- [x] 7.2 Add `tests/tool.test.ts` cases for `renderCrochetPatternText`: valid render (rows, counts, no buttons/progress bar), error rendering, localized title
- [x] 7.3 Extend `tests/settings.test.ts` for the three new settings: normalization, `SETTING_DEFINITIONS` control list, localized definition indices
- [x] 7.4 Run `npm run lint` and `npm test` and fix any failures

## 8. Manual verification

- [ ] 8.1 In the sandbox note, try `text: on`, `position: left`, and `position: below` on a `crochet` block and confirm layout and content match expectations
