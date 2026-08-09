## Context

An increase begins with two child angles equally offset from the parent angle. The shaping renderer deliberately connects the V apex to that parent and its open ends to those exact child angles. This makes the chart truthful, but it also exposes any later asymmetry in placement.

The seam-closing pass historically consumes surplus by interpolating a different angular correction for every stitch. An increase pair therefore receives two different corrections. A later rigid number-alignment turn shifts both children together but leaves the apex on the parent below, which can make the imbalance much larger. In the reported nine-round pattern, one arm-length difference reaches about 14.97px.

## Goals and non-goals

### Goals

- Keep every increase V nearly isosceles when its original ancestry placement already fits.
- Preserve exact parent and child endpoints rather than cosmetically redrawing the mark.
- Keep the red round-number bearings unchanged.
- Preserve minimum symbol, seam, and marker clearance.
- Avoid changing continuous-style layout.

### Non-goals

- Do not force symmetry when the ancestry placement violates a hard collision constraint.
- Do not make all later ordinary rounds inherit an indefinitely widening seam.
- Do not compact, clamp, or invent shaping endpoints in the renderer.

## Decisions

### Test available room before closing the seam

For a Japanese round containing increases, compare the raw ancestry angles with every neighbouring minimum gap and the requested wrap-around seam. If every constraint already passes, keep those angles. Otherwise use the existing seam closing, order, and fit pipeline.

This makes the exception conditional on real room rather than on a particular round number or stitch count.

### Move the numbered marker only after verifying the geometry

After final placement, verify that every increase group's child-angle mean still equals the source-angle mean. Only then align the number and round-change step independently. If a crowded round had to move the groups off-centre, retain the established rigid marker behavior.

### Carry one bounded transition above shaping

The first ordinary Japanese round immediately above increases may retain two flexible 10px reserves plus ordinary symbol clearance. It still goes through the established seam correction and number alignment, but the smaller correction keeps its stitches within about half a pitch of the increase marks below. Later ordinary rounds return to the normal bounded seam rules.

## Risks and mitigations

- Retained space could create an unbounded corridor. The extra transition reserve applies only to the immediately following ordinary round.
- A marker moved independently could leave the available seam. The behavior is gated on the final increase groups remaining centred after all hard constraints.
- A dense or malformed round might not have room for symmetry. The existing constraint pipeline remains the fallback and shaping endpoints remain truthful.
