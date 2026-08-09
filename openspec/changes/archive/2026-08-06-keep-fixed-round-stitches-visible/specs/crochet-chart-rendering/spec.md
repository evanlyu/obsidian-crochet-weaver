## MODIFIED Requirements

### Requirement: Preserve exact one-to-one round ancestry
The system SHALL place graph-driven stitches from their recorded sources and SHALL preserve exact one-to-one parent angles whenever the resulting fixed-spacing round remains readable. Automatic spacing SHALL adjust radius rather than move valid ancestry targets. Explicit spacing SHALL keep the configured interval exact; if exact inherited targets would force the round below the readability projection threshold, the system SHALL apply a deterministic minimum-displacement projection instead of hiding or overlapping stitches.

#### Scenario: Every readable ordinary child stays over its parent
- **WHEN** a current ordinary stitch has exactly one previous-round source
- **AND** its round remains at or above the readability projection threshold at exact ancestry targets
- **THEN** it SHALL keep exactly the angle of that source
- **AND** seam fitting, radius fitting, and marker alignment SHALL NOT move it

#### Scenario: Marker cannot reach its preferred bearing
- **WHEN** placing a numbered separator at its preferred bearing would cross the final stitch
- **THEN** the marker, separator, and closing instructions SHALL stop at the farthest safe bearing within measured seam surplus
- **AND** no stitch SHALL move solely to make room for presentation geometry

#### Scenario: Non-bijective valid rounds preserve mapped ancestry
- **WHEN** a round increases, decreases, deliberately skips, or otherwise does not map one current stitch to one unique previous-round stitch
- **THEN** every valid recorded source relationship SHALL determine its preferred target angle
- **AND** automatic spacing SHALL solve collision clearance by radius growth without an even-spacing fallback
- **AND** explicit spacing SHALL preserve its exact interval and SHALL retain those targets unless their common readable scale falls below the projection threshold

#### Scenario: Unreadable inherited centers receive minimum correction
- **WHEN** distinct fixed-spacing stitches inherit centers so close that the round's common safe scale falls below the readability projection threshold
- **THEN** the system SHALL preserve written order and the first semantic target
- **AND** it SHALL minimize angular displacement from all preferred ancestry targets
- **AND** it SHALL retain every source relationship and every stitch

### Requirement: Honor configured round spacing
The system SHALL treat a positive round spacing resolved from chart frontmatter or plugin settings as an exact radial interval for `type: round` charts in radial, Japanese, and continuous styles.

#### Scenario: Every configured interval is identical
- **WHEN** a chart resolves a positive round spacing of N pixels
- **THEN** every round after the first SHALL have a radius exactly N pixels greater than the preceding round
- **AND** stitch count, shaping density, seam contents, marker alignment, and readability correction SHALL NOT increase that interval

#### Scenario: Readable ancestry remains exact at fixed spacing
- **WHEN** a graph-driven round remains readable at its configured radius and exact ancestry targets
- **THEN** every valid parent-derived angle SHALL remain unchanged
- **AND** increase children SHALL remain balanced around their parent
- **AND** the layout SHALL uniformly scale that round only if full-size symbols would otherwise overlap

#### Scenario: Near-coincident ancestry is corrected at fixed spacing
- **WHEN** exact graph-derived centers would force the common round scale below the readability projection threshold
- **THEN** the configured radial interval SHALL remain unchanged
- **AND** the layout SHALL apply deterministic order-and-clearance projection before uniform scaling
- **AND** projection SHALL be based on measured geometry rather than a specific round, count, or pattern phrase

#### Scenario: Automatic spacing remains adaptive
- **WHEN** no positive round spacing is resolved
- **THEN** the layout MAY grow a crowded round to its smallest collision-safe radius

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL prevent real stitch symbols in explicitly spaced round charts from visually overlapping or disappearing. It SHALL retain exact centers while readable, SHALL use bounded minimum angular correction when inherited centers become unreadably close, and SHALL never change configured round radii or stitch counts.

#### Scenario: Dense round uses one maximum safe scale
- **WHEN** two or more real stitch symbols in one fixed-spacing round would lack visual clearance at full size
- **THEN** the system SHALL calculate the largest scale at which every real-stitch pair in that round remains visually separate
- **AND** every real stitch symbol in that round SHALL use the same scale
- **AND** symbols in rounds that already fit radially and tangentially SHALL remain at full size

#### Scenario: Distinct centers cannot zero the round
- **WHEN** two distinct real-stitch centers are closer than the unscaled clearance
- **THEN** symbol size and clearance SHALL scale proportionally
- **AND** their round SHALL NOT receive a zero common scale merely to retain a fixed-size gap

#### Scenario: Inherited near-collision is separated before scaling
- **WHEN** exact inherited centers would require a common scale below the readability projection threshold
- **THEN** the system SHALL restore working order and minimum gaps with deterministic minimum displacement
- **AND** the first semantic target SHALL remain anchored
- **AND** later one-to-one rounds SHALL inherit the corrected displayed parent angles coherently

#### Scenario: Tall symbols remain inside their band
- **WHEN** a fixed-spacing round contains a symbol whose radial height would reach into an adjacent round
- **THEN** the round's common symbol scale SHALL also fit that symbol within the configured radial band with proportional clearance

#### Scenario: Written non-neighbours are also checked
- **WHEN** free-form ancestry places two stitches close together even though they are not adjacent in the written item list
- **THEN** the same all-pairs clearance calculation SHALL include that pair

#### Scenario: Reported staged-increase chart keeps every stitch
- **WHEN** a Japanese fixed-spacing chart grows 6→12→18→24→28→32→36→40 stitches, continues with six 40-stitch rounds, and then decreases to 36
- **THEN** each 40-stitch round SHALL render all forty real stitch symbols with positive visual clearance
- **AND** no symbol SHALL be scaled to zero
- **AND** the decrease round SHALL retain 32 ordinary symbols plus four decrease marks
- **AND** every increase mark SHALL remain a balanced V
