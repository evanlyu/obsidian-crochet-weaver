## Why

Crochet Weaver already implements a usable crochet-chart workflow, but the repository does not yet have an OpenSpec baseline that records the expected behavior. Capturing the current syntax, rendering, settings, and progress-tool contracts now will make future changes testable and prevent regressions in chart generation.

## What Changes

- Document the current crochet pattern syntax accepted by `crochet` and `crochet-tool` code blocks.
- Establish the chart rendering contract for flat rows, concentric rounds, continuous spirals, stitch symbols, loop markers, and error display.
- Define the user settings and per-pattern frontmatter override rules.
- Specify the `crochet-tool` progress panel behavior, stitch counts, controls, and persistence model.
- Record the completed implementation tasks that turned the baseline into automated tests and user-facing documentation.
- Detail the next-round first-stitch marker for concentric round charts.
- Describe the global `showNextRoundMarker` setting.
- Cover the language preference and internationalization support.
- Explain the chart safety limits that prevent rendering excessive items.
- Address settings normalization for malformed persisted settings.
- Record the README replacement, layout logic split, and test coverage.

## Capabilities

### New Capabilities

- `crochet-pattern-syntax`: Pattern language, frontmatter configuration, row labels, stitches, repeats, groups, anchors, and loop modifiers.
- `crochet-chart-rendering`: Conversion of parsed crochet patterns into themed SVG charts across flat, round, and spiral layouts, including next-round first-stitch markers, safety limits, and settings normalization.
- `crochet-progress-tool`: Readable pattern checklist, per-row stitch counts, progress controls, and persisted completion state for `crochet-tool` blocks with full localization support.

### Modified Capabilities

- None.

## Impact

- Affected source areas: `src/grammar.peggy`, generated `src/parser.ts`, `src/types.ts`, `src/layout.ts` (split into focused modules), `src/render.ts`, `src/tool.ts`, `src/settings.ts`, `src/main.ts`, and `styles.css`.
- Affected Obsidian surfaces: Markdown code block processors for `crochet` and `crochet-tool`, the plugin settings tab, and plugin `data.json` storage.
- Affected project workflow: parsing, layout semantics, settings precedence, rendering output, progress persistence, and marker behavior are covered by automated tests and should remain regression-protected in future changes.
- No new runtime dependencies or network behavior are introduced by this documentation baseline.
