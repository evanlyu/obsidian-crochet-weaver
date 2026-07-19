## 1. Option resolution

- [x] 1.1 Add `resolveShowTool(ast: CrochetAst): boolean` to `src/options.ts`, parsing the `tool` frontmatter key with the existing `boolOption` helper (default `false`)

## 2. Wiring in the chart block processor

- [x] 2.1 In `src/main.ts`'s `crochet` processor, when `resolveShowTool(ast)` is true, create a `.crochet-weaver-with-tool` wrapper, render the SVG into a nested `.crochet-weaver-chart-container` child, then call `renderCrochetTool(source, wrapper, this, locale)` so the tool becomes the wrapper's second child
- [x] 2.2 When `tool` is not enabled, keep rendering the SVG directly into `el` exactly as before

## 3. Layout styling

- [x] 3.1 Add `.crochet-weaver-with-tool` flex layout rules to `styles.css` (row layout, wraps to stacked on narrow widths, sensible gap, no double margins on the nested chart/tool elements)

## 4. Tests

- [x] 4.1 Add `tests/options.test.ts` cases for `resolveShowTool`: absent key → false, `tool: on`/`true`/`yes`/`1` → true, `tool: off`/invalid value → false
- [x] 4.2 Run `npm run lint` and `npm test` and fix any failures

## 5. Manual verification

- [ ] 5.1 In the sandbox note `Crochet Weaver 測試.md`, add a `crochet` block with `tool: on` in frontmatter and confirm the chart and tool render side by side, progress controls work, and reload keeps progress
