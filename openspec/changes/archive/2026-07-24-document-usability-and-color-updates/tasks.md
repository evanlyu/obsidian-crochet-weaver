## 1. Flat-chart grid guide fix

- [x] 1.1 Track real min/max stitch column across rows in `layoutFlat` instead of assuming column 0 (`src/layout/flat.ts`)
- [x] 1.2 Anchor `buildMeshGuide`'s column range to that real extent
- [x] 1.3 Add a regression test that fails on the old (column-0-assumed) behavior (`tests/layout.test.ts`)

## 2. Scrollable / drag-to-pan charts

- [x] 2.1 Add `wrapScrollable()` helper: wraps a rendered SVG in a scrollable container, adds mouse drag-to-pan, centers the initial scroll position when overflowing (`src/scroll-pan.ts`, new)
- [x] 2.2 Wire it into chart rendering and the blank-grid renderer (`src/render.ts`, `src/grid/render.ts`)
- [x] 2.3 Add `.crochet-weaver-canvas` styles: bounded max-height, `overflow: auto`, grab/grabbing cursor (`styles.css`)
- [x] 2.4 Fix the flex `min-width: auto` overflow bug on the chart's panel container when embedded next to the progress tool (`.crochet-weaver-chart-row .crochet-weaver-chart-container`)
- [x] 2.5 Add tests for wrapper creation, drag scroll math, and initial centering (`tests/render.test.ts` and direct DOM checks)

## 3. Progress-tool row layout (reset-all, wrapping, overlap fix)

- [x] 3.1 Add a "Reset all" button next to the per-row stitch-count reset button (`src/tool.ts`, `src/i18n.ts`, `styles.css`)
- [x] 3.2 First-pass mobile fix: `flex-wrap` on the stitch-counter and bottom control button rows
- [x] 3.3 Second-pass fix: `min-width: 0` + `overflow-wrap` on the row-text element and its flex-item ancestors
- [x] 3.4 Rework `.crochet-tool-row` / `.crochet-pattern-text-row` from flex to CSS Grid (`auto minmax(0, 1fr) auto`) after the flex-based fixes were confirmed (via real browser rendering) to still overlap on a `<button>` element
- [x] 3.5 Switch text wrapping from `overflow-wrap: anywhere` to `overflow-wrap: break-word` + `word-break: normal`
- [x] 3.6 Verify the final layout by rendering the real component (happy-dom → static HTML → Safari, screenshotted) at a narrow width

## 4. Readable pattern-text style

- [x] 4.1 Add `PatternTextStyle` type, `patternTextStyle` global setting, and `readable` per-chart frontmatter override (`src/types.ts`, `src/settings-data.ts`, `src/options.ts`)
- [x] 4.2 Add `stitchName()` lookup with per-locale full names for all 46 stitches plus both round anchors, falling back to the raw abbreviation when untranslated (`src/i18n.ts`)
- [x] 4.3 Thread `textStyle` through `renderCrochetTool`/`renderCrochetPatternText`; implement anchor-first `魔術環(短針6)` formatting for readable mode (`src/tool.ts`)
- [x] 4.4 Add the settings-tab dropdown (declarative `getSettingDefinitions()` path and the legacy `display()` fallback) (`src/settings.ts`)
- [x] 4.5 Tests for translation lookup, readable-mode formatting (stitches, groups, repeats, anchor), and settings resolution

## 5. Yarn color-change syntax

- [x] 5.1 Add the `color`/`ColorChange` grammar rule with word-boundary and optional-colon handling (`src/grammar.peggy`)
- [x] 5.2 Add `ColorChangeNode` to the AST, `color?` to `StitchNode`/`GroupNode`/`RenderItem`, `ColorMarker` type, `LayoutResult.colorMarkers` (`src/types.ts`)
- [x] 5.3 Thread a `ColorState` ref through `unroll()`, tagging produced units with the active color (`src/layout/steps.ts`)
- [x] 5.4 Track color across rows and collect transition markers in all three layouts (`src/layout/flat.ts`, `round.ts`, `spiral.ts`, `polar.ts`) and shift markers through `normalize()`
- [x] 5.5 Render a hollow ring marker (not a filled dot, not stitch recoloring) before the stitch symbols (`src/render.ts`, `src/layout/constants.ts` for `COLOR_MARKER_RADIUS`); tune radius/stroke-width down after visual review
- [x] 5.6 Add the "change to `<color>`" phrase to `serializeNode`/`rowStepsText` for both text styles (`src/tool.ts`, `src/i18n.ts`)
- [x] 5.7 Add `ColorChangeNode` handling to the budget validator (`src/budget.ts`)
- [x] 5.8 Tests across parser, layout (all three chart types, group color, cross-row persistence, marker placement), render (ring drawn, symbols stay theme-colored), and tool text

## 6. AI pattern-authoring reference in four languages

- [x] 6.1 Translate `docs/ai-pattern-authoring.md` into `.zh-TW.md`, `.zh-CN.md`, `.ja.md`, keeping code blocks and syntax tokens verbatim; add cross-language nav links to all four files
- [x] 6.2 Document the color-change syntax addition in all four language versions after it was implemented
- [x] 6.3 Generate `src/ai-doc-content.ts` (bundled string constants) from the four `.md` files; add a byte-equality test so the two can't silently drift (`tests/ai-doc-content.test.ts`)
- [x] 6.4 Add the "Copy AI pattern-authoring instructions" settings section with one button per language (`src/settings.ts`, `src/i18n.ts`)
- [x] 6.5 Update `README.md` and its three translations to link the AI doc's per-language copy and mention the settings copy buttons

## 7. Documentation and examples

- [x] 7.1 Add "Readable pattern text style" and "Yarn Color Changes" sections to `examples/demo.md`; validate every code block in the file still parses
- [x] 7.2 Add feature bullets and a "Color changes" syntax subsection to `README.md` and its three translations; link `examples/demo.md` from all four (previously only linked from the English version)
- [x] 7.3 Update `CHANGELOG.md`'s 1.2.0 entry to cover every item in this change
- [x] 7.4 Update the user's `Mini Baby Penguin.md` vault note to use `color` steps for its multi-color rounds, matching the source pattern
- [x] 7.5 Analyze a second real pattern (lemon slice motif) and write it as a new vault note (`Lemon1.md`) using this change's syntax, including its `color` steps

## 8. Tooling

- [x] 8.1 Fix `npm run lint` reporting false-positive "unsafe call" errors on a checkout without a pre-generated `src/parser.ts` — add `generate-parser` as a prerequisite, matching `test`/`dev`/`build`

## 9. Release

- [x] 9.1 Bump version to 1.2.0 (`manifest.json`, `package.json`, `versions.json`)
- [ ] 9.2 Cut an actual GitHub release (tag + release notes) — not done as part of this change

## 10. Verification

- [x] 10.1 `npm test` passing (196 tests, up from 171 at the start of this change), `npm run lint` clean, `npx tsc -noEmit` clean, after every section above
- [x] 10.2 Visually verify the color-marker rendering and the final grid-based row layout against a real browser render (not just unit tests), since two earlier CSS-only fixes in section 3 looked correct on paper but were not
