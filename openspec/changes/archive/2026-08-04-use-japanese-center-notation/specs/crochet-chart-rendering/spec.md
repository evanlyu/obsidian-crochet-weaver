## MODIFIED Requirements

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
