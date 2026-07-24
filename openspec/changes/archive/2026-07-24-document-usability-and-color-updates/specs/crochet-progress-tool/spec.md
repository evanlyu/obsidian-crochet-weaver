## MODIFIED Requirements

### Requirement: Display normalized rows and stitch counts
The system SHALL display each parsed row with its row number, normalized step text, optional anchor/loop text, and computed stitch count, laid out so the row number and stitch count stay fixed-width while the step text wraps within the remaining space instead of overlapping or clipping.

#### Scenario: Row list rendering
- **WHEN** a crochet tool block contains multiple rows
- **THEN** the tool SHALL render one clickable row entry for each parsed row

#### Scenario: Repeat stitch count
- **WHEN** a row contains repeat syntax such as `[sc, inc] x 6`
- **THEN** the displayed stitch count SHALL reflect the expanded stitch output count

#### Scenario: Join slip stitch count
- **WHEN** a round row ends with a joining `sl st` after other units
- **THEN** the displayed stitch count SHALL exclude that join stitch

#### Scenario: Long row text wraps without overlapping the count
- **WHEN** a row's normalized step text is too long to fit on one line at the panel's current width
- **THEN** the step text SHALL wrap onto additional lines, growing the row's height, while the row number and stitch count remain in their own fixed-width columns and never overlap the wrapped text

## ADDED Requirements

### Requirement: Reset all progress with one control
The system SHALL provide a control that resets both the current round/row progress and the in-row stitch counter in a single action.

#### Scenario: Reset all button
- **WHEN** the user activates the "reset all" control in the stitch-counter area
- **THEN** the tool SHALL reset round/row progress to zero and the stitch counter to zero, the same as the existing bottom "Reset" control

### Requirement: Display pattern text in a readable, translated style
The system SHALL support a "readable" pattern-text style that renders each step using its full, localized stitch name and always shows a count, instead of raw shorthand — configurable globally and per chart.

#### Scenario: Readable stitch name
- **WHEN** the readable style is active and a step is a stitch
- **THEN** the tool SHALL render the stitch's full localized name immediately followed by its count, e.g. `短針6` instead of `6 sc`

#### Scenario: Readable anchor placement
- **WHEN** the readable style is active and a row has a round anchor (`in MR` / `in ch ring`)
- **THEN** the tool SHALL render the anchor's localized name first, wrapping the row's steps in parentheses after it, e.g. `魔術環(短針6)`

#### Scenario: Per-chart override
- **WHEN** a chart's frontmatter sets `readable: on` or `readable: off`
- **THEN** that chart SHALL use the specified style regardless of the global "Pattern text style" setting

#### Scenario: Color-change phrase
- **WHEN** a row contains a `color` step, in either the raw or readable style
- **THEN** the tool SHALL render it as a localized "change to `<color>`" phrase at that point in the row
