## ADDED Requirements

### Requirement: Track stitch progress within the current row
The system SHALL display a stitch counter for the current (in-progress) row, letting the user increment or decrement it one stitch at a time, so they can track their position within a row and not just which rows are complete.

#### Scenario: Counter shown for the current row
- **WHEN** the progress tool has a current row (completed row count is less than the total row count)
- **THEN** the tool SHALL display a stitch counter labeled with that row's number, showing the current stitch count out of that row's total stitch count

#### Scenario: Counter hidden when the pattern is fully complete
- **WHEN** the completed row count equals the total row count
- **THEN** the tool SHALL NOT display a stitch counter

#### Scenario: Increment one stitch
- **WHEN** the user selects the increment control and the current stitch count is below the current row's total
- **THEN** the stored stitch count for that row SHALL increase by one

#### Scenario: Decrement one stitch
- **WHEN** the user selects the decrement control and the current stitch count is above zero
- **THEN** the stored stitch count for that row SHALL decrease by one

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

## MODIFIED Requirements

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
