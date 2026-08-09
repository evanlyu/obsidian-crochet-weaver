## MODIFIED Requirements

### Requirement: Honor configured round spacing
The system SHALL treat a positive round spacing resolved from chart frontmatter or plugin settings as an exact radial interval for `type: round` charts in radial, Japanese, and continuous styles, and SHALL keep the symbol size resolved from settings unchanged across those rounds.

#### Scenario: Configured symbol size remains global
- **WHEN** a fixed-spacing chart contains the same real stitch symbol in multiple rounds with different densities
- **THEN** every instance SHALL retain the size resolved from the user's symbol-size setting
- **AND** no round SHALL assign that stitch a local density-derived scale

#### Scenario: Near-coincident ancestry is corrected at fixed spacing
- **WHEN** exact graph-derived centers would overlap at the configured symbol size
- **THEN** the configured radial interval and symbol size SHALL remain unchanged
- **AND** the layout SHALL apply deterministic order-and-clearance projection instead of symbol scaling
- **AND** projection SHALL be based on measured geometry rather than a specific round, count, or pattern phrase

### Requirement: Keep fixed-spacing round symbols clear
The system SHALL prevent real stitch symbols in explicitly spaced round charts from visually overlapping, disappearing, or changing size from one round to another. It SHALL retain exact centers while configured-size symbols fit, SHALL use bounded minimum angular correction when inherited centers collide, and SHALL never change configured round radii, stitch counts, or symbol size.

#### Scenario: Dense round retains configured symbol size
- **WHEN** two or more real stitch symbols in one fixed-spacing round would lack visual clearance at full configured size
- **THEN** the system SHALL apply deterministic angular clearance
- **AND** every real stitch symbol SHALL retain the configured size
- **AND** the system SHALL NOT assign a local per-round scale

#### Scenario: Reported staged-increase chart keeps one short-stitch size
- **WHEN** a Japanese fixed-spacing chart grows 6→12→18→24→28→32→36→40 stitches, continues with six 40-stitch rounds, and then decreases to 36
- **THEN** every visible single-crochet symbol in every round SHALL retain the configured size
- **AND** every 40-stitch round SHALL retain positive visual clearance and all forty real stitches
- **AND** the first 40-stitch round SHALL remain aligned to displayed R8 parents or increase-V endpoints
- **AND** every increase mark SHALL remain balanced
