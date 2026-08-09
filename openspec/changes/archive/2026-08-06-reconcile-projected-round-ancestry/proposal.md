## Why

The fixed-spacing readability projection keeps dense rounds visible, ordered, and separate. However, moving only the crowded outer round can leave its stitches at different bearings from the earlier parent stitches or increase-V endpoints they are worked into. The graph relationship remains correct in data but becomes visually misleading.

## What Changes

- Record which fixed-spacing rounds require readability projection.
- Reconcile the outermost corrected round inward through the existing stitch graph.
- Align one-to-one sources to their displayed children.
- Keep increase sources at the midpoint of their displayed children.
- Preserve the relative opening of multiple decrease sources while aligning their midpoint to the displayed target.
- Refit affected round symbols without changing configured radii or stitch counts.
- Add an exact R8-to-R9 parent/V-endpoint alignment regression to the reported fifteen-round pattern.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: A fixed-spacing readability correction now remains visually connected to every earlier displayed ancestry relationship.

## Impact

- `src/layout/round-graph.ts`: track projected rounds and reconcile corrected bearings inward.
- `tests/layout.test.ts`: assert every first-40-round stitch remains directly above its R8 parent or increase endpoint.
- README variants, bundled pattern-skill sources, and rendering requirements.
