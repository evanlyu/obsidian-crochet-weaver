## MODIFIED Requirements

### Requirement: Persist progress by pattern identity
The system SHALL persist the completed row/round count and the current row's in-progress stitch count through the plugin settings data using a safe identity derived from frontmatter `id` or the source content. A stored stitch count SHALL be read back against the row's current total, so a count saved before row totals moved to written-count weight is carried over rather than left pointing past the end of its row.

#### Scenario: Safe explicit progress id
- **WHEN** a crochet tool pattern frontmatter includes an `id` made from 1–80 ASCII letters, digits, underscores, or hyphens and it is not a reserved built-in object-property name
- **THEN** progress SHALL be stored and loaded using that id

#### Scenario: Automatic progress id
- **WHEN** a crochet tool pattern omits `id` or supplies an empty, malformed, overlong, or reserved id
- **THEN** progress SHALL be stored and loaded using a hash derived from the block source

#### Scenario: Persisted progress ID safety
- **WHEN** persisted progress or stitch-progress data contains a malformed or reserved key
- **THEN** settings normalization SHALL discard that key rather than copy it into the normalized settings object
- **AND** the plugin SHALL not corrupt object prototypes or execute arbitrary code

#### Scenario: Stitch progress survives reload
- **WHEN** a note containing a `crochet-tool` block (or an embedded `tool: on` panel) with a non-zero in-progress stitch count is closed and reopened
- **THEN** the stitch counter SHALL show the same count it had before closing

#### Scenario: A stitch count stored under the old row totals
- **WHEN** a pattern's stored in-progress stitch count is larger than the row's total, as can happen for a row whose total changed when mid-round chains began counting
- **THEN** the panel SHALL clamp the loaded count to that row's current total rather than showing a count past the end of the row
- **AND** it SHALL NOT discard the user's completed row count
