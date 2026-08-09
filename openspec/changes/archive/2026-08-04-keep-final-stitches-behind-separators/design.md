## Context

The band guide uses each seam's round-change step as the angle of its separator. For ancestry-sensitive rounds the step and red number can be moved independently of the stitches. The earlier implementation applied the full requested turn without checking whether the step would pass the final stitch. Total seam width remained valid, but its contents were no longer validly ordered.

## Goals and non-goals

### Goals

- Keep every ordinary final stitch wholly on the closing side of its separator.
- Preserve the requested number column whenever real neighbouring slack can pay for it.
- Preserve the opening-side and opposite-side ancestry columns.
- Keep centred increase V marks unchanged.
- Keep closing instructions in seam order.

### Non-goals

- Do not restore exact number bearing by rotating an entire ancestry-sensitive round.
- Do not shrink or cosmetically clip the final stitch.
- Do not let a separator consume symbol or minimum marker clearance.

## Decisions

### Move only the closing edge

If the target marker needs more turn than the current seam surplus provides, taper a positive angular offset into the final quarter of a broad ordinary round. The first and opposite-side stitches do not move. Each neighbouring gap contributes no more than its slack above the computed minimum, so the adjustment cannot create a symbol collision.

### Treat closing seam contents as one packet

The number, round-change step, and any closing instructions move together. Their maximum turn is the current wrap-around gap minus the full `seamArc` promise. This preserves their internal order and every symbol/margin allocation through the final stitch.

### Clamp before breaking ancestry

If the available gap slack still cannot reach the ideal marker bearing, cap the packet at the safe boundary. The -0.5 degree per-round incline remains the target; extreme long charts may deviate by less than one degree. This is preferable to rotating real stitches away from their parents or placing a stitch across the separator.

## Risks and mitigations

- Closing-edge adjustment could crowd neighbouring stitches. The maximum turn is derived from each gap's measured slack above `minStitchGaps`.
- A closing instruction could be left behind and crossed by the step. All closing instructions move with the marker packet.
- Marker alignment could visibly wander. Ordinary charts still reach the exact target when there is room; a forty-round stress test bounds safety deviations below one degree.
