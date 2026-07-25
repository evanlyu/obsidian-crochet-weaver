## MODIFIED Requirements

### Requirement: Support flat chart layout
The system SHALL lay out `type: flat` charts as alternating flat rows with dynamic canvas bounds, and any reference geometry aligned to those rows (such as a background grid guide) SHALL be anchored to the real position of the rendered stitches rather than an assumed starting column.

#### Scenario: Multiple flat rows
- **WHEN** a flat chart contains multiple rows
- **THEN** odd and even rows SHALL alternate horizontal direction while remaining aligned to the previous row endpoint

#### Scenario: Group in flat row
- **WHEN** a flat row contains a grouped step
- **THEN** the grouped stitches SHALL render as a fan at the same row column

#### Scenario: Symmetric increase drifts the row bounds
- **WHEN** a flat pattern increases on both edges of a row (so alternating-direction rows drift left of where row 1 started)
- **THEN** layout SHALL track the real minimum and maximum stitch column across all rows so any aligned background geometry covers every rendered stitch

### Requirement: Render supported stitch symbols and visual markers
The system SHALL render supported stitch symbols through SVG definitions using `currentColor`, SHALL apply visual markers for configured accents and loop modifiers, and SHALL flag yarn color changes with a ring marker rather than recoloring the stitch symbols.

#### Scenario: Supported stitch symbol
- **WHEN** a layout item references a supported stitch symbol
- **THEN** rendering SHALL create a `<use>` element that references a chart-local symbol definition

#### Scenario: Highlight increases and decreases
- **WHEN** `highlightIncDec` is enabled and a rendered item is `inc` or `dec`
- **THEN** that SVG item SHALL receive class `crochet-weaver-accent`

#### Scenario: Loop marker
- **WHEN** a row has `blo` or `flo`
- **THEN** rendered items from that row SHALL include the corresponding loop marker path

#### Scenario: Stitch symbols stay theme-colored regardless of yarn color
- **WHEN** a stitch has an associated yarn color from a `color` step
- **THEN** its rendered symbol SHALL keep the chart's normal theme color, not the literal yarn color

#### Scenario: Color-change ring marker
- **WHEN** a rendered stitch is the first one worked in a new yarn color
- **THEN** rendering SHALL draw a hollow ring (`fill: none`, `stroke` set to that color) at that stitch's position, drawn before the stitch symbols so the symbol's own strokes stay visible on top

## ADDED Requirements

### Requirement: Scroll and pan oversized charts
The system SHALL render a chart or blank grid at its real configured size inside a bounded, scrollable viewport instead of shrinking it to fit its container, and SHALL support panning that viewport.

#### Scenario: Chart larger than its container
- **WHEN** a rendered chart's width or height exceeds the space available in its note pane
- **THEN** the chart SHALL render at full size inside a viewport capped at a maximum height, with scrolling enabled instead of the chart being visually shrunk

#### Scenario: Mouse drag panning
- **WHEN** a user presses and drags with the mouse inside an overflowing chart viewport
- **THEN** the viewport SHALL scroll to follow the drag

#### Scenario: Initial scroll position
- **WHEN** a chart viewport overflows on load
- **THEN** the viewport SHALL open scrolled to the horizontal and/or vertical center of the overflowing axis, instead of the top-left corner
