# crochet-chart-rendering Specification

## Purpose
TBD - created by archiving change document-current-crochet-behavior. Update Purpose after archive.
## Requirements
### Requirement: Render crochet code blocks as SVG charts
The system SHALL register a `crochet` Markdown code block processor that parses the block source, calculates a layout, and appends an SVG chart to the rendered block.

#### Scenario: Valid crochet block
- **WHEN** Obsidian renders a `crochet` code block with valid pattern syntax
- **THEN** the plugin SHALL append an SVG element with class `crochet-weaver-chart`

#### Scenario: Invalid crochet block
- **WHEN** Obsidian renders a `crochet` code block with invalid pattern syntax
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

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

### Requirement: Support flat chart layout
The system SHALL lay out `type: flat` charts as alternating flat rows with dynamic canvas bounds.

#### Scenario: Multiple flat rows
- **WHEN** a flat chart contains multiple rows
- **THEN** odd and even rows SHALL alternate horizontal direction while remaining aligned to the previous row endpoint

#### Scenario: Group in flat row
- **WHEN** a flat row contains a grouped step
- **THEN** the grouped stitches SHALL render as a fan at the same row column

### Requirement: Support round chart layout
The system SHALL lay out `type: round` charts as concentric rounds with stitch symbols distributed around each round.

#### Scenario: Magic ring anchor
- **WHEN** a round chart starts from a row anchored `in MR`
- **THEN** the chart SHALL include a center magic-ring symbol

#### Scenario: Chain ring anchor
- **WHEN** a round chart starts from a row anchored `in ch ring`
- **THEN** the chart SHALL include a center ring made from chain symbols

#### Scenario: Join slip stitch
- **WHEN** a round contains a trailing `sl st` after other units
- **THEN** the trailing slip stitch SHALL be rendered as a join between the last and first round positions and SHALL not increase the round stitch-count spacing

### Requirement: Support spiral chart layout
The system SHALL lay out `type: spiral` charts as a continuous spiral path across all rows.

#### Scenario: Spiral progression
- **WHEN** a spiral chart contains multiple rows
- **THEN** rendered stitches SHALL continue along a single spiral instead of resetting to a new concentric round per row

### Requirement: Render supported stitch symbols and visual markers
The system SHALL render supported stitch symbols through SVG definitions using `currentColor` and SHALL apply visual markers for configured accents and loop modifiers.

#### Scenario: Supported stitch symbol
- **WHEN** a layout item references a supported stitch symbol
- **THEN** rendering SHALL create a `<use>` element that references a chart-local symbol definition

#### Scenario: Highlight increases and decreases
- **WHEN** `highlightIncDec` is enabled and a rendered item is `inc` or `dec`
- **THEN** that SVG item SHALL receive class `crochet-weaver-accent`

#### Scenario: Loop marker
- **WHEN** a row has `blo` or `flo`
- **THEN** rendered items from that row SHALL include the corresponding loop marker path

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

### Requirement: Normalize persisted settings
The system SHALL normalize malformed or invalid persisted settings to defaults or safe values during initialization.

#### Scenario: Malformed settings normalization
- **WHEN** the persisted settings contain invalid or malformed values
- **THEN** the plugin SHALL normalize them to default or safe values during initialization

### Requirement: Enforce chart safety limits
The system SHALL validate parsed charts against safety limits before layout expansion and render controlled inline errors for excessive rows, quantities, repeats, nesting, or render items.

#### Scenario: Excessive rows limit
- **WHEN** a pattern contains more than 200 rows
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive stitch quantity limit
- **WHEN** a pattern contains a stitch quantity greater than 1000
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive repeat count limit
- **WHEN** a pattern contains a repeat count greater than 500
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive nesting depth limit
- **WHEN** a pattern contains a nesting depth greater than 8
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive total rendered stitches limit
- **WHEN** a pattern expands to more than 5000 total rendered stitches
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

### Requirement: Localize chart, settings, and error text
The system SHALL localize all chart, settings, and error text through the resolved locale.

#### Scenario: Text localization
- **WHEN** the plugin renders chart labels, settings tab text, or error messages
- **THEN** the text SHALL be localized according to the resolved language preference or Obsidian fallback locale

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

