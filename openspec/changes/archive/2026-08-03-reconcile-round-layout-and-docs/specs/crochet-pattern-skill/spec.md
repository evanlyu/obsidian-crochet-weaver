## ADDED Requirements

### Requirement: Keep published guidance aligned with the executable contract
The system SHALL keep every README and localized pattern-skill file aligned with the options, style names, count weights, progress identity, and round-chart behavior the current plugin executes. Documentation conformance SHALL be tested so a runtime option or count rule cannot change without an intentional guidance update.

#### Scenario: Every current chart option is documented
- **WHEN** a user or assistant reads any supported README or pattern-skill language
- **THEN** it SHALL cover `type`, `id`, `scale`, `stroke`, `spacing`, `highlight`, `style`, `lace`, `sector`, `wholeRounds`, `grid`, `rounds`, `rows`, `columns`, `tool`, `text`, `readable`, and `position`
- **AND** it SHALL list `radial`, `japanese`, and `continuous` as the current round-style names rather than the retired `standard` name

#### Scenario: Beginning-chain guidance is consistent
- **WHEN** any README or skill explains a round's opening chain
- **THEN** it SHALL state that `ch 3 (counts as dc)` contributes one replacement stitch and `ch 1 (does not count as a st)` contributes zero
- **AND** an unannotated beginning chain SHALL count as one only when the round closes to its top
- **AND** it SHALL NOT also contain an unconditional statement that every beginning chain counts zero

#### Scenario: Progress guidance follows written-unit weight
- **WHEN** any README or skill explains the stitch counter
- **THEN** it SHALL tell the reader to advance once per written unit
- **AND** it SHALL explain that the increment is that unit's written-count weight, including `inc` adding 2 and a V or shell adding its whole weight at once

#### Scenario: Progress identity grammar is documented
- **WHEN** the guidance recommends an explicit progress `id`
- **THEN** it SHALL state that the id uses 1–80 ASCII letters, digits, underscores, or hyphens
- **AND** it SHALL state that an absent or invalid id falls back to a content-derived hash

#### Scenario: Localized skill examples remain executable
- **WHEN** the four localized pattern-skill files are compared
- **THEN** every fenced `crochet` code example SHALL be byte-identical
- **AND** syntax placeholders such as `color <name>` and `next <place>` SHALL remain untranslated
