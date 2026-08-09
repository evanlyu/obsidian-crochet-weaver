## Context

The seam placer already computes a safe label slot and a preferred column target. A first-visible-round shortcut ignored the safe result and rendered the number directly at the target, while the closing join remained capped inside the real seam surplus.

## Decision

After every item in a round has its final position, walk continuously from the seam's guaranteed-safe label slot toward the preferred round-number bearing, evaluating the measured label extent against the round separator and every rendered item's measured footprint. Stop at the first collision boundary. Do not accept a clear endpoint beyond a collision, because doing so would let a number cross its separator or closing join and reverse the seam's visual order.

The same calculation applies to every graph-driven round. It does not branch on R4, R16, digit count, stitch count, or a particular instruction sequence.

## Consequences

- Uncrowded charts retain the existing -50 degree first target and 0.5 degree outer incline.
- Crowded or partial charts keep their number as close to that guide as actual geometry permits.
- A partial chart's number remains on the opening side of its separator and wholly left of its closing join.
- Round spacing, real stitch positions, stitch counts, and configured symbol size remain unchanged.
- The slip-stitch dot carries a small readable footprint beyond its inked circle, improving separation from both text and linework.
