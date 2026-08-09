## Why

The first visible number in a partial chart was forced to its preferred bearing even when the seam's closing join had already reached its safe movement limit. In charts beginning at R4 or R16, the red number could therefore be drawn directly over the filled slip-stitch dot.

## What Changes

- Treat the shared inward number column as a preferred bearing, not permission to cross a drawn symbol.
- Check every candidate number position against the real stitches and seam instructions drawn on that round.
- Follow the connected clear path from the seam's safe label slot and stop at its first collision boundary.
- Preserve the number/separator/join order instead of crossing the separator or join to reach a later clear bearing.
- Measure number width and the slip-stitch dot's readable footprint more accurately.
- Cover the exact reported R4–R8 and R16–R19 chart slices with regressions.
- Synchronize OpenSpec, README variants, and bundled pattern-skill sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: round-number bearings remain visually inclined where space permits and yield to measured symbol clearance everywhere else.

## Impact

- `src/layout/round-graph.ts`: geometry-based number-bearing fit.
- `src/layout/constants.ts`: measured tabular-digit width.
- `src/render/symbols.ts`: readable slip-stitch footprint.
- `tests/layout.test.ts`: minimal and full reported-chart regressions.
- README, pattern-skill, and rendering specification variants.
