## Context

`embed-progress-tool-in-chart` added a chart-only `tool: on` frontmatter key (`resolveShowTool(ast): boolean`, no global setting) that wraps the chart and `renderCrochetTool` in a `.crochet-weaver-with-tool` flex row. This change extends that mechanism: a second panel type (read-only pattern text), global on/off defaults for both panel types, and a position choice.

## Goals / Non-Goals

**Goals:**
- `text: on` shows a read-only per-row shorthand listing next to the chart, reusing `tool.ts`'s existing row-serialization helpers (`serializeSteps`, `anchorText`, `loopText`, `roundStitchCount`, `patternTitle`).
- `showTool`/`showPatternText` global settings become the defaults; `tool`/`text` frontmatter keys override them per chart, matching the existing `highlight`/`highlightIncDec` precedent.
- `panelPosition` global setting (`right`/`left`/`below`) plus a per-chart `position` override controls where the panel sits relative to the chart.

**Non-Goals:**
- No combined tool+text panel — `tool` wins if both resolve true.
- No independent positioning of the chart itself (e.g. "image position" as a separate axis from panel position) — one `position` value describes the panel's placement relative to the chart, which fully determines the layout since there are always exactly two elements (chart, panel) when a panel is shown.
- No "above" position — only right/left/below, matching what was asked for.

## Decisions

- **`resolveShowTool(ast): boolean` (chart-only, no settings) is replaced by `resolvePanelOptions(ast, settings): PanelOptions`** returning `{ showTool, showText, position }`. This is a pre-release rename (the repo has no commits yet), consolidating what would otherwise be three near-identical small resolver functions into one call site in `main.ts`, mirroring how `resolveOptions` already bundles multiple settings+frontmatter resolutions into one object.
- **`PanelPosition = 'left' | 'right' | 'below'` lives in `src/types.ts`**, next to `SymbolRotation`, since both are small string-union settings/frontmatter enums resolved the same way (`isSymbolRotation`-style guard + lowercase frontmatter value).
- **`text` reuses `tool.ts`'s private helpers via a new exported `renderCrochetPatternText(source, el, locale)`** in the same file (no new module), rendering plain `<div>` rows (no buttons, no click handlers, no progress store) under `.crochet-pattern-text`, kept visually distinct from `.crochet-tool` so it's never mistaken for interactive.
- **Position is expressed as one enum, not two independent left/right toggles for "content" and "image".** Since a panel-bearing chart always has exactly two flex children (chart, panel) in a fixed DOM order (chart, then panel), `right` is the base row order, `left` is `flex-direction: row-reverse` (panel visually first), and `below` is `flex-direction: column` (panel stacked under the chart). A second independent "image position" setting would only ever be the mirror of this one value, so it is not added.
- **Global defaults, frontmatter overrides, same `boolOption`/lowercase-enum pattern as the rest of `resolveOptions`.** `showTool`/`showPatternText` default to `false` (panels are opt-in visual additions, consistent with `highlightIncDec`'s default-off). `panelPosition` defaults to `'right'` (matches the layout already shipped for `tool: on`, so existing usages keep the same look).

## Risks / Trade-offs

- [Renaming/refactoring the just-added `resolveShowTool` and `.crochet-weaver-with-tool` class before either has shipped] → Mitigation: no commits exist yet in this repo; safe to change freely, and it avoids leaving a narrower, soon-obsolete API in place.
- [Someone expects `text` and `tool` to combine] → Mitigation: documented precedence (`tool` wins), unchanged from the prior design.
