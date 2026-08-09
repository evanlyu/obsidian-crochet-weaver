## Why

Traditional Japanese crochet charts label a yarn-loop start with `わ`. The
current Japanese-style renderer instead reuses the generic hollow magic-ring
circle, which loses that established printed-chart cue. A chain-made ring is a
different construction and should continue to show the chain stitches that
form it rather than inventing an unverified `ち` abbreviation.

## What changes

- Render the center of a Japanese-style `in MR` round as the Japanese `わ`
  label instead of the generic hollow ring.
- Keep the same logical `MR` center anchor and compact geometry so stitch
  placement and progress identity do not change.
- Keep `in ch ring` rendered as a ring of chain symbols.
- Keep radial, continuous, and spiral center rendering unchanged.
- Document the convention and add layout/rendering regression coverage.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: center-anchor layout metadata, SVG rendering, chart styles,
  documentation, and tests
- No pattern syntax, parser, settings, persistence, or release artifact changes
