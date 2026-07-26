## 1. Stitch graph

- [x] 1.1 Add `src/layout/graph.ts`: `GraphStitch` (id, round/stitch index, symbol, `sourceStitchIds`, `targetStitchIds`, `sourceSlots`, `shaping`), `StitchMappingGroup`, `StitchRound`, `StitchGraph`, `FOUNDATION_ID`
- [x] 1.2 Build the graph from the AST's own operations: an increase's two stitches share one source, a decrease/`scNtog` records every stitch it closed over, round 1 records the center ring
- [x] 1.3 Record the reverse direction too — each stitch's `targetStitchIds` — so the mapping is checkable both ways
- [x] 1.4 Add `validateStitchGraph()` returning typed issues (`missing-source`, `unknown-source`, `source-skipped`, `source-reused`, `shaping-mismatch`, `unconsumed-stitch`) and `consumesPreviousRoundExactly()`
- [x] 1.5 Tests for graph shape, shaping ancestry, the foundation anchor, and every validation issue (`tests/graph.test.ts`)

## 2. Wrap-safe circular math

- [x] 2.1 Add `src/layout/angles.ts`: `shortestAngleDelta`, `meanAngle` (circular mean), `normalizeAngle`, `arcToDegrees`
- [x] 2.2 Add `enforceOrderAndGap()` (PAVA / isotonic regression) generalized to per-pair minimum gaps via cumulative sums, so working order and clearance are met with the least squared displacement
- [x] 2.3 Add `fitTurn()` for the wrap gap and `relaxSpacing()` (clamped Laplacian smoothing, bounded drift, plain stitches only)
- [x] 2.4 Keep every within-round angle sequence continuous (monotonically decreasing, never wrapped); use `shortestAngleDelta`/`meanAngle` wherever two angles are compared or averaged
- [x] 2.5 Tests including the 0°/360° seam cases that previously put a decrease on the opposite side of the chart

## 3. Graph-driven round placement

- [x] 3.1 Add `src/layout/round-graph.ts` (`layoutRoundGraph`): target angle per stitch from its ancestry — parent angle, straddle for an increase pair, circular mean for a decrease
- [x] 3.2 Size the minimum gap per pair from the symbols actually drawn at that radius (`minStitchGaps`), not one global constant
- [x] 3.3 Skip relaxation entirely for a round with no shaping so it copies its parents exactly (drift 0.000)
- [x] 3.4 Fall back to even spacing for a round that does not consume the round below exactly once each, while still recording its real mapping
- [x] 3.5 Draw the round's opening `ch`/`mr` before its stitches and the closing `sl st` after, at the seam
- [x] 3.6 Tests asserting order preservation, minimum gaps, per-stitch alignment bounds, and plain rounds inheriting exactly (`tests/layout.test.ts`)

## 4. Shaping drawn as a symbol of its own round

- [x] 4.1 Add `src/layout/shaping.ts` (`buildShapingMark`): V/∧ built inside the round's own band, sharing the band boundaries with the spiral guide
- [x] 4.2 Measure the mark's span with `shortestAngleDelta` plus a slide, after raw-angle spans read 350° across the seam and drew chart-wide slivers
- [x] 4.3 Cap the width (`MAX_MARK_WIDTH`) so a decrease over distant parents still reads as a ∧; keep an increase's V to one symbol's room
- [x] 4.4 Route the marks through `LayoutResult.shapingMarks` and render them as inline paths (`src/types.ts`, `src/render.ts`)
- [x] 4.5 Tests for in-band placement, mark endpoints landing on the real stitches, and seam-crossing marks

## 5. `linked` round style

- [x] 5.1 Add `src/layout/links.ts` (`buildStitchLink`): cross-round connectors ending on real stitch positions
- [x] 5.2 Keep every stitch's own symbol in this style, including both stitches of an increase; an `hdc2tog`/`dc2tog`-family decrease keeps its printed symbol and gains a line per stitch it closed over
- [x] 5.3 Add `linked` to `RoundStyle`, the `style` frontmatter key, and the "Round chart style" setting (`src/types.ts`, `src/options.ts`, `src/settings-data.ts`, `src/i18n.ts`)
- [x] 5.4 Tests for connector endpoints and per-style symbol counts

## 6. Repeat packing — implemented, measured, removed

- [x] 6.1 Implement `packGroups` plus repeat inference (written repeats and shaping-derived groups)
- [x] 6.2 Measure four packing strategies against per-stitch alignment on real patterns; record the failure (1.44 stitch-widths at a repeat-count change; 1.34 with per-group anchoring)
- [x] 6.3 Remove `packGroups` and the group-inference helpers; restore the strict alignment assertions rather than loosening them to match packed output
- [x] 6.4 Confirm the remaining ~0.2–0.5 stitch offset is inherent and periodic, not accumulating, and assert that bound in tests

## 7. Symbols always face outward (rotation setting removed)

- [x] 7.1 Make `symbolAngle(phi)` unconditionally `phi + 90` and export it (`src/layout/polar.ts`)
- [x] 7.2 Remove `SymbolRotation`, `LayoutOptions.rotation`, the `rotation` frontmatter handling, the global setting, and its four locales' strings
- [x] 7.3 Fix BLO/FLO loop markers to turn with the stitch (`translate(x y) rotate(rotation)`), so the loop bar is on the side the loop is actually on
- [x] 7.4 Update tests to the single orientation; delete the tests whose setting no longer exists

## 8. Pattern language

- [x] 8.1 `RepeatCount`: `x N`, `xN`, `rep N`, `repN`, and a bare `rep` yielding `null` (`src/grammar.peggy`)
- [x] 8.2 Add `src/resolve-repeats.ts`: fill bare-`rep` counts in from the round below, returning a copy so the AST keeps the pattern as written; wire it into `parse-chart.ts`
- [x] 8.3 Raise `RepeatResolutionError` with translation keys for uneven division (`error.repeatUneven`) and no previous round (`error.repeatNoPrevious`); add the strings in all four locales
- [x] 8.4 Accept a stitch count on either side of the name (`6 sc`, `sc6`, `sc 6`) without letting a suffix count eat part of a digit-bearing stitch name (`dc2tog`, `tr5cl`)
- [x] 8.5 Normalize `sl st` / `slst` / `sl-st` / `sl_st` to one stitch
- [x] 8.6 Add `roundInstructions()` (start / stitches / end) and `stitchWeight()`: a round's opening `ch` or `mr` and its closing `sl st` are drawn but excluded from the round's total, and the next round works into neither; a mid-round chain or slip stitch still counts
- [x] 8.7 Tests: 11 cases in `tests/repeats.test.ts` covering all of the above plus both error paths

## 9. Increase/decrease color setting

- [x] 9.1 Add `highlightColor` to settings, defaults, and `normalizeSettings` (`parseHexColor`), placed after the highlight toggle (`src/settings-data.ts`)
- [x] 9.2 Add the color picker to both the declarative definitions path and the pre-1.13.0 `display()` fallback (`src/settings.ts`)
- [x] 9.3 Thread it through `RenderOptions`/`resolveOptions` and apply it in `render.ts` via an `accent()` helper covering both shaping marks and accented stitch symbols
- [x] 9.4 Make `.crochet-weaver-accent`'s color a fallback the inline setting overrides (`styles.css`); add the four locales' strings
- [x] 9.5 Tests: the configured color reaches the rendered symbol; the settings enumeration includes the new entry

## 10. Documentation

- [x] 10.1 Update `README.md` and its three translations: `rep` forms, bare `rep`, suffix counts, slip-stitch spellings, the round's opening chain, the new color setting
- [x] 10.2 Replace the repeat-packing paragraph in all four READMEs with what the chart now does (every stitch follows the stitch below it)
- [x] 10.3 Update `docs/ai-pattern-authoring*.md` (four languages): new syntax, `style: linked`, the counting rule for a round's opening/closing instructions, checklist items
- [x] 10.4 Regenerate `src/ai-doc-content.ts` from the four docs; byte-equality test passes
- [x] 10.5 Update the `CHANGELOG.md` 1.3.0 entry: new syntax, the color setting, and a Changed section for the removed rotation setting

## 11. Verification

- [x] 11.1 `npm test` passing — 272 tests, up from 253 at the start of this change — with `npm run build` and `npx tsc --noEmit` clean and `npm run lint` reporting only the pre-existing deprecated-`display()` warning
- [x] 11.2 Verify layout numerically (drift per stitch in stitch-widths, gap spread per round) on three real patterns: a lemon-slice motif, a penguin head, and a 15-round cat-bear basket
- [x] 11.3 Verify visually by rendering through happy-dom, converting with `qlmanage -t`, and reading the PNG — not by unit assertions alone
- [x] 11.4 Fix the layout, not the tests, whenever a measurement disagreed with an assertion
