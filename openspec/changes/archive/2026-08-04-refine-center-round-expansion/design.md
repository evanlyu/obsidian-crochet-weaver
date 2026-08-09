## Context

Round 1 already anchors its first stitch at -90 degrees. On round 2, ancestry initially places the two children of the first increase on opposite sides of that parent. Seam closing and the later rigid number-alignment turn can move the child pair to the right while the V apex remains on the parent, producing unequal arms.

The seam renderer already creates a 10px minimum on each side of the number/step pair from 8px of marker-side air plus the ordinary 2px inter-item gap. A separate bounded 10px reserve is available to retain useful inherited room. These two values have different meanings: minimum clearance versus optional layout flexibility.

## Goals and non-goals

### Goals

- Preserve the twelve-o'clock first stitch.
- Make the first V above the center straddle that stitch with nearly equal arm lengths.
- Keep the documented round-number bearings unchanged.
- Retain at least the existing collision clearance around the numbered marker.
- Move round 1 closer to the center without overlapping the magic ring or first-round symbols.

### Non-goals

- Do not make every shaping round retain an indefinitely widening seam.
- Do not compact or falsify increase endpoints in the shaping renderer.
- Do not change radial or lace presentation behavior.

## Decisions

### Recognize only the center expansion exception

The exceptional round is the first non-empty round above the center when every produced stitch belongs to an increase. It receives the bounded seam reserve even though it is a shaping round. Other shaping rounds keep the established seam-closing behavior.

### Move the marker, not the stitches

For the center expansion exception, stitch angles remain ancestry-driven. The number and round-change step are aligned independently within the retained seam room. This preserves the -50 degree first number and -0.5 degree per-round incline without rotating the children away from their parent.

### Keep 10px as a lower bound

The number/step pair keeps its 10px minimum side clearance. The center expansion and sufficiently large ordinary rounds may retain another bounded 10px of flexible seam room when doing so protects ancestry. This reserve is not the marker's minimum clearance and does not turn 10px into an exact total width.

### Tighten the first radius

The compact inner seam share changes from 0.68 to 0.60. For the default joined six-single-crochet magic-ring case this places the first stitch at 30.6px from the center, while the symbol-derived minimum and collision tests remain authoritative.

## Risks and mitigations

- A larger center-expansion seam can shift the first two ancestry transitions. Tests allow that localized effect while keeping later-round drift under the existing bound.
- Moving marker contents independently could overlap a stitch if used broadly. The behavior is restricted to the center all-increase exception and the already-qualified broad ordinary-round path.
- A tighter first radius could crowd the marker. Existing seam, symbol-overlap, and full-pattern tests continue to enforce clearance.
