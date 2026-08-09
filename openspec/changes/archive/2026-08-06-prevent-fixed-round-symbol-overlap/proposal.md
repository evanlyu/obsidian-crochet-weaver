## Why

Exact fixed round spacing and immutable ancestry angles can leave dense stitches so close that two symbols read as one doubled mark. Expanding the radius would violate the selected spacing, while moving individual stitches would redraw their parent relationships.

## What Changes

- Measure the actual screen-space clearance of every pair of stitch symbols in a fixed-spacing round.
- Compute the largest uniform symbol scale that preserves visual clearance.
- Apply one scale to the whole affected round so symbols remain consistent.
- Cap symbol height to the fixed radial band so adjacent rounds cannot overlap.
- Preserve centers, round radii, ancestry angles, increase endpoints, and seam geometry.
- Add a long free-form fixed-spacing regression and update documentation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Fixed-spacing layouts now resolve crowding with uniform per-round symbol scaling.

## Impact

- `src/layout/clarity.ts`: fixed-band clarity calculation.
- `src/layout/round.ts`: radial-style integration.
- `src/layout/round-graph.ts`: Japanese and continuous integration.
- `tests/layout.test.ts`: long multi-increase overlap regression.
- README, pattern-skill variants, and rendering specification.
