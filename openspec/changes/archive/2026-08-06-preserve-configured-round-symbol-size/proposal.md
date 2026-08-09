## Why

Fixed-spacing collision handling applied a separate maximum safe scale to each round. Although each individual round used one uniform scale, neighboring rounds could show the same single-crochet symbol at visibly different sizes. Reconciliation could also rerun the fit and multiply an earlier local scale. The user's global symbol-size setting must remain authoritative across the whole chart.

## What Changes

- Treat full configured symbol size as the trigger for angular collision correction.
- Remove local per-round tangential and radial symbol scaling.
- Remove the second scaling pass after inward ancestry reconciliation.
- Keep fixed radii, written stitch counts, graph ancestry, balanced V marks, and positive visual clearance.
- Assert that every visible single crochet in the reported staged-increase chart has render scale `1`.
- Synchronize OpenSpec, README variants, and bundled pattern-skill sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Fixed-spacing rounds preserve the symbol size resolved from settings; density is handled by angular placement rather than per-round scaling.

## Impact

- `src/layout/clarity.ts`: retain scale measurement only as a collision signal.
- `src/layout/round-graph.ts`: trigger projection whenever configured-size symbols collide and never write a local item scale.
- `src/layout/round.ts`: remove local scaling from standard round layout.
- `tests/layout.test.ts`: configured-size regressions for the minimal R1–R8 sequence and full fifteen-round report.
- README, pattern-skill, and rendering specification variants.
