## Why

The `crochet-dev` hat crown is a good test of whether Crochet Weaver can draw lace as a chart rather than as a loose list of stitches. The fenced `crochet` block in that note already uses a bounded written-pattern style: multiline rounds, beginning-chain count notes, explicit slip-stitch joins, `turn`, V2/V3 aliases, shell-center targets, picots, structured count annotations, and prior-round/range repeats.

The plugin must accept those note forms directly. Canonical AST names remain useful internally, and concise aliases may remain accepted, but users should not have to rewrite `ch 3 (counts as dc)` as a different pre-normalized block before the chart renders.

## What Changes

- **The note's marking style is supported directly.** Indented continuation lines belong to the preceding row or range label until the next row label or blank boundary; commas and final periods are accepted.
- **Beginning chains use written note forms.** `ch 3 (counts as dc)` draws three starting chains and contributes one replacement double crochet. `ch 1 (does not count as a st)` draws one setup chain and contributes zero.
- **Joins use written note forms.** `sl st to top of beginning ch-3`, `sl st to first sc`, and `sl st to join` are accepted as non-counting closing joins.
- **Repositioning uses the written note form.** `sl st into next ch-1 sp` changes the cyclic starting phase and consumes nothing; the following produced step consumes the selected space.
- **Targets use the written note forms.** The bounded target grammar accepts `same st`, `same ch-1 sp`, `next dc`, `next sc`, `next ch-1 sp`, `next ch-2 sp`, `next ch-3 sp`, `next picot`, and `center dc of next 3/5/7/9-dc shell`.
- **Quantity-targeted motifs consume once.** `3 dc in next ch-1 sp`, `5 dc in next ch-2 sp`, and larger shell quantities apply the target to the whole quantity, produce sibling `dc` graph nodes sharing one source, and create one shell-fan motif slot rather than advancing the cursor once per stitch.
- **Round entry and same-place motifs are defined.** Later joined rounds start from the previous round's resolved join/start position; leading `turn` changes direction but not that selected place; `same` can add siblings to the same selected source as part of a same-place motif without causing duplicate-consumption errors.
- **Next-target searches imply skips.** A `next <typed target>` search advances in current traversal direction and records every intervening previous-round target position as implicitly skipped for graph validation. Explicit `skip N` remains a low-level alias but is not required for `crochet-dev` rows.
- **Turns apply to the current round.** A `turn` at the start of R4 and later reverses that current round's traversal and drawing direction relative to the previous round and toggles that current round's RS/WS state.
- **Joins set the next entry point.** `sl st to top of beginning ch-3`, `sl st to first sc`, and `sl st to join` resolve to concrete current-round graph positions and define the entry/start position inherited by the next joined round.
- **Written counts and graph nodes are separate.** Fabric stitches and counted beginning-chain replacements produce stitch graph nodes; each chain run produces one chain-space graph node; written count annotations still count ordinary mid-round chains one per chain. Space nodes add no extra count beyond their written chains.
- **Progress uses written count weight.** Progress row totals and stitch-counter display use the same written-count weight as structured count validation, so R2 displays 48 rather than 24.
- **Source repeats expand before charting.** `R13: repeat R11.` and Unicode en-dash or ASCII-hyphen ranges such as `R15-R18: repeat R11-R14.` become real rounds with row labels, counts, turn state, and source metadata.
- **The pattern skill teaches the direct note forms.** It keeps button loops, sewing, gauge, sector charts, and mixed circular/strip page presentation as external notes rather than chart syntax.

## Capabilities

### New Capabilities

- `crochet-lace-motifs`: chain-space graph nodes, shell fan motifs, V2/V3 targetable internal spaces, picot and center-shell targets, implicit skip accounting from typed-next searches, explicit skip aliases, repositioning, current-round turns, and source-repeat metadata.

### Modified Capabilities

- `crochet-pattern-syntax`: adds direct support for the bounded `crochet-dev` written forms, plus internal canonical AST terms for beginning chains, joins, repositioning, turns, targets, counts, aliases, and source repeats.
- `crochet-chart-rendering`: makes graph-driven round styles honor current-round turn direction, chain-space arcs made from actual chain symbols, shell-fan geometry, counted beginning chains, joins, and source-repeat-expanded rounds.
- `crochet-pattern-skill`: teaches assistants to preserve and emit the direct note forms for chart-relevant `crochet-dev` semantics and to preserve non-chart finishing as notes.
- `crochet-progress-tool`: uses written-count weight for row totals and stitch-counter increments while allowing one written instruction to advance by its weight.

## Impact

- **Pattern language**: multiline row parsing, bounded note-form parsing, AST normalization, pattern expansion, structured count annotations, and user-facing errors.
- **Graph and layout**: working-cursor target resolution, implicit skipped-position accounting, chain-space nodes, repositioning without consumption, current-round turn traversal, shell-fan slots, and source metadata.
- **Render**: counted beginning-chain placement, explicit joins, curved chain symbols, shell fans, V spaces, picots, center-shell targeting, and continuous connectors to stitches or spaces.
- **Progress tool**: row totals and stitch-counter display change to written-count weight for charts using the revised notation.
- **Docs and skill**: README examples, localized pattern skill files, generated skill content, and a `crochet-dev` derived example using the original marking style.
- **Not chart syntax**: button loop and sewing instructions, gauge notes, sector or partial charts, and the reference page's mixed circular/strip presentation.
