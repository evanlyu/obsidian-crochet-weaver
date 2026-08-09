## Context

`ancestryTargets` already returns the correct parent angle for every ordinary
stitch in a one-to-one round. The result then passes through two independent
presentation corrections:

1. `closeSeam` narrows the inherited seam by tapering stitch angles near it.
2. `openClosingEdgeForSeparator` or `alignRoundNumber` moves stitches again to
   place the red marker and separator.

Instrumentation on a two-round, thirty-stitch reproduction measured zero error
at `ancestryTargets`, 0.366 degrees after seam closing, and 16.217 degrees after
the separator correction. A one-stitch reproduction stays exact through
placement and is then rotated 15.584 degrees by round-number alignment.

## Goals and non-goals

### Goals

- Keep every ordinary one-to-one child at exactly its parent's angle.
- Keep the marker packet ordered and on the safe side of the last stitch.
- Preserve the existing exact ancestry of increase/decrease endpoints.
- Retain collision-free rendering in the reported nine-round chart.

### Non-goals

- Do not force exact ancestry on shaping, skipped, repeated-source, or otherwise
  non-bijective rounds.
- Do not change radial-style charts.
- Do not change stitch counts or graph mapping.

## Decisions

### Return exact ancestry before presentation fitting

When every current stitch has exactly one unique previous-round source and the
counts match, `placeDrawnOrder` returns the ancestry targets unchanged.
Increasing the radius already increases physical room between those fixed
angles; seam cosmetics may not redistribute them.

### Treat the marker as independent presentation

Every exact one-to-one numbered round uses the independent marker path,
including small rounds. The number, separator, and closing instructions move
only within measured seam surplus. If the requested bearing is unsafe, the
marker stops early instead of moving the final stitch.

## Risks and mitigations

- The inherited stitch gap at the seam may grow in pixels on outer rings. This
  is preferable to falsifying stitch ancestry; marker placement remains capped
  and ordered inside that gap.
- A wider symbol in a later one-to-one round could collide at an inherited
  angle. The production pattern and general symbol-overlap regressions remain
  mandatory; a future radius-growth pass must expand the radius, never change
  ancestry, if such a case appears.
