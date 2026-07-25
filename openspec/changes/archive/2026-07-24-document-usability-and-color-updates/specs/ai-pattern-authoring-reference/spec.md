## ADDED Requirements

### Requirement: Provide a four-language AI pattern-authoring reference
The system SHALL ship a self-contained reference document, written for an AI assistant converting or authoring crochet patterns, in English, Traditional Chinese, Simplified Chinese, and Japanese, with all syntax tokens and code examples kept identical (untranslated) across every language version.

#### Scenario: Language parity
- **WHEN** any of the four language versions of the reference document is compared to the others
- **THEN** every `crochet` code block and every backtick-quoted syntax token SHALL be byte-identical across all four versions

### Requirement: Copy the AI reference from the settings tab
The system SHALL provide a settings-tab control with one button per supported language that copies that language's full AI pattern-authoring reference text to the system clipboard.

#### Scenario: Copy button
- **WHEN** the user activates one of the four language buttons in the "Copy AI pattern-authoring instructions" setting
- **THEN** the system SHALL write that language's reference document text to the clipboard and show a brief "copied" confirmation on the button

#### Scenario: Works without network access or the source repository
- **WHEN** the plugin is installed from a release (not run from the source checkout)
- **THEN** the copy buttons SHALL still work, since the reference text is bundled into the compiled plugin rather than read from the repository's `docs/` folder
