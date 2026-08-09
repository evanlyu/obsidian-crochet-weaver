## ADDED Requirements

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL prevent real stitch symbols in explicitly spaced round charts from visually overlapping without changing their center positions, configured radii, or graph-derived angles.

#### Scenario: Dense round uses one maximum safe scale
- **WHEN** two or more real stitch symbols in one fixed-spacing round would lack the required visual clearance at full size
- **THEN** the system SHALL calculate the largest scale at which every real-stitch pair in that round retains clearance
- **AND** every real stitch symbol in that round SHALL use the same scale
- **AND** symbols in rounds that already fit SHALL remain at full size

#### Scenario: Tall symbols remain inside their band
- **WHEN** a fixed-spacing round contains a symbol whose radial height would reach into an adjacent round
- **THEN** the round's common symbol scale SHALL also fit that symbol within the configured radial band with clearance

#### Scenario: Scaling does not change crochet meaning
- **WHEN** fixed-spacing clarity scaling is applied
- **THEN** stitch centers, ancestry angles, increase and decrease endpoints, round radii, separator geometry, and written order SHALL remain unchanged

#### Scenario: Written non-neighbours are also checked
- **WHEN** free-form ancestry places two stitches close together even though they are not adjacent in the written item list
- **THEN** the same clearance calculation SHALL include that pair
