## Context

Round layout previously worked from one number per round: how many stitches it has. Everything else — where an increase went, which stitch a decrease closed over — was inferred from the difference between consecutive counts, which cannot recover the position of the shaping. `style: book` made that gap visible: a symbol that claims to point at the stitches it belongs to is only as good as the correspondence behind it.

Three layers are involved: the pattern language (`src/grammar.peggy` → generated parser, plus a resolution pass), a new graph layer between the AST and geometry (`src/layout/graph.ts`), and the placement/drawing code (`src/layout/round-graph.ts`, `shaping.ts`, `links.ts`, `src/render.ts`).

## Goals / Non-Goals

**Goals:**
- Every stitch on a round chart records which previous-round stitch(es) it is worked into, taken from the pattern's own operations, and is drawn from that record.
- Shaping reads as it does in a printed pattern book: a symbol belonging to a round, in line with that round's other stitches.
- A stitch stays visually under the stitch it is worked into, round after round, without drift accumulating outward.
- Accept the forms real patterns are written in, and fail loudly where a pattern is genuinely ambiguous, rather than guessing.

**Non-Goals:**
- No 3D or inward-curving silhouette: decrease rounds still move outward (unchanged, and documented as a known limitation).
- No automatic repeat detection for its own sake — grouping stitches by repeat was implemented, measured, and removed (see Decisions).
- No change to `style: standard`, which still spreads each round evenly with the stock `inc`/`dec` glyphs.

## Decisions

- **A stitch graph, not count arithmetic.** `buildStitchGraph()` walks the rows in order and produces `GraphStitch` records (`id`, `roundIndex`, `stitchIndex`, `symbol`, `sourceStitchIds`, `targetStitchIds`, `sourceSlots`, `shaping`) plus per-round `StitchMappingGroup`s for the shaping. An increase's two stitches share one source; a decrease's stitch has two; round 1's stitches point at `FOUNDATION_ID`. `validateStitchGraph()` returns typed issues (`missing-source`, `unknown-source`, `source-skipped`, `source-reused`, `shaping-mismatch`, `unconsumed-stitch`) — the mapping is checkable in both directions, so a bad pattern is reported as a fact rather than as an odd-looking chart.
  - Alternative considered: keep counts and annotate shaping positions. Rejected — a round that both increases and decreases, or works into a round it doesn't consume exactly once each, has no recoverable mapping from counts alone.
- **Angles stay continuous within a round; only the seam wraps.** Every placement step (parent angle, mean of two parents, gap enforcement) operates on a monotonically decreasing, un-wrapped angle sequence, with `shortestAngleDelta`/`meanAngle` used wherever two angles must be compared or averaged. This was found the hard way: averaging a decrease's two parents at 5° and 355° put the mark on the opposite side of the chart, and measuring a mark's span on raw angles read 350° across the seam and drew a chart-wide sliver.
- **Placement is an isotonic projection, not a sort.** Targets come from ancestry, then `enforceOrderAndGap()` (PAVA) finds the closest sequence that preserves working order and per-pair minimum gaps in least-squares terms, `fitTurn()` closes the wrap gap, and `relaxSpacing()` shares the remaining slack among the plain stitches only, bounded by a maximum drift. Stitches are never reordered, and a round with no shaping anywhere skips relaxation entirely so it copies its parents exactly (measured drift 0.000).
- **Minimum gaps are per-pair and derived from what is actually drawn.** `minStitchGaps()` sizes each gap from the two symbols' real extents at that radius rather than from a single global constant, so a V and a plain `sc` don't reserve the same room.
- **Repeat packing was implemented, measured, and removed.** Closing each `[...] x N` group up and putting the freed room between groups reads well on a plain increase spiral, but it is mathematically incompatible with per-stitch correspondence: at a repeat-count change (basket R5) it put a stitch 1.44 stitch-widths from the stitch it is worked into, and per-group anchoring only moved the error to the next round (1.34). Four strategies were measured; alignment is the user's stated priority, so `packGroups` and the group-inference helpers were deleted. The residual ~0.2–0.5 stitch offset that remains is inherent — adding six stitches to a round forces the rest to spread — and is periodic, not accumulating.
- **Shaping marks live inside their round's band.** `buildShapingMark()` builds the V/∧ from the round's own band boundaries (shared with the spiral guide), insetting a share of the band, with a `squeeze` factor and a `slide` so the mark stays under the stitch it belongs to. A mark opens far enough to reach across its stitches but is capped (`MAX_MARK_WIDTH`) so a decrease spanning distant parents on a large round still reads as a ∧ rather than two long lines.
- **All round symbols face outward; the rotation setting is gone.** A stitch symbol has a top (where the next round is worked) and a bottom (where it is worked into). On a round chart that is `phi + 90°`, always. The setting's other option (upright symbols) put BLO/FLO loop bars on the wrong side of the stitch for most of the chart, which is not a preference but a wrong drawing.
- **A bare `rep` is resolved after parsing, not in the grammar.** The parser sees one row at a time and cannot know the round below, so `RepeatCount` yields `null` for a bare `rep` and `resolveRepeats()` walks the rows in order filling counts in, returning a copy so the AST keeps the pattern as written (`rep`, not the number it came out as). Uneven division and a bare `rep` on row 1 raise `RepeatResolutionError` with translation keys rather than silently truncating.
- **A round's opening `ch`/`mr` and its closing `sl st` are instructions, not fabric.** `roundInstructions()` splits a round into `start` / `stitches` / `end`; only the middle counts toward the round's total and is available for the next round to work into, while all three are drawn (the seam pieces at the round's seam). A chain or slip stitch *in the middle* of a round is a real stitch — that is what a shell or a lace mesh is made of — so only the leading and trailing positions are treated this way.

## Risks / Trade-offs

- [A stitch can still sit up to ~0.5 stitch-widths from its parent on a shaping round] → Accepted and measured: it is forced by the geometry (a round that gains stitches must spread the rest), it is periodic rather than cumulative, and tests assert the bound instead of describing it.
- [Removing a setting changes existing vaults] → `rotation` is dropped from persisted settings and ignored in frontmatter rather than erroring, so an existing note keeps rendering; the only visible change is symbols now facing outward, which is the correct drawing.
- [Bare `rep` turns a previously-unparseable pattern into one that can fail *later*, at resolution] → Accepted: both failure modes are explicit, localized error messages naming the round and the numbers involved, which is the point — guessing a count would produce a wrong chart that looks fine.

## Verification note

Layout was checked numerically (drift per stitch measured in stitch-widths, gap spread per round) and visually (rendering through happy-dom, converting the SVG with `qlmanage -t`, and reading the PNG) against three real patterns, not by unit assertions alone. When measurements disagreed with the tests, the layout was fixed and the strict assertions restored — tests were never loosened to match observed behavior.
