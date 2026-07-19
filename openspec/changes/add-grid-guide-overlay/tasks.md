## 1. Shared types

- [x] 1.1 Add a `ChartGridGuide { circles: readonly GridCircle[]; lines: readonly GridLine[] }` type in `src/types.ts`, reusing the existing `GridCircle`/`GridLine` shapes
- [x] 1.2 Add `grid: boolean`, `gridCount?: number`, `gridColumns?: number` to `LayoutOptions` in `src/types.ts`
- [x] 1.3 Add `gridGuide?: ChartGridGuide` to `LayoutResult` in `src/types.ts`

## 2. Settings model

- [x] 2.1 Add `showGrid: boolean` (default `false`) to `CrochetWeaverSettings`/`DEFAULT_SETTINGS` and a toggle definition in `getLocalizedSettingDefinitions` (`src/settings-data.ts`)
- [x] 2.2 Normalize `showGrid` in `normalizeSettings` (`src/settings-data.ts`)
- [x] 2.3 Add `settings.showGrid.name`/`.desc` translation keys for `en`, `zh-TW`, `zh-CN`, `ja` (`src/i18n.ts`)
- [x] 2.4 Add the toggle control to the settings tab's manual `display()` fallback (`src/settings.ts`)

## 3. Option resolution

- [x] 3.1 Add a `positiveInt` helper and resolve `grid` (bool, `config.grid` / `settings.showGrid`), `gridCount` (from `config.rounds` for `type: round`/`spiral`, or `config.rows` for `type: flat`), and `gridColumns` (`config.columns`) in `resolveOptions` (`src/options.ts`)
- [x] 3.2 Add unit tests covering: grid on/off via frontmatter and setting, invalid frontmatter falling back, gridCount/gridColumns parsed per chart type (`tests/options.test.ts`)

## 4. Layout: normalize

- [x] 4.1 Extend `normalize(items, rowConnectors?, gridGuide?)` in `src/layout/normalize.ts` to include the guide's circles/lines in the bounding-box calculation and to shift the guide by the same `(dx, dy)` as items, returning `gridGuide` on the result
- [x] 4.2 Add unit tests for bbox expansion (a guide larger than the stitch bounding box isn't clipped) and correct shifting (`tests/normalize.test.ts`)

## 5. Layout: round

- [x] 5.1 In `layoutRound` (`src/layout/round.ts`), collect each round's real computed radius and last round's rendered unit count as the loop already runs
- [x] 5.2 When `options.grid`, build ring circles (real radii, extended beyond the real round count by stepping `ringSpacing`, per `options.gridCount`) and spokes (from center to the outer ring, count from `options.gridColumns` or the last round's rendered unit count — not its stitch-weighted count, since an `inc` is one angular slot) via the shared `buildRingGuide` helper (`src/layout/grid-guide.ts`) and pass as `gridGuide` into `normalize`
- [x] 5.3 Add unit tests: ring count/radii match real rounds, extension beyond real count, override below real count is ignored, default vs. overridden spoke count (`tests/layout.test.ts`)

## 6. Layout: spiral

- [x] 6.1 In `layoutSpiral` (`src/layout/spiral.ts`), record the radius reached at the end of each row and that row's rendered unit count
- [x] 6.2 When `options.grid`, build the same ring/spoke guide shape as round layout (via `buildRingGuide`), using per-row end radius instead of per-round radius, and pass as `gridGuide` into `normalize`
- [x] 6.3 Add unit tests mirroring the round-layout guide tests, adapted for spiral's per-row radius (`tests/layout.test.ts`)

## 7. Layout: flat

- [x] 7.1 In `layoutFlat` (`src/layout/flat.ts`), when `options.grid`, build a rectangular mesh (`ROW_HEIGHT`/`STITCH_WIDTH` cell size) over the chart's real bounding box, row count from `options.gridCount` (min: real row count) and column count from `options.gridColumns` (min: widest row's rendered unit count), and pass as `gridGuide` into `normalize`
- [x] 7.2 `layoutFlat` gained an `options: LayoutOptions` parameter (previously took none); updated `src/layout.ts`'s call site accordingly
- [x] 7.3 Add unit tests: default mesh size matches real extent, override extends it, override below real extent is ignored (`tests/layout.test.ts`)

## 8. Rendering

- [x] 8.1 In `renderSVG` (`src/render.ts`), draw `layout.gridGuide`'s circles and lines first (before stitch symbols and row connectors), as plain SVG `circle`/`line` elements with class `crochet-weaver-grid-guide`
- [x] 8.2 Add `.crochet-weaver-grid-guide` styling to `styles.css` (`color: var(--text-faint)`, reduced opacity)
- [x] 8.3 Add unit tests asserting the guide layer renders before symbol elements and uses the right class (`tests/render.test.ts`)

## 8a. Safety limits

- [x] 8a.1 Add a `GRID_GUIDE_BUDGET` constant (`maxRounds: 40`, `maxColumns: 72`, `maxRows: 40`) and a `validateGridGuideBudget(chartType, options)` function in `src/budget.ts`, throwing the existing `ChartBudgetError` (reusing the `budget.gridRounds`/`budget.gridColumns`/`budget.gridRows` translation strings added for the standalone crochet-grid block) — kept independent from `src/grid/budget.ts` per the design doc's "types only, not code paths" boundary
- [x] 8a.2 Call `validateGridGuideBudget` in the `crochet` block processor (`src/main.ts`) right after `resolveOptions`, before layout
- [x] 8a.3 Add unit tests: disabled guide skips validation, ordinary overrides pass, excessive rounds/rows/columns each throw (`tests/budget.test.ts`)

## 9. Docs

- [x] 9.1 Document `grid`/`rounds`/`rows`/`columns` on `crochet` blocks and the `showGrid` setting in `README.md`, `README.ja.md`, `README.zh-CN.md`, `README.zh-TW.md`
- [x] 9.2 Add a demo section to `examples/demo.md` showing a round chart with `grid: on` (default-aligned), one with an extended `rounds:` override, plus spiral and flat examples

## 10. Verification

- [x] 10.1 Run `npm run lint` and `npm test` and fix any failures (121 tests passing, 0 lint errors — 1 pre-existing deprecation warning unrelated to this change)
- [x] 10.2 Ran `npm run build` and copied the updated demo section into the vault's Crochet Weaver Demo note. Visual confirmation in Obsidian itself is left to the user (requires reloading the plugin in a running Obsidian instance).
