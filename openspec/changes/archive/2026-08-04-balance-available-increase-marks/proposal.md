## Why

Only the first increase above the center currently keeps its ancestry-driven V. Later increase rounds still close their seam by moving the two children of one increase by different amounts, then may rotate the entire round to align its red number. Both operations move the children's midpoint away from their parent and produce visibly scalene V marks even when the unmodified placement already has enough room.

## What changes

- Detect when an increase round's original ancestry placement already satisfies every symbol gap and its requested seam.
- Preserve that placement instead of consuming harmless seam surplus with per-stitch corrections.
- Align the red number and round-change step independently when the resulting increase groups remain centred on their real parents.
- Let the immediately following ordinary Japanese round retain bounded seam room so it stays associated with the increase marks below.
- Keep collision constraints authoritative and keep shaping endpoints attached to the real graph stitches.
- Cover all 24 increases in the nine-round long-tailed-tit head pattern with a geometry regression test.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: graph-driven Japanese round placement and round-layout tests
- No pattern syntax, settings, persistence, continuous-style layout, or release artifact changes
