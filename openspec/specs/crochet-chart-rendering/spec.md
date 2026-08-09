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
The system SHALL resolve every chart option from the block's own frontmatter where it sets one and from the global settings otherwise, and SHALL fall back to the global setting for a value it does not recognize.

#### Scenario: Valid frontmatter override
- **WHEN** a chart's frontmatter sets a recognized option
- **THEN** that value SHALL be used in place of the global setting

#### Scenario: Invalid frontmatter override
- **WHEN** a chart's frontmatter sets an option to a value the system does not recognize
- **THEN** the global setting SHALL be used instead

#### Scenario: Retired frontmatter key
- **WHEN** a chart's frontmatter sets a key the system no longer supports
- **THEN** it SHALL be ignored rather than reported as an error

#### Scenario: A chart drawn as one wedge of itself
- **WHEN** a chart's frontmatter sets `sector: 90`, or `sector: on`
- **THEN** the chart SHALL be worked out whole and drawn from the seam through that many degrees of itself, leaving the rest undrawn
- **AND** a motif that falls on the edge of the wedge SHALL be kept whole or left out whole, never drawn with some of its stitches missing
- **AND** the wedge SHALL be taken about the top of the chart, so it opens upward from the centre
- **AND** `wholeRounds: 4` SHALL draw the first four rounds entire and take the wedge only from the rounds after them
- **AND** what the chart draws at its centre SHALL be kept whatever wedge is asked for
- **AND** a chart that asks for no wedge SHALL be drawn entire, as before

#### Scenario: A chart says it is lace
- **WHEN** a chart's frontmatter sets `lace: on`
- **THEN** the chart SHALL be drawn the way a pattern book prints lace: no lines drawn around its rounds, no round numbers, and its symbols drawn larger than their ordinary size
- **AND** the round the numbers would have sat in SHALL not have room kept for them
- **AND** a run of chains SHALL be turned out of the chart rather than laid along its round, and SHALL ask the ring for one stitch's room however many chains it is made of
- **AND** the chain a round opens with SHALL be stacked across that round's band at its seam, standing for the stitch it replaces
- **AND** the round worked into the ring at the middle SHALL stand on that ring rather than on a circle of its own outside it
- **AND** what the chart is made of SHALL NOT change: the same stitches are drawn, in the same places, from the same pattern

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
The system SHALL lay out `type: round` charts as concentric rounds, and SHALL offer three drawing styles resolved from the `style` frontmatter key or the global round-chart-style setting: `radial`, `japanese`, and `continuous`. Graph-driven round styles SHALL support the bounded `crochet-dev` note grammar directly, including shell-fan motifs, chain spaces, implicit skips from typed-next searches, explicit low-level skips, counted beginning chains, non-counting beginning chains, explicit slip-stitch joins, repositioning, current-round turns, V aliases, picot targets, center-shell targets, structured count validation, and source-repeat-expanded rows without introducing a fourth chart style or a new chart presentation.

#### Scenario: Every round moves outward, even a decrease round
- **WHEN** a round chart contains a round whose stitch count is lower than the previous round's
- **THEN** that round SHALL still be placed at a larger radius than the previous round, never at a smaller radius that would overlap or nest inside an earlier round

#### Scenario: Magic ring anchor
- **WHEN** a round chart starts from a row anchored `in MR`
- **THEN** the chart SHALL include a center magic-ring anchor
- **AND** `style: japanese` SHALL print that anchor as the centered Japanese label `わ`
- **AND** other round styles SHALL retain the generic hollow-ring symbol

#### Scenario: Chain ring anchor
- **WHEN** a round chart starts from a row anchored `in ch ring`
- **THEN** the chart SHALL include a center ring made from chain symbols
- **AND** `style: japanese` SHALL preserve those chain symbols rather than replace them with a `ち` label

#### Scenario: Join slip stitch
- **WHEN** a round contains a trailing `sl st` after other units
- **THEN** the trailing slip stitch SHALL be rendered as a join between the last and first round positions and SHALL not increase the round stitch-count spacing

#### Scenario: Round style resolution
- **WHEN** a chart sets `style: japanese` or `style: continuous` in frontmatter, or neither and the global round-chart-style setting selects one
- **THEN** the chart SHALL be drawn in that style, and an unrecognized value SHALL fall back to the global setting

#### Scenario: Japanese style draws a continuous spiral guide
- **WHEN** a round chart is drawn in `japanese` style
- **THEN** one continuous guide SHALL wind through the rounds, stepping outward at each starting seam, with each round numbered at that seam

#### Scenario: Round numbers form a slight inward guide
- **WHEN** a numbered graph-driven round chart is drawn
- **THEN** the first stitch worked into the center ring SHALL remain at twelve o'clock independently of the first round number
- **AND** the first number SHALL target a -50 degree bearing
- **AND** each outer round number SHALL target another 0.5 degrees toward twelve o'clock, forming a subtle inward incline instead of either a rigid spoke or a spiralling column
- **AND** a large ordinary round SHALL align its number and round-change step without rigidly rotating its opening, closing instructions, or real stitch positions
- **AND** each target SHALL be accepted only when the entire path from the measured seam slot to that target remains clear of the round separator and every stitch or seam instruction actually drawn on that round
- **AND** the number SHALL stop at the first collision boundary, remaining on the opening side of the separator and before the closing join instead of crossing either to reach a later clear bearing
- **AND** this clearance rule SHALL depend on measured label and symbol geometry rather than on the written round number, including when a partial chart begins after R1

#### Scenario: Round-change step stays near radial
- **WHEN** the guide steps from one round's band out to the next
- **THEN** both ends of that step SHALL be anchored on the seam of the round it steps into, separated by a gap measured as a length of arc rather than as an angle, so the step reads as a near-radial jog at every radius instead of flattening into a slant on the outer rounds
- **AND** the two corners where it leaves one band and meets the next SHALL be drawn as curves, with the run between them left straight, so the step reads as one S rather than two right angles

#### Scenario: Lace does not create a fourth style
- **WHEN** a round chart contains chain spaces, implicit skips, turns, joins, beginning chains, or motifs worked into chain spaces
- **THEN** `style: japanese` and `style: continuous` SHALL use the same graph-driven lace geometry
- **AND** `style: radial` SHALL continue to spread written units evenly without ancestry alignment

#### Scenario: Straight non-lace round behavior is unchanged
- **WHEN** a graph-driven round contains no chain-space targets, no skip steps, no implicit skipped positions, no shell motifs, no turn change, and no chain run of one or more chains between anchors
- **THEN** it SHALL preserve the existing round layout behavior for ordinary stitches, shaping, seams, anchors, and round numbering

### Requirement: Size every chart from the symbols it draws
The system SHALL take every chart size from the symbols, motifs, curves, seam instructions, labels, and text the chart actually draws and from the pattern's own contents, never from a stitch count times an assumed per-stitch size.

#### Scenario: A round of tall stitches gets a longer ring
- **WHEN** two rounds have the same stitch count but one is written in a wider or taller stitch than the other
- **THEN** the round of wider stitches SHALL be drawn on a longer ring, and in neither round SHALL two neighbouring symbols be closer than their own widths

#### Scenario: The seam is sized by what it holds
- **WHEN** a round opens with more than one chain, closes with a join, or is numbered with more than one digit
- **THEN** the room reserved at its seam SHALL grow by what each of those is drawn at, so none of them is drawn over another
- **AND** a filled join dot SHALL retain a readable layout footprint outside its inked circle so nearby labels and linework remain distinct

#### Scenario: Flat charts follow their own symbols
- **WHEN** a flat chart contains stitches wider or taller than a single crochet
- **THEN** its stitch pitch and row height SHALL grow to hold them, uniformly across the chart so its rows still line up in columns and aligned background geometry still has columns to draw

#### Scenario: A chart that names a spacing gets that spacing
- **WHEN** a chart or the settings name a spacing, and a round has more stitches than the round below it
- **THEN** every round SHALL be stepped out by that spacing, so long as its own symbols fit on the ring that gives it
- **AND** no round SHALL be given room for a stitch pitch it does not draw: the ring SHALL be measured from the symbols themselves, never floored at an assumed per-stitch width
- **AND** the room a round would like between its stitches, over and above what its symbols need, SHALL never push it past the spacing it was given — only what will not otherwise go round the ring may do that

#### Scenario: Rounds sit as far apart as their stitches are tall
- **WHEN** a chart names no spacing of its own
- **THEN** each round SHALL be drawn as far from the round below it as that round's own stitches are tall, so a round of single crochets sits closer than a round of double trebles
- **AND** a chart or a setting that names a spacing SHALL be given that spacing instead

#### Scenario: A round sized by what it draws, not by what the drawing stands for
- **WHEN** a round's increases or decreases are drawn as the V or ∧ that stands for the stitches they make, rather than as those stitches
- **THEN** the ring SHALL be long enough for the marks it draws, not for the stitches they replace — a round of increases SHALL NOT be pushed out to a radius sized for twice the symbols it draws
- **AND** the same round drawn in a style that keeps every stitch's own symbol SHALL still be given a ring long enough for all of them

#### Scenario: Nothing is drawn over the center anchor
- **WHEN** a round or spiral chart is worked into a magic ring or a chain ring
- **THEN** the first stitches and the innermost guide line SHALL be placed outside what that anchor is drawn as, measured from it rather than from a fixed radius

#### Scenario: Lace motifs size the ring by motif slots
- **WHEN** a graph-driven round contains a grouped motif such as `9 dc in next ch-3 sp`
- **THEN** ring circumference SHALL reserve one motif slot sized from that fan rather than nine independent source-position slots

#### Scenario: Quantity-targeted motif renders as one fan slot
- **WHEN** a graph-driven round contains `3 dc in next ch-1 sp`, `5 dc in next ch-2 sp`, `7 dc in next ch-3 sp`, or `9 dc in next ch-3 sp`
- **THEN** the target SHALL apply to the whole quantity
- **AND** the renderer SHALL receive one shell-fan motif slot with N visible double crochet heads sharing one source

#### Scenario: Curved chain runs size the ring by their symbols
- **WHEN** a graph-driven round contains a chain-space run
- **THEN** ring circumference and seam reservation SHALL include the room needed by every chain symbol distributed along its curve

#### Scenario: Chain run at seam remains clear
- **WHEN** a chain-space run starts or ends near the round seam
- **THEN** the seam reservation SHALL keep its chain symbols, round number, opening instructions, closing join, and round-change guide from overlapping

#### Scenario: Counted beginning chain remains visible
- **WHEN** a round begins with `ch 3 (counts as dc)`
- **THEN** the seam SHALL draw three chain symbols
- **AND** the replacement double crochet SHALL occupy the first produced stitch position for targeting, written count validation, joining, and highlighting

### Requirement: Support spiral chart layout
The system SHALL lay out `type: spiral` charts as a continuous spiral path across all rows.

#### Scenario: Spiral progression
- **WHEN** a spiral chart contains multiple rows
- **THEN** rendered stitches SHALL continue along a single spiral instead of resetting to a new concentric round per row

### Requirement: Render supported stitch symbols and visual markers
The system SHALL render supported stitch symbols through SVG definitions using `currentColor`, SHALL orient round-chart symbols and their loop markers outward from the chart center, SHALL apply visual markers for configured accents and loop modifiers, and SHALL flag yarn color changes with a ring marker rather than recoloring the stitch symbols. Every stitch name the pattern parser accepts SHALL have a symbol definition to render.

#### Scenario: Supported stitch symbol
- **WHEN** a layout item references a supported stitch symbol
- **THEN** rendering SHALL create a `<use>` element that references a chart-local symbol definition

#### Scenario: Every parseable stitch has a symbol definition
- **WHEN** any stitch name accepted by the pattern parser is laid out and rendered
- **THEN** the chart SHALL contain a symbol definition whose id the stitch's `<use>` element resolves to (no stitch may parse but render as an empty reference)

#### Scenario: Round symbols face outward
- **WHEN** a stitch is placed on a round or spiral chart at angle `phi`
- **THEN** its symbol SHALL be rotated so its top points away from the chart center — the direction the next round is worked — with no configurable alternative

#### Scenario: Highlight increases and decreases
- **WHEN** `highlightIncDec` is enabled and a rendered item is `inc`, `dec`, or another accented shaping stitch, including every N-together decrease (`sc2tog`, `sc3tog`, `hdc2tog`–`hdc5tog`, `dc2tog`–`dc5tog`)
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
The system SHALL build a stitch graph from the pattern's own operations in which every produced stitch records the previous-round stitch or space it is worked into, every chain run records one targetable space graph node, every explicit skip and implicit skipped position records previous-round target positions consumed without producing into, every reposition records the phase it moves to without consumption, and every stitch or space records later stitches worked into it. The graph SHALL validate lace mapping before drawing.

#### Scenario: Increase and decrease ancestry
- **WHEN** a round contains an `inc` or a `dec`/N-together decrease
- **THEN** the increase's two stitches SHALL record the one stitch below they share, and the decrease's stitch SHALL record every stitch it closed over

#### Scenario: First round anchored to the center
- **WHEN** the first round of a round chart is built
- **THEN** each of its stitches SHALL record the center ring as its source rather than having no source

#### Scenario: Mapping problems reported as facts
- **WHEN** a pattern skips a stitch of the round below, works into one twice, works into nothing, or leaves a stitch that no later round picks up
- **THEN** validation SHALL report that as a typed issue before layout, instead of silently producing a chart

#### Scenario: Stitch worked into a chain space
- **WHEN** a stitch or group is written with `in next ch-1 sp`, `in next ch-2 sp`, `in next ch-3 sp`, or `in same ch-1 sp`
- **THEN** the graph SHALL attach the produced stitch or stitches to the requested chain-space source
- **AND** those stitches SHALL be positioned from that space in graph-driven layouts

#### Scenario: Chain-space target must exist
- **WHEN** a row names a chain-space target but the previous round has no matching chain space available in current traversal order
- **THEN** validation SHALL report a typed mapping issue before layout rather than placing the stitch evenly or guessing a source

#### Scenario: Center-shell target must exist
- **WHEN** a row names `in center dc of next 9-dc shell` but no matching next odd shell exists in traversal order
- **THEN** validation SHALL report a typed mapping issue before layout

#### Scenario: Picot target must exist
- **WHEN** a row names `in next picot` but no next picot exists in traversal order
- **THEN** validation SHALL report a typed mapping issue before layout

#### Scenario: Typed-next search consumes intervening targets as implicit skips
- **WHEN** a lace round searches for the next typed target between worked stitches or motifs
- **THEN** each intervening previous-round target position SHALL be consumed exactly once without producing a current-round stitch
- **AND** the selected target SHALL be consumed by the produced stitch or motif
- **AND** the round SHALL still be eligible for ancestry alignment if all previous-round target positions are accounted for exactly once

#### Scenario: Same-place siblings are not duplicate source errors
- **WHEN** contiguous output instructions share the current selected source through `same st` or `same ch-1 sp`
- **THEN** graph validation SHALL allow them as siblings in one same-place motif
- **AND** later unrelated reuse of that source SHALL still fail validation

### Requirement: Place round stitches from their ancestry
The system SHALL derive each stitch or shell motif of every graph-driven round from the stitch or chain space it is worked into and SHALL never reorder a round's written units or a motif's children. With automatic round spacing, every valid parent-derived angle SHALL remain a hard semantic constraint and the radius SHALL grow until the rendered contents fit. With explicit round spacing, the configured radial interval SHALL remain exact and parent-derived angles SHALL remain exact while symbols fit at their configured size; inherited collisions SHALL use deterministic minimum-displacement order-and-gap projection without changing that configured symbol size.

#### Scenario: Plain stitch follows its parent through shaping
- **WHEN** an ordinary stitch has one previous-round source, including in a round that also increases, decreases, or deliberately skips places
- **AND** the round's symbols fit at their configured size at its ancestry targets
- **THEN** that stitch SHALL keep exactly the angle of its source so its lineage remains radial
- **AND** seam fitting, radius fitting, separator placement, and round-number alignment SHALL NOT move it

#### Scenario: A stitch the next round shapes across keeps its angle
- **WHEN** the next round works an increase or a decrease into a stitch of this round
- **THEN** that stitch SHALL prefer the angle its ancestry gave it
- **AND** any readability projection SHALL keep the V or ∧ connected to its actual displayed parent and child endpoints

#### Scenario: Shaping stitches sit with the stitches they belong to
- **WHEN** a round contains increases or decreases
- **THEN** an increase's children SHALL use balanced angular offsets around the stitch below them
- **AND** a decrease SHALL sit at the seam-safe circular mean of the stitches it merged
- **AND** ordinary stitches elsewhere in the same round SHALL remain on their own parent angles unless measured readability requires the same bounded projection

#### Scenario: Seam-crossing shaping
- **WHEN** a decrease merges stitches that lie on opposite sides of the 0°/360° seam
- **THEN** its position SHALL be computed on the shortest arc between them, not by averaging raw angles, so it never lands on the opposite side of the chart

#### Scenario: Automatic radius satisfies all hard geometry
- **WHEN** no explicit round spacing is configured and parent-derived angles at the natural radius do not provide enough room for neighboring symbols, shaping, or the seam
- **THEN** the current round radius SHALL grow to the smallest feasible radius at which those same semantic angles satisfy every minimum clearance

#### Scenario: Explicit round spacing is exact
- **WHEN** a positive round spacing is resolved from chart frontmatter or plugin settings
- **THEN** every round after the first SHALL sit exactly that many pixels beyond the previous round
- **AND** symbol density, shaping, seam clearance, and round-number alignment SHALL NOT increase that interval
- **AND** collision-free ancestry-derived angles SHALL remain unchanged
- **AND** colliding targets SHALL receive deterministic minimum angular correction
- **AND** every real stitch symbol SHALL retain the size resolved from the user's symbol-size setting

#### Scenario: Working order is never traded away
- **WHEN** any radius or bounded invalid-mapping fallback is evaluated
- **THEN** the stitches SHALL remain in working order
- **AND** automatic spacing SHALL prevent neighboring symbol overlap
- **AND** explicit spacing SHALL prevent overlap through minimum-displacement projection without local per-round symbol scaling

#### Scenario: Deliberately skipped places retain ancestry
- **WHEN** a free-form round deliberately skips one or more previous-round places
- **THEN** every stitch that the round does work SHALL still be positioned from its recorded source
- **AND** the round SHALL NOT fall back to even spacing merely because its mapping is not bijective

#### Scenario: Contradictory mapping remains bounded
- **WHEN** graph validation reports a source order that cannot satisfy one turn at any bounded radius
- **THEN** the layout SHALL preserve working order and minimum clearance with a deterministic projection anchored to the first semantic target
- **AND** it SHALL NOT grow the chart without bound or silently replace all ancestry with even spacing

#### Scenario: The seam keeps room of its own
- **WHEN** a round of a graph-driven round chart is placed
- **THEN** the gap between its last stitch and its first SHALL be at least as wide as what is drawn at the seam needs — a slot each for the round's closing join, the step out to the next round, the round number, and the round's opening chain — so no stitch is drawn over any of them
- **AND** those SHALL be laid out in that order from the closing side of the round to the opening side, putting the round number between the step and the round's first stitch
- **AND** any extra inherited room SHALL remain available rather than being consumed solely for presentation alignment

#### Scenario: A numbered seam inherits its available angle
- **WHEN** a numbered round inherits a wider seam than its minimum
- **THEN** it SHALL retain the full inherited angular seam rather than narrowing it by moving stitches
- **AND** the round number, separator, and closing instructions SHALL move only within the available seam space
- **AND** the inherited seam MAY become physically wider at a larger radius because exact stitch correspondence takes priority over a fixed-width corridor

#### Scenario: Motif fans from its source
- **WHEN** a grouped motif is worked into one stitch or chain space
- **THEN** the motif's feet SHALL converge on that source
- **AND** the motif's stitch heads SHALL fan outward in written child order across the room reserved for that motif in the current round band

#### Scenario: Curved chain run stays in its own band
- **WHEN** a chain-space run is drawn
- **THEN** its individual chain symbols SHALL follow a curve connecting the two anchors within the current round's band, not the previous or next round's band

#### Scenario: Chain count is visible
- **WHEN** a chain-space run contains N chains
- **THEN** the chart SHALL draw N chain symbols along the run, without replacing them with only an arc or count label

#### Scenario: Leading turn reverses current round drawing direction
- **WHEN** R4 or a later joined round begins with `turn`
- **THEN** that current graph-driven round SHALL draw in the opposite direction from the previous round around the same center
- **AND** its next-target traversal SHALL run in the same reversed direction
- **AND** motif children SHALL preserve their written order within each motif

#### Scenario: Side alternates through crochet-dev rounds
- **WHEN** the original `crochet-dev` R1 through R22 are expanded
- **THEN** R1 SHALL default to RS
- **AND** absent `turn` SHALL preserve side and direction
- **AND** each leading current-round `turn` SHALL make R4 and later even rounds WS and R5 and later odd rounds RS through R22

#### Scenario: Join target sets next entry position
- **WHEN** a round closes with `sl st to top of beginning ch-3`, `sl st to first sc`, or `sl st to join`
- **THEN** `top of beginning ch-3` SHALL resolve to the counted beginning-chain replacement and `first sc` SHALL resolve to the first produced single crochet
- **AND** `to join` SHALL resolve to the counted beginning-chain replacement when present, otherwise to the first produced stitch or first child of the first motif after turn/reposition phase
- **AND** that resolved position SHALL be the entry/start position inherited by the next joined round

### Requirement: Draw shaping as a symbol of its own round
In `japanese` style the system SHALL draw an increase and a decrease as a mark belonging to its own round, in line with that round's plain stitches and inside that round's band, never as a mark floating in the gap between two rounds.

#### Scenario: Increase drawn as a balanced V
- **WHEN** a round contains an `inc`
- **THEN** a V SHALL be drawn with its point on the round's inner edge at the real parent position
- **AND** its two arms SHALL end at the real angular positions of the two child stitches
- **AND** those child positions SHALL be balanced around their parent so the V is isosceles while preserving child order

#### Scenario: Decrease drawn as a ∧
- **WHEN** a round contains a `dec` or an N-together decrease drawn as a shaping mark
- **THEN** a ∧ SHALL be drawn with its point at the produced stitch and its feet leaning toward every stitch it closed over

#### Scenario: A wide decrease stays legible
- **WHEN** a decrease inherits a very wide or one-sided set of source positions
- **THEN** its opening SHALL be compacted to the room of the source symbols and shifted under its point so it still reads as one ∧
- **AND** this compaction SHALL NOT be applied to an increase, whose balanced parent and child endpoints carry exact ancestry

### Requirement: Link stitches to the stitches they are worked into
In `continuous` style the system SHALL keep every stitch's own symbol and SHALL draw connector lines from lace motif stitches to the stitch or chain space they are worked into, with every endpoint landing on a real stitch or space position.

#### Scenario: Both stitches of an increase are drawn
- **WHEN** a round containing an `inc` is drawn in `continuous` style
- **THEN** two stitch symbols SHALL be rendered for that increase, each connected to the one stitch below they share

#### Scenario: Printed decrease symbol gains its connectors
- **WHEN** a round contains an `hdc2tog`/`dc2tog`-family decrease
- **THEN** its own printed symbol SHALL be kept and a connector SHALL be drawn to each stitch it closed over

#### Scenario: Continuous connectors from chain-space motif
- **WHEN** a grouped motif is worked into a chain space in `continuous` style
- **THEN** each drawn stitch in that motif SHALL connect to the chain-space source position rather than to an inferred stitch position

#### Scenario: Continuous connectors from counted beginning chain
- **WHEN** a later round works into the replacement stitch made by `ch 3 (counts as dc)`
- **THEN** the connector endpoint SHALL land on that replacement stitch's graph position

#### Scenario: Japanese style prints without extra connectors
- **WHEN** the same grouped motif is drawn in `japanese` style
- **THEN** it SHALL use the same fan geometry but SHALL NOT add the continuous-style connector overlay

### Requirement: Resolve the increase and decrease accent color from settings
The system SHALL resolve the accent color used for highlighted increases and decreases from a global `highlightColor` setting, normalizing an invalid persisted value to the default.

#### Scenario: Configured accent color is applied
- **WHEN** increase/decrease highlighting is on and `highlightColor` is set
- **THEN** the accented shaping marks and symbols SHALL be drawn in that color

#### Scenario: Invalid persisted color
- **WHEN** the persisted `highlightColor` is missing or not a valid hex color
- **THEN** settings normalization SHALL replace it with the default accent color

### Requirement: Render a background grid guide behind a chart's stitches
The system SHALL, when the resolved `grid` option is enabled for a `crochet` block, render a faint background guide layer behind the chart's stitch symbols, using the chart's own real layout geometry.

#### Scenario: Grid disabled by default
- **WHEN** a `crochet` block has no `grid` frontmatter key and the `showGrid` global setting is false
- **THEN** the chart SHALL render exactly as it does today, with no guide layer

#### Scenario: Grid enabled via frontmatter
- **WHEN** a `crochet` block frontmatter contains a truthy `grid` value (e.g. `grid: on`)
- **THEN** the chart SHALL render a background guide layer behind its stitch symbols, using class `crochet-weaver-grid-guide`

#### Scenario: Grid enabled via global setting
- **WHEN** the `showGrid` global setting is true and a `crochet` block frontmatter has no `grid` key
- **THEN** that block SHALL render the guide layer

#### Scenario: Invalid grid frontmatter falls back to the global setting
- **WHEN** a `crochet` block frontmatter contains an invalid boolean value for `grid`
- **THEN** the block SHALL fall back to the `showGrid` global setting

### Requirement: Align round and spiral guide rings to real round radii
The system SHALL, for `type: round` charts with the guide enabled, draw one guide ring per round at that round's real computed radius, and SHALL, for `type: spiral` charts, draw one guide ring per row at the radius the spiral reaches by the end of that row.

#### Scenario: Round chart guide ring matches real round radius
- **WHEN** a `type: round` chart with the guide enabled has N rounds
- **THEN** the rendered guide SHALL contain N ring circles, each at the same radius as that round's real stitch placements

#### Scenario: Spiral chart guide ring approximates the row boundary
- **WHEN** a `type: spiral` chart with the guide enabled has N rows
- **THEN** the rendered guide SHALL contain N ring circles, each at the spiral's radius at the end of the corresponding row

### Requirement: Extend round/spiral guide rings beyond the real pattern
The system SHALL allow a `rounds` frontmatter key on `type: round` or `type: spiral` charts to extend the guide's ring count beyond the chart's real round/row count, continuing to step outward by the resolved ring spacing, and SHALL never draw fewer guide rings than the chart's real round/row count.

#### Scenario: Rounds override extends the guide
- **WHEN** a round or spiral chart with the guide enabled has an actual round/row count of N and a `rounds` frontmatter value of M greater than N
- **THEN** the rendered guide SHALL contain M ring circles, with the extra M − N rings stepping outward from the last real ring by the resolved ring spacing

#### Scenario: Rounds override below the real count is ignored
- **WHEN** a round or spiral chart's `rounds` frontmatter value is less than its actual round/row count
- **THEN** the rendered guide SHALL still contain one ring per actual round/row, ignoring the smaller override

### Requirement: Align round and spiral guide spokes to the outer round's rendered unit count
The system SHALL, for `type: round` or `type: spiral` charts with the guide enabled, draw radial guide spokes from the center to the outermost guide ring, defaulting the spoke count to the last round's (or last row's) rendered unit count (one angular slot per rendered symbol — an `inc` is one slot even though it outputs 2 stitches), evenly spaced by angle.

#### Scenario: Default spoke count matches the outer round
- **WHEN** a round or spiral chart with the guide enabled has no `columns` frontmatter key
- **THEN** the rendered guide SHALL contain one spoke per rendered unit in the chart's last round/row

#### Scenario: Columns override sets an explicit spoke count
- **WHEN** a round or spiral chart's `columns` frontmatter value is a positive integer
- **THEN** the rendered guide SHALL contain that many evenly spaced spokes instead of the default

### Requirement: Render a row/column mesh guide for flat charts
The system SHALL, for `type: flat` charts with the guide enabled, render a rectangular mesh guide over the chart's real bounding box, using the chart's row height and stitch width as the cell size.

#### Scenario: Default mesh matches the real chart extent
- **WHEN** a `type: flat` chart with the guide enabled has no `rows` or `columns` frontmatter key
- **THEN** the rendered mesh SHALL have one row-guide per chart row and one column-guide sized to the widest row's rendered unit count

#### Scenario: Rows/columns override extends the mesh
- **WHEN** a `type: flat` chart's `rows` or `columns` frontmatter value is greater than its real row count or widest-row rendered unit count
- **THEN** the rendered mesh SHALL extend to that larger count, never to a count smaller than the chart's real extent

### Requirement: Enforce grid guide safety limits
The system SHALL validate a resolved grid-guide override (`rounds`/`rows` and `columns`) against safety limits before layout, only when the guide is enabled, and render a controlled inline error for excessive values.

#### Scenario: Excessive rounds/rows limit
- **WHEN** the guide is enabled and the resolved round/spiral `rounds` (or flat `rows`) override exceeds the grid guide's round/row limit
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error` instead of attempting layout

#### Scenario: Excessive columns limit
- **WHEN** the guide is enabled and the resolved `columns` override exceeds the grid guide's column limit
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error` instead of attempting layout

#### Scenario: Unused override is not validated
- **WHEN** the guide is disabled (`grid` is falsy)
- **THEN** an excessive `rounds`, `rows`, or `columns` value in frontmatter SHALL NOT be rejected, since it has no effect on rendering

### Requirement: Resolve the grid guide color from a fixed style
The system SHALL render the grid guide using a single global visual style (not a per-chart or per-setting configurable color), consistent across all charts that enable it.

#### Scenario: No frontmatter override for guide color
- **WHEN** a `crochet` block frontmatter contains a color-like key intended for the grid guide
- **THEN** chart rendering SHALL ignore it; the guide SHALL always use the fixed `crochet-weaver-grid-guide` style

### Requirement: Validate the crochet-dev chart contract
The system SHALL accept the original bounded note form of `crochet-dev` R1 through R22 and SHALL draw all chart-relevant notation without treating finishing notes as chart syntax.

#### Scenario: R1 through R3 validate strict written counts
- **WHEN** the original note form contains R1 `ch 3 (counts as dc)` plus 23 `dc`, R2 `ch 1 (does not count as a st)` plus 24 `sc` and 24 ordinary `ch 1`, and R3 reposition plus 3-dc shell fans
- **THEN** written count validation SHALL report R1 = 24, R2 = 48, and R3 = 48
- **AND** all joins, source targets, implicit skips, and spaces SHALL resolve without fallback placement

#### Scenario: R3 first shell is one fan across steps
- **WHEN** R3 begins `sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp`
- **THEN** rendering SHALL show the counted beginning-chain replacement and the two following double crochets as one 3-dc shell fan at the selected space
- **AND** graph validation SHALL treat the selected space as consumed once

#### Scenario: V2 and V3 spaces support later targets
- **WHEN** R4 through R22 contain `V2`, `V3`, and later motifs worked into their internal spaces
- **THEN** the chart SHALL draw the visible V spaces with exactly two or three chain symbols
- **AND** later targets SHALL attach to those spaces

#### Scenario: Required crochet-dev repeat counts
- **WHEN** R4/R6, R8, and R10/R12 are parsed from the original note form
- **THEN** each R4/R6 repeat SHALL have written count 7 from V2 4 plus surrounding ch1, sc, and ch1
- **AND** each R8 repeat SHALL have written count 9 from V2 4 plus ch2, sc, and ch2
- **AND** each R10/R12 repeat SHALL have written count 10 from V3 5 plus ch2, sc, and ch2

#### Scenario: Strict counts across expanded R1 through R22
- **WHEN** R13 repeats R11, R14 repeats R12, R15-R18 repeat R11-R14, and R19-R22 repeat R11-R14 from their source-repeat note forms
- **THEN** every expanded round SHALL keep its own row label and expected structured count
- **AND** strict written count validation SHALL run on the expanded rows before rendering

### Requirement: Keep the numbered center expansion upright and compact
The system SHALL treat the first stitch worked into a center ring as the fixed twelve-o'clock origin, SHALL keep the red numbered marker's side clearance as a minimum rather than an exact seam width, SHALL preserve every readable graph-driven ancestry target independent of round number or shaping mix, and SHALL keep final stitches wholly on the closing side of their round separators. Geometry-triggered readability correction SHALL remain bounded, ordered, and independent of any particular pattern.

#### Scenario: Compact first round
- **WHEN** a default-scale numbered round chart starts with a joined opening chain and six single crochets in a magic ring
- **THEN** the magic-ring symbol SHALL have a 5px radius
- **AND** its first produced stitch SHALL remain at a -90 degree bearing
- **AND** its center radius SHALL remain between 28px and 29px
- **AND** neither the magic ring, opening instructions, round number, nor first-round stitches SHALL overlap

#### Scenario: Any valid increase round remains balanced
- **WHEN** a numbered graph-driven round contains one or more increases
- **THEN** every increase's children SHALL remain centred on the stitch from which they are made
- **AND** every rendered V SHALL keep its exact parent and child endpoints
- **AND** its two arm lengths SHALL differ by less than 0.5px at default scale
- **AND** with automatic spacing, lack of space SHALL be solved by radius growth rather than seam compaction or asymmetric child movement
- **AND** with explicit spacing, the configured interval SHALL remain unchanged, any collision projection SHALL retain balanced V arms, and every stitch symbol SHALL retain the configured size

#### Scenario: Ordinary ancestry remains exact through arbitrary shaping
- **WHEN** an ordinary stitch appears before, between, or after shaping in a numbered graph-driven round
- **AND** its round remains readable at exact ancestry targets
- **THEN** it SHALL keep exactly the angle of its own source
- **AND** later ordinary rounds SHALL inherit that same radial lineage

#### Scenario: Final stitch and separator
- **WHEN** independently aligning a numbered marker would put a round's final stitch on the number side of its separator
- **THEN** the layout SHALL cap movement of the number, separator, and closing instructions to measured seam surplus
- **AND** the final symbol SHALL remain wholly on the closing side of the separator
- **AND** no real stitch SHALL move to make room for presentation geometry

#### Scenario: Closing seam packet
- **WHEN** a numbered seam contains closing instructions after its separator
- **THEN** those instructions SHALL move with the number and separator as one ordered packet
- **AND** the packet SHALL move no farther than the seam's surplus beyond its full promised arc

#### Scenario: Numbered marker clearance is a minimum
- **WHEN** a numbered seam has more room than the number and round-change marker require
- **THEN** the marker SHALL retain at least 10px of clearance on each side
- **AND** the layout SHALL keep any additional ancestry-derived room that remains
- **AND** that additional room SHALL NOT be interpreted as requiring the seam to collapse to exactly 10px

#### Scenario: Outer guide remains stable
- **WHEN** a numbered round aligns its marker column
- **THEN** the first number SHALL target -50 degrees and each outer number SHALL target an additional -0.5 degree incline
- **AND** a marker SHALL move continuously from its measured seam slot and stop before that target at the first point where continuing would cross the final symbol or any seam instruction
- **AND** separator safety, readable ancestry, and stitch clarity SHALL take priority over exact marker bearing
- **AND** retained angular seam room MAY become physically wider on later radii while the marker packet remains ordered inside it

### Requirement: Preserve exact one-to-one round ancestry
The system SHALL place graph-driven stitches from their recorded sources and SHALL preserve exact one-to-one parent angles whenever the resulting fixed-spacing round fits symbols at their configured size. Automatic spacing SHALL adjust radius rather than move valid ancestry targets. Explicit spacing SHALL keep the configured interval exact; if exact inherited targets would overlap at the configured symbol size, the system SHALL apply a deterministic minimum-displacement projection instead of resizing, hiding, or overlapping stitches.

#### Scenario: Every readable ordinary child stays over its parent
- **WHEN** a current ordinary stitch has exactly one previous-round source
- **AND** its round fits configured-size symbols at exact ancestry targets
- **THEN** it SHALL keep exactly the angle of that source
- **AND** seam fitting, radius fitting, and marker alignment SHALL NOT move it

#### Scenario: Marker cannot reach its preferred bearing
- **WHEN** placing a numbered separator at its preferred bearing would cross the final stitch
- **THEN** the marker, separator, and closing instructions SHALL stop at the farthest safe bearing within measured seam surplus
- **AND** no stitch SHALL move solely to make room for presentation geometry

#### Scenario: Non-bijective valid rounds preserve mapped ancestry
- **WHEN** a round increases, decreases, deliberately skips, or otherwise does not map one current stitch to one unique previous-round stitch
- **THEN** every valid recorded source relationship SHALL determine its preferred target angle
- **AND** automatic spacing SHALL solve collision clearance by radius growth without an even-spacing fallback
- **AND** explicit spacing SHALL preserve its exact interval and SHALL retain those targets unless configured-size symbols would overlap

#### Scenario: Colliding inherited centers receive minimum correction
- **WHEN** distinct fixed-spacing stitches inherit centers too close to draw at the configured symbol size
- **THEN** the system SHALL preserve written order and the first semantic target
- **AND** it SHALL minimize angular displacement from all preferred ancestry targets
- **AND** it SHALL retain every source relationship and every stitch
- **AND** it SHALL NOT assign a local render scale to the affected round

#### Scenario: Readability correction remains connected to earlier rounds
- **WHEN** minimum-displacement projection changes the displayed angles of a fixed-spacing round
- **THEN** the system SHALL reconcile those corrected angles inward through recorded graph relationships
- **AND** a one-to-one source SHALL move to its child's displayed angle
- **AND** an increase source SHALL remain at the angular midpoint of its displayed children
- **AND** multiple decrease sources SHALL retain their relative opening while their midpoint aligns with the displayed decrease target
- **AND** configured radii and stitch counts SHALL remain unchanged

### Requirement: Honor configured round spacing
The system SHALL treat a positive round spacing resolved from chart frontmatter or plugin settings as an exact radial interval for `type: round` charts in radial, Japanese, and continuous styles.

#### Scenario: Every configured interval is identical
- **WHEN** a chart resolves a positive round spacing of N pixels
- **THEN** every round after the first SHALL have a radius exactly N pixels greater than the preceding round
- **AND** stitch count, shaping density, seam contents, marker alignment, and readability correction SHALL NOT increase that interval

#### Scenario: Readable ancestry remains exact at fixed spacing
- **WHEN** a graph-driven round fits configured-size symbols at its configured radius and exact ancestry targets
- **THEN** every valid parent-derived angle SHALL remain unchanged
- **AND** increase children SHALL remain balanced around their parent
- **AND** every stitch symbol SHALL retain the configured size

#### Scenario: Near-coincident ancestry is corrected at fixed spacing
- **WHEN** exact graph-derived centers would overlap at the configured symbol size
- **THEN** the configured radial interval SHALL remain unchanged
- **AND** the layout SHALL apply deterministic order-and-clearance projection instead of symbol scaling
- **AND** projection SHALL be based on measured geometry rather than a specific round, count, or pattern phrase

#### Scenario: Automatic spacing remains adaptive
- **WHEN** no positive round spacing is resolved
- **THEN** the layout MAY grow a crowded round to its smallest collision-safe radius

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL prevent real stitch symbols in explicitly spaced round charts from visually overlapping, disappearing, or changing size from one round to another. It SHALL retain exact centers while configured-size symbols fit, SHALL use bounded minimum angular correction when inherited centers collide, and SHALL never change configured round radii, stitch counts, or the symbol size resolved from settings.

#### Scenario: Dense round retains configured symbol size
- **WHEN** two or more real stitch symbols in one fixed-spacing round would lack visual clearance at full size
- **THEN** the system SHALL apply deterministic angular clearance
- **AND** every real stitch symbol SHALL keep the size resolved from the user's symbol-size setting
- **AND** the system SHALL NOT assign a local per-round scale

#### Scenario: Inherited near-collision is separated without scaling
- **WHEN** exact inherited centers would overlap at the configured symbol size
- **THEN** the system SHALL restore working order and minimum gaps with deterministic minimum displacement
- **AND** the first semantic target SHALL remain anchored
- **AND** corrected angles SHALL reconcile inward so the projected stitches remain visually connected to their displayed parents or shaping endpoints
- **AND** later one-to-one rounds SHALL inherit the corrected displayed parent angles coherently

#### Scenario: Written non-neighbours are also checked
- **WHEN** free-form ancestry places two stitches close together even though they are not adjacent in the written item list
- **THEN** the same all-pairs clearance calculation SHALL include that pair

#### Scenario: Reported staged-increase chart keeps every stitch
- **WHEN** a Japanese fixed-spacing chart grows 6→12→18→24→28→32→36→40 stitches, continues with six 40-stitch rounds, and then decreases to 36
- **THEN** each 40-stitch round SHALL render all forty real stitch symbols with positive visual clearance
- **AND** every short-stitch symbol in every round SHALL retain the configured size
- **AND** the first 40-stitch round SHALL keep every stitch directly above its displayed parent stitch or increase-V endpoint
- **AND** the decrease round SHALL retain 32 ordinary symbols plus four decrease marks
- **AND** every increase mark SHALL remain a balanced V
