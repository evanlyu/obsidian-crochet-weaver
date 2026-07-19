## ADDED Requirements

### Requirement: Highlight the current position on an embedded chart
The system SHALL, for a `crochet` block embedding the progress tool (`tool: on`), highlight the current row and the current target stitch on the chart using a configurable color.

#### Scenario: Current row highlighted
- **WHEN** an embedded tool has a current row
- **THEN** every chart symbol belonging to that row SHALL receive a row-level highlight

#### Scenario: Target stitch highlighted more strongly
- **WHEN** an embedded tool has a current row and a current target stitch (the next stitch to be made)
- **THEN** the chart symbol(s) for that target unit SHALL receive a stronger highlight than the row-level highlight

#### Scenario: Grouped stitch highlighted as one unit
- **WHEN** the target unit is a group (e.g. `(dc, ch, dc)`)
- **THEN** every chart symbol belonging to that group SHALL receive the stronger highlight together

#### Scenario: No highlight once the pattern is complete
- **WHEN** the embedded tool's completed row count equals the total row count
- **THEN** the chart SHALL NOT show any highlight

#### Scenario: Highlight updates live
- **WHEN** the user interacts with the embedded tool's controls (stitch increment/decrement/reset, previous/complete/reset round, or clicking a row)
- **THEN** the chart's highlight SHALL update to match without requiring the note to be reopened

#### Scenario: No highlight outside the embedded tool case
- **WHEN** a `crochet` block does not embed the progress tool (no `tool: on`), or embeds the read-only pattern text instead
- **THEN** the chart SHALL NOT show any highlight

### Requirement: Resolve the chart marker color from settings
The system SHALL resolve the highlight color from a global `chartMarkerColor` setting.

#### Scenario: Global marker color applies
- **WHEN** a chart is highlighted
- **THEN** it SHALL use the `chartMarkerColor` global setting's color

#### Scenario: No frontmatter override
- **WHEN** a `crochet` block frontmatter contains a `chartMarkerColor`-like key
- **THEN** chart rendering SHALL ignore it and use the global setting, consistent with `showNextRoundMarker`/`nextRoundMarkerColor`
