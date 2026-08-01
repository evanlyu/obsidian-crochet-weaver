## ADDED Requirements

### Requirement: Record a chain run between two anchors as a space
The system SHALL record a run of one or more chains worked between two anchors in a round as one space in the stitch graph: an identity a later round can be worked into, and a position taken from the chains it is made of. This SHALL include ordinary row-level chains and chain runs nested inside grouped V-stitches or aliases such as `V2` and `V3`. A space SHALL NOT be a fabric stitch and SHALL NOT add written count beyond the chains that created it, while every written chain SHALL remain available as an individual renderable pattern step.

#### Scenario: A chain run becomes one space and keeps written count
- **WHEN** a round contains `ch 3` between two anchors
- **THEN** the three chains SHALL contribute 3 to written stitch-count weight
- **AND** the run SHALL be recorded as one targetable `ch-3 sp` graph node
- **AND** the space node SHALL contribute no additional count

#### Scenario: A ch-1 space is targetable and remains visible
- **WHEN** R2 contains one ordinary `ch 1` between neighboring single crochets and the next round works into that `ch-1 sp`
- **THEN** the graph SHALL expose a chain-space source for the next round
- **AND** the renderer SHALL still draw exactly one chain symbol for the written chain

#### Scenario: A V-stitch creates an internal space
- **WHEN** a round contains `(dc, ch 2, dc)`, `(dc, ch 3, dc)`, `V2`, or `V3` worked into one source
- **THEN** the two double crochets SHALL form one fan motif
- **AND** the chain run between them SHALL form a targetable `ch-2 sp` or `ch-3 sp` for the next round
- **AND** V2 SHALL have written count weight 4 and V3 SHALL have written count weight 5

### Requirement: Draw a chain run as countable symbols along a curve
The system SHALL draw every chain in a chain-space run as an individual chain symbol, distributing the symbols along a curved path that bridges the two anchors and bows away from the chart's center across its round's band. The system SHALL NOT replace the run with one plain stroked arc or only a numeric label.

#### Scenario: The arc meets what it connects
- **WHEN** a chain run between two anchors is drawn
- **THEN** its curved path SHALL start at the first anchor and end at the second
- **AND** it SHALL stay inside its own round's band

#### Scenario: Chain count stays readable
- **WHEN** a chain run contains N chains
- **THEN** the chart SHALL contain exactly N chain symbols in written order
- **AND** a reader SHALL be able to recover the count without a substitute label

#### Scenario: Group-internal V space stays visible
- **WHEN** `V3` is drawn
- **THEN** the two double crochet symbols SHALL remain visible
- **AND** exactly three chain symbols SHALL be drawn along the curve between them
- **AND** the internal space SHALL be addressable as `next ch-3 sp`

### Requirement: Draw a group as one shell-fan motif
The system SHALL draw a group of stitches worked into one place as a single shell-fan motif. Every child stitch SHALL remain individually visible, countable, addressable, and highlightable in written order; their feet SHALL converge on the source stitch or space, and their heads SHALL spread along the outer edge of the current round band across room derived from the symbols actually drawn.

#### Scenario: Quantity-targeted shell consumes once
- **WHEN** the source writes `5 dc in next ch-2 sp`
- **THEN** the target SHALL apply to the whole quantity instruction
- **AND** the selected `ch-2 sp` SHALL be consumed exactly once
- **AND** five sibling double crochet graph nodes SHALL share that source and form one shell-fan motif slot

#### Scenario: A shell reads as a fan
- **WHEN** a round contains `3 dc in next ch-1 sp`, `5 dc in next ch-2 sp`, `7 dc in next ch-3 sp`, or `9 dc in next ch-3 sp`
- **THEN** the corresponding double crochet stitches SHALL be drawn spreading from that one place, not spaced along the ring as independent source positions

#### Scenario: Quantity-targeted shell does not advance per stitch
- **WHEN** `9 dc in next ch-3 sp` is resolved
- **THEN** cursor traversal SHALL find one `ch-3 sp` target
- **AND** it SHALL NOT perform nine separate `next ch-3 sp` searches or consume nine sources

#### Scenario: Progressive shells remain countable
- **WHEN** successive rounds contain 3-, 5-, 7-, and 9-dc shell motifs as in `crochet-dev`
- **THEN** each shell SHALL visibly contain the written number of double-crochet symbols
- **AND** every shell SHALL keep the same source-to-outer-band fan construction as its child count grows

#### Scenario: Center dc of an odd shell is targetable
- **WHEN** a later round targets `in center dc of next 3-dc shell`, `in center dc of next 5-dc shell`, `in center dc of next 7-dc shell`, or `in center dc of next 9-dc shell`
- **THEN** target resolution SHALL select the middle double crochet child of that odd shell
- **AND** intervening previous-round target positions passed during the typed search SHALL be recorded as implicit skips

#### Scenario: Picot target is targetable and zero-count for this pattern
- **WHEN** a later round targets `in next picot`
- **THEN** target resolution SHALL select the next picot child in traversal order
- **AND** the produced stitch or motif SHALL attach to the picot's position
- **AND** the picot embellishment itself SHALL have written count weight 0 for the `crochet-dev` count annotations

### Requirement: Keep a shell-fan round aligned to the round below
The system SHALL treat a round that uses typed `next` searches, `same` targets, spaces, repositioning, shell centers, and explicit low-level skips as a round that consumes the round below exactly once each when the written operations account for it exactly. Such a round SHALL keep its ancestry alignment rather than falling back to even spacing.

#### Scenario: Typed next search records implicit skips
- **WHEN** the cursor searches for `next ch-2 sp`, `next dc`, `next sc`, `next picot`, or `center dc of next 7-dc shell`
- **THEN** every intervening previous-round target position before the selected target SHALL be recorded as implicitly skipped and consumed for graph validation
- **AND** the selected target SHALL be consumed by the produced stitch or group

#### Scenario: Same target reuses current selected place
- **WHEN** a following step uses `in same st` or `in same ch-1 sp`
- **THEN** it SHALL use the cursor's current selected place for that same-place operation
- **AND** it SHALL NOT perform a new `next` search

#### Scenario: Same target can add siblings to a motif
- **WHEN** a same-place operation follows a consumed target as part of a contiguous same-source shell or V motif
- **THEN** it SHALL add sibling output nodes to the same source without triggering duplicate-consumption validation
- **AND** unrelated later reuse of the same source SHALL still be reported as a duplicate-use mapping error

#### Scenario: Reposition consumes nothing
- **WHEN** R3 begins with `sl st into next ch-1 sp`
- **THEN** the reposition SHALL change the cyclic starting phase
- **AND** it SHALL NOT consume that space or any intervening targets
- **AND** the following produced shell SHALL consume the selected `ch-1 sp`

#### Scenario: R3 first shell aggregates across steps
- **WHEN** R3 begins `sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp`
- **THEN** the counted beginning-chain replacement and the following two double crochets SHALL share the selected `ch-1 sp`
- **AND** the chart SHALL draw one 3-dc shell fan with three visible heads at the round start

#### Scenario: Round entry cursor inherits join point
- **WHEN** a later joined round starts without repositioning
- **THEN** its cursor SHALL initialize at the previous round's resolved closing-join/start position
- **AND** a leading `turn` SHALL reverse traversal direction without changing that selected entry place

#### Scenario: A skip that runs past the round below
- **WHEN** explicit low-level skip steps or implicit skip accounting consume more previous-round target positions than remain available
- **THEN** validation SHALL report it as a fact about the pattern, naming the round and the counts, before anything is drawn

#### Scenario: R3 makes twelve 3-dc shell fans
- **WHEN** R3 is parsed from the `crochet-dev` note form with a reposition into the next `ch-1 sp`, `ch 3 (counts as dc)`, and 3-dc shells in `ch-1 sp` targets
- **THEN** the round SHALL draw twelve 3-dc shell fans attached to R2 chain spaces
- **AND** the strict written count SHALL be 12 reps times 4 = 48

#### Scenario: R4 and later rounds turn
- **WHEN** R4 and later joined rounds start with `turn`
- **THEN** each such current round SHALL reverse traversal and drawing direction relative to the previous round
- **AND** motif child order SHALL remain the order written inside each group

#### Scenario: R15 through R22 expand from R11 through R14
- **WHEN** the source writes R15 through R22 as repeats of R11 through R14 using en-dash or hyphen ranges
- **THEN** each repeated round SHALL expand before charting
- **AND** shell, V, picot, center, turn, join, implicit skip, and count semantics SHALL be validated on the expanded rows
