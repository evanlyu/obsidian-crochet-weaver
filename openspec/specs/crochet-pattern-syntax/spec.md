# crochet-pattern-syntax Specification

## Purpose
TBD - created by archiving change document-current-crochet-behavior. Update Purpose after archive.
## Requirements
### Requirement: Parse crochet code block documents
The system SHALL parse a crochet pattern document into a `CrochetChart` AST with optional flat frontmatter configuration and one or more rows.

#### Scenario: Pattern without frontmatter
- **WHEN** a crochet document contains only valid row lines
- **THEN** the parser SHALL return a chart AST whose config defaults to `type: flat`

#### Scenario: Pattern with frontmatter
- **WHEN** a crochet document starts with `---`, contains flat `key: value` lines, and closes with `---`
- **THEN** the parser SHALL include those key/value pairs in the chart config while preserving `type: flat` when no explicit type is provided

### Requirement: Accept row labels and row modifiers
The system SHALL accept row labels written as `R<number>:` or `Row <number>:` and SHALL attach supported row-level modifiers to the row AST.

#### Scenario: Short row label
- **WHEN** a row starts with `R1:` followed by valid steps
- **THEN** the parser SHALL create a row with `num` equal to `1`

#### Scenario: Long row label
- **WHEN** a row starts with `Row 12:` followed by valid steps
- **THEN** the parser SHALL create a row with `num` equal to `12`

#### Scenario: Loop modifier
- **WHEN** a row includes `blo` or `flo` immediately after the row label
- **THEN** the parser SHALL set the row loop modifier to `blo` or `flo`

#### Scenario: Round anchor
- **WHEN** a row ends with `in MR` or `in ch ring`
- **THEN** the parser SHALL set the row anchor to `MR` or `ch ring`

### Requirement: Parse supported stitch instructions
The system SHALL parse supported stitch names, optional quantity prefixes, repeat blocks, and grouped stitches into the AST.

#### Scenario: Quantity-prefixed stitch
- **WHEN** a step is written as `10 ch`
- **THEN** the parser SHALL create a stitch node for `ch` with count `10`

#### Scenario: Supported stitch names
- **WHEN** a step uses `ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `inc`, `dec`, or `MR`
- **THEN** the parser SHALL create a stitch node with the corresponding stitch name

#### Scenario: Repeat block
- **WHEN** a step is written as `[sc, inc] x 6`
- **THEN** the parser SHALL create a repeat node with count `6` and child stitch nodes for `sc` and `inc`

#### Scenario: Grouped stitches
- **WHEN** a step is written as `(dc, ch, dc)`
- **THEN** the parser SHALL create a group node whose children are the enclosed steps

### Requirement: Reject malformed crochet syntax
The system SHALL reject malformed crochet syntax and surface a parse error to the caller.

#### Scenario: Unsupported stitch word
- **WHEN** a crochet document contains a stitch word that is not in the supported stitch list
- **THEN** parsing SHALL fail instead of creating an unknown stitch node

#### Scenario: Incomplete repeat block
- **WHEN** a crochet document contains a repeat block without a numeric `x` count
- **THEN** parsing SHALL fail instead of guessing a repeat count

