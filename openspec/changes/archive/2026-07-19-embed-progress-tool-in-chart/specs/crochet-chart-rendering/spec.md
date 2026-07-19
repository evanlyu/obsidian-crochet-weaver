## ADDED Requirements

### Requirement: Embed the progress tool alongside a chart
The system SHALL allow a `crochet` code block to render the progress tool next to its chart by reusing the block's own source, so the user does not need to duplicate the pattern into a separate `crochet-tool` block.

#### Scenario: Tool disabled by default
- **WHEN** a `crochet` block has no `tool` frontmatter key, or `tool` is not a truthy boolean value
- **THEN** the block SHALL render only the SVG chart, unchanged from prior behavior

#### Scenario: Tool enabled via frontmatter
- **WHEN** a `crochet` block frontmatter contains a truthy `tool` value (e.g. `tool: on`)
- **THEN** the block SHALL render both the SVG chart and a progress tool panel, both derived from the same block source

#### Scenario: Embedded tool shares pattern content
- **WHEN** the embedded progress tool is rendered
- **THEN** its rows, stitch counts, and controls SHALL reflect the same parsed pattern as the chart, with no separate copy of the pattern text required

#### Scenario: Embedded tool progress identity
- **WHEN** the embedded progress tool persists or loads progress
- **THEN** it SHALL use the same `id`-or-source-hash identity rule already used by standalone `crochet-tool` blocks

#### Scenario: Side-by-side layout
- **WHEN** both the chart and the embedded tool are rendered
- **THEN** they SHALL be laid out side by side when the container is wide enough, and SHALL wrap to a stacked layout when it is not

#### Scenario: Standalone tool block unaffected
- **WHEN** a `crochet-tool` code block is rendered on its own
- **THEN** its behavior SHALL be unchanged by the `tool` frontmatter key introduced for `crochet` blocks
