## ADDED Requirements

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
- **WHEN** a pattern frontmatter contains a `showNextRoundMarker` key
- **THEN** chart rendering SHALL ignore this frontmatter key and resolve the option only from global settings

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
The system SHALL render a next-round marker at the first stitch of the next round in concentric round charts when enabled.

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
- **THEN** the marker SHALL use the chart-local `.crochet-weaver-next-round-marker` class and apply theme-aware currentColor or accent styling

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
