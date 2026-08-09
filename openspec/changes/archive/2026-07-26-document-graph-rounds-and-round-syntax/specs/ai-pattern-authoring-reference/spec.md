## MODIFIED Requirements

### Requirement: Provide a four-language AI pattern-authoring reference
The system SHALL ship a self-contained reference document, written for an AI assistant converting or authoring crochet patterns, in English, Traditional Chinese, Simplified Chinese, and Japanese, with all syntax tokens and code examples kept identical (untranslated) across every language version, and SHALL keep it current with the pattern language and the chart styles the plugin actually supports.

#### Scenario: Language parity
- **WHEN** any of the four language versions of the reference document is compared to the others
- **THEN** every `crochet` code block and every backtick-quoted syntax token SHALL be byte-identical across all four versions

#### Scenario: Documents every supported repeat form
- **WHEN** the reference describes repeats
- **THEN** it SHALL cover `x N`, `rep N`, and the bare `rep` inferred from the round below, including when a bare `rep` is an error rather than an inference

#### Scenario: Documents what a round's stitch count excludes
- **WHEN** the reference states the stitch-counting rule
- **THEN** it SHALL say that a round's opening chain, a `mr` written as a step, and the closing slip stitch are drawn but excluded from the round's count, while a mid-round chain or slip stitch counts

#### Scenario: Documents the available round styles
- **WHEN** the reference lists the `style` frontmatter values
- **THEN** it SHALL list `standard`, `book`, and `linked`

#### Scenario: Bundled copy matches the documents
- **WHEN** the reference documents are updated
- **THEN** the copy bundled into the compiled plugin SHALL be byte-identical to them
