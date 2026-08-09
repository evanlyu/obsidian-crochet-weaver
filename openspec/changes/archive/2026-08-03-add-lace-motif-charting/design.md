## Context

Round charts are drawn from a stitch graph. Every graph-driven style reads the same facts: what graph nodes the current round produces, what previous-round stitch or space each item works into, what the seam contains, and whether traversal runs clockwise or counterclockwise.

The `crochet-dev` note is not arbitrary English. It is a bounded written-pattern grammar inside a fenced `crochet` block. This change accepts that marking style directly and normalizes it into internal AST terms before expansion, count validation, graph building, layout, and rendering.

## Goals / Non-Goals

**Goals:**

- Accept the exact chart-relevant `crochet-dev` fenced-block forms directly, including multiline round bodies and final periods.
- Preserve the required visible shell-fan output for 3, 5, 7, and 9 double crochet shells.
- Separate graph-produced stitch nodes, chain-space graph nodes, and written stitch-count weight.
- Keep every chain in a chain space visible as its own chain symbol and count ordinary mid-round chains in written count annotations.
- Keep every motif child countable, targetable, addressable, and highlightable.
- Let `turn` at the start of a round apply to that current round's traversal, drawing direction, and RS/WS state.
- Expand prior-round and range repeats into actual rounds while retaining source metadata.

**Non-Goals:**

- Parsing arbitrary English crochet instructions outside the bounded note grammar.
- Adding button loop, sewing, gauge, sector chart, partial-circle chart, or mixed circular/strip page presentation semantics to chart syntax.
- Reading a chart image back into a pattern.
- Treating chain-space graph nodes as extra written-count stitches beyond the chains that created them.

## Decisions

**Accept the note grammar, then normalize.** Parser support includes indented continuation lines, commas, final periods, `ch 3 (counts as dc)`, `ch 1 (does not count as a st)`, note-form joins, note-form targets, `V2`, `V3`, structured count annotations, and source repeats. Internal AST names may use concise canonical variants, but parser acceptance is for the note's forms directly.

**Use a working cursor with implicit skip accounting.** Each round has a cursor over the previous round's targetable positions. A `next <typed target>` search advances in the current traversal direction until it finds the requested type, records every intervening previous-round target position as implicitly skipped/consumed, and consumes the selected target when the produced stitch or group is made. `same` reuses the cursor's selected place for the current same-place operation. Explicit `skip N` remains a low-level alias for direct consumption but is not required in `crochet-dev` rows.

**Initialize round entry explicitly.** The first round starts from its foundation or magic ring. Each later joined round starts at the previous round's resolved join/start graph position. A leading current-round `turn` reverses traversal and drawing direction but keeps that inherited selected place. A reposition instruction may replace the cyclic starting phase before the first produced stitch.

**Quantity-targeted motifs consume their source once.** A written quantity such as `3 dc in next ch-1 sp` applies its target to the whole quantity instruction. It consumes the selected source once, produces three sibling `dc` graph nodes sharing that source, and creates one shell-fan motif slot. It must not normalize into three independent `dc in next ch-1 sp` units that advance or consume the cursor three times. `V2` and `V3` apply their target to the whole alias the same way.

**Same-place siblings are allowed inside one motif.** `same st` and `same ch-1 sp` may add sibling output nodes to the current selected source as part of the same shell/V/same-place motif. That same-place aggregation is not a duplicate-consumption error. Reusing a source later outside the same-place motif still fails validation.

**Repositioning changes phase only.** `sl st into next ch-1 sp` moves the cyclic starting phase to the matching space and draws the slip stitch as setup. It consumes no previous-round target position. The following produced step consumes that selected space.

**R3's first shell aggregates across steps.** `sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp` forms one 3-dc shell fan. The reposition selects the current space without consumption; the counted beginning chain creates the first replacement `dc` at that selected space and consumes it once; the following `2 dc in same ch-1 sp` adds two sibling `dc` nodes to that same source; contiguous same-source outputs at round start aggregate into one motif slot with three visible heads.

**Beginning chains follow source count notes.** `ch 3 (counts as dc)` draws three seam chains and produces one addressable replacement `dc` graph node with written count weight 1. `ch 1 (does not count as a st)` draws one seam chain, produces no stitch graph node, and has written count weight 0. Concise aliases may parse, but the note forms are primary.

**An unannotated beginning chain is decided by its round's join.** `crochet-dev` annotates the chain only in R1 and R2; R3 opens with a bare `ch 3` and closes `sl st to top of beginning ch-3`. That join is the pattern saying the chain is a stitch, so an unannotated beginning chain counts as the stitch it replaces when the round closes to its top, and counts zero when the round closes anywhere else. Requiring the annotation would mean rewriting the note, which this change exists to avoid.

**Joins are written slip-stitch joins.** `sl st to top of beginning ch-3`, `sl st to first sc`, and `sl st to join` draw closing slip stitches, produce no graph stitch, and have written count weight 0.

**Join targets resolve to graph positions and set inheritance.** `sl st to top of beginning ch-3` targets the counted beginning replacement stitch top. `sl st to first sc` targets the first produced single crochet. `sl st to join` resolves to the current round's designated start/join point: the counted beginning replacement if present, otherwise the first produced stitch, including the first child of the first motif, after reposition and turn phase are applied. The resolved closing join is visible, non-counting, and sets the entry/start position inherited by the next joined round.

**Turn applies to the current round.** When `turn` appears as the first instruction of R4 or later, that current round toggles RS/WS, reverses next-target traversal relative to the previous round, and draws in the opposite direction. A documented end-of-row alias may be normalized to the next row's leading turn, but the `crochet-dev` semantics are current-round leading turns.

**Side state is explicit.** The first round defaults to RS. A joined round with no leading `turn` preserves the previous round's side and direction. Each leading current-round `turn` toggles side and direction, so the `crochet-dev` expansion has R4 and later even rounds on WS and R5 and later odd rounds on RS through R22.

**Spaces are graph nodes, not count replacements.** Any run of one or more ordinary mid-round chains between anchors creates one chain-space graph node with identity, chain count, anchors, source row, and position. The space itself has written count weight 0; the written chains that formed it each have written count weight 1 unless they are part of a non-counting beginning chain.

**V2 and V3 are bounded aliases.** `V2` expands to `(dc, ch 2, dc)` and has written count weight 4. `V3` expands to `(dc, ch 3, dc)` and has written count weight 5. Their internal chain runs create targetable `ch-2 sp` and `ch-3 sp` nodes.

**Odd shells expose a center dc.** A 3-, 5-, 7-, or 9-dc shell records its center double crochet as a targetable child. `in center dc of next N-dc shell` resolves only for those odd shell sizes in this change.

**Structured count annotations validate written count weight.** Count validation compares source annotations to written stitch-count weight, not only produced fabric-stitch graph nodes. Required examples include R1 = replacement dc + 23 dc = 24, R2 = 24 sc + 24 ordinary ch1 = 48, R3 = 12 reps * (3 dc + 1 sc) = 48, R4/R6 = 7 per repeat, R8 = 9 per repeat, and R10/R12 = 10 per repeat. Picot embellishments in this pattern have weight 0.

**Source repeats expand into rows.** `R13: repeat R11.` and en-dash or hyphen range repeats such as `R15-R18: repeat R11-R14.` are source conveniences, not rendering shortcuts. Expansion produces concrete rows with their own row numbers, current-round turn state, joins, count checks, and source metadata naming the copied row.

**All actual source repeats are covered.** Expansion supports the note's `R13: repeat R11.`, `R14: repeat R12.`, `R15-R18: repeat R11-R14.`, and `R19-R22: repeat R11-R14.` lines, with either ASCII hyphen or Unicode en-dash ranges. Leading current-round `turn` semantics are evaluated after expansion on each expanded row.

**Progress uses written count weight.** The progress panel's row total and stitch-counter display use the same written-count weight as structured validation. Ordinary mid-round chains count one each; counted beginning-chain replacement counts one; non-counting beginning/setup chains, joins, repositioning, turns, skips, picot embellishments in this pattern, and space nodes count zero. A written instruction may still be advanced atomically by adding its weight.

## Risks / Trade-offs

- **Bounded note grammar is larger than shorthand syntax:** this is necessary because the user expects the existing fenced block to render directly.
- **Written counts differ from graph-produced stitch nodes:** tests must keep both numbers visible so chain spaces do not accidentally disappear from progress/count display or become extra graph stitches.
- **Implicit skip accounting can hide mistakes if target search is loose:** typed target searches must fail when the requested target does not exist instead of silently choosing an untyped next position.
- **Turned joined rounds complicate ancestry:** cursor traversal and drawing direction must share the current round's turn state so the chart does not look correct while targets resolve in the wrong direction.

## Resolved Scope Boundaries

- The parser directly accepts the `crochet-dev` marking style; concise canonical aliases are optional accepted alternatives, not a required pre-rewrite step.
- Canonical low-level `skip N` may parse, but `crochet-dev` rows rely on implicit skips from typed `next` searches.
- Button loops, sewing, gauge, sector chart layout, and mixed circular/strip page layout are external notes for the pattern skill, not chart syntax.
