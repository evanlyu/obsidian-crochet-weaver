## MODIFIED Requirements

### Requirement: Parse supported stitch instructions
The system SHALL parse supported stitch names, optional quantity prefixes, repeat blocks, and grouped stitches into the AST.

#### Scenario: Quantity-prefixed stitch
- **WHEN** a step is written as `10 ch`
- **THEN** the parser SHALL create a stitch node for `ch` with count `10`

#### Scenario: Supported stitch names
- **WHEN** a step uses any of the supported stitch names — basic `ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `MR`, `picot`, `rsc`; shaping `inc`, `dec`, `sc2tog`, `sc3tog`, `hdc2tog`, `hdc3tog`, `hdc4tog`, `hdc5tog`, `dc2tog`, `dc3tog`, `dc4tog`, `dc5tog`; post `fpsc`, `fphdc`, `fpdc`, `fptr`, `bpsc`, `bphdc`, `bpdc`, `bptr`; crossed `xhdc`, `xdc`, `xtr`; cluster `hdc2cl`, `hdc3cl`, `hdc5cl`, `dc2cl`, `dc3cl`, `dc5cl`, `tr2cl`, `tr3cl`, `tr5cl`, `bobble`; popcorn `popcorn`, `hdc popcorn`, `tr popcorn`
- **THEN** the parser SHALL create a stitch node with the corresponding stitch name

#### Scenario: Longer names are not consumed as shorter prefixes
- **WHEN** a step uses a stitch name containing another supported name as a prefix (for example `sc2tog`, `dc3cl`, `hdc popcorn`, `tr popcorn`)
- **THEN** the parser SHALL create a single stitch node for the longer name, not a node for the prefix followed by a parse error

#### Scenario: Digit-containing names do not collide with quantity prefixes
- **WHEN** a step is written as `3 dc2tog`
- **THEN** the parser SHALL create a stitch node for `dc2tog` with count `3`

#### Scenario: Repeat block
- **WHEN** a step is written as `[sc, inc] x 6`
- **THEN** the parser SHALL create a repeat node with count `6` and child stitch nodes for `sc` and `inc`

#### Scenario: Grouped stitches
- **WHEN** a step is written as `(dc, ch, dc)`
- **THEN** the parser SHALL create a group node whose children are the enclosed steps
