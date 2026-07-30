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
The system SHALL apply global plugin settings as defaults and SHALL allow valid frontmatter values in a pattern to override those defaults. Unsupported frontmatter keys SHALL be ignored rather than treated as errors.

#### Scenario: Valid frontmatter override
- **WHEN** a pattern frontmatter contains valid values for `spacing`, `scale`, `stroke`, `highlight`, or `style`
- **THEN** chart rendering SHALL use those values instead of the corresponding global setting

#### Scenario: Invalid frontmatter override
- **WHEN** a pattern frontmatter contains an invalid numeric, boolean, or style value
- **THEN** chart rendering SHALL fall back to the corresponding global setting

#### Scenario: Retired frontmatter key
- **WHEN** a pattern frontmatter contains a `rotation` key
- **THEN** chart rendering SHALL ignore it and render the chart normally, since symbol rotation is no longer configurable

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

### Requirement: Support round chart layout
The system SHALL lay out `type: round` charts as concentric rounds, and SHALL offer three drawing styles resolved from the `style` frontmatter key or the global round-chart-style setting: `standard` (each round's stitches spread evenly, stock `inc`/`dec` glyphs), `book` (Japanese-pattern-book styling), and `linked` (book layout with each stitch's correspondence drawn as a connector).

#### Scenario: Every round moves outward, even a decrease round
- **WHEN** a round chart contains a round whose stitch count is lower than the previous round's
- **THEN** that round SHALL still be placed at a larger radius than the previous round, never at a smaller radius that would overlap or nest inside an earlier round

#### Scenario: Magic ring anchor
- **WHEN** a round chart starts from a row anchored `in MR`
- **THEN** the chart SHALL include a center magic-ring symbol

#### Scenario: Chain ring anchor
- **WHEN** a round chart starts from a row anchored `in ch ring`
- **THEN** the chart SHALL include a center ring made from chain symbols

#### Scenario: Join slip stitch
- **WHEN** a round contains a trailing `sl st` after other units
- **THEN** the trailing slip stitch SHALL be rendered as a join between the last and first round positions and SHALL not increase the round stitch-count spacing

#### Scenario: Round style resolution
- **WHEN** a chart sets `style: book` or `style: linked` in frontmatter, or neither and the global round-chart-style setting selects one
- **THEN** the chart SHALL be drawn in that style, and an unrecognized value SHALL fall back to the global setting

#### Scenario: Book style draws a continuous spiral guide
- **WHEN** a round chart is drawn in `book` style
- **THEN** one continuous guide SHALL wind through the rounds, stepping outward at each starting seam, with each round numbered at that seam

#### Scenario: Round-change step stays near radial
- **WHEN** the guide steps from one round's band out to the next
- **THEN** both ends of that step SHALL be anchored on the seam of the round it steps into, separated by a gap measured as a length of arc rather than as an angle, so the step reads as a near-radial jog at every radius instead of flattening into a slant on the outer rounds

### Requirement: Support spiral chart layout
The system SHALL lay out `type: spiral` charts as a continuous spiral path across all rows.

#### Scenario: Spiral progression
- **WHEN** a spiral chart contains multiple rows
- **THEN** rendered stitches SHALL continue along a single spiral instead of resetting to a new concentric round per row

### Requirement: Render supported stitch symbols and visual markers
The system SHALL render supported stitch symbols through SVG definitions using `currentColor`, SHALL orient round-chart symbols and their loop markers outward from the chart center, SHALL apply visual markers for configured accents and loop modifiers, and SHALL flag yarn color changes with a ring marker rather than recoloring the stitch symbols.

#### Scenario: Supported stitch symbol
- **WHEN** a layout item references a supported stitch symbol
- **THEN** rendering SHALL create a `<use>` element that references a chart-local symbol definition

#### Scenario: Round symbols face outward
- **WHEN** a stitch is placed on a round or spiral chart at angle `phi`
- **THEN** its symbol SHALL be rotated so its top points away from the chart center — the direction the next round is worked — with no configurable alternative

#### Scenario: Highlight increases and decreases
- **WHEN** `highlightIncDec` is enabled and a rendered item is `inc`, `dec`, or another accented shaping stitch
- **THEN** that SVG item SHALL receive class `crochet-weaver-accent`, and where the shaping is drawn as a mark of its own round the mark itself SHALL receive it

#### Scenario: Loop marker
- **WHEN** a row has `blo` or `flo`
- **THEN** rendered items from that row SHALL include the corresponding loop marker path, rotated with the stitch so the loop bar sits on the side of the stitch the loop is actually on

#### Scenario: Stitch symbols stay theme-colored regardless of yarn color
- **WHEN** a stitch has an associated yarn color from a `color` step
- **THEN** its rendered symbol SHALL keep the chart's normal theme color, not the literal yarn color

#### Scenario: Color-change ring marker
- **WHEN** a rendered stitch is the first one worked in a new yarn color
- **THEN** rendering SHALL draw a hollow ring (`fill: none`, `stroke` set to that color) at that stitch's position, drawn before the stitch symbols so the symbol's own strokes stay visible on top

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

#### Scenario: Loop marker highlighted together with its stitch
- **WHEN** a highlighted stitch (current row or current target) has a `blo` or `flo` loop marker
- **THEN** that loop marker SHALL receive the same row- or stitch-level highlight class and the same `chartMarkerColor` as its stitch symbol, so the two read as one highlighted unit

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
- **THEN** chart rendering SHALL ignore it and use the global setting

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

### Requirement: Record each stitch's source and target stitches
The system SHALL build a stitch graph from the pattern's own operations in which every stitch records the previous-round stitch or stitches it is worked into and the next-round stitches worked into it, and SHALL validate that graph before drawing.

#### Scenario: Increase and decrease ancestry
- **WHEN** a round contains an `inc` or a `dec`/N-together decrease
- **THEN** the increase's two stitches SHALL record the one stitch below they share, and the decrease's stitch SHALL record every stitch it closed over

#### Scenario: First round anchored to the center
- **WHEN** the first round of a round chart is built
- **THEN** each of its stitches SHALL record the center ring as its source rather than having no source

#### Scenario: Mapping problems reported as facts
- **WHEN** a pattern skips a stitch of the round below, works into one twice, works into nothing, or leaves a stitch that no later round picks up
- **THEN** validation SHALL report that as a typed issue before layout, instead of silently producing a chart

### Requirement: Place round stitches from their ancestry
The system SHALL position each stitch of a round from the stitch or stitches it is worked into rather than by spreading the round evenly, SHALL never reorder a round's stitches, and SHALL keep a minimum gap between neighboring symbols sized from what is actually drawn at that radius.

#### Scenario: Plain round follows its parents, closing up what they left
- **WHEN** a round has no shaping anywhere in it
- **THEN** each of its stitches SHALL sit at the angle of the stitch it is worked into, give or take the fraction of a stitch it may drift to even out crowding inherited from shaping below, so consecutive plain rounds stack into columns that lean toward even spacing rather than carrying that crowding outward unchanged

#### Scenario: A stitch the next round shapes across keeps its angle
- **WHEN** the next round works an increase or a decrease into a stitch of this round
- **THEN** that stitch SHALL keep the angle its ancestry gave it and SHALL not be moved by any evening-out pass, since the V or ∧ drawn there is aimed at where it sits

#### Scenario: Shaping stitches sit with the stitches they belong to
- **WHEN** a round contains increases or decreases
- **THEN** an increase's two stitches SHALL straddle the stitch below them and a decrease SHALL sit between the stitches it merged, with the remaining slack shared among the plain stitches near the shaping

#### Scenario: Seam-crossing shaping
- **WHEN** a decrease merges stitches that lie on opposite sides of the 0°/360° seam
- **THEN** its position SHALL be computed on the shortest arc between them, not by averaging raw angles, so it never lands on the opposite side of the chart

#### Scenario: Working order is never traded away
- **WHEN** any spacing or relaxation pass adjusts a round
- **THEN** the stitches SHALL remain in working order and no symbol SHALL overlap its neighbor

#### Scenario: Round that cannot inherit an alignment
- **WHEN** a round does not work into the round below exactly once for each of its stitches
- **THEN** that round SHALL fall back to even spacing while still recording its real mapping

#### Scenario: The seam keeps room of its own
- **WHEN** a round of a graph-driven round chart is spaced
- **THEN** the gap between its last stitch and its first SHALL be at least as wide as what is drawn at the seam needs — a slot each for the round's closing join, the step out to the next round, the round number, and the round's opening chain — so no stitch is drawn over any of them
- **AND** those SHALL be laid out in that order from the closing side of the round to the opening side, putting the round number between the step and the round's first stitch
- **AND** where the round leaves more room than the seam asked for, the extra SHALL sit either side of the seam's contents rather than to one side of them

### Requirement: Draw shaping as a symbol of its own round
In `book` style the system SHALL draw an increase and a decrease as a mark belonging to its own round, in line with that round's plain stitches and inside that round's band, never as a mark floating in the gap between two rounds.

#### Scenario: Increase drawn as a V
- **WHEN** a round contains an `inc`
- **THEN** a V SHALL be drawn with its point on the round's inner edge, in line with the stitch it is worked into, and its two arms reaching the round's outer edge where the next round works into the two stitches it makes

#### Scenario: Decrease drawn as a ∧
- **WHEN** a round contains a `dec` or an N-together decrease drawn as a shaping mark
- **THEN** a ∧ SHALL be drawn with a foot on each stitch it closed over and its point standing above them

#### Scenario: Mark stays legible on a large round
- **WHEN** the stitches a mark spans are far apart on a large round
- **THEN** the mark SHALL still lean toward both of them but SHALL be capped in width so it reads as a V or ∧ rather than stretching into two long lines

### Requirement: Link stitches to the stitches they are worked into
In `linked` style the system SHALL keep every stitch's own symbol — including both stitches an increase makes — and SHALL draw a connector from a shaping stitch to each stitch below it is worked into, with every endpoint landing on a real stitch position.

#### Scenario: Both stitches of an increase are drawn
- **WHEN** a round containing an `inc` is drawn in `linked` style
- **THEN** two stitch symbols SHALL be rendered for that increase, each connected to the one stitch below they share

#### Scenario: Printed decrease symbol gains its connectors
- **WHEN** a round contains an `hdc2tog`/`dc2tog`-family decrease
- **THEN** its own printed symbol SHALL be kept and a connector SHALL be drawn to each stitch it closed over

### Requirement: Resolve the increase and decrease accent color from settings
The system SHALL resolve the accent color used for highlighted increases and decreases from a global `highlightColor` setting, normalizing an invalid persisted value to the default.

#### Scenario: Configured accent color is applied
- **WHEN** increase/decrease highlighting is on and `highlightColor` is set
- **THEN** the accented shaping marks and symbols SHALL be drawn in that color

#### Scenario: Invalid persisted color
- **WHEN** the persisted `highlightColor` is missing or not a valid hex color
- **THEN** settings normalization SHALL replace it with the default accent color

