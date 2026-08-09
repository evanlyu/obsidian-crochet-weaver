## MODIFIED Requirements

### Requirement: Render traditional Japanese round charts
The system SHALL render graph-driven Japanese and continuous round charts with an inward-leaning round-number guide where measured geometry permits, while keeping every number clear of the stitches and seam instructions drawn on its round.

#### Scenario: A preferred number bearing is collision-checked
- **WHEN** a numbered round has a preferred column bearing
- **THEN** the number SHALL use that bearing only if its measured label footprint remains clear of the round separator and every drawn symbol throughout the path from the seam's guaranteed-safe label slot
- **AND** otherwise it SHALL stop at the first collision boundary on that path
- **AND** it SHALL remain on the opening side of the separator and before the closing join instead of crossing either to reach a later clear bearing
- **AND** no real stitch, opening instruction, closing instruction, or configured round radius SHALL move merely to force the label to its preferred bearing

#### Scenario: A partial chart starts after R1
- **WHEN** the first written round is R4, R16, or any other valid round number and it closes with a join
- **THEN** its number SHALL remain clear of that join using the same geometry-based rule as every other round
- **AND** its number SHALL remain wholly on the opening side of the separator and the left side of that join
- **AND** the behavior SHALL NOT depend on the particular round number, stitch count, or pattern wording

### Requirement: Size every chart from the symbols it draws
The system SHALL measure label digits and seam-instruction footprints as they are rendered, including readable space around a filled join dot.

#### Scenario: One- and two-digit round numbers sit beside joins
- **WHEN** a seam contains a closing slip stitch beside a one- or multi-digit round number
- **THEN** the reserved and final positions SHALL keep the filled dot visually distinct from the number
- **AND** the number width SHALL grow with its actual digit count
