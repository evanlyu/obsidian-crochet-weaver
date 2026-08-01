## MODIFIED Requirements

### Requirement: Parse supported stitch instructions
The system SHALL parse the bounded `crochet-dev` written-pattern grammar directly, including supported stitch names, quantities, repeat blocks, grouped stitches, explicit low-level skip steps, V aliases, beginning-chain count notes, closing slip-stitch joins, reposition instructions, current-round turns, structured count annotations, source repeats, explicit targets, multiline row bodies, accepted commas, and final periods into the AST.

#### Scenario: Quantity-prefixed stitch
- **WHEN** a step is written as `10 ch`
- **THEN** the parser SHALL create a stitch node for `ch` with count `10`

#### Scenario: Quantity written after the stitch name
- **WHEN** a step is written as `sc6` or `sc 6`
- **THEN** the parser SHALL create a stitch node for `sc` with count `6`, identical to the node produced by `6 sc`

#### Scenario: Digit-bearing stitch names are not split by a suffix count
- **WHEN** a step is written as `dc2tog`, `hdc3tog`, or `tr5cl`
- **THEN** the parser SHALL create a single stitch node with that name and count `1`, and SHALL still read `dc12` as `dc` with count `12`

#### Scenario: Slip-stitch spellings
- **WHEN** a step is written as `sl st`, `slst`, `sl-st`, or `sl_st`
- **THEN** the parser SHALL create a stitch node for the single normalized stitch name `sl st`

#### Scenario: Supported stitch names
- **WHEN** a step uses `ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `inc`, `dec`, or `MR`
- **THEN** the parser SHALL create a stitch node with the corresponding stitch name

#### Scenario: Repeat block
- **WHEN** a step is written as `[sc, inc] x 6`
- **THEN** the parser SHALL create a repeat node with count `6` and child stitch nodes for `sc` and `inc`

#### Scenario: Equivalent repeat-count forms
- **WHEN** a repeat's count is written as `x 6`, `x6`, `rep 6`, or `rep6`
- **THEN** the parser SHALL produce the same repeat node with count `6` in every case

#### Scenario: Grouped stitches
- **WHEN** a step is written as `(dc, ch, dc)`
- **THEN** the parser SHALL create a group node whose children are the enclosed steps

#### Scenario: Multiline round bodies
- **WHEN** a row or range label such as `R4:` is followed by indented continuation lines
- **THEN** every indented nonblank continuation line SHALL belong to that row until the next row label, range label, or blank boundary
- **AND** commas and a final period SHALL be accepted as separators or terminators without changing semantics

#### Scenario: Note-form counted beginning chain
- **WHEN** a round starts with `ch 3 (counts as dc)`
- **THEN** the parser SHALL create a beginning-chain node with chain count `3` and replacement stitch `dc`
- **AND** written count validation SHALL count it as one double crochet
- **AND** rendering SHALL keep all three chain symbols visible at the seam

#### Scenario: Note-form non-counting beginning chain
- **WHEN** a round starts with `ch 1 (does not count as a st)`
- **THEN** the parser SHALL create a beginning-chain node with chain count `1` and no replacement stitch
- **AND** written count validation SHALL count it as zero
- **AND** rendering SHALL keep the chain symbol visible at the seam

#### Scenario: Note-form closing joins
- **WHEN** a round ends with `sl st to top of beginning ch-3`, `sl st to first sc`, or `sl st to join`
- **THEN** the parser SHALL create a closing-join node with the requested target
- **AND** the join SHALL draw as a closing slip stitch with written count weight 0

#### Scenario: Reposition into a chain space
- **WHEN** a step is written as `sl st into next ch-1 sp`
- **THEN** the parser SHALL create a reposition node with stitch `sl st` and target `next ch-1 sp`
- **AND** the reposition SHALL move the working cursor's cyclic phase without producing a graph stitch or consuming the selected space

#### Scenario: Current-round turn instruction
- **WHEN** a round begins with `turn`
- **THEN** the parser SHALL create a turn node on that current round
- **AND** that current round SHALL toggle RS/WS state, reverse next-target traversal, and reverse round drawing direction relative to the previous round

#### Scenario: Supported explicit targets
- **WHEN** a stitch or group is written with `in same st`, `in same ch-1 sp`, `in next sc`, `in next dc`, `in next ch-1 sp`, `in next ch-2 sp`, `in next ch-3 sp`, `in next picot`, `in center dc of next 3-dc shell`, `in center dc of next 5-dc shell`, `in center dc of next 7-dc shell`, or `in center dc of next 9-dc shell`
- **THEN** the parser SHALL attach the corresponding target node to that step
- **AND** layout SHALL resolve that target through the working cursor

#### Scenario: Quantity target applies to the whole quantity
- **WHEN** a quantity instruction is written as `3 dc in next ch-1 sp`, `5 dc in next ch-2 sp`, `7 dc in next ch-3 sp`, or `9 dc in next ch-3 sp`
- **THEN** the parser SHALL attach the target to the whole quantity instruction
- **AND** AST normalization SHALL preserve it as one targeted motif-producing instruction rather than N independently targeted stitch instructions

#### Scenario: V alias target applies to the whole alias
- **WHEN** `V2 in next ch-2 sp` or `V3 in same ch-3 sp` is written
- **THEN** the parser SHALL attach the target to the whole alias
- **AND** expansion SHALL produce one same-source V motif with an internal targetable chain space

#### Scenario: Target syntax is local to one step
- **WHEN** a row is written `(5 dc) in next ch-3 sp, ch 3, sc in next dc.`
- **THEN** only the grouped stitches SHALL have the chain-space target
- **AND** the following chain and single crochet SHALL keep their own instructions and targets

#### Scenario: Unsupported target is rejected
- **WHEN** a step is written with a target outside the bounded supported target grammar
- **THEN** parsing SHALL fail rather than preserving an unknown target string

#### Scenario: V-stitch aliases
- **WHEN** a step is written as `V2` or `V3`
- **THEN** `V2` SHALL expand to `(dc, ch 2, dc)` with written count weight 4
- **AND** `V3` SHALL expand to `(dc, ch 3, dc)` with written count weight 5
- **AND** the internal chain run SHALL be available as a targetable space in graph-driven round layouts

#### Scenario: Structured count annotations
- **WHEN** a row carries `(24 dc)`, `(24 sc + 24 ch-1 sp = 48 sts)`, or `(12 reps, 7 sts per rep)`
- **THEN** the parser SHALL preserve the structured expected count data
- **AND** validation SHALL compare it to written stitch-count weight after aliases, beginning chains, and source repeats expand

#### Scenario: Source repeat of one round
- **WHEN** a row is written as `R13: repeat R11.`
- **THEN** expansion SHALL create a concrete R13 row from R11's chart steps
- **AND** the expanded row SHALL retain source metadata naming R11
- **AND** any annotation on R13 SHALL validate against the expanded row's written count weight

#### Scenario: Source repeat of a range
- **WHEN** rows are written as `R15-R18: repeat R11-R14.` or `R15–R18: repeat R11–R14.`
- **THEN** expansion SHALL create concrete rows R15 through R18 by copying source rows R11 through R14 in order
- **AND** each expanded row SHALL retain source metadata naming the source row it copied
- **AND** each expanded row SHALL participate in current-round turn, target, join, graph, and count validation as its own round

#### Scenario: Explicit low-level skip step
- **WHEN** a step is written as `skip 3` or `sk 3`
- **THEN** the parser SHALL create a skip node with count `3`
- **AND** the skip node SHALL consume three target positions from the previous round without producing any stitches in the current round

#### Scenario: Skip count must be positive
- **WHEN** a step is written as `skip 0`, `skip -1`, or `skip` without a positive integer count
- **THEN** parsing SHALL fail instead of creating a zero-width or ambiguous skip node

### Requirement: Distinguish a round's opening and closing instructions from its stitches
The system SHALL treat the chain a round opens with, a magic ring written as a step, and the slip stitch a round closes with as instructions rather than stitches of the fabric: each SHALL be kept in the pattern and available to draw, and SHALL not be worked into by the following round. Such an instruction SHALL count toward the round's written count only where the pattern says it does — `ch 3 (counts as dc)` counts as the one stitch it replaces, `ch 1 (does not count as a st)` and every closing join count zero. Where a beginning chain carries no annotation, the round's own closing join SHALL decide it: a join written to the top of that beginning chain means it replaces a stitch, and any other join means it does not. A chain or slip stitch elsewhere in a round SHALL remain an ordinary stitch and SHALL count as one.

#### Scenario: Opening chain parsed and kept
- **WHEN** a round is written `R2: ch, 6 sc, sl st`
- **THEN** parsing SHALL succeed and the row's steps SHALL retain the leading `ch` in written order

#### Scenario: Opening and closing instructions excluded from the count
- **WHEN** a round is written `R1: mr, ch, sc6, slst`
- **THEN** the round's stitch count SHALL be `6`

#### Scenario: A beginning chain that replaces a stitch
- **WHEN** a round is written `R1: MR, ch 3 (counts as dc), 23 dc, sl st to top of beginning ch-3.`
- **THEN** the beginning chain SHALL count as one double crochet, giving the round a written count of 24
- **AND** it SHALL produce one graph stitch a later round can be worked into

#### Scenario: An unannotated beginning chain counts when the join says so
- **WHEN** a round is written `R3: sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp, ... sl st to top of beginning ch-3.`, with no `(counts as dc)` note on the chain
- **THEN** that beginning chain SHALL count as the one double crochet it replaces, because the round closes to its top
- **AND** a round whose beginning chain carries no note and whose join is written to anything else, such as `sl st to first sc`, SHALL count that chain as zero

#### Scenario: Magic ring written as a step
- **WHEN** a first round is written `R1: mr, ch, sc6, slst` instead of using the `in MR` anchor
- **THEN** the system SHALL treat `mr` as the round's center anchor rather than as a counted stitch

#### Scenario: Mid-round chain is a real stitch
- **WHEN** a chain or slip stitch appears between other stitches of a round rather than at its start or end
- **THEN** that stitch SHALL count toward the round's stitch total like any other stitch
- **AND** a run of such chains between two anchors SHALL additionally create one chain-space graph node, which itself counts zero

## ADDED Requirements

### Requirement: Distinguish graph nodes, spaces, and written count weight
The system SHALL preserve opening chains, ordinary chains, repositioning slip stitches, closing joins, turns, magic ring instructions, picots, spaces, and count annotations as written chart instructions while keeping separate graph-produced stitch nodes, chain-space graph nodes, and written stitch-count weight.

#### Scenario: Ordinary mid-round chains count in written annotations
- **WHEN** a mid-round `ch 1`, `ch 2`, or `ch 3` is not part of a non-counting beginning chain
- **THEN** each written chain SHALL contribute 1 to written stitch-count weight
- **AND** the chain run SHALL create one chain-space graph node when it sits between anchors
- **AND** the space node itself SHALL add no extra written count

#### Scenario: R1 counted chain and join
- **WHEN** R1 is written as `MR, ch 3 (counts as dc), 23 dc, sl st to top of beginning ch-3. (24 dc)`
- **THEN** the written count SHALL be replacement dc + 23 dc = 24
- **AND** the beginning chain SHALL create a targetable replacement double crochet graph node
- **AND** the join SHALL close to the top of that beginning chain with written count weight 0

#### Scenario: R2 non-counting chain and spaces
- **WHEN** R2 is written with `ch 1 (does not count as a st)`, 24 single crochets separated by ordinary `ch 1`, and `sl st to first sc. (24 sc + 24 ch-1 sp = 48 sts)`
- **THEN** the beginning chain SHALL count 0
- **AND** the written count SHALL be 24 sc + twenty-four ordinary ch1 = 48
- **AND** the 24 ordinary mid-round chains SHALL create 24 targetable `ch-1 sp` graph nodes

#### Scenario: R3 reposition and counted chain
- **WHEN** R3 starts with `sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp` and has `(12 reps, 4 sts per rep)`
- **THEN** the reposition SHALL move the cursor to that chain space without changing the written count
- **AND** the beginning chain SHALL count as the first double crochet of the first 3-dc shell
- **AND** the following `2 dc in same ch-1 sp` SHALL add two sibling double crochet graph nodes to the same source without a duplicate-consumption error
- **AND** the round's written count SHALL be 12 reps times 3 dc plus 1 sc = 48

#### Scenario: R2 same stitch after non-counting beginning chain
- **WHEN** R2 begins `ch 1 (does not count as a st), sc in same st`
- **THEN** the round-entry cursor SHALL select the inherited start stitch from R1
- **AND** the single crochet SHALL consume that selected stitch even though R2 has no earlier produced target

#### Scenario: Actual source-repeat lines
- **WHEN** the note contains `R13: repeat R11.`, `R14: repeat R12.`, `R15-R18: repeat R11-R14.`, or `R19-R22: repeat R11-R14.` with either hyphen or en-dash ranges
- **THEN** expansion SHALL create concrete rows for each destination row
- **AND** each row SHALL preserve source row mapping and current-round leading-turn semantics after expansion
