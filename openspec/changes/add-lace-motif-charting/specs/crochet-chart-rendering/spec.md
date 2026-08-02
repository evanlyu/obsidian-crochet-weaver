## MODIFIED Requirements

### Requirement: Support round chart layout
The system SHALL lay out `type: round` charts as concentric rounds, and SHALL offer three drawing styles resolved from the `style` frontmatter key or the global round-chart-style setting: `radial`, `japanese`, and `continuous`. Graph-driven round styles SHALL support the bounded `crochet-dev` note grammar directly, including shell-fan motifs, chain spaces, implicit skips from typed-next searches, explicit low-level skips, counted beginning chains, non-counting beginning chains, explicit slip-stitch joins, repositioning, current-round turns, V aliases, picot targets, center-shell targets, structured count validation, and source-repeat-expanded rows without introducing a fourth chart style or a new chart presentation.

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
- **WHEN** a chart sets `style: japanese` or `style: continuous` in frontmatter, or neither and the global round-chart-style setting selects one
- **THEN** the chart SHALL be drawn in that style, and an unrecognized value SHALL fall back to the global setting

#### Scenario: Book style draws a continuous spiral guide
- **WHEN** a round chart is drawn in `japanese` style
- **THEN** one continuous guide SHALL wind through the rounds, stepping outward at each starting seam, with each round numbered at that seam

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
The system SHALL position each stitch or shell motif of a graph-driven round from the stitch or chain space it is worked into, SHALL never reorder a round's written units or a motif's children, and SHALL keep a minimum gap between neighboring rendered symbols, curved chain runs, and shell fans sized from what is actually drawn at that radius.

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

#### Scenario: The seam stays one width, however far out the round is
- **WHEN** a round inherits from the round below a seam gap wider in arc than what it draws there needs
- **THEN** the round SHALL spread its stitches into the surplus so its seam keeps about the same width on screen as every other round's, rather than the same angle
- **AND** that spread SHALL be measured from the point of the round opposite the seam, which does not move, and SHALL move no stitch further than the layout's per-round drift allowance

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

## ADDED Requirements

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
