## Why

The embedded progress tool (`tool: on`) and the stitch counter (`add-stitch-counter`) track exactly where the user is in a pattern, but that position is only shown as text/buttons in the panel — the chart itself never reflects it. Users have to mentally map "row 9, stitch 24" back onto the SVG. Highlighting the current position directly on the chart closes that loop.

## What Changes

- When a `crochet` block embeds the progress tool (`tool: on`), the chart now highlights the current row's symbols with a subtle wash, and highlights the specific target stitch (the next stitch to make, from the stitch counter) more strongly, in a user-configurable color.
- Add a global setting, "織圖工具目前標記色" (chart tool current marker color), for this highlight color. No frontmatter override (same precedence-free pattern as `showNextRoundMarker`/`nextRoundMarkerColor` — this is a tool-UI color, not chart content).
- Clicking a row entry in the tool's row list (which resets the stitch counter to 0) naturally highlights that row's first stitch, since the target stitch is always "the next stitch counter position."
- The highlight updates live as the user taps `+1`/`−1`, completes/goes back a round, or clicks a row — no need to re-open the note.
- No highlight is drawn once the whole pattern is complete, matching the stitch counter's own hidden-when-complete behavior. Not shown for standalone `crochet-tool` blocks (no chart to draw on) or `crochet-pattern-text` (no progress state).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crochet-chart-rendering`: charts embedded with the progress tool gain a live current-row/current-stitch highlight, using a new global marker-color setting.
- `crochet-progress-tool`: the tool reports its current row/stitch target so the paired chart can highlight it.

## Impact

- Affected source areas: `src/types.ts` (`RenderItem` gains `rowIndex`/`unitIndex`, new `ChartHighlight` type), `src/layout/steps.ts` (new `targetUnitIndex` helper), `src/layout/round.ts` / `src/layout/spiral.ts` / `src/layout/flat.ts` (tag each created item with its row/unit index), `src/render.ts` (draw highlight backgrounds), `src/tool.ts` (`renderCrochetTool` gains an optional `onHighlightChange` callback reporting the current target), `src/main.ts` (wires the callback to re-render the paired chart), `src/settings-data.ts` / `src/settings.ts` / `src/i18n.ts` (new color setting).
- Affected tests: `tests/layout.test.ts`, `tests/render.test.ts`, `tests/tool.test.ts`, `tests/settings.test.ts`.
- Not a breaking change: highlighting only appears for embedded `tool: on` charts; everything else renders exactly as before.
