## MODIFIED Requirements

### Requirement: Display normalized rows and stitch counts
The system SHALL display each parsed row with its row number, normalized step text, optional anchor/loop text, and computed stitch count, laid out so the row number and stitch count stay fixed-width while the step text wraps within the remaining space instead of overlapping or clipping. The displayed count SHALL be the row's written-count weight — the same number structured count annotations are validated against — rather than the number of fabric stitches the graph produced.

#### Scenario: Row list rendering
- **WHEN** a crochet tool block contains multiple rows
- **THEN** the tool SHALL render one clickable row entry for each parsed row

#### Scenario: Repeat stitch count
- **WHEN** a row contains repeat syntax such as `[sc, inc] x 6`
- **THEN** the displayed stitch count SHALL reflect the expanded stitch output count

#### Scenario: Join slip stitch count
- **WHEN** a round row ends with a joining `sl st` after other units
- **THEN** the displayed stitch count SHALL exclude that join stitch

#### Scenario: Ordinary mid-round chains count toward the row total
- **WHEN** the progress tool displays a round written with 24 single crochets separated by ordinary `ch 1`, as `crochet-dev` R2 is
- **THEN** the row total SHALL display 48
- **AND** it SHALL NOT display 24 merely because only 24 single crochet graph stitches were produced

#### Scenario: Counted and non-counting beginning chains
- **WHEN** a row starts with `ch 3 (counts as dc)`
- **THEN** that beginning chain SHALL contribute 1 to the row total rather than 3
- **AND** a row starting with `ch 1 (does not count as a st)` SHALL have it contribute 0

#### Scenario: Instructions that are drawn but never counted
- **WHEN** a row contains closing joins, repositioning slip stitches, turns, explicit skips, picot embellishments, or chain-space graph nodes
- **THEN** those SHALL contribute 0 to the row total, except for any ordinary written chains inside them, which count as themselves

#### Scenario: Long row text wraps without overlapping the count
- **WHEN** a row's normalized step text is too long to fit on one line at the panel's current width
- **THEN** the step text SHALL wrap onto additional lines, growing the row's height, while the row number and stitch count remain in their own fixed-width columns and never overlap the wrapped text

### Requirement: Persist progress by pattern identity
The system SHALL persist the completed row/round count and the current row's in-progress stitch count through the plugin settings data using an identity derived from frontmatter `id` or the source content. A stored stitch count SHALL be read back against the row's current total, so a count saved before row totals moved to written-count weight is carried over rather than left pointing past the end of its row.

#### Scenario: Explicit progress id
- **WHEN** a crochet tool pattern frontmatter includes a non-empty `id`
- **THEN** progress SHALL be stored and loaded using that id

#### Scenario: Automatic progress id
- **WHEN** a crochet tool pattern does not include a non-empty `id`
- **THEN** progress SHALL be stored and loaded using a hash derived from the block source

#### Scenario: Persisted progress ID safety
- **WHEN** a progress ID matches a built-in object property name or prototype key
- **THEN** the plugin SHALL safely store and load progress and stitch progress without corrupting the settings object or executing arbitrary code

#### Scenario: Stitch progress survives reload
- **WHEN** a note containing a `crochet-tool` block (or an embedded `tool: on` panel) with a non-zero in-progress stitch count is closed and reopened
- **THEN** the stitch counter SHALL show the same count it had before closing

#### Scenario: A stitch count stored under the old row totals
- **WHEN** a pattern's stored in-progress stitch count is larger than the row's total, as can happen for a row whose total changed when mid-round chains began counting
- **THEN** the panel SHALL clamp the loaded count to that row's current total rather than showing a count past the end of the row
- **AND** it SHALL NOT discard the user's completed row count

### Requirement: Track stitch progress within the current row
The system SHALL display a stitch counter for the current (in-progress) row, letting the user increment or decrement it one pattern unit at a time (e.g., +2 for an inc), so they can track their position within a row and not just which rows are complete. A unit's weight SHALL be its written-count weight, so one written instruction advances the counter once, by what that instruction is worth.

#### Scenario: Counter shown for the current row
- **WHEN** the progress tool has a current row (completed row count is less than the total row count)
- **THEN** the tool SHALL display a stitch counter labeled with that row's number, showing the current stitch count out of that row's total stitch count

#### Scenario: Counter hidden when the pattern is fully complete
- **WHEN** the completed row count equals the total row count
- **THEN** the tool SHALL NOT display a stitch counter

#### Scenario: Increment one unit
- **WHEN** the user selects the increment control and the current stitch count is below the current row's total
- **THEN** the stored stitch count for that row SHALL increase by the unit's weight

#### Scenario: A motif instruction advances by its written weight
- **WHEN** the user advances the counter over `V2`, `V3`, or `5 dc in next ch-2 sp`
- **THEN** the counter SHALL advance once for that written instruction
- **AND** the increment SHALL equal that instruction's written-count weight

#### Scenario: Decrement one unit
- **WHEN** the user selects the decrement control and the current stitch count is above zero
- **THEN** the stored stitch count for that row SHALL decrease by the previous unit's weight

#### Scenario: Reset current row's stitch count
- **WHEN** the user selects the stitch-counter reset control
- **THEN** the stored stitch count for the current row SHALL become zero without changing the completed row count
