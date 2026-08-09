## ADDED Requirements

### Requirement: Preserve exact one-to-one round ancestry
The system SHALL treat the parent angle of every ordinary stitch in an exact one-to-one graph-driven round as a hard constraint, and SHALL adjust presentation geometry rather than move those stitches.

#### Scenario: Every ordinary child stays over its parent
- **WHEN** a round has the same number of stitches as the round below
- **AND** every current stitch has exactly one unique previous-round source
- **THEN** every current stitch SHALL keep exactly the angle of that source
- **AND** seam closing, gap fitting, relaxation, and marker alignment SHALL NOT move it

#### Scenario: Marker cannot reach its preferred bearing
- **WHEN** placing a numbered separator at its preferred bearing would cross the final stitch of an exact one-to-one round
- **THEN** the marker, separator, and closing instructions SHALL stop at the farthest safe bearing within measured seam surplus
- **AND** no stitch SHALL move to make room for them

#### Scenario: Non-bijective rounds retain collision fitting
- **WHEN** a round increases, decreases, skips, reuses, or otherwise does not map one current stitch to one unique previous-round stitch
- **THEN** the established order, collision, and shaping placement passes SHALL continue to apply
