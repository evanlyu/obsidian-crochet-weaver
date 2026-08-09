## MODIFIED Requirements

### Requirement: Keep the numbered center expansion upright and compact
The system SHALL treat the first stitch worked into a center ring as the fixed twelve-o'clock origin, SHALL keep the red numbered marker's side clearance as a minimum rather than an exact seam width, and SHALL preserve ancestry-centred Japanese increase marks whenever their original placement satisfies every symbol-gap and seam constraint.

#### Scenario: Compact first round
- **WHEN** a default-scale numbered round chart starts with a joined opening chain and six single crochets in a magic ring
- **THEN** its first produced stitch SHALL remain at a -90 degree bearing
- **AND** its center radius SHALL remain between 30px and 31px
- **AND** neither the magic ring, opening instructions, round number, nor first-round stitches SHALL overlap

#### Scenario: Space-rich increase round
- **WHEN** a numbered Japanese-style round contains increases whose ancestry-driven angles satisfy every required neighbouring gap and the requested seam
- **THEN** every increase's children SHALL remain centred on the stitch from which they are made
- **AND** every rendered V SHALL keep its exact parent and child endpoints
- **AND** its two arm lengths SHALL differ by less than 0.5px at default scale
- **AND** the red round number and round-change step SHALL use retained seam room instead of rigidly rotating those children

#### Scenario: Crowded increase round
- **WHEN** an increase round's ancestry-driven angles do not satisfy a minimum symbol gap or seam
- **THEN** order and collision constraints SHALL take priority over visual symmetry
- **AND** the layout SHALL use the established seam-closing and fitting fallback
- **AND** the V endpoints SHALL continue to identify the real parent and children rather than being cosmetically falsified

#### Scenario: Ordinary round immediately above increases
- **WHEN** a numbered Japanese-style ordinary round consumes every child of an increase round exactly once
- **THEN** it MAY retain bounded additional seam room for that single transition
- **AND** its stitches SHALL remain within rounding distance of half a pitch from the increase marks below
- **AND** later ordinary rounds SHALL return to the established bounded seam-correction rules

#### Scenario: Numbered marker clearance is a minimum
- **WHEN** a numbered seam has more room than the number and round-change marker require
- **THEN** the marker SHALL retain at least 10px of clearance on each side
- **AND** the layout MAY keep additional bounded room when it protects centred increases or a qualified ordinary round's ancestry
- **AND** that additional room SHALL NOT be interpreted as requiring every numbered seam to collapse to exactly 10px

#### Scenario: Outer guide remains stable
- **WHEN** an increase round uses safely available seam room
- **THEN** the first number SHALL remain at -50 degrees and each outer number SHALL retain the existing additional -0.5 degree incline
- **AND** the retained room SHALL NOT propagate as an unbounded widening corridor through all later rounds
