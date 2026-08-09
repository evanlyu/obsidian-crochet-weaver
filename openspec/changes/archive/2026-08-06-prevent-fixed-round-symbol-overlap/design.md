## Context

A positive `spacing` is now an exact radial interval, and graph-driven layouts preserve semantic angles. In long patterns, repeated shaping can create small inherited angular gaps. At fixed radius those gaps may be too narrow for full-size symbols even though their centers and ancestry are correct.

The layout therefore has three hard constraints: fixed radius, semantic center positions, and no visual overlap. Symbol scale is the remaining presentation variable.

## Goals / Non-Goals

**Goals:**

- Prevent real stitch symbols from overlapping in fixed-spacing round charts.
- Retain the largest readable symbol size.
- Keep every symbol in one round at the same scale.
- Preserve all stitch centers, parent relationships, V endpoints, and guide radii.
- Support radial, Japanese, and continuous styles with one calculation.

**Non-Goals:**

- Move stitches away from their graph-derived targets.
- Increase configured round spacing.
- Scale labels, separators, center anchors, or shaping paths.
- Change automatic-spacing behavior.

## Decisions

### Use one maximum safe scale per round

For each pair of real stitch symbols, compute the scale at which their visual envelopes retain the required clearance. Also compute the scale needed for the tallest symbol to remain inside the fixed radial band. The smallest bound is the maximum safe scale for that round.

All real stitch symbols in that round receive the same factor. This can shrink a dense round but never enlarges or inconsistently sizes individual stitches.

### Check every pair

Free-form ancestry can bring written non-neighbours close together after repeated shaping. Checking only consecutive written stitches misses those collisions, so the solver checks every real-stitch pair in the current round. The chart budget bounds this work.

### Preserve geometry

Scaling is applied only at rendering through each item's existing scale field. Coordinates, angles, guides, connectors, shaping marks, color markers, and seam contents keep their existing geometry.

## Risks / Trade-offs

- **A very dense forced spacing can produce small symbols** → The solver retains the mathematically largest clear size; users can choose automatic or larger spacing when they prefer larger marks.
- **Pairwise checks add work** → They run only for explicitly spaced rounds and are bounded by the existing 5,000-item chart budget.

## Migration Plan

No stored data migration is required.

## Open Questions

None.
