## Context

Crochet Weaver is an Obsidian community plugin that renders crochet charts from fenced Markdown code blocks. The current implementation is local-only and centered on a pipeline of Peggy grammar parsing, typed AST handling, layout calculation, SVG rendering, settings resolution, and an optional progress-tracking panel.

The repository currently has no archived base OpenSpec requirements. This change documents the current product contract and its completed automated test coverage before future feature work changes syntax, layout behavior, or persisted progress data.

## Goals / Non-Goals

**Goals:**

- Establish a baseline specification for accepted crochet pattern syntax.
- Establish a baseline specification for SVG chart generation in flat, round, and spiral modes.
- Establish a baseline specification for global settings, frontmatter overrides, and error handling.
- Establish a baseline specification for `crochet-tool` progress rendering and persistence.
- Record the completed fixtures, tests, and user documentation that protect the baseline behavior.

**Non-Goals:**

- Change the parser grammar, layout algorithms, symbol artwork, or persisted data format.
- Add command palette commands, ribbon actions, custom views, or network behavior.
- Replace Peggy, esbuild, Obsidian APIs, or the current TypeScript module structure.
- Guarantee compatibility for syntax not currently accepted by `src/grammar.peggy`.

## Decisions

1. Treat `src/grammar.peggy` as the source of truth for syntax.

   The generated parser is derived from Peggy and `ts-pegjs`, so OpenSpec requirements should describe grammar-level behavior rather than generated implementation details. Alternative considered: document `src/parser.ts`; rejected because it is generated and must not become the edited contract.

2. Split the baseline into three capabilities.

   `crochet-pattern-syntax`, `crochet-chart-rendering`, and `crochet-progress-tool` map to separable user outcomes and test suites. Alternative considered: one broad `crochet-weaver` capability; rejected because it would make future changes harder to review and validate.

3. Specify semantic rendering outcomes instead of pixel-perfect SVG output.

   Layout tests should assert parsed rows, render items, symbols, rotations, classes, and sizing invariants. Pixel snapshots can supplement manual QA, but they are brittle across Obsidian themes and browser engines.

4. Preserve settings precedence as global defaults overridden by valid per-pattern frontmatter values.

   Existing behavior accepts only valid positive numeric overrides and known boolean/rotation values; invalid values fall back to settings. Alternative considered: fail on invalid frontmatter; rejected because that would change current behavior.

5. Preserve progress identity as explicit `id` first, content hash second.

   This matches the current `crochet-tool` behavior: an explicit frontmatter `id` keeps progress stable across text edits, while omitted `id` derives state from the block source and can reset after edits.

6. Implement next-round first-stitch marker semantics for concentric round charts.

   The next-round marker indicates where the next round begins. It is placed at the first stitch of the next round (the top entry point) to guide the user. This marker is only relevant for concentric round charts, so it is omitted for flat and spiral charts.

7. Control next-round marker visibility via a global setting.

   The `showNextRoundMarker` option is resolved from global settings. It is not supported as a per-chart frontmatter override to keep the chart configuration clean and consistent.

8. Use theme-aware accent and currentColor styling for the next-round marker.

   The marker uses the chart-local `.crochet-weaver-next-round-marker` class. It applies theme-aware currentColor or accent styling to match the active Obsidian theme.

9. Resolve localization through configured language preference or Obsidian fallback.

   The plugin resolves the user's language preference from settings. If set to follow Obsidian, it falls back to the active Obsidian locale. This ensures all chart, settings, and error text are localized correctly.

10. Enforce chart budget limits to prevent performance issues.

    The plugin validates parsed charts against safety limits before layout expansion. If a chart exceeds limits for rows, stitch quantities, repeats, nesting, or total render items, it renders a controlled inline error instead of freezing the preview.

11. Normalize persisted settings to defaults or safe values.

    Malformed or invalid persisted settings are normalized to defaults or safe values during initialization. This prevents runtime crashes from corrupted configuration files.

## Risks / Trade-offs

- Test fixtures may reveal undocumented parser edge cases -> Mitigate by recording current accepted/rejected examples before changing grammar.
- Semantic layout tests may miss visual regressions in symbol paths -> Mitigate with targeted DOM/SVG assertions and manual Obsidian rendering checks for representative patterns.
- README drift can obscure released behavior -> Mitigate by keeping Crochet Weaver usage, settings, build, and release instructions aligned with implemented features.
- Layout behavior is split across focused modules behind the `src/layout.ts` facade -> Mitigate future refactors with semantic layout and rendering tests before changing algorithms.
- Invalid frontmatter currently falls back silently -> Mitigate by documenting fallback behavior now and considering explicit validation in a separate future change.
