## 1. Persistence

- [x] 1.1 Add `stitchProgress: Record<string, number>` to `CrochetWeaverSettings`, default `{}`, normalized in `normalizeSettings` by reusing the existing `normalizeProgress` helper (`src/settings-data.ts`)
- [x] 1.2 Add `getStitchProgress(id)`/`setStitchProgress(id, count)` to `CrochetWeaverPlugin`, mirroring `getProgress`/`setProgress` (`src/main.ts`)

## 2. Progress store interface

- [x] 2.1 Extend `ProgressStore` in `src/tool.ts` with `getStitchProgress(id: string): number` and `setStitchProgress(id: string, count: number): Promise<void>`

## 3. Localization

- [x] 3.1 Add `tool.stitchCounterLabel`, `tool.stitchProgress`, `tool.stitchAdd`, `tool.stitchSubtract`, `tool.stitchReset` for `en`, `zh-TW`, `zh-CN`, `ja` (`src/i18n.ts`)

## 4. Counter UI and behavior

- [x] 4.1 In `renderCrochetTool`'s `paint()`, compute the current row (if any), its stitch total (`roundStitchCount`), and the stored stitch count; render a labeled counter block (decrement button, live count text, increment button, reset button) between the round progress bar and the row list, only when a current row exists (`src/tool.ts`)
- [x] 4.2 Add an `advanceDone(newDone)` helper that calls `store.setProgress` and resets `store.setStitchProgress(id, 0)` together before repainting; route the previous/complete/reset/row-click handlers through it (`src/tool.ts`)
- [x] 4.3 Wire the increment button: below the row's total, just increments the stitch count; when incrementing would reach the row's total, call `advanceDone` instead (row auto-completes, counter resets) (`src/tool.ts`)
- [x] 4.4 Wire the decrement button (disabled at 0) and the reset button (sets stitch count to 0) (`src/tool.ts`)

## 5. Styling

- [x] 5.1 Add `.crochet-tool-stitch-counter` and related classes to `styles.css` for the counter block layout

## 6. Tests

- [x] 6.1 Update `MemoryProgressStore` in `tests/tool.test.ts` to implement the new `ProgressStore` methods
- [x] 6.2 Add test cases: counter renders for the current row with correct label/count/total; hidden when pattern fully complete; increment/decrement/reset behavior; increment at row total auto-advances `done` and resets the counter; previous/complete/reset/row-click all reset the counter for the new current row
- [x] 6.3 Run `npm run lint` and `npm test` and fix any failures

## 7. Manual verification

- [ ] 7.1 In the sandbox note, work through the `basket-body` `crochet-tool` block's `R9: 40 sc` row using only the `+1` button and confirm it auto-advances to R10 with the counter reset
