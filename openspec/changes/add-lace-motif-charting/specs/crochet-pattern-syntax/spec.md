## MODIFIED Requirements

### Requirement: Parse supported stitch instructions
The system SHALL parse the bounded `crochet-dev` written-pattern grammar directly, including supported stitch names, quantities, repeat blocks, grouped stitches, explicit low-level skip steps, V aliases, beginning-chain count notes, closing slip-stitch joins, reposition instructions, current-round turns, structured count annotations, source repeats, explicit targets, multiline row bodies, accepted commas, and final periods into the AST.

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
- **WHEN** R3 starts with `sl st into next ch-1 sp, ch 3 (counts as dc), 2 dc in same ch-1 sp` and has `(12 reps, 4 sts per rep)`
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
