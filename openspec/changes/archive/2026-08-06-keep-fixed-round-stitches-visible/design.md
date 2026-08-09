## Context

Graph-derived angles correctly record where stitches are worked. Repeated increases at different positions can nevertheless create a later sequence in which one increase child crosses close to a neighboring ordinary stitch. A one-to-one round inherits those centers. With exact radial spacing, preserving both centers and only scaling symbols can reduce the common scale to zero.

The constraints are therefore prioritized as:

1. keep every stitch and written order;
2. keep the configured radial interval exact;
3. prevent visual overlap;
4. preserve exact ancestry angles whenever readable;
5. otherwise minimize angular displacement;
6. use one maximum safe symbol scale per round.

## Goals / Non-Goals

**Goals:**

- Never hide a valid round by assigning its stitches a zero scale.
- Resolve inherited near-collisions without rules tied to a round number, stitch count, or pattern phrase.
- Preserve exact one-to-one ancestry for ordinary charts that already remain readable.
- Keep fixed radii and uniform per-round symbol sizing.
- Keep increase V marks balanced and connected to their real parent and children.

**Non-Goals:**

- Increase an explicitly configured round spacing.
- Replace ancestry with unrelated even spacing.
- Change stitch counts, graph sources, or working order.
- Change automatic-spacing radius fitting.

## Decisions

### Trigger projection from measured readability

Before rendering a graph-driven fixed-spacing round, measure the largest common tangential scale at its exact ancestry targets. If that scale is at least 0.6, retain every target exactly. Below that threshold, run the normal deterministic order-and-gap projection, anchored to the first semantic target.

This is one geometry rule for every valid pattern. It does not identify specific rounds, repeat forms, or shaping sequences.

### Keep clearance proportional while scaling

The safe pair scale is `distance / (combined extents + clearance)`. This scales the requested breathing room with the symbols. Subtracting a fixed clearance before division could return zero for two distinct centers even though a smaller, still visible rendering exists.

Radial band fitting uses the same proportional rule.

### Propagate corrected geometry

Projected angles are written to the current stitch layouts. Later one-to-one rounds inherit those displayed parent angles exactly, so the correction remains coherent instead of being recalculated independently on every outer round.

### Retain uniform scale as the final adjustment

After placement, every real stitch pair is measured. One maximum safe scale is applied to the whole round, including the radial-height bound. This retains a consistent visual weight and catches non-neighbor pairs.

## Risks / Trade-offs

- **A severely contradictory forced layout can still require small symbols** → The projection prevents coincident centers and the proportional calculation keeps scale positive; the existing chart budget bounds pathological input.
- **Crowded rounds can deviate slightly from exact parent bearings** → Projection occurs only below the readability trigger, minimizes squared displacement, preserves order, and keeps the first semantic target anchored.
- **Projection could distort shaping** → Regressions assert balanced V arms in the reported multi-increase sequence and existing arbitrary-shaping suites remain required.

## Migration Plan

No stored data migration is required.

## Open Questions

None.
