## Context

Round layout has two spacing modes. Automatic spacing derives a natural step from symbol height and may expand a round to prevent collisions. Explicit spacing is a user-selected chart scale. The prior ancestry fix applied collision-driven radius expansion to both modes, so a 20px chart could unexpectedly contain 37px and 91px gaps.

## Goals / Non-Goals

**Goals:**

- Make positive configured spacing exact and identical between consecutive rounds.
- Preserve valid ancestry angles and symmetric increase endpoints.
- Keep automatic spacing collision-aware.
- Apply the same explicit-spacing rule to radial, Japanese, and continuous styles.

**Non-Goals:**

- Guarantee that arbitrarily dense content never overlaps inside a user-forced interval.
- Change the first round's center clearance.
- Change parsing, stitch counts, or graph construction.

## Decisions

### Explicit spacing is a hard radial constraint

After the first round, a configured layout always returns `previousRadius + spacing`. Symbol circumference, seam contents, and shaping density cannot increase this value.

### Semantic angles remain hard constraints

Japanese and continuous styles keep the graph-derived angles even when the configured radius is crowded. Projecting those angles would redraw parent relationships; expanding the radius would violate the selected scale.

### Automatic spacing retains collision fitting

When no positive spacing is resolved, the existing bounded radius solver remains active. This preserves the convenient collision-free automatic mode while making explicit settings predictable.

## Risks / Trade-offs

- **Dense symbols can touch at a small explicit spacing** → Document this as the direct consequence of a hard user-selected scale; automatic spacing remains available for collision-free layout.
- **The first round is not exactly one spacing unit from the center anchor** → The center is not a crochet round; its clearance remains sized from the anchor and first-round symbols.

## Migration Plan

No stored data migration is required. Existing positive spacing values immediately become exact.

## Open Questions

None.
