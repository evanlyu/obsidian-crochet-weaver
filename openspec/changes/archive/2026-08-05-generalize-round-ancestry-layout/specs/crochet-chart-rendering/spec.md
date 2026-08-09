## MODIFIED Requirements

### Requirement: Place round stitches from their ancestry
The system SHALL position each stitch or shell motif of every graph-driven round from the stitch or chain space it is worked into, SHALL preserve every valid parent-derived angle as a hard semantic constraint, SHALL never reorder a round's written units or a motif's children, and SHALL keep a minimum gap between neighboring rendered symbols, curved chain runs, shell fans, and seam contents sized from what is actually drawn at that radius.

#### Scenario: Plain stitch follows its parent through shaping
- **WHEN** an ordinary stitch has one previous-round source, including in a round that also increases, decreases, or deliberately skips places
- **THEN** that stitch SHALL keep exactly the angle of its source so its lineage remains radial
- **AND** seam fitting, radius fitting, separator placement, and round-number alignment SHALL NOT move it

#### Scenario: A stitch the next round shapes across keeps its angle
- **WHEN** the next round works an increase or a decrease into a stitch of this round
- **THEN** that stitch SHALL keep the angle its ancestry gave it, since the V or ∧ drawn there is aimed at where it sits

#### Scenario: Shaping stitches sit with the stitches they belong to
- **WHEN** a round contains increases or decreases
- **THEN** an increase's children SHALL use balanced angular offsets around the stitch below them
- **AND** a decrease SHALL sit at the seam-safe circular mean of the stitches it merged
- **AND** ordinary stitches elsewhere in the same round SHALL remain on their own parent angles

#### Scenario: Seam-crossing shaping
- **WHEN** a decrease merges stitches that lie on opposite sides of the 0°/360° seam
- **THEN** its position SHALL be computed on the shortest arc between them, not by averaging raw angles, so it never lands on the opposite side of the chart

#### Scenario: Minimum radius satisfies all hard geometry
- **WHEN** parent-derived angles at the requested or natural radius do not provide enough room for neighboring symbols, shaping, or the seam
- **THEN** the current round radius SHALL grow to the smallest feasible radius at which those same semantic angles satisfy every minimum clearance
- **AND** explicit round spacing SHALL act as a minimum rather than permission to move stitches

#### Scenario: Working order is never traded away
- **WHEN** any radius or bounded invalid-mapping fallback is evaluated
- **THEN** the stitches SHALL remain in working order and no symbol SHALL overlap its neighbor

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
- **AND** any extra inherited room SHALL remain available rather than being consumed by moving stitches

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

### Requirement: Keep the numbered center expansion upright and compact
The system SHALL treat the first stitch worked into a center ring as the fixed twelve-o'clock origin, SHALL keep the red numbered marker's side clearance as a minimum rather than an exact seam width, SHALL preserve every graph-driven ancestry target independent of round number or shaping mix, and SHALL keep final stitches wholly on the closing side of their round separators.

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
- **AND** lack of space SHALL be solved by radius growth rather than seam compaction or asymmetric child movement

#### Scenario: Ordinary ancestry remains exact through arbitrary shaping
- **WHEN** an ordinary stitch appears before, between, or after shaping in a numbered graph-driven round
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
- **AND** a marker SHALL stop before that target when reaching it would cross the final symbol
- **AND** separator safety and exact ancestry SHALL take priority over exact marker bearing
- **AND** retained angular seam room MAY become physically wider on later radii while the marker packet remains ordered inside it

### Requirement: Preserve exact one-to-one round ancestry
The system SHALL treat every valid parent-derived angle in a graph-driven round as a hard constraint, including but not limited to exact one-to-one ordinary rounds, and SHALL adjust radius and presentation geometry rather than move those stitches.

#### Scenario: Every ordinary child stays over its parent
- **WHEN** a current ordinary stitch has exactly one previous-round source
- **THEN** it SHALL keep exactly the angle of that source
- **AND** seam fitting, radius fitting, and marker alignment SHALL NOT move it

#### Scenario: Marker cannot reach its preferred bearing
- **WHEN** placing a numbered separator at its preferred bearing would cross the final stitch
- **THEN** the marker, separator, and closing instructions SHALL stop at the farthest safe bearing within measured seam surplus
- **AND** no stitch SHALL move to make room for them

#### Scenario: Non-bijective valid rounds preserve mapped ancestry
- **WHEN** a round increases, decreases, deliberately skips, or otherwise does not map one current stitch to one unique previous-round stitch
- **THEN** every valid recorded source relationship SHALL still determine its target angle
- **AND** collision clearance SHALL be solved by radius growth without an even-spacing fallback
