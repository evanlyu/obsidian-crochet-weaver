## MODIFIED Requirements

### Requirement: Render supported stitch symbols and visual markers
The system SHALL render supported stitch symbols through SVG definitions using `currentColor` and SHALL apply visual markers for configured accents and loop modifiers.

#### Scenario: Supported stitch symbol
- **WHEN** a layout item references a supported stitch symbol
- **THEN** rendering SHALL create a `<use>` element that references a chart-local symbol definition

#### Scenario: Every parseable stitch has a symbol definition
- **WHEN** any stitch name accepted by the pattern parser is laid out and rendered
- **THEN** the chart SHALL contain a symbol definition whose id the stitch's `<use>` element resolves to (no stitch may parse but render as an empty reference)

#### Scenario: Highlight increases and decreases
- **WHEN** `highlightIncDec` is enabled and a rendered item is `inc`, `dec`, or any N-together decrease (`sc2tog`, `sc3tog`, `hdc2tog`–`hdc5tog`, `dc2tog`–`dc5tog`)
- **THEN** that SVG item SHALL receive class `crochet-weaver-accent`

#### Scenario: Loop marker
- **WHEN** a row has `blo` or `flo`
- **THEN** rendered items from that row SHALL include the corresponding loop marker path
