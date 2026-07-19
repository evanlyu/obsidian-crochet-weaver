## 1. Settings model

- [x] 1.1 Add `nextRoundMarkerColor: string` to `CrochetWeaverSettings` and its default hex value in `DEFAULT_SETTINGS` (`src/settings-data.ts`)
- [x] 1.2 Add a `color` control variant to `CrochetSettingDefinition` and a definition entry for `nextRoundMarkerColor` in `getLocalizedSettingDefinitions` (`src/settings-data.ts`)
- [x] 1.3 Validate and normalize `nextRoundMarkerColor` (6-digit hex) in `normalizeSettings`, falling back to the default on malformed input (`src/settings-data.ts`)

## 2. Localization

- [x] 2.1 Add `settings.nextRoundMarkerColor.name` / `.desc` translation keys for `en`, `zh-TW`, `zh-CN`, `ja` (`src/i18n.ts`)

## 3. Settings UI

- [x] 3.1 Add an `addColorPicker` control for `nextRoundMarkerColor` in the settings tab, placed next to the "Show next round marker" toggle (`src/settings.ts`)

## 4. Option resolution and rendering

- [x] 4.1 Add `nextRoundMarkerColor: string` to `RenderOptions` (`src/types.ts`)
- [x] 4.2 Resolve `nextRoundMarkerColor` from global settings only (no frontmatter override) in `resolveOptions` (`src/options.ts`)
- [x] 4.3 Use `options.nextRoundMarkerColor` as the next-round marker's `stroke` attribute instead of `currentColor` (`src/render.ts`)
- [x] 4.4 Remove the now-unused `.crochet-weaver-next-round-marker { color: var(--color-accent) }` rule (`styles.css`)

## 5. Tests

- [x] 5.1 Update `tests/render.test.ts` to assert the marker's `stroke` attribute reflects the configured `nextRoundMarkerColor`
- [x] 5.2 Update `tests/options.test.ts` fixtures/assertions to include `nextRoundMarkerColor`
- [x] 5.3 Add/extend `tests/settings.test.ts` cases for `nextRoundMarkerColor` normalization (valid hex, malformed hex, missing) and the settings-definitions list
- [x] 5.4 Run `npm run lint` and `npm test` and fix any failures
