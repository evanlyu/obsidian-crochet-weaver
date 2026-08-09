## MODIFIED Requirements

### Requirement: Preserve exact one-to-one round ancestry
The system SHALL place graph-driven stitches from their recorded sources and SHALL preserve exact one-to-one parent angles whenever the resulting fixed-spacing round remains readable. Automatic spacing SHALL adjust radius rather than move valid ancestry targets. Explicit spacing SHALL keep the configured interval exact; if exact inherited targets would force the round below the readability projection threshold, the system SHALL apply a deterministic minimum-displacement projection instead of hiding or overlapping stitches, then reconcile that displayed correction inward through recorded graph relationships.

#### Scenario: Readability correction remains connected to earlier rounds
- **WHEN** minimum-displacement projection changes the displayed angles of a fixed-spacing round
- **THEN** the system SHALL reconcile those corrected angles inward through recorded graph relationships
- **AND** a one-to-one source SHALL move to its child's displayed angle
- **AND** an increase source SHALL remain at the angular midpoint of its displayed children
- **AND** multiple decrease sources SHALL retain their relative opening while their midpoint aligns with the displayed decrease target
- **AND** configured radii and stitch counts SHALL remain unchanged

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL prevent real stitch symbols in explicitly spaced round charts from visually overlapping, disappearing, or becoming visually detached from recorded ancestry. It SHALL retain exact centers while readable, SHALL use bounded minimum angular correction when inherited centers become unreadably close, SHALL reconcile corrected bearings inward, and SHALL never change configured round radii or stitch counts.

#### Scenario: Inherited near-collision is separated before scaling
- **WHEN** exact inherited centers would require a common scale below the readability projection threshold
- **THEN** the system SHALL restore working order and minimum gaps with deterministic minimum displacement
- **AND** the first semantic target SHALL remain anchored
- **AND** corrected angles SHALL reconcile inward so projected stitches remain visually connected to displayed parents or shaping endpoints
- **AND** later one-to-one rounds SHALL inherit the corrected displayed parent angles coherently

#### Scenario: Reported staged-increase chart keeps every stitch aligned
- **WHEN** a Japanese fixed-spacing chart grows 6→12→18→24→28→32→36→40 stitches, continues with six 40-stitch rounds, and then decreases to 36
- **THEN** each 40-stitch round SHALL render all forty real stitch symbols with positive visual clearance
- **AND** the first 40-stitch round SHALL keep every stitch directly above its displayed parent stitch or increase-V endpoint
- **AND** every increase mark SHALL remain a balanced V centred on its real source
- **AND** no configured radial interval or stitch count SHALL change
