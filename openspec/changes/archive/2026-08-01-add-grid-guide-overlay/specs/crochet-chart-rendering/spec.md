## ADDED Requirements

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
