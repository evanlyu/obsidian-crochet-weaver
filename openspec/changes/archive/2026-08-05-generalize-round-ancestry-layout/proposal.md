## Why

Graph-driven round charts currently preserve stitch ancestry only through several narrow cases. Seam compaction, spacing relaxation, even-spacing fallback, and rigid round-number alignment can move valid stitches away from their parents and distort increase marks in otherwise free-form patterns.

## What Changes

- Make parent-derived stitch angles immutable for every valid graph-driven round, regardless of round number, stitch count, shaping mix, or deliberate skips.
- Replace ancestry-moving seam and spacing heuristics with a radius solver that grows the current round until its semantic angles satisfy symbol, shaping, and seam clearance.
- Position the numbered seam packet only inside measured seam surplus; never rotate real stitches to reach a preferred marker bearing.
- Keep increase children balanced around their parent and render each Japanese V from those exact endpoints.
- Remove obsolete round-count and mapping-shape exceptions, including even-spacing fallback for deliberately skipped places.
- Add free-form mixed-shaping, explicit-skip, separator, and visual regression coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Generalize graph-driven ancestry placement and seam safety from selected one-to-one or space-rich rounds to every valid free-form round.

## Impact

- `src/layout/round-graph.ts`: ancestry placement, radius selection, seam packet positioning, and fallback constraints.
- `src/layout/angles.ts`: removal of seam-taper and spacing-relaxation heuristics that moved semantic angles.
- `src/layout/graph.ts`: clarify that exact full-round consumption is validation metadata, not a prerequisite for ancestry placement.
- `tests/layout.test.ts`: geometry regressions for mixed increases, plain children, deliberate skips, and minimum ring spacing.
- OpenSpec, README, and bundled pattern-skill documentation describing graph-driven round layout.
