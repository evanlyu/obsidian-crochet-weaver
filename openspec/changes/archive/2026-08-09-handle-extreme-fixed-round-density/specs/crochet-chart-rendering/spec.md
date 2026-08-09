## MODIFIED Requirements

### Requirement: Place round stitches from their ancestry
The system SHALL derive graph-driven round stitches from recorded sources and SHALL reconcile a projected correction inward only while the relationship gives every preceding-round source exactly one unambiguous replacement bearing.

#### Scenario: Partial or repeated ancestry stops inward correction
- **WHEN** a projected round uses only part of the preceding round's sources or uses any source more than once
- **THEN** that relationship SHALL form an inward-reconciliation boundary
- **AND** the earlier round's stitch bearings and shaping geometry SHALL remain unchanged
- **AND** the projected round SHALL resolve its own working order and clearance without inventing one replacement bearing for an ambiguous source

### Requirement: Honor configured round spacing
The system SHALL treat a positive round spacing as the exact difference between consecutive radii and MAY raise the absolute first-round radius to the smallest value required by the most demanding later round.

#### Scenario: An extreme later round fits by raising the common base radius
- **WHEN** a later fixed-spacing round needs more circumference than its inherited absolute radius can provide for configured-size symbols and its seam
- **THEN** the layout SHALL derive the minimum first-round radius from the most demanding round's measured pairwise gaps and seam
- **AND** every later round SHALL remain exactly the configured spacing beyond the preceding round
- **AND** the system SHALL NOT overlap, hide, or locally scale symbols to preserve a smaller absolute first radius

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL keep every real stitch symbol in an explicitly spaced graph-driven round visible, full-sized, and separated using its actual drawn geometry.

#### Scenario: Non-lace chain stitches use their stamped width
- **WHEN** chain stitches are drawn directly on a round instead of hanging on a lace chain-space curve
- **THEN** pairwise clearance and fixed-base sizing SHALL use each chain symbol's full drawn extent
- **AND** the shortened chord budget reserved for a curved lace chain run SHALL NOT be applied
