## MODIFIED Requirements

### Requirement: Resolve chart options from settings and frontmatter
The system SHALL apply global plugin settings as defaults and SHALL allow valid frontmatter values in a pattern to override those defaults.

#### Scenario: Valid frontmatter override
- **WHEN** a pattern frontmatter contains valid values for `rotation`, `spacing`, `scale`, `stroke`, or `highlight`
- **THEN** chart rendering SHALL use those values instead of the corresponding global setting

#### Scenario: Invalid frontmatter override
- **WHEN** a pattern frontmatter contains an invalid numeric, boolean, or rotation value
- **THEN** chart rendering SHALL fall back to the corresponding global setting

#### Scenario: Next round marker setting resolution
- **WHEN** a pattern frontmatter contains a `showNextRoundMarker` or `nextRoundMarkerColor` key
- **THEN** chart rendering SHALL ignore these frontmatter keys and resolve both options only from global settings

### Requirement: Render next-round first-stitch marker
The system SHALL render a next-round marker at the first stitch of the next round in concentric round charts when enabled, using a user-configurable color.

#### Scenario: Enabled marker for round charts
- **WHEN** `showNextRoundMarker` is enabled and the chart type is `round`
- **THEN** the chart SHALL render a marker at the first stitch of the next round

#### Scenario: Disabled marker omission
- **WHEN** `showNextRoundMarker` is disabled
- **THEN** the chart SHALL NOT render a next-round marker

#### Scenario: Flat or spiral chart marker omission
- **WHEN** the chart type is `flat` or `spiral`
- **THEN** the chart SHALL NOT render a next-round marker even if `showNextRoundMarker` is enabled

#### Scenario: Marker styling and classes
- **WHEN** a next-round marker is rendered
- **THEN** the marker SHALL use the chart-local `.crochet-weaver-next-round-marker` class and SHALL use the `nextRoundMarkerColor` global setting as its stroke color

#### Scenario: Marker color setting change
- **WHEN** the user changes the `nextRoundMarkerColor` setting in the plugin settings tab
- **THEN** subsequently rendered next-round markers SHALL use the newly selected color

#### Scenario: Malformed persisted marker color
- **WHEN** the persisted `nextRoundMarkerColor` value is not a valid 6-digit hex color string
- **THEN** the system SHALL normalize it to the default marker color
