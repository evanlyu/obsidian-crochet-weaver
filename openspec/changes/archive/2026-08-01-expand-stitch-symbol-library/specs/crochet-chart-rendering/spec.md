## MODIFIED Requirements

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
