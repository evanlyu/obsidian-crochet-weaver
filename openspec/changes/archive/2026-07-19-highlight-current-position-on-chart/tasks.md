## 1. Types

- [x] 1.1 Add `rowIndex?: number` and `unitIndex?: number` to `RenderItem`, and a `ChartHighlight { rowIndex: number; unitIndex?: number }` type (`src/types.ts`)
- [x] 1.2 Add `chartMarkerColor: string` to `RenderOptions` (`src/types.ts`)

## 2. Layout: tag items with row/unit index

- [x] 2.1 Add `targetUnitIndex(row: RowNode, stitchTarget: number): number` to `src/layout/steps.ts`, mirroring `roundStitchCount`'s trailing-join pop
- [x] 2.2 Thread `rowIndex`/`unitIndex` through `layoutRound` (`src/layout/round.ts`), tagging every item from `placeUnitPolar` including the popped join item
- [x] 2.3 Thread `rowIndex`/`unitIndex` through `layoutSpiral` (`src/layout/spiral.ts`)
- [x] 2.4 Thread `rowIndex`/`unitIndex` through `layoutFlat` (`src/layout/flat.ts`), including all fanned-out group items sharing one `unitIndex`

## 3. Settings

- [x] 3.1 Add `chartMarkerColor: string` to `CrochetWeaverSettings`, default hex, normalized via the existing hex-color validator (`src/settings-data.ts`)
- [x] 3.2 Add a color-picker setting definition and localized name/desc (using "織圖工具目前標記色" for zh-TW) for `en`/`zh-TW`/`zh-CN`/`ja` (`src/settings-data.ts`, `src/i18n.ts`)
- [x] 3.3 Add the color-picker UI control in the settings tab (`src/settings.ts`)
- [x] 3.4 Resolve `chartMarkerColor` into `RenderOptions` in `resolveOptions` (`src/options.ts`)

## 4. Rendering

- [x] 4.1 In `renderSVG`, accept an optional highlight target and draw a low-opacity background circle behind every item whose `rowIndex` matches, and a stronger one behind items whose `unitIndex` also matches, using `options.chartMarkerColor` (`src/render.ts`)
- [x] 4.2 Add `.crochet-weaver-row-highlight` / `.crochet-weaver-stitch-highlight` styles (opacity handled inline via the resolved color; classes mainly for sizing/z-order) (`styles.css`)

## 5. Tool → chart wiring

- [x] 5.1 Add an optional `onHighlightChange?: (target: ChartHighlight | undefined) => void` parameter to `renderCrochetTool`, invoked at the end of `paint()` with the current row/target-unit or `undefined` when complete (`src/tool.ts`)
- [x] 5.2 In `main.ts`'s embedded `tool: on` path, keep a reference to the chart container and pass an `onHighlightChange` callback that re-renders the chart (`renderSVG`, container cleared first) with the new highlight

## 6. Tests

- [x] 6.1 Add `tests/layout.test.ts` cases for `targetUnitIndex` and for `rowIndex`/`unitIndex` tagging across flat/round/spiral, including a grouped unit
- [x] 6.2 Add `tests/render.test.ts` cases for row-level vs stitch-level highlight classes/colors, and no highlight when target is `undefined`
- [x] 6.3 Add `tests/tool.test.ts` cases for `onHighlightChange` firing with the right target on paint, on each control, and reporting `undefined` when complete
- [x] 6.4 Extend `tests/settings.test.ts` for `chartMarkerColor` normalization and definitions list
- [x] 6.5 Run `npm run lint` and `npm test` and fix any failures

## 7. Manual verification

- [ ] 7.1 In the sandbox note's `tool: on` demo, tap `+1` a few times and confirm the chart highlights move stitch by stitch, and clicking a row entry highlights that row's first stitch
