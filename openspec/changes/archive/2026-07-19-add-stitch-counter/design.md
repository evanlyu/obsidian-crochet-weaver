## Context

`renderCrochetTool` (`src/tool.ts`) tracks a single `done: number` (rows/rounds complete, 0..total) per pattern via `ProgressStore.getProgress`/`setProgress`, backed by `CrochetWeaverPlugin.settings.progress` (a `Record<id, number>`, `id` from `progressIdFromConfig`). Row's own stitch total is already computed by `roundStitchCount(row)` (from `layout.ts`, already used to display "{count} 針" per row). There is currently no state for progress *within* the current row.

## Goals / Non-Goals

**Goals:**
- A visible, always-current "X / Y stitches" counter for whichever row is in progress, with tap-once `+1`/`−1` and a reset control.
- Reaching the row total via `+1` rolls over into completing the row (mirrors clicking "complete round") so the user's tapping rhythm doesn't have to break at row boundaries.
- Persist the in-progress stitch count so it survives a note reload, same as row progress does.

**Non-Goals:**
- No stitch counter on the read-only `crochet-pattern-text` panel — it has no progress state at all by design (see `embed-pattern-text-in-chart`).
- No remembering a partial stitch count for rows other than the current one (e.g. no per-row history) — only "the current row's count" is tracked, matching how `done` already only tracks "rows completed," not per-row detail.
- No change to the segmented round-level progress bar's meaning (still one segment per row).

## Decisions

- **Extend `ProgressStore` with `getStitchProgress(id)`/`setStitchProgress(id, count)`**, mirroring the existing `getProgress`/`setProgress` shape exactly. `CrochetWeaverPlugin` implements both, backed by a new `settings.stitchProgress: Record<string, number>` map that reuses the existing `normalizeProgress` validator (it already only checks "safe id + non-negative integer," which applies equally to a stitch count).
- **`+1` auto-advances the row when it reaches the row's total**, calling the same row-advance path as the "complete round" button (which also resets the stitch counter to 0), rather than requiring a separate explicit action once the count is reached. This directly matches the ask ("click a button once to record one stitch") — the user's rhythm is uninterrupted at row boundaries.
- **Every path that changes `done` resets the stitch counter to 0 for the (new) current row.** Introduce one `advanceDone(newDone)` helper inside `paint()`'s closure that calls both `store.setProgress` and `store.setStitchProgress(id, 0)` before repainting; route the existing previous/complete/reset/row-click handlers through it instead of calling `store.setProgress` directly. This guarantees the counter never shows stale progress from a row the user has already left.
- **Placement: one small counter block between the round progress bar and the row list**, labeled with the current row number (e.g. "R9"), rather than embedding controls inside the current row's list entry. The row list entries stay plain `<button>`s (unchanged, still jump-to-row); nesting a stepper's buttons inside a row `<button>` would require invalid nested interactive elements. The counter is hidden entirely once `done === total` (no current row).
- **Buttons show literal numeral text** rather than translated words — language-neutral, so only their `aria-label`s need localized strings (`tool.stitchAdd`/`tool.stitchSubtract`).
- **Fast-follow fix: the persisted counter tracks whole *units* (physical stitch-making actions), not raw weighted stitches.** The initial implementation stored a weighted stitch count and incremented it by exactly 1 per tap — for an `inc` (one symbol, 2 output stitches) that meant two taps to finish one physical stitch, which the user correctly flagged as unrealistic ("不會有人做一半" — nobody makes half a stitch). Fixed by storing `unitsDone` (0..total units in the row) instead: each tap advances by one whole unit, and the displayed "X / Y stitches" is *derived* by summing `unitStitchCounts(row)` (`layout/steps.ts`) for the completed units, so the weighted total shown still matches real pattern annotations. The `+`/`−` buttons now show the *next*/*previous* unit's actual weight (`+2` for an upcoming `inc`, `+1` otherwise) so the UI is self-documenting about what one tap does.

## Risks / Trade-offs

- [A very large single-row stitch count (e.g. 100+ sc) means many taps] → Mitigation: inherent to the "tap once per stitch" ask; the reset control at least makes recovering from a miscount cheap, and `+1`/`−1` stay simple rather than adding a manual numeric-entry escape hatch that wasn't requested.
- [Reusing `normalizeProgress` for `stitchProgress` couples their validation rules] → Mitigation: both are genuinely "safe id → non-negative integer count" maps; no behavioral difference is needed between them today.
