## ADDED Requirements

### Requirement: Honor configured round spacing
The system SHALL treat a positive round spacing resolved from chart frontmatter or plugin settings as an exact radial interval for `type: round` charts in radial, Japanese, and continuous styles.

#### Scenario: Every configured interval is identical
- **WHEN** a chart resolves a positive round spacing of N pixels
- **THEN** every round after the first SHALL have a radius exactly N pixels greater than the preceding round
- **AND** stitch count, shaping density, seam contents, and marker alignment SHALL NOT increase that interval

#### Scenario: Ancestry remains exact at fixed spacing
- **WHEN** a graph-driven round is crowded at its configured radius
- **THEN** every valid parent-derived angle SHALL remain unchanged
- **AND** increase children SHALL remain balanced around their parent
- **AND** the layout SHALL NOT move those angles or grow the configured interval to obtain collision clearance

#### Scenario: Automatic spacing remains adaptive
- **WHEN** no positive round spacing is resolved
- **THEN** the layout MAY grow a crowded round to its smallest collision-safe radius
