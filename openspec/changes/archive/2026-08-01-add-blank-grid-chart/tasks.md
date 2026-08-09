## 1. Grid config parsing

- [x] 1.1 Add a `GridConfig` type (`shape: 'polar' | 'rect'`, `rounds`, `columns`, `rows`, plus optional `scale`/`stroke`/`spacing` strings) in `src/types.ts`
- [x] 1.2 Add `parseGridConfig(source: string)` in a new `src/grid/parse.ts` that reads flat `key: value` lines (no frontmatter fences, no rows) and returns a `GridConfig`, throwing a parse error on any malformed line
- [x] 1.3 Add unit tests for `parseGridConfig` covering empty source, valid keys, unknown keys (ignored), and a malformed line (error)

## 2. Settings model

- [x] 2.1 Add `gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, `gridDefaultRows` to `CrochetWeaverSettings` and `DEFAULT_SETTINGS` (`src/settings-data.ts`)
- [x] 2.2 Add dropdown definitions for the four new settings in `getLocalizedSettingDefinitions` (`src/settings-data.ts`)
- [x] 2.3 Validate and normalize the four new settings in `normalizeSettings` (positive-integer bounds, valid `shape` enum), falling back to defaults on malformed input (`src/settings-data.ts`)
- [x] 2.4 Update `ringSpacing` setting description text to mention it also sizes polar-grid rings and rect-grid cells (`src/settings-data.ts`, all 4 locales in `src/i18n.ts`)

## 3. Localization

- [x] 3.1 Add `settings.gridDefaultShape.*`, `settings.gridDefaultRounds.*`, `settings.gridDefaultColumns.*`, `settings.gridDefaultRows.*` translation keys for `en`, `zh-TW`, `zh-CN`, `ja` (`src/i18n.ts`)
- [x] 3.2 Add a translation key for the grid block's malformed-config error message in all four locales (`src/i18n.ts`)
- [x] 3.3 Add a translation key for the "Insert blank crochet grid" command name in all four locales (`src/i18n.ts`)

## 4. Settings UI

- [x] 4.1 Render the four new grid-default dropdowns in the settings tab (`src/settings.ts`). (No section heading was added — the existing settings tab has no other section dividers, so the new controls are appended to the same flat list for consistency.)

## 5. Grid option resolution

- [x] 5.1 Add `resolveGridOptions(config: GridConfig, settings: CrochetWeaverSettings)` in `src/grid/options.ts` that resolves `shape`, `rounds`, `columns`, `rows` from config with settings fallback, and reuses the same `scale`/`strokeWidth`/`ringSpacing` resolution logic `resolveOptions` uses
- [x] 5.2 Add grid safety-limit constants (`maxRounds: 40`, `maxColumns: 72`, `maxRows: 40`) in a new `GRID_BUDGET` in `src/grid/budget.ts`, following the `CHART_BUDGET` pattern in `src/budget.ts`
- [x] 5.3 Add `validateGridBudget` that throws a `GridBudgetError` (mirroring `ChartBudgetError`'s localized-error shape) when resolved `rounds`/`columns`/`rows` exceed `GRID_BUDGET`
- [x] 5.4 Add unit tests for option resolution (config overrides, invalid overrides falling back) and for budget validation (`tests/grid.test.ts`)

## 6. Grid layout and rendering

- [x] 6.1 Add `layoutPolarGrid` (in `src/grid/layout.ts`, via `calculateGridLayout`) computing N ring radii spaced by `ringSpacing` and M evenly angled spoke endpoints. (Ring radii are `i * ringSpacing`, independent of the stitch-chart `BASE_RADIUS`/`MIN_ARC` constants, since a blank grid has no stitch geometry to match.)
- [x] 6.2 Add `layoutRectGrid` in `src/grid/layout.ts` computing a rows x columns mesh of horizontal/vertical line coordinates sized by the resolved spacing (`scale` is applied at render time via the SVG `width`/`height` attributes, same as `renderSVG`)
- [x] 6.3 Add `renderGrid(layout, container, options, locale)` in `src/grid/render.ts` that draws the resolved shape's rings/spokes or mesh lines as an SVG with root class `crochet-weaver-grid`, using `currentColor` and the resolved `strokeWidth`
- [x] 6.4 Add unit tests asserting ring/spoke counts for `shape: polar` and mesh line counts for `shape: rect` (`tests/grid.test.ts`)

## 7. Block registration and command

- [x] 7.1 Register the `crochet-grid` Markdown code block processor in `src/main.ts`: parse config, resolve options, validate budget, layout, render; render an inline `crochet-weaver-error` box on any parse/budget failure via a new `renderGridError` in `src/grid/errors.ts` (parallel to `src/errors.ts`, since grid errors have their own title/message keys and a `GridParseError` shape instead of a PEG parse-error shape)
- [x] 7.2 Add an "Insert blank crochet grid" editor command in `src/main.ts` that inserts a fenced `crochet-grid` block at the cursor pre-filled with the current `gridDefaultShape`/`gridDefaultRounds`/`gridDefaultColumns`/`gridDefaultRows` settings
- [x] 7.3 No dedicated `main.ts`-level test was added — this project has no unit tests for `main.ts`'s existing `crochet`/`crochet-tool` registration either (block processors and commands are Obsidian-API-bound). Covered instead by unit tests on every function `main.ts` calls (parse/options/budget/layout/render) plus manual verification (task 9.2).

## 8. Styling and docs

- [x] 8.1 Add `.crochet-weaver-grid` line styling (stroke, fill: none) to `styles.css`
- [x] 8.2 Document the `crochet-grid` block (config keys, both shapes, an example of each) in `README.md`, `README.ja.md`, `README.zh-CN.md`, `README.zh-TW.md`

## 9. Verification

- [x] 9.1 Run `npm run lint` and `npm test` and fix any failures (99 tests passing, 0 lint errors — 1 pre-existing deprecation warning on the legacy `display()` settings-tab fallback, unrelated to this change)
- [ ] 9.2 Manually install the built plugin in a vault and verify a polar grid, a rect grid, an invalid config, and the insert command all behave as specced
