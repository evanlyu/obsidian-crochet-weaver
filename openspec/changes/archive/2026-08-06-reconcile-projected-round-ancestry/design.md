## Context

A graph-driven round first prefers exact parent-derived angles. Under explicit spacing, a later dense round may need minimum-displacement projection to retain visible clearance. The prior implementation wrote that correction only to the projected round. Its earlier displayed parents stayed at their old bearings, so a plain child could appear beside rather than above its parent, and a V endpoint could miss the next stitch worked into it.

The graph already has the information required to keep the picture coherent. A corrected child bearing determines its one-to-one source bearing. The midpoint of corrected increase children determines the increase source bearing. A corrected decrease target determines the midpoint of its sources while their relative opening remains meaningful.

## Goals / Non-Goals

**Goals:**

- Keep every projected child visually attached to its displayed parent or shaping endpoint.
- Keep increase V arms balanced around their real source.
- Preserve decrease-source openings.
- Apply one graph rule independent of round number, stitch count, or repeat wording.
- Preserve configured radial spacing, stitch counts, working order, and the outer projection solution.

**Non-Goals:**

- Replace exact readable ancestry with even spacing.
- Change the readability threshold or projection objective.
- Increase configured ring spacing.
- Alter pattern parsing or stitch-graph identity.

## Decisions

### Use the outermost corrected round as the reconciliation anchor

When more than one fixed-spacing round requires projection, the outermost displayed correction is the final readability constraint. Reconciliation walks from that round toward the center so every intervening relationship agrees with the final displayed child bearings.

### Infer source bearings by relationship cardinality

For a one-source group, the source moves to the circular mean of its displayed targets. This covers ordinary one-to-one stitches and keeps an increase source between all children it produced.

For a multi-source group such as a decrease, the sources move by one common angular turn. Their relative opening stays unchanged while their midpoint aligns with the displayed target.

Candidate bearings use continuous angles and are normalized to the source's existing turn, preserving working order across the seam.

### Update rendered geometry without changing radii

Reconciliation changes only angle, Cartesian position, and symbol rotation. The source stitch retains its assigned round radius. Render items and color markers follow the updated stitch layout, and affected rounds rerun uniform fixed-band scaling at the new positions.

## Risks / Trade-offs

- **An earlier round moves after its seam was measured** → Projection keeps the first semantic target anchored, and reconciliation preserves the same graph origin. Separator safety and full layout regressions remain required.
- **A free-form group can propose one source more than once** → Candidate angles are combined by circular mean rather than last-write wins.
- **Dense positions can require smaller earlier symbols** → Each affected round reruns the same all-pairs uniform scale calculation; no stitch is deleted and configured radii remain exact.

## Migration Plan

No stored data migration is required.

## Open Questions

None.
