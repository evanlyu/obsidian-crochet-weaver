## ADDED Requirements

### Requirement: Embed read-only pattern text alongside a chart
The system SHALL allow a `crochet` code block to render a read-only shorthand listing of its rows next to its chart by reusing the block's own source, with no progress tracking UI or persisted state.

#### Scenario: Text panel enabled
- **WHEN** the resolved `text` option is true and the resolved `tool` option is false for a `crochet` block
- **THEN** the block SHALL render the SVG chart next to a read-only panel listing each row's label, normalized shorthand steps, and stitch count

#### Scenario: Text panel has no progress UI
- **WHEN** the pattern-text panel is rendered
- **THEN** it SHALL NOT include a progress bar, done/current row styling, clickable controls, or persisted progress state

#### Scenario: Tool takes precedence over text
- **WHEN** the resolved `tool` option is true for a `crochet` block, regardless of the resolved `text` option
- **THEN** the block SHALL render the interactive progress tool and SHALL NOT additionally render the read-only pattern-text panel

### Requirement: Resolve embedded panel options from settings and frontmatter
The system SHALL resolve whether to embed the progress tool, whether to embed read-only pattern text, and where to position an embedded panel, using global settings as defaults and per-chart frontmatter as overrides.

#### Scenario: Global defaults apply without frontmatter overrides
- **WHEN** a `crochet` block frontmatter contains no `tool`, `text`, or `position` key
- **THEN** the block SHALL use the `showTool`, `showPatternText`, and `panelPosition` global settings respectively

#### Scenario: Frontmatter overrides global panel defaults
- **WHEN** a `crochet` block frontmatter contains a valid `tool`, `text`, and/or `position` value
- **THEN** the block SHALL use those frontmatter values instead of the corresponding global setting

#### Scenario: Invalid frontmatter falls back to global settings
- **WHEN** a `crochet` block frontmatter contains an invalid `tool`, `text`, or `position` value
- **THEN** the block SHALL fall back to the corresponding global setting

#### Scenario: Panel position layout
- **WHEN** a chart renders with an embedded tool or text panel
- **THEN** a `position` of `right` SHALL place the panel after the chart in reading order, `left` SHALL place the panel before the chart, and `below` SHALL stack the panel under the chart, each wrapping/stacking further on narrow widths as needed
