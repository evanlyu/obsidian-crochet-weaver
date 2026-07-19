## ADDED Requirements

### Requirement: Report the current highlight target
The system SHALL let the progress tool report its current row and target-stitch position so a paired chart can be highlighted.

#### Scenario: Reports current row and target unit
- **WHEN** the tool has a current row
- **THEN** it SHALL report that row's index and the unit index corresponding to the current stitch-counter position

#### Scenario: Reports no target when complete
- **WHEN** the tool's completed row count equals the total row count
- **THEN** it SHALL report no highlight target

#### Scenario: Reports on every state change
- **WHEN** any control changes the tool's row or stitch progress
- **THEN** the tool SHALL report the updated highlight target immediately after repainting
