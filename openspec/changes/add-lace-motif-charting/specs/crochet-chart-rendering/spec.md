## MODIFIED Requirements

### Requirement: Support round chart layout
The system SHALL lay out `type: round` charts as concentric rounds, and SHALL offer three drawing styles resolved from the `style` frontmatter key or the global round-chart-style setting: `radial`, `japanese`, and `continuous`. Graph-driven round styles SHALL support the bounded `crochet-dev` note grammar directly, including shell-fan motifs, chain spaces, implicit skips from typed-next searches, explicit low-level skips, counted beginning chains, non-counting beginning chains, explicit slip-stitch joins, repositioning, current-round turns, V aliases, picot targets, center-shell targets, structured count validation, and source-repeat-expanded rows without introducing a fourth chart style or a new chart presentation.

#### Scenario: Lace does not create a fourth style
- **WHEN** a round chart contains chain spaces, implicit skips, turns, joins, beginning chains, or motifs worked into chain spaces
- **THEN** `style: japanese` and `style: continuous` SHALL use the same graph-driven lace geometry
- **AND** `style: radial` SHALL continue to spread written units evenly without ancestry alignment

#### Scenario: Straight non-lace round behavior is unchanged
- **WHEN** a graph-driven round contains no chain-space targets, no skip steps, no implicit skipped positions, no shell motifs, no turn change, and no chain run of one or more chains between anchors
- **THEN** it SHALL preserve the existing round layout behavior for ordinary stitches, shaping, seams, anchors, and round numbering

### Requirement: Size every chart from the symbols it draws
The system SHALL take every chart size from the symbols, motifs, curves, seam instructions, labels, and text the chart actually draws and from the pattern's own contents, never from a stitch count times an assumed per-stitch size.

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

### Requirement: Record each stitch's source and target stitches
The system SHALL build a stitch graph from the pattern's own operations in which every produced stitch records the previous-round stitch or space it is worked into, every chain run records one targetable space graph node, every explicit skip and implicit skipped position records previous-round target positions consumed without producing into, every reposition records the phase it moves to without consumption, and every stitch or space records later stitches worked into it. The graph SHALL validate lace mapping before drawing.

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
The system SHALL position each stitch or shell motif of a graph-driven round from the stitch or chain space it is worked into, SHALL never reorder a round's written units or a motif's children, and SHALL keep a minimum gap between neighboring rendered symbols, curved chain runs, and shell fans sized from what is actually drawn at that radius.

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

### Requirement: Link stitches to the stitches they are worked into
In `continuous` style the system SHALL keep every stitch's own symbol and SHALL draw connector lines from lace motif stitches to the stitch or chain space they are worked into, with every endpoint landing on a real stitch or space position.

#### Scenario: Continuous connectors from chain-space motif
- **WHEN** a grouped motif is worked into a chain space in `continuous` style
- **THEN** each drawn stitch in that motif SHALL connect to the chain-space source position rather than to an inferred stitch position

#### Scenario: Continuous connectors from counted beginning chain
- **WHEN** a later round works into the replacement stitch made by `ch 3 (counts as dc)`
- **THEN** the connector endpoint SHALL land on that replacement stitch's graph position

#### Scenario: Japanese style prints without extra connectors
- **WHEN** the same grouped motif is drawn in `japanese` style
- **THEN** it SHALL use the same fan geometry but SHALL NOT add the continuous-style connector overlay

### Requirement: Validate the crochet-dev chart contract
The system SHALL accept the original bounded note form of `crochet-dev` R1 through R22 and SHALL draw all chart-relevant notation without treating finishing notes as chart syntax.

#### Scenario: R1 through R3 validate strict written counts
- **WHEN** the original note form contains R1 `ch 3 (counts as dc)` plus 23 `dc`, R2 `ch 1 (does not count as a st)` plus 24 `sc` and 24 ordinary `ch 1`, and R3 reposition plus 3-dc shell fans
- **THEN** written count validation SHALL report R1 = 24, R2 = 48, and R3 = 48
- **AND** all joins, source targets, implicit skips, and spaces SHALL resolve without fallback placement

#### Scenario: R3 first shell is one fan across steps
- **WHEN** R3 begins `sl st into next ch-1 sp, ch 3 (counts as dc), 2 dc in same ch-1 sp`
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
