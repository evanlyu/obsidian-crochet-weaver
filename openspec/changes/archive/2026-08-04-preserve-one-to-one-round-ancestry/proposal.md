## Why

Recent seam and round-number corrections can move ordinary stitches after
their ancestry positions have already been calculated. In a one-to-one round,
that makes a stitch appear beside rather than directly above the stitch it is
worked into, so the chart communicates the wrong construction.

## What changes

- Treat exact one-to-one ancestry as a hard angular constraint in graph-driven
  round layouts.
- Prevent seam closing, gap fitting, separator correction, and round-number
  alignment from moving those stitches.
- Move or cap only the number, separator, and closing instructions inside the
  inherited seam space.
- Preserve separator safety, increase/decrease geometry, and collision checks.
- Add minimal and full-pattern regression coverage.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: graph-driven round placement, numbered-seam positioning, and
  layout regressions
- No syntax, parser, settings, persistence, or release artifact changes
