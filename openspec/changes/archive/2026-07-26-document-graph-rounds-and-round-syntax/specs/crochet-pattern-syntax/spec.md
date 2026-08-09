## MODIFIED Requirements

### Requirement: Parse supported stitch instructions
The system SHALL parse supported stitch names, quantities written on either side of the stitch name, repeat blocks with any supported count form, and grouped stitches into the AST.

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

### Requirement: Reject malformed crochet syntax
The system SHALL reject malformed crochet syntax and surface a parse error to the caller, and SHALL report — rather than guess — a repeat count that cannot be determined from the pattern.

#### Scenario: Unsupported stitch word
- **WHEN** a crochet document contains a stitch word that is not in the supported stitch list
- **THEN** parsing SHALL fail instead of creating an unknown stitch node

#### Scenario: Incomplete repeat block
- **WHEN** a crochet document contains a repeat block with neither a numeric count nor a bare `rep`
- **THEN** parsing SHALL fail instead of guessing a repeat count

#### Scenario: Bare repeat that does not divide evenly
- **WHEN** a round contains a bare `rep` whose one repeat works into a number of stitches that does not divide the previous round's stitch count evenly
- **THEN** the system SHALL raise a localized error naming the round, the stitches consumed per repeat, and the stitches available, instead of truncating or rounding the count

#### Scenario: Bare repeat with no previous round
- **WHEN** the first round of a pattern contains a bare `rep`
- **THEN** the system SHALL raise a localized error stating that `rep` needs a round before it to work into

## ADDED Requirements

### Requirement: Infer a bare repeat count from the previous round
The system SHALL accept a repeat block written with a bare `rep` (no count) — how a written pattern says "around" / "to end of round" — and SHALL resolve its count after parsing from the number of stitches the previous round leaves to work into, without modifying the pattern as written.

#### Scenario: Count inferred from the round below
- **WHEN** a pattern is written `R1: mr, ch, sc6, slst` followed by `R2: ch, [2 sc, inc] rep, slst`
- **THEN** the system SHALL resolve the repeat's count to `2`, since each repeat works into 3 stitches and the round below leaves 6

#### Scenario: A decrease inside the repeat consumes two stitches
- **WHEN** a bare `rep` block contains a `dec` (or an N-together decrease)
- **THEN** the stitches that repeat works into SHALL count that decrease as the number of stitches it closes over, not as one

#### Scenario: The pattern keeps its written form
- **WHEN** a bare `rep` has been resolved
- **THEN** the AST SHALL still contain a repeat node with its children (not the expanded stitch list), so the pattern can be read back as written

### Requirement: Distinguish a round's opening and closing instructions from its stitches
The system SHALL treat the chain a round opens with, a magic ring written as a step, and the slip stitch a round closes with as instructions rather than stitches of the fabric: each SHALL be kept in the pattern and available to draw, SHALL be excluded from the round's stitch count, and SHALL not be worked into by the following round. A chain or slip stitch elsewhere in a round SHALL remain an ordinary stitch.

#### Scenario: Opening chain parsed and kept
- **WHEN** a round is written `R2: ch, 6 sc, sl st`
- **THEN** parsing SHALL succeed and the row's steps SHALL retain the leading `ch` in written order

#### Scenario: Opening and closing instructions excluded from the count
- **WHEN** a round is written `R1: mr, ch, sc6, slst`
- **THEN** the round's stitch count SHALL be `6`

#### Scenario: Magic ring written as a step
- **WHEN** a first round is written `R1: mr, ch, sc6, slst` instead of using the `in MR` anchor
- **THEN** the system SHALL treat `mr` as the round's center anchor rather than as a counted stitch

#### Scenario: Mid-round chain is a real stitch
- **WHEN** a chain or slip stitch appears between other stitches of a round rather than at its start or end
- **THEN** that stitch SHALL count toward the round's stitch total like any other stitch
