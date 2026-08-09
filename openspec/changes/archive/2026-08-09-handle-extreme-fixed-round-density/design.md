## Context

Explicit `spacing` constrains differences between consecutive radii. It does not require round 1 to remain at the smallest radius derived from its own stitches. A later round can therefore demand more total circumference while every interval remains exact. Separately, inward reconciliation is meaningful only when a displayed correction gives each source one unambiguous replacement bearing.

## Goals / Non-Goals

**Goals:**

- Keep every configured-size symbol visible and separate through extreme early density jumps.
- Preserve the exact configured interval between all consecutive rounds.
- Keep earlier shaping unchanged when later ancestry is partial or repeated.
- Base every decision on graph cardinality and measured symbol geometry.

**Non-Goals:**

- Add a pattern-, round-, count-, or stitch-specific exception.
- Change automatic-spacing behavior.
- Enable lace fan rendering when `lace` is off.
- Resize or delete stitches.

## Decisions

### Preflight the common base radius

For each non-empty graph round, convert its real pairwise minimum angular gaps back to arc lengths, reserve the larger of the final pair gap and measured seam, and calculate the radius that circumference requires. Subtract the exact cumulative configured offsets before comparing candidates. The largest candidate is the minimum first-round radius for the whole chart. Placement then continues with the existing exact step between radii.

### Preserve per-symbol gap requirements

Do not cap a large symbol pair's minimum gap at the round's average pitch. A mix of small chains and tall stitches must be allowed to spend less arc on the former and more on the latter. Non-lace chains are stamped on the ring, so they use full symbol extent; only lace chains hanging on a curved space use the shortened chord budget.

### Stop inward reconciliation at ambiguous ancestry

Count how often every source stitch of the preceding round appears in the projected round's relationships. Reconciliation crosses the boundary only when every source appears exactly once. Missing sources would move selected stitches while leaving skipped neighbours fixed; repeated sources offer several unrelated replacement bearings. Both cases keep the earlier round unchanged and let the projected round retain its own clearance solution.

## Risks / Trade-offs

- **The center can be larger in an extreme early expansion** → This is the minimum geometry that satisfies full symbol size, no overlap, and exact intervals simultaneously; ordinary charts keep their existing base radius.
- **A partial projected round may not sit exactly over every displayed source** → Moving only selected earlier sources would corrupt existing shaping. The graph relationship remains recorded while the current round takes the minimum clear projection.
- **Preflight adds a linear pass over round stitches** → The existing chart budget bounds the work and placement already performs the same gap measurements.

## Migration Plan

No stored data migration is required.

## Open Questions

None.
