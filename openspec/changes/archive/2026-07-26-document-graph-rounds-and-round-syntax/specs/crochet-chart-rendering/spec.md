## MODIFIED Requirements

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

## ADDED Requirements

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

#### Scenario: Plain round inherits its parents exactly
- **WHEN** a round has no shaping anywhere in it
- **THEN** each of its stitches SHALL sit at the angle of the stitch it is worked into, so consecutive plain rounds stack into straight radial columns

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
