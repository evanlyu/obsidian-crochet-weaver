## Why

A fixed-spacing chart can jump from a few inner stitches to dozens of grouped chain and tall-stitch symbols one round later. The old solver fixed the first radius from the inner round alone, leaving the later circumference physically too short. Its projection then reconciled the grouped correction inward even when the later round selected only part of the preceding round or wrapped across the same source repeatedly. The result was overlapping outer symbols and small increase V marks torn into giant stars.

## What Changes

- Measure every graph-driven fixed-spacing round before placement and derive the minimum absolute first-round radius that lets the most demanding round fit at configured symbol size.
- Preserve the configured radial interval exactly after choosing that common base radius.
- Use each stamped non-lace chain symbol's full extent in pairwise gap calculations.
- Reconcile a projected correction inward only through a relationship that covers every preceding-round source exactly once.
- Add minimal partial-ancestry and full extreme grouped-round regressions.
- Synchronize README, all pattern-skill languages, and canonical rendering requirements.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Extreme fixed-spacing density now raises the shared base radius and ambiguous ancestry stops inward correction.

## Impact

- `src/layout/round-graph.ts`: fixed-base preflight, full symbol gaps, and ancestry reconciliation boundary.
- `tests/layout.test.ts`: extreme grouped-round geometry regressions.
- README, pattern-skill variants, and OpenSpec rendering requirements.
