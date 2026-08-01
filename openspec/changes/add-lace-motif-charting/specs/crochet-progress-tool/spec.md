## MODIFIED Requirements

### Requirement: Track row progress and stitch counts
The progress tool SHALL use the same written-count weight as structured count validation for row totals and stitch-counter display. Ordinary mid-round chains SHALL count one per chain; a counted beginning-chain replacement SHALL count one; non-counting beginning/setup chains, closing joins, repositioning slip stitches, turns, skips, picot embellishments in this pattern, and chain-space graph nodes SHALL count zero. One written instruction SHALL advance the counter atomically by its written weight.

#### Scenario: R2 progress total includes ordinary chains
- **WHEN** the progress tool displays the original `crochet-dev` R2 with 24 single crochets and twenty-four ordinary `ch 1` spaces
- **THEN** the row total SHALL display 48
- **AND** it SHALL NOT display 24 merely because only 24 single crochet graph stitches were produced

#### Scenario: Counted beginning chain contributes one
- **WHEN** the progress tool displays R1 or R3 with `ch 3 (counts as dc)`
- **THEN** the beginning chain replacement SHALL contribute 1 to the row total
- **AND** it SHALL NOT contribute 3

#### Scenario: Non-counting instructions contribute zero
- **WHEN** the progress tool displays rows containing non-counting beginning chains, closing joins, repositioning slip stitches, turns, explicit skips, picot embellishments, or chain-space graph nodes
- **THEN** those instructions or nodes SHALL contribute 0 to the row total unless they also contain ordinary written chains that count separately

#### Scenario: Motif instructions advance by written weight
- **WHEN** a user advances a progress counter over `V2`, `V3`, or `5 dc in next ch-2 sp`
- **THEN** the tool SHALL advance once for the written instruction
- **AND** the increment SHALL equal that instruction's written-count weight
