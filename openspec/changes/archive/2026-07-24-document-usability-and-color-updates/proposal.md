## Why

This change was implemented conversationally (bug reports and feature requests against a running Obsidian vault, with feedback iterated in place) rather than through the propose-first workflow, so no OpenSpec artifacts existed for it. It bundles a batch of chart/tool usability fixes and one new capability (yarn color changes) shipped together in the same session; this change captures them retroactively so the spec baseline matches what is now in `main`.

## What Changes

- Fix the flat-chart grid guide (`grid: on`) anchoring to the real min/max stitch position instead of assuming row 1 starts at column 0 — symmetric increase/decrease motifs no longer drift outside the guide box.
- Add a scrollable, drag-to-pan viewport around oversized charts and blank grids instead of squeezing them to fit their container; an oversized chart opens centered on its middle.
- Fix two flexbox `min-width: auto` overflow bugs uncovered by the above (the chart's flex-row panel, and the progress tool's row text) that clipped content on narrow/portrait widths instead of wrapping it.
- Rework the progress-tool row layout (`.crochet-tool-row`, `.crochet-pattern-text-row`) from flex to CSS Grid (`auto minmax(0, 1fr) auto`) so the round badge and stitch-count columns can never overlap the pattern-text column regardless of width — the flex-based fix was not sufficient on its own.
- Add a **"Reset all"** button next to the stitch counter's existing per-row reset, doing a full reset (round progress + stitch count) as a shortcut.
- Add a **readable pattern-text style** (`readable: on` / global "Pattern text style" setting) that translates stitch abbreviations into full, localized names (e.g. `短針6`) instead of raw shorthand, across all 46 stitch symbols and both round anchors, in all four supported languages.
- **BREAKING (internal only, no persisted-data impact)**: `layout/steps.ts#unroll` gains a second `colorState` parameter; existing single-argument call sites are unaffected since it defaults to a fresh state.
- Add a **yarn color-change step** (`color <name>` / `color: <name>` / `color #hex`) to the pattern grammar: applies to every stitch from that point on, in the current row and every later row, until changed again. Charts flag the first stitch of each new color with a small hollow ring (not a filled dot, and not recoloring the stitch symbols themselves) so it never hides the stitch or competes with the progress tool's current-position highlight. Shown as "change to `<color>`" in both tool and pattern-text panels.
- Translate the AI pattern-authoring reference doc into Traditional Chinese, Simplified Chinese, and Japanese (previously English-only), and add a **"Copy AI pattern-authoring instructions"** settings section with one button per language.
- Fix `npm run lint` reporting false-positive "unsafe call" errors on a fresh checkout (the script didn't regenerate `src/parser.ts` first, unlike `test`/`dev`/`build`).

## Capabilities

### New Capabilities
- `ai-pattern-authoring-reference`: the four-language AI pattern-authoring reference document and the settings-tab affordance to copy any translation to the clipboard.

### Modified Capabilities
- `crochet-pattern-syntax`: add the `color <name>` step (a non-stitch step that sets the active yarn color for subsequent stitches).
- `crochet-chart-rendering`: fix flat-chart grid-guide anchoring; add color-change ring markers; add the scrollable/drag-to-pan chart viewport.
- `crochet-progress-tool`: add the "Reset all" control; add the readable pattern-text style; fix row-layout overflow/wrapping so long rows and their round/count badges never clip or overlap on narrow widths.

## Impact

- Affected source areas: `src/grammar.peggy` (regenerates `src/parser.ts`), `src/types.ts`, `src/layout/{flat,round,spiral,polar,steps,normalize,constants}.ts`, `src/render.ts`, `src/scroll-pan.ts` (new), `src/tool.ts`, `src/options.ts`, `src/settings.ts`, `src/settings-data.ts`, `src/i18n.ts`, `src/ai-doc-content.ts` (new, generated from `docs/ai-pattern-authoring*.md`), `src/budget.ts`, `src/grid/render.ts`, `styles.css`, `package.json` (`lint` script), `eslint.config.mts`.
- Docs: `docs/ai-pattern-authoring.md` plus three new translations, `examples/demo.md`, `README.md` plus its three translations, `CHANGELOG.md` (1.2.0 entry).
- Version bump to 1.2.0 (`manifest.json`, `package.json`, `versions.json`); no GitHub release cut as part of this change.
- Test suite grew from 171 to 196 cases covering every item above; no persisted-data migration needed (all new settings default to the pre-existing behavior).
