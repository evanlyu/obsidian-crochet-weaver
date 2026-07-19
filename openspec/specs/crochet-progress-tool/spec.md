# crochet-progress-tool Specification

## Purpose
TBD - created by archiving change document-current-crochet-behavior. Update Purpose after archive.
## Requirements
### Requirement: Render crochet tool blocks as progress panels
The system SHALL register a `crochet-tool` Markdown code block processor that renders a readable row list, progress summary, progress bar, and controls for a valid crochet pattern.

#### Scenario: Valid crochet tool block
- **WHEN** Obsidian renders a `crochet-tool` block with valid pattern syntax
- **THEN** the plugin SHALL append a progress panel with class `crochet-tool`

#### Scenario: Invalid crochet tool block
- **WHEN** Obsidian renders a `crochet-tool` block with invalid pattern syntax
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

### Requirement: Display normalized rows and stitch counts
The system SHALL display each parsed row with its row number, normalized step text, optional anchor/loop text, and computed stitch count.

#### Scenario: Row list rendering
- **WHEN** a crochet tool block contains multiple rows
- **THEN** the tool SHALL render one clickable row entry for each parsed row

#### Scenario: Repeat stitch count
- **WHEN** a row contains repeat syntax such as `[sc, inc] x 6`
- **THEN** the displayed stitch count SHALL reflect the expanded stitch output count

#### Scenario: Join slip stitch count
- **WHEN** a round row ends with a joining `sl st` after other units
- **THEN** the displayed stitch count SHALL exclude that join stitch

### Requirement: Persist progress by pattern identity
The system SHALL persist the completed row/round count and the current row's in-progress stitch count through the plugin settings data using an identity derived from frontmatter `id` or the source content.

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

### Requirement: Provide progress controls
The system SHALL allow users to advance, go back, reset, or jump to a row by interacting with the progress panel.

#### Scenario: Complete current row
- **WHEN** the user selects the complete-row control
- **THEN** the stored completed count SHALL increase by one without exceeding the total row count

#### Scenario: Go back one row
- **WHEN** the user selects the go-back control
- **THEN** the stored completed count SHALL decrease by one without going below zero

#### Scenario: Reset progress
- **WHEN** the user selects the reset control
- **THEN** the stored completed count SHALL become zero

#### Scenario: Jump to row
- **WHEN** the user selects a rendered row entry
- **THEN** the stored completed count SHALL become that row's one-based position

#### Scenario: Localized progress controls
- **WHEN** the progress panel renders controls
- **THEN** the control labels SHALL be localized according to the resolved language preference or Obsidian fallback locale

### Requirement: Show progress state in the panel
The system SHALL visually distinguish completed rows, the current row, and remaining rows based on the persisted completed count.

#### Scenario: Completed row styling
- **WHEN** a row number is less than or equal to the completed count
- **THEN** that row entry SHALL receive completed styling

#### Scenario: Current row styling
- **WHEN** a row number is exactly one greater than the completed count
- **THEN** that row entry SHALL receive current-row styling

#### Scenario: Progress summary text
- **WHEN** the tool renders progress for a flat pattern
- **THEN** the progress summary SHALL use the unit word for rows

#### Scenario: Round progress summary text
- **WHEN** the tool renders progress for a round or spiral pattern
- **THEN** the progress summary SHALL use the unit word for rounds

### Requirement: Track stitch progress within the current row
The system SHALL display a stitch counter for the current (in-progress) row, letting the user increment or decrement it one pattern unit at a time (e.g., +2 for an inc), so they can track their position within a row and not just which rows are complete.

#### Scenario: Counter shown for the current row
- **WHEN** the progress tool has a current row (completed row count is less than the total row count)
- **THEN** the tool SHALL display a stitch counter labeled with that row's number, showing the current stitch count out of that row's total stitch count

#### Scenario: Counter hidden when the pattern is fully complete
- **WHEN** the completed row count equals the total row count
- **THEN** the tool SHALL NOT display a stitch counter

#### Scenario: Increment one unit
- **WHEN** the user selects the increment control and the current stitch count is below the current row's total
- **THEN** the stored stitch count for that row SHALL increase by the unit's weight

#### Scenario: Decrement one unit
- **WHEN** the user selects the decrement control and the current stitch count is above zero
- **THEN** the stored stitch count for that row SHALL decrease by the previous unit's weight

#### Scenario: Reset current row's stitch count
- **WHEN** the user selects the stitch-counter reset control
- **THEN** the stored stitch count for the current row SHALL become zero without changing the completed row count

### Requirement: Auto-complete a row when its stitch count is reached
The system SHALL treat reaching a row's full stitch count via the increment control as completing that row.

#### Scenario: Increment reaches the row total
- **WHEN** the user selects the increment control and the resulting count would equal the current row's total stitch count
- **THEN** the completed row count SHALL increase by one and the stitch counter for the new current row SHALL reset to zero

### Requirement: Reset stitch progress when the current row changes
The system SHALL reset the stitch counter to zero whenever the current row changes through any control other than the stitch increment/decrement controls themselves.

#### Scenario: Completing a round resets the counter
- **WHEN** the user selects the complete-round control
- **THEN** the stitch counter for the new current row SHALL be zero

#### Scenario: Going back a round resets the counter
- **WHEN** the user selects the go-back control
- **THEN** the stitch counter for the new current row SHALL be zero

#### Scenario: Resetting overall progress resets the counter
- **WHEN** the user selects the overall progress reset control
- **THEN** the stitch counter for the new current row SHALL be zero

#### Scenario: Jumping to a row resets the counter
- **WHEN** the user selects a row entry to jump to it
- **THEN** the stitch counter for the new current row SHALL be zero

### Requirement: Report the current highlight target
The system SHALL let the progress tool report its current row and target-stitch position so a paired chart can be highlighted.

#### Scenario: Reports current row and target unit
- **WHEN** the tool has a current row
- **THEN** it SHALL report that row's index and the unit index corresponding to the current stitch-counter position

#### Scenario: Reports no target when complete
- **WHEN** the tool's completed row count equals the total row count
- **THEN** it SHALL report no highlight target

#### Scenario: Reports on every state change
- **WHEN** any control changes the tool's row or stitch progress
- **THEN** the tool SHALL report the updated highlight target immediately after repainting

