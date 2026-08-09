## Why

Crocheters often want blank graph paper to sketch a new round/spiral or flat design by hand (or as a printable/reference underlay) before writing it as `crochet` pattern syntax. Today the plugin only renders charts derived from parsed stitch text — there is no way to get an empty, configurable drafting grid. Two shapes are needed: a polar (concentric-ring) grid for round/spiral designs and a rectangular (row/column) mesh grid for flat designs, each with configurable round/row and column counts, matching how dedicated chart-drafting tools expose "Rounds" and "Columns" grid properties.

## What Changes

- Add a new `crochet-grid` Markdown code block that renders a blank drafting grid SVG — no stitch parsing, no progress tracking, just guide geometry.
- Support two grid shapes via a `shape` config key: `polar` (concentric rings + evenly spaced radial spokes, sized by `rounds` and `columns`) and `rect` (a rectangular mesh sized by `rows` and `columns`).
- Resolve `shape`, `rounds`, `columns`, and `rows` from new global settings defaults (`gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, `gridDefaultRows`) with per-block frontmatter overrides, reusing the existing `scale`/`stroke`/`spacing` frontmatter keys and global settings for sizing so the new grid visually matches existing charts.
- Add safety limits for `rounds`, `columns`, and `rows` (mirroring the existing chart budget pattern) so a malformed or excessive block cannot generate an unbounded SVG, with the same inline-error rendering used by `crochet` blocks.
- Add a "Insert blank crochet grid" command that inserts a starter `crochet-grid` block at the cursor using the resolved defaults, as a lighter-weight substitute for a custom properties dialog.
- Add new settings-tab controls (dropdowns) for the four grid defaults, localized in all supported languages.

## Capabilities

### New Capabilities
- `crochet-grid-chart`: blank polar/rectangular drafting-grid code block, its config resolution, safety limits, and settings.

### Modified Capabilities
- None. (`crochet-chart-rendering` and `crochet-pattern-syntax` are untouched — the grid block does not use the stitch-pattern parser.)

## Impact

- Affected source areas: new `src/grid.ts` (or `src/layout/grid.ts` + block processor), `src/settings-data.ts`, `src/settings.ts`, `src/i18n.ts`, `src/main.ts` (block + command registration), `styles.css`.
- Affected Obsidian surfaces: new code-block language (`crochet-grid`), new command, plugin settings tab (4 new dropdowns), `data.json` persisted settings shape.
- Affected tests: new `tests/grid.test.ts` (or similar), plus `tests/settings.test.ts` and `tests/i18n.test.ts` updates.
- No new runtime dependencies. Purely additive — no existing `crochet`/`crochet-tool` behavior changes.
