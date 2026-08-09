## ADDED Requirements

### Requirement: Keep the numbered center expansion upright and compact
The system SHALL treat the first stitch worked into a center ring as the fixed twelve-o'clock origin, SHALL keep the red numbered marker's side clearance as a minimum rather than an exact seam width, and SHALL use safely available seam room before rotating ancestry-driven stitches away from that origin.

#### Scenario: Compact first round
- **WHEN** a default-scale numbered round chart starts with a joined opening chain and six single crochets in a magic ring
- **THEN** its first produced stitch SHALL remain at a -90 degree bearing
- **AND** its center radius SHALL remain between 30px and 31px
- **AND** neither the magic ring, opening instructions, round number, nor first-round stitches SHALL overlap

#### Scenario: First all-increase round
- **WHEN** the first non-empty round above the center consists entirely of increases
- **THEN** the two children of its first increase SHALL lie on opposite sides of their twelve-o'clock parent
- **AND** the V SHALL be nearly isosceles, with its two arm lengths differing by less than 0.5px at default scale
- **AND** the red round number and round-change step SHALL use retained seam room instead of rigidly rotating those children to align the marker

#### Scenario: Numbered marker clearance is a minimum
- **WHEN** a numbered seam has more room than the number and round-change marker require
- **THEN** the marker SHALL retain at least 10px of clearance on each side
- **AND** the layout MAY keep additional bounded room when it protects the center increase or a qualified ordinary round's ancestry
- **AND** that additional room SHALL NOT be interpreted as requiring every numbered seam to collapse to exactly 10px

#### Scenario: Outer guide remains stable
- **WHEN** the center expansion uses its flexible seam reserve
- **THEN** the first number SHALL remain at -50 degrees and each outer number SHALL retain the existing additional -0.5 degree incline
- **AND** later rounds SHALL return to the established bounded seam-correction rules rather than inheriting an unbounded widening corridor
