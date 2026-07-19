## 1. Test Harness Setup

- [x] 1.1 Add a lightweight test runner and npm test script suitable for TypeScript parser/layout/tool tests.
- [x] 1.2 Add DOM test setup utilities for exercising SVG rendering and `crochet-tool` panel behavior outside Obsidian.
- [x] 1.3 Add parser generation to the test workflow so tests always run against `src/grammar.peggy` output.

## 2. Pattern Syntax Coverage

- [x] 2.1 Add parser fixtures for documents with and without frontmatter.
- [x] 2.2 Add parser tests for `R<number>:` and `Row <number>:` labels.
- [x] 2.3 Add parser tests for `blo`, `flo`, `in MR`, and `in ch ring` row modifiers.
- [x] 2.4 Add parser tests for supported stitches, quantity prefixes, groups, and repeat blocks.
- [x] 2.5 Add parser tests confirming malformed syntax and unsupported stitch words fail clearly.

## 3. Chart Rendering Coverage

- [x] 3.1 Add layout tests for flat row zigzag placement and grouped-stitch fan placement.
- [x] 3.2 Add layout tests for round chart anchors, radius progression, and joining slip-stitch handling.
- [x] 3.3 Add layout tests for spiral charts continuing across rows on one path.
- [x] 3.4 Add option-resolution tests for global settings, valid frontmatter overrides, and invalid override fallback.
- [x] 3.5 Add SVG rendering tests for chart class, symbol references, accent classes, loop markers, and unique symbol ids.
- [x] 3.6 Add error-rendering tests for invalid `crochet` blocks.

## 4. Progress Tool Coverage

- [x] 4.1 Add tests for `crochet-tool` rendering valid panels and invalid syntax errors.
- [x] 4.2 Add tests for normalized row text, expanded stitch counts, and joining slip-stitch count exclusion.
- [x] 4.3 Add tests for explicit progress ids and automatic content-hash progress ids.
- [x] 4.4 Add tests for complete, previous, reset, and row-click progress controls.
- [x] 4.5 Add tests for completed/current row styling and flat versus round/spiral progress unit words.

## 5. Documentation and Validation

- [x] 5.1 Replace the sample-plugin README content with Crochet Weaver usage, syntax examples, settings, and manual install/build instructions.
- [x] 5.2 Update manifest description if needed so plugin metadata matches Crochet Weaver behavior.
- [x] 5.3 Update license attribution and release workflow documentation for Crochet Weaver.
- [x] 5.4 Add `npm test` to CI and release workflows before build/lint/release steps.

## 6. Safety and Settings Hardening

- [x] 6.1 Add chart budget validation for excessive rows, repeats, nesting, and render items before layout/tool rendering.
- [x] 6.2 Harden `crochet-tool` progress ids so unsafe object keys cannot corrupt persisted progress state.
- [x] 6.3 Normalize persisted settings loaded from plugin data before storing them in memory.
- [x] 6.4 Add settings search definitions for Obsidian 1.13+ and remove the lint warning.

## 7. Accessibility and Refactor

- [x] 7.1 Add accessible SVG names and progress-tool ARIA semantics.
- [x] 7.2 Make progress-tool row controls keyboard accessible while preserving the current visual layout.
- [x] 7.3 Split oversized layout logic into focused modules behind the existing `src/layout.ts` public facade.

## 8. Final Validation

- [x] 8.1 Run `npm test`, `npm run build`, and `npm run lint` after implementation.
- [x] 8.2 Run OpenSpec validation for the change and confirm all requirements are covered by tasks or documentation.

## 9. Marker and Internationalization Alignment

- [x] 9.1 Add layout tests for next-round first-stitch marker placement in concentric round charts.
- [x] 9.2 Add SVG rendering tests for next-round marker class and theme-aware styling.
- [x] 9.3 Add options and settings normalization tests for malformed persisted settings.
- [x] 9.4 Update README documentation to describe next-round marker and language settings.
- [x] 9.5 Add localized settings strings for English, Traditional Chinese, Simplified Chinese, and Japanese.
