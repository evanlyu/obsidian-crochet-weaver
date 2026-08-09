## Why

The first increase round of a small numbered chart can be rotated right merely to place its red round number on the shared guide. That makes the first V visibly scalene even though its parent is correctly fixed at twelve o'clock. The innermost round also keeps more radius than the center symbols and seam safety require.

## What changes

- Keep the first stitch of round 1 at twelve o'clock while reducing its default center radius.
- Treat the red number's 10px side clearance as a minimum rather than an exact corridor width.
- Let the first all-increase round use bounded seam reserve so its first two children straddle their parent and the V remains nearly isosceles.
- Position the red number and round-change step inside that available reserve without rotating the real stitches.
- Protect the behavior with a minimal R1/R2 geometry regression test and update affected ancestry tolerances only at the center expansion.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: graph-driven round placement, seam documentation, and round-layout tests
- No syntax, settings, persistence, or release artifact changes
