## ADDED Requirements

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
The system SHALL persist the completed row/round count through the plugin settings data using an identity derived from frontmatter `id` or the source content.

#### Scenario: Explicit progress id
- **WHEN** a crochet tool pattern frontmatter includes a non-empty `id`
- **THEN** progress SHALL be stored and loaded using that id

#### Scenario: Automatic progress id
- **WHEN** a crochet tool pattern does not include a non-empty `id`
- **THEN** progress SHALL be stored and loaded using a hash derived from the block source

#### Scenario: Persisted progress ID safety
- **WHEN** a progress ID matches a built-in object property name or prototype key
- **THEN** the plugin SHALL safely store and load progress without corrupting the settings object or executing arbitrary code

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
