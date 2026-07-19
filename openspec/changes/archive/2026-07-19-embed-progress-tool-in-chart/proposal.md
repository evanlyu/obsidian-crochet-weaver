## Why

A ```crochet``` block (chart) and a ```crochet-tool``` block (progress checklist) currently require the user to paste the same pattern source into two separate code blocks. Any edit to the pattern has to be made twice, and the two blocks can silently drift out of sync. Users want the progress tool to be driven by the same source as the chart it belongs to, with one flag to turn it on.

## What Changes

- Add a `tool` boolean frontmatter key to the `crochet` code block (parsed the same way as the existing `highlight` boolean key). When `tool: on`/`true`/`yes`/`1`, the block renders the progress tool immediately alongside the SVG chart, reusing the exact same block source that was already parsed for the chart — no second code block, no duplicated pattern text.
- Lay the chart and the tool out side by side (wrapping to a stacked layout on narrow widths) so the tool reads as attached to its chart rather than as an unrelated element.
- The standalone `crochet-tool` code block is unchanged and still works for users who want a tool without a chart.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crochet-chart-rendering`: the `crochet` block gains an opt-in `tool` frontmatter key that embeds the progress tool next to the chart, reusing the chart's own source.

## Impact

- Affected source areas: `src/main.ts` (crochet block processor), `src/options.ts` (parse the `tool` key), `styles.css` (side-by-side layout).
- Affected Obsidian surfaces: rendering of `crochet` code blocks that set `tool: on`.
- Affected tests: `tests/options.test.ts`; manual verification in the sandbox note since `main.ts` wiring itself isn't unit tested (consistent with existing coverage, which tests `renderSVG`/`renderCrochetTool` directly rather than the code-block processor registration).
- No parser/grammar changes needed — frontmatter already accepts arbitrary `key: value` pairs. Not a breaking change: default is off, existing charts and existing standalone `crochet-tool` blocks keep behaving exactly as before.
