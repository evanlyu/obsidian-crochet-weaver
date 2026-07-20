## Why

`crochet-grid` (see the `crochet-grid-chart` capability) draws a blank drafting grid as its own separate block, disconnected from any real pattern. Users also want the reference grid drawn directly behind their actual `crochet` chart — so the concentric round guides or row/column mesh line up with the real stitches they've already written, making it easier to see "which round/row am I on" at a glance, especially alongside the embedded progress tool's current-position highlight.

## What Changes

- Add a `grid` frontmatter key (and matching `showGrid` global setting) to the existing `crochet` block. When truthy, the chart draws a faint background guide layer behind the stitch symbols:
  - `type: round` / `type: spiral`: one guide ring per round, at the round's real computed radius; `type: flat`: a row/column mesh aligned to the chart's real row height and stitch width.
  - Guide density defaults to the pattern's own real extent (actual round/row count, and the last round's stitch count / the widest row's stitch count for the cross-axis) — no extra config needed for the common case.
  - Optional `rounds:` (round/spiral) or `rows:` (flat) and `columns:` frontmatter keys let the guide extend *beyond* the real pattern (e.g., to preview how many more rounds a design might need), never fewer than the real extent.
- Extend the shared layout pipeline (`normalize`, `layoutRound`, `layoutSpiral`, `layoutFlat`) to compute and pass through this guide geometry, and `renderSVG` to draw it as a background layer before the stitch symbols.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `crochet-chart-rendering`: `crochet` charts gain an optional background grid-guide layer resolved from a new `grid`/`showGrid` option and (for round/spiral) `rounds`/(for flat) `rows`, plus `columns`, frontmatter overrides.

## Impact

- Affected source areas: `src/types.ts`, `src/options.ts`, `src/settings-data.ts`, `src/settings.ts`, `src/i18n.ts`, `src/layout/normalize.ts`, `src/layout/round.ts`, `src/layout/spiral.ts`, `src/layout/flat.ts`, `src/render.ts`, `styles.css`.
- Affected Obsidian surfaces: plugin settings tab (new toggle), `data.json` persisted settings shape.
- Affected tests: `tests/options.test.ts`, `tests/layout.test.ts`, `tests/render.test.ts`, `tests/settings.test.ts`.
- No new runtime dependencies. Purely additive to the existing `crochet` block; default `showGrid: false` keeps all current charts unchanged until a user opts in.
