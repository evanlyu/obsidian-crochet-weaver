## Why

The progress tool (`crochet-tool` block and the embedded `tool: on` panel) only tracks progress at row/round granularity — "done" means a whole row is complete. For a row with many identical stitches (e.g. `R9: 40 sc`), there is nothing tracking *which stitch within that row* the user has reached, so it's easy to lose count mid-row and not know whether the next stitch is number 23 or 24.

## What Changes

- Add a stitch counter for the current (in-progress) row: a live "X / Y stitches" readout with `+1`/`−1` buttons, so the user can tap once per physical stitch made and always see where they are within the row they're working.
- Reaching the row's full stitch count via `+1` auto-completes that row (advances to the next row) and resets the counter to zero for the new current row, so a user can keep tapping `+1` continuously across row boundaries without a separate "complete round" click.
- A small reset control clears the current row's stitch count back to zero (e.g. after a miscount) without affecting completed-row progress.
- Any control that changes which row is current (previous round, complete round, reset, or clicking a row to jump to it) resets the stitch counter to zero for the new current row.
- Stitch counts persist per pattern (same `id`-or-source-hash identity already used for row progress), so reloading the note keeps the in-progress stitch count.
- No counter is shown once the whole pattern is complete (no current row left).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crochet-progress-tool`: the progress panel gains a per-row stitch counter (increment/decrement/reset controls, persisted state, auto-advance on completing a row's stitch count) alongside the existing row-level progress controls.

## Impact

- Affected source areas: `src/tool.ts` (`ProgressStore` interface gains stitch-progress methods, `renderCrochetTool` gains the counter UI and row-advance-resets-stitch-count behavior), `src/main.ts` (`CrochetWeaverPlugin` implements the new store methods, backed by a new persisted `stitchProgress` map), `src/settings-data.ts` (new `stitchProgress` field, reusing the existing progress-map normalization), `src/i18n.ts` (new strings, all locales), `styles.css` (counter layout).
- Affected tests: `tests/tool.test.ts` (its `MemoryProgressStore` mock gains the new methods), `tests/settings.test.ts` if `stitchProgress` normalization needs its own case beyond reusing `normalizeProgress`.
- Not a breaking change: existing row-level progress data and behavior are untouched; the counter is additive and only appears when a row is in progress.
