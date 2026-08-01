## 1. Parser, AST, and expansion

- [ ] 1.1 Add failing parser tests for original `crochet-dev` multiline round bodies: indented continuations, commas, final periods, and row/range boundaries
- [ ] 1.2 Implement multiline row-body parsing without changing non-multiline rows
- [ ] 1.3 Add failing parser tests for direct note forms: `ch 3 (counts as dc)`, `ch 1 (does not count as a st)`, `sl st to top of beginning ch-3`, `sl st to first sc`, `sl st to join`, and `sl st into next ch-1 sp`
- [ ] 1.4 Implement AST node types and grammar support for direct beginning-chain notes, note-form joins, and note-form repositioning
- [ ] 1.5 Add failing parser tests for leading current-round `turn`, `same st`, `same ch-1 sp`, quantity-targeted motifs like `3 dc in next ch-1 sp`, `next sc/dc/ch-1 sp/ch-2 sp/ch-3 sp/picot`, center dc of next 3/5/7/9-dc shell, and targeted V2/V3 aliases
- [ ] 1.6 Implement grammar and AST normalization for current-round turns, bounded targets, and V2/V3 aliases
- [ ] 1.7 Add failing parser tests for structured annotations `(24 dc)`, `(24 sc + 24 ch-1 sp = 48 sts)`, `(12 reps, 4 sts per rep)`, `(12 reps, 7 sts per rep)`, `R13: repeat R11.`, `R14: repeat R12.`, and hyphen/en-dash ranges such as `R15-R18: repeat R11-R14.` and `R19–R22: repeat R11–R14.`
- [ ] 1.8 Implement structured count annotation parsing and source-repeat expansion with source metadata
- [ ] 1.9 Add failing parser tests for invalid skip counts, unsupported targets, invalid shell-center targets, malformed joins, malformed turns, and malformed source-repeat ranges
- [ ] 1.10 Implement parser validation for invalid bounded grammar forms and regenerate `src/pattern/parser.ts`

## 2. Written counts, graph nodes, and budgets

- [ ] 2.1 Add failing count tests for R1 original note form: replacement dc + 23 dc = 24, with join weight 0
- [ ] 2.2 Implement written count weight for counted beginning-chain replacements and note-form joins
- [ ] 2.3 Add failing count tests for R2 original note form: non-counting beginning chain 0, 24 sc + twenty-four ordinary ch1 = 48, and 24 targetable space graph nodes
- [ ] 2.4 Implement ordinary mid-round chain written count weight and one chain-space graph node per chain run without extra space count
- [ ] 2.5 Add failing count tests for R3: 12 reps times 3 dc plus 1 sc = 48, with the beginning replacement as the first dc of the first shell and reposition weight 0
- [ ] 2.6 Implement written count validation across beginning chains, ordinary chains, groups, shells, sc/dc nodes, repositioning, and joins
- [ ] 2.7 Add failing count tests for R4/R6 per-repeat count 7, R8 per-repeat count 9, and R10/R12 per-repeat count 10, including V2/V3 chain weights and picot embellishment weight 0
- [ ] 2.8 Implement V2/V3, picot, turn, skip, and source-repeat written count behavior
- [ ] 2.9 Add failing progress-total tests proving row totals use written-count weight, including R2 displaying 48, counted beginning replacement displaying 1, and non-counting setup/join/reposition/turn/skip/picot/space nodes displaying 0
- [ ] 2.10 Implement progress row totals and stitch-counter increments from written-count weight while allowing one written instruction to advance atomically by its weight
- [ ] 2.11 Add failing safety-budget tests covering multiline source repeats, chain-space runs, quantity-targeted shell motifs, implicit skipped positions, explicit skip aliases, and target nodes
- [ ] 2.12 Implement budget accounting for the revised AST and expansion model

## 3. Working cursor and stitch graph

- [ ] 3.1 Add failing graph tests proving `sl st into next ch-1 sp` changes cyclic starting phase and consumes nothing
- [ ] 3.2 Implement reposition phase changes without consuming the selected space or intervening targets
- [ ] 3.3 Add failing graph tests proving first round starts from foundation/MR, later joined rounds inherit the previous resolved join/start position, and leading `turn` changes direction but not the selected entry place
- [ ] 3.4 Implement round-entry cursor initialization and join/start inheritance
- [ ] 3.5 Add failing graph tests proving R2 `ch 1 (does not count as a st), sc in same st` consumes the inherited entry stitch despite no earlier R2 produced target
- [ ] 3.6 Implement same-target behavior from round-entry selection
- [ ] 3.7 Add failing graph tests proving typed `next` searches advance in current traversal direction, record every intervening target as implicitly skipped/consumed, and consume the selected target through the produced stitch or group
- [ ] 3.8 Implement implicit skip accounting for `next sc`, `next dc`, `next ch-N sp`, `next picot`, and `center dc of next N-dc shell`
- [ ] 3.9 Add failing graph tests proving quantity-targeted motifs and targeted V2/V3 consume one source once and do not advance the cursor per child
- [ ] 3.10 Implement one-source graph semantics for quantity-targeted motifs and targeted aliases
- [ ] 3.11 Add failing graph tests proving `same st` and `same ch-1 sp` can add sibling nodes to the same-source motif without duplicate-consumption errors while unrelated later reuse still errors
- [ ] 3.12 Implement same-source sibling aggregation and duplicate-use validation boundaries
- [ ] 3.13 Add failing graph tests for leading `turn` on R4 and later reversing current-round traversal, toggling side state, preserving child order, and yielding R4/R6/etc. WS plus R5/R7/etc. RS through R22
- [ ] 3.14 Implement current-round turn state, RS/WS toggling, and reversed traversal for joined rounds
- [ ] 3.15 Add failing graph tests for missing targets, implicit skip overrun, explicit skip overrun, unrelated reused targets, unconsumed targets, and unsupported older-space references
- [ ] 3.16 Implement typed graph validation errors before layout

## 4. Chain spaces, V spaces, and shell motifs

- [ ] 4.1 Add failing graph tests proving any ordinary chain run creates one targetable chain-space graph node while each written chain still contributes to written count
- [ ] 4.2 Implement chain-space graph nodes with identity, source row, chain count, anchors, source metadata, and position hooks
- [ ] 4.3 Add failing graph tests proving V2 creates a targetable `ch-2 sp` and V3 creates a targetable `ch-3 sp`
- [ ] 4.4 Implement V2/V3 internal space nodes from alias expansion
- [ ] 4.5 Add failing layout tests for exactly N chain symbols drawn along `ch-1`, `ch-2`, `ch-3`, and longer chain-space curves with no plain arc or label substitution
- [ ] 4.6 Implement curved chain-symbol geometry inside the current round band with seam reservation
- [ ] 4.7 Add failing layout tests for note-form quantity-targeted 3, 5, 7, and 9 double crochet shells whose feet converge on one source, consume one source once, and whose heads spread along the outer band
- [ ] 4.8 Implement shell-fan geometry while keeping every child countable, addressable, targetable, and highlightable
- [ ] 4.9 Add failing layout tests proving `sl st into next ch-1 sp, ch 3 (counts as dc), 2 dc in same ch-1 sp` aggregates into one 3-head shell-fan slot
- [ ] 4.10 Implement contiguous same-source motif aggregation at round start

## 5. Round rendering behavior

- [ ] 5.1 Add failing layout tests proving leading `turn` on the current round draws alternating directions from R4 onward while preserving motif child order
- [ ] 5.2 Implement graph-driven current-round drawing direction from turn state in `japanese` and `continuous` styles
- [ ] 5.3 Add failing render tests for original note-form counted beginning chains, non-counting beginning chains, joins to beginning-chain top, joins to first sc, generic joins, and reposition slip stitches
- [ ] 5.4 Implement rendering for note-form beginning-chain, join, and reposition instructions at the seam or target space, and set the next round's inherited entry/start position from the resolved join
- [ ] 5.5 Add failing continuous-style tests for connector endpoints landing on stitches, chain spaces, counted beginning-chain replacement stitches, picots, and shell centers
- [ ] 5.6 Implement continuous connector endpoints for the revised graph node types
- [ ] 5.7 Add failing regression tests proving radial style keeps its even placement and ordinary non-lace graph-driven rounds keep existing behavior
- [ ] 5.8 Preserve existing radial and non-lace graph-driven behavior

## 6. Direct crochet-dev acceptance coverage

- [ ] 6.1 Add a failing acceptance test using the original multiline `crochet-dev` R1 through R3 forms: R1 count 24 and join, R2 count 48 with 24 targetable `ch-1 sp` spaces, R2 `sc in same st`, R3 first shell across `ch 3 (counts as dc), 2 dc in same ch-1 sp`, and R3 count annotation `(12 reps, 4 sts per rep)`
- [ ] 6.2 Implement any missing parser, graph, written count, layout, or render behavior needed for direct R1 through R3 acceptance
- [ ] 6.3 Add a failing acceptance test using original R4 through R10 forms covering leading current-round turns, WS/RS side alternation, V2/V3, targeted V aliases, quantity-targeted 5/7/9-dc shells, center-shell targets, picot targets, joins, implicit skips, and structured counts
- [ ] 6.4 Implement any missing behavior needed for direct R4 through R10 acceptance
- [ ] 6.5 Add a failing acceptance test using original R11 through R14 forms covering the repeated motif section with written counts and typed target resolution
- [ ] 6.6 Implement any missing behavior needed for direct R11 through R14 acceptance
- [ ] 6.7 Add a failing acceptance test using original `R13: repeat R11.`, `R14: repeat R12.`, `R15-R18: repeat R11-R14.`, and `R19-R22: repeat R11-R14.` forms with source metadata, current-round leading-turn semantics after expansion, side state, and strict written counts
- [ ] 6.8 Implement any missing behavior needed for direct R13 and R15 through R22 acceptance

## 7. Errors, docs, skill, and examples

- [ ] 7.1 Add failing localization tests for invalid beginning-chain notes, joins, reposition targets, turn placement, unsupported targets, missing chain spaces, missing picots, missing shell centers, source-repeat expansion failures, written count mismatches, and implicit/explicit skip overruns
- [ ] 7.2 Implement localized errors for the revised bounded grammar and mapping failures
- [ ] 7.3 Add failing docs or snapshot tests for README and localized pattern-skill updates covering direct `crochet-dev` note forms, quantity-targeted motifs, R3 first-shell aggregation, round-entry cursor, join inheritance, current-round turns, side state, progress totals, structured counts, written-count versus graph-node separation, implicit skips, and non-chart finishing/page notes
- [ ] 7.4 Update README files, localized skill files, generated skill content, and examples to match the decision-complete direct-note contract

## 8. Verification

- [ ] 8.1 Run targeted parser and expansion tests
- [ ] 8.2 Run targeted written-count, budget, graph, layout, and render tests
- [ ] 8.3 Run targeted docs, localization, and skill-content tests
- [ ] 8.4 Run the full test suite with `npm test`
- [ ] 8.5 Run `npm run lint`
- [ ] 8.6 Run `npm run build`
- [ ] 8.7 Manually render the original `crochet-dev` fenced `crochet` block R1 through R22 and verify quantity-targeted 3/5/7/9-dc shell fans, R3 first-shell aggregation, chain spaces, V2/V3 spaces, picots, current-round turns, side state, join inheritance, progress totals, structured written counts, implicit skips, and no chart syntax for finishing notes
