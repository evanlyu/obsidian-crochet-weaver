## Why

`tool: on` (from `embed-progress-tool-in-chart`) lets a `crochet` block show its interactive progress checklist next to the chart, but only as a per-chart frontmatter flag — there is no way to make it the default for every chart, and no way to instead show a read-only shorthand list (no progress UI) for people who just want to read the notation next to the picture. There is also no control over which side of the chart the panel appears on, or whether it stacks below instead.

## What Changes

- Add a `text` boolean frontmatter key to the `crochet` code block. When `text: on`, the block renders the SVG chart next to a static, read-only list of the pattern's rows (row label, normalized shorthand steps, stitch count) — reusing the same block source already parsed for the chart, so there is still only one copy of the pattern to maintain. No progress bar, no buttons, no persisted state.
- If both `tool: on` and `text: on` are set on the same block, `tool` takes precedence (it already includes a row-by-row breakdown, so `text` would be redundant).
- Promote both embed flags to global plugin settings — `showTool` and `showPatternText` — that set the default for every `crochet` block. The existing `tool`/`text` frontmatter keys become per-chart overrides on top of those global defaults, following the same override pattern already used by `highlight`/`highlightIncDec`, `rotation`/`symbolRotation`, etc.
- Add a `panelPosition` global setting (`right` default, `left`, or `below`) controlling where the embedded panel (tool or text) sits relative to the chart, plus a matching per-chart `position` frontmatter override.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crochet-chart-rendering`: the `crochet` block gains a `text` frontmatter key (read-only pattern listing), global settings `showTool`/`showPatternText`/`panelPosition` that provide defaults for the `tool`/`text`/`position` frontmatter keys, and a configurable panel position (right/left/below) for any embedded tool or text panel.

## Impact

- Affected source areas: `src/tool.ts` (new `renderCrochetPatternText`), `src/types.ts` (`PanelPosition`), `src/settings-data.ts` (new settings + normalization + definitions), `src/settings.ts` (new UI controls), `src/i18n.ts` (new strings, all locales), `src/options.ts` (`resolvePanelOptions` replacing the earlier chart-only `resolveShowTool`), `src/main.ts` (wiring/precedence/position class), `styles.css` (read-only panel styles, position-aware layout).
- Affected tests: `tests/tool.test.ts`, `tests/options.test.ts`, `tests/settings.test.ts`.
- No parser/grammar changes needed. Not a breaking change: all new settings default to the prior behavior (panels off, position right).
