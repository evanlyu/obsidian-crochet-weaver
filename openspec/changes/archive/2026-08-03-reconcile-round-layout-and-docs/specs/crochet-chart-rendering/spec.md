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

#### Scenario: Japanese style draws a continuous spiral guide
- **WHEN** a round chart is drawn in `japanese` style
- **THEN** one continuous guide SHALL wind through the rounds, stepping outward at each starting seam, with each round numbered at that seam

#### Scenario: Round numbers form a slight inward guide
- **WHEN** a numbered graph-driven round chart is drawn
- **THEN** the first stitch worked into the center ring SHALL remain at twelve o'clock independently of the first round number
- **AND** the first number SHALL sit at a -50 degree bearing
- **AND** each outer round number SHALL move another 0.5 degrees toward twelve o'clock, forming a subtle inward incline instead of either a rigid spoke or a spiralling column
- **AND** a large ordinary round SHALL align its number and round-change step without rigidly rotating its opening, closing instructions, or real stitch positions

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

### Requirement: Place round stitches from their ancestry
The system SHALL position each stitch or shell motif of a graph-driven round from the stitch or chain space it is worked into, SHALL never reorder a round's written units or a motif's children, and SHALL keep a minimum gap between neighboring rendered symbols, curved chain runs, and shell fans sized from what is actually drawn at that radius.

#### Scenario: Plain round follows its parents
- **WHEN** a round works one ordinary stitch into each stitch of the round below
- **THEN** every stitch outside a necessary local seam correction SHALL keep the angle of its parent exactly, so the broad side opposite the seam remains in radial columns
- **AND** inherited crowding from earlier shaping MAY relax only where the round is not an exact one-to-one ordinary copy

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

#### Scenario: A large plain numbered seam may keep bounded extra room
- **WHEN** a sufficiently large numbered round works one ordinary stitch into each stitch below and inherits a wider seam than its minimum
- **THEN** it SHALL retain no more than 10 px of that additional opening room
- **AND** any correction beyond that allowance SHALL fade smoothly to zero within the nearest quarter of the round on each seam edge
- **AND** the broad opposite side SHALL remain exactly on its ancestry rather than rotating or redistributing around the whole round
- **AND** small rounds and shaping rounds SHALL keep their stricter balanced placement because they do not have enough plain neighboring gaps to localize the correction safely

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

#### Scenario: Increase drawn as a V
- **WHEN** a round contains an `inc`
- **THEN** a V SHALL be drawn with its point on the round's inner edge at the real parent position
- **AND** its two arms SHALL end at the real angular positions of the two child stitches it makes, preserving child order without forcing artificial symmetry or width capping

#### Scenario: Decrease drawn as a ∧
- **WHEN** a round contains a `dec` or an N-together decrease drawn as a shaping mark
- **THEN** a ∧ SHALL be drawn with its point at the produced stitch and its feet leaning toward every stitch it closed over

#### Scenario: A wide decrease stays legible
- **WHEN** a decrease inherits a very wide or one-sided set of source positions
- **THEN** its opening SHALL be compacted to the room of the source symbols and shifted under its point so it still reads as one ∧
- **AND** this compaction SHALL NOT be applied to an increase, whose parent and child endpoints carry exact ancestry
