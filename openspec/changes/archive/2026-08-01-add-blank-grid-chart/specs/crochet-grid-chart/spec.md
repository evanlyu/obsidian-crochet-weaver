## ADDED Requirements

### Requirement: Render crochet-grid code blocks as SVG grids
The system SHALL register a `crochet-grid` Markdown code block processor that parses the block's flat `key: value` config, resolves grid options, and appends a blank drafting-grid SVG chart to the rendered block.

#### Scenario: Valid crochet-grid block
- **WHEN** Obsidian renders a `crochet-grid` code block with valid (or empty) config
- **THEN** the plugin SHALL append an SVG element with class `crochet-weaver-grid`

#### Scenario: Invalid crochet-grid block
- **WHEN** a `crochet-grid` code block's config contains a malformed line (not a `key: value` pair)
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Empty block uses all defaults
- **WHEN** a `crochet-grid` code block has no config lines
- **THEN** the plugin SHALL render a grid using the `gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, and `gridDefaultRows` global settings

### Requirement: Resolve grid options from settings and frontmatter
The system SHALL apply global grid-default settings and general chart-appearance settings as defaults, and SHALL allow valid per-block config values to override those defaults.

#### Scenario: Valid config override
- **WHEN** a `crochet-grid` block config contains valid values for `shape`, `rounds`, `columns`, `rows`, `scale`, `stroke`, or `spacing`
- **THEN** grid rendering SHALL use those values instead of the corresponding global setting

#### Scenario: Invalid config override
- **WHEN** a `crochet-grid` block config contains an invalid `shape` value, or a non-positive-integer `rounds`, `columns`, or `rows` value
- **THEN** grid rendering SHALL fall back to the corresponding global setting

#### Scenario: Shared appearance settings
- **WHEN** a `crochet-grid` block resolves `scale`, `stroke`, or `spacing`
- **THEN** it SHALL use the same `scale`, `strokeWidth`, and `ringSpacing` global settings and resolution precedence already used by `crochet` blocks

### Requirement: Render a polar drafting grid
The system SHALL, for `shape: polar`, render `rounds` concentric ring circles spaced by the resolved ring spacing and `columns` straight radial spokes evenly distributed by angle from the center to the outermost ring.

#### Scenario: Ring count matches rounds
- **WHEN** a polar grid resolves `rounds` to a positive integer N
- **THEN** the rendered SVG SHALL contain exactly N concentric ring circles

#### Scenario: Spoke count matches columns
- **WHEN** a polar grid resolves `columns` to a positive integer M
- **THEN** the rendered SVG SHALL contain exactly M radial spoke lines, evenly spaced by `360 / M` degrees

#### Scenario: Default shape
- **WHEN** a `crochet-grid` block config omits `shape` and the `gridDefaultShape` setting is `polar`
- **THEN** the block SHALL render a polar grid

### Requirement: Render a rectangular drafting grid
The system SHALL, for `shape: rect`, render a rectangular mesh of `rows` by `columns` equally sized cells using the resolved cell spacing.

#### Scenario: Mesh dimensions match rows and columns
- **WHEN** a rectangular grid resolves `rows` to R and `columns` to C
- **THEN** the rendered SVG SHALL contain a mesh of horizontal and vertical guide lines forming R by C cells

#### Scenario: Cell size follows spacing
- **WHEN** a rectangular grid resolves its cell spacing value
- **THEN** each mesh cell's width and height SHALL equal that resolved spacing value scaled by the resolved `scale`

### Requirement: Enforce grid safety limits
The system SHALL validate resolved `rounds`, `columns`, and `rows` against safety limits before rendering and render a controlled inline error for excessive values.

#### Scenario: Excessive rounds limit
- **WHEN** a polar grid's resolved `rounds` exceeds 40
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive columns limit
- **WHEN** a grid's resolved `columns` exceeds 72
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

#### Scenario: Excessive rows limit
- **WHEN** a rectangular grid's resolved `rows` exceeds 40
- **THEN** the plugin SHALL render an inline error box with class `crochet-weaver-error`

### Requirement: Localize grid settings and error text
The system SHALL localize all grid settings-tab text and grid error text through the resolved locale, matching the localization already used for `crochet` and `crochet-tool` blocks.

#### Scenario: Text localization
- **WHEN** the plugin renders the grid settings-tab controls or a grid error message
- **THEN** the text SHALL be localized according to the resolved language preference or Obsidian fallback locale

### Requirement: Insert a blank grid via command
The system SHALL provide a command that inserts a starter `crochet-grid` code block at the editor cursor, pre-filled with the resolved default shape, rounds, columns, and rows.

#### Scenario: Command inserts a template
- **WHEN** the user runs the "Insert blank crochet grid" command in an editor
- **THEN** the plugin SHALL insert a fenced `crochet-grid` code block at the cursor containing `shape`, `rounds`, `columns`, and `rows` lines set to the current `gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, and `gridDefaultRows` settings
