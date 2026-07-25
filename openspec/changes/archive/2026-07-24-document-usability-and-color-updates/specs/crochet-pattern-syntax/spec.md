## ADDED Requirements

### Requirement: Parse yarn color-change steps
The system SHALL parse a `color` step — the keyword `color` (optionally followed by `:`), then a CSS color name or `#hex` code — as a step that sets the active yarn color for every following stitch, without itself producing a stitch node.

#### Scenario: Named color
- **WHEN** a step is written as `color white`
- **THEN** the parser SHALL create a color-change node with color `white` and no width (it does not count as a stitch)

#### Scenario: Hex color with optional colon
- **WHEN** a step is written as `color: #ff8800`
- **THEN** the parser SHALL create a color-change node with color `#ff8800`

#### Scenario: Mid-row color change
- **WHEN** a row is written as `8 sc, color white, 8 sc, color black, 8 sc`
- **THEN** the parser SHALL create stitch nodes for each `sc` run and color-change nodes at the two color-switch points, preserving step order

#### Scenario: Color word boundary
- **WHEN** the input contains `colorwhite` with no separating space or colon
- **THEN** the parser SHALL fail to parse it as a color-change step
