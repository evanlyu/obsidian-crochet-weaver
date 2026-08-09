## Why

Independently aligning a red round number and its separator can move that separator past the round's final stitch. The seam still has enough total arc, so center-to-center spacing tests pass, but the final symbol appears inside the numbered corridor and on the same side of the separator as its number.

## What changes

- Treat the separator as a hard geometric boundary, not only as a seam-width budget.
- Before aligning an ordinary round's marker, spend only available closing-edge gap slack to move the final stitches clear of the target separator.
- Move closing seam instructions with the number/step packet and cap that packet to the seam's real surplus.
- Preserve increase geometry; if a centred increase cannot give the marker its exact target bearing, clamp the marker instead of rotating the V.
- Keep the half-degree number incline as a target while allowing a sub-degree safety deviation on extreme long charts.
- Add a regression test proving the final stitches of R4, R5, and R7-R9 stay opposite their red numbers across the separator.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: numbered seam alignment, closing-edge spacing, spiral separator placement tests
- No pattern syntax, settings, persistence, or release artifact changes
