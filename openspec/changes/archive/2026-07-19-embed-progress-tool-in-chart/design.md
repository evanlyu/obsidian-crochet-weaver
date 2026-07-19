## Context

`src/main.ts` registers two independent Markdown code block processors:
- `crochet` → parses `source`, validates the budget, resolves render/layout options, computes a layout, and calls `renderSVG(layout, el, opts, locale)`.
- `crochet-tool` → calls `renderCrochetTool(source, el, this, locale)`, which does its own `parse`/`validateChartBudget` of `source` and renders a checklist/progress panel keyed by `progressIdFromConfig(ast.config.id, source)`.

Today the only way to get both a chart and a tool for the same pattern is to paste the pattern twice, once per block. `resolveOptions` in `src/options.ts` already has a precedent for chart-scoped frontmatter booleans (`highlight: on` → `highlightIncDec`), parsed with the existing `boolOption` helper.

## Goals / Non-Goals

**Goals:**
- Let one `crochet` block, via a frontmatter flag, also render the progress tool for the exact same source — eliminating duplicated pattern text.
- Reuse `renderCrochetTool` as-is (it is already a pure function of `source` + a `ProgressStore`), rather than forking its logic.
- Place the tool visually beside the chart, as asked, with a reasonable responsive fallback.

**Non-Goals:**
- No change to the standalone `crochet-tool` block's behavior or its own frontmatter.
- No new progress-identity mechanism — embedding still uses the existing `id:`-or-source-hash rule from `crochet-progress-tool`, so users who want a stable id across a standalone tool block and an embedded one still set `id:` explicitly (unchanged, pre-existing behavior).
- No configurable layout direction (e.g. tool-above vs tool-beside) — a single side-by-side-wrapping layout is enough for the ask.

## Decisions

- **New frontmatter key `tool` on the `crochet` block, boolean, default off.** Mirrors `highlight`'s existing boolean-frontmatter pattern for discoverability and reuses `boolOption` parsing. Rejected: a dropdown of placement modes (`tool: beside|below|off`) — no current requirement for more than on/off, and it can be added later without breaking the boolean case (`on` staying valid).
- **Resolve it as its own small function, not folded into `resolveOptions`.** `resolveOptions` returns `RenderOptions & LayoutOptions`, which flow into `renderSVG`/`calculateLayout`. Whether to mount the tool is a decision for the code-block processor in `main.ts`, not for the rendering/layout pipeline, so a separate `resolveShowTool(ast): boolean` in `src/options.ts` (next to `resolveOptions`, reusing the private `boolOption` helper) keeps each function's contract narrow and keeps `resolveShowTool` unit-testable on its own.
- **Reuse `renderCrochetTool(source, ...)` unchanged, called with the same `source` the chart block already parsed.** This is what actually removes the duplication: the tool is driven by literally the same string, so there is only ever one place to edit the pattern. `renderCrochetTool` re-parses `source` internally; this is a small, already-budget-validated re-parse (patterns are size-limited by `validateChartBudget`), and keeps `tool.ts`'s public function self-contained and independently testable, consistent with how the standalone block already uses it.
- **Layout: a flex wrapper div, chart first then tool, wrapping to stacked on narrow widths.** `main.ts` creates a `.crochet-weaver-with-tool` container, renders the SVG into a nested `.crochet-weaver-chart-container` child, then calls `renderCrochetTool` with the wrapper as `el` so the tool's own `.crochet-tool` div becomes the second flex child. `styles.css` adds `display:flex; flex-wrap:wrap; gap` rules. This satisfies "beside" on typical note-pane widths while not breaking narrow/mobile panes.

## Risks / Trade-offs

- [Progress-id drift if a user later duplicates the pattern into both an embedded `tool: on` chart and a separate standalone `crochet-tool` block without setting `id:`] → Mitigation: pre-existing, documented behavior of the id-from-source-hash rule; no new risk introduced, and setting `id:` already solves it.
- [Side-by-side layout could feel cramped for very tall round/spiral charts next to a long row list] → Mitigation: `flex-wrap: wrap` falls back to a stacked layout once the container is too narrow for both at their natural width; acceptable for a first version since no placement configuration was requested.
