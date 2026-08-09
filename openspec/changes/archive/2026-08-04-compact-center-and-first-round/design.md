## Context

The center currently draws the magic ring with a 6px radius and places the common joined six-single-crochet first round at 30.6px. Collision limits are much smaller than that radius; the remaining size is driven by a conservative share of the numbered seam arc.

Shrinking only the first radius slightly changes the inherited seam angle on R2 and the first ordinary transition above shaping. The transition therefore needs a bounded increase in retained seam room to keep its stitches associated with the V marks below.

## Goals and non-goals

### Goals

- Make the center visibly more compact.
- Preserve the first stitch at -90 degrees.
- Preserve every space-rich increase V below the 0.5px arm-difference limit.
- Preserve final-stitch separator safety and marker minimum clearance.
- Keep all non-magic-ring center types unchanged.

### Non-goals

- Do not scale every stitch symbol.
- Do not reduce chain-ring geometry.
- Do not bypass symbol-derived collision limits.

## Decisions

### Reduce both independent dimensions

The `MR` symbol radius and extent become 5px. The compact inner seam share becomes 0.56, producing a 28–29px first-round radius for the default joined six-single-crochet case.

### Keep hard limits authoritative

The existing symbol-derived inner radius, seam circumference, order, minimum gap, and separator checks still run. The compact share is only a lower bound layered into that pipeline.

### Carry a bounded transition reserve

An ordinary Japanese round immediately above increases may retain three 10px flexible reserves plus one normal 2px symbol clearance. This remains a one-transition exception and prevents the reduced center from increasing the next round's ancestry error.

## Risks and mitigations

- The first seam sides become shorter. Tests keep them above 19px, still well above the 10px minimum.
- Smaller geometry could distort the first V. The complete nine-round pattern is checked at 20px and 30px spacing.
- Changing `MR` geometry could affect other render styles. The full layout, symbol-rendering, and production suites remain required.
