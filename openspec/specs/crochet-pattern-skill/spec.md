# crochet-pattern-skill Specification

## Purpose
The plugin ships what an AI assistant needs in order to turn a written crochet pattern into Crochet Weaver syntax, in the form assistants already know how to load: a skill. It lives at `skills/crochet-weaver-pattern/`, is written in four languages, and is bundled into the compiled plugin so it can be copied from the settings tab without the repository.

## Requirements
### Requirement: Ship the pattern conversion knowledge as a skill
The system SHALL provide a self-contained skill, written for an AI assistant converting or authoring crochet patterns, in English, Traditional Chinese, Simplified Chinese, and Japanese, with all syntax tokens and code examples kept identical (untranslated) across every language version, and SHALL keep it current with the pattern language and the chart styles the plugin actually supports.

#### Scenario: Skill shape
- **WHEN** any language version of the skill is read
- **THEN** it SHALL open with YAML frontmatter carrying at least a `name` and a `description` saying both what the skill does and when to use it, so an agent can decide from the frontmatter alone whether to load it
- **AND** it SHALL be usable on its own — pasted into a chat, pointed at by an agent, or dropped into a skills folder — without needing another file from the repository

#### Scenario: Language parity
- **WHEN** any of the four language versions of the skill is compared to the others
- **THEN** every `crochet` code block and every backtick-quoted syntax token SHALL be byte-identical across all four versions

#### Scenario: Documents every supported repeat form
- **WHEN** the skill describes repeats
- **THEN** it SHALL cover `x N`, `rep N`, and the bare `rep` inferred from the round below, including when a bare `rep` is an error rather than an inference

#### Scenario: Documents what a round's stitch count excludes
- **WHEN** the skill states the stitch-counting rule
- **THEN** it SHALL say that a round's opening chain, a `mr` written as a step, and the closing slip stitch are drawn but excluded from the round's count, while a mid-round chain or slip stitch counts

#### Scenario: Documents the available round styles
- **WHEN** the skill lists the `style` frontmatter values
- **THEN** it SHALL list `radial`, `japanese`, and `continuous`

#### Scenario: Bundled copy matches the files
- **WHEN** a skill file is updated
- **THEN** the copy bundled into the compiled plugin SHALL be regenerated from it and SHALL be byte-identical to it, and a stale bundle SHALL fail the test suite rather than ship

### Requirement: Copy the skill from the settings tab
The system SHALL provide a settings-tab control with one button per language the skill is written in, which copies that language's full skill text to the system clipboard.

#### Scenario: Copy button
- **WHEN** the user activates one of the four language buttons in the "Copy the pattern skill" setting
- **THEN** the system SHALL write that language's skill text to the clipboard and show a brief "copied" confirmation on the button

#### Scenario: A language the skill is not written in
- **WHEN** the plugin's interface is set to a language the skill has not been written in
- **THEN** the setting SHALL still offer the languages it does have, and any request for another language SHALL be answered with the English skill rather than nothing

#### Scenario: Works without network access or the source repository
- **WHEN** the plugin is installed from a release (not run from the source checkout)
- **THEN** the copy buttons SHALL still work, since the skill text is bundled into the compiled plugin rather than read from the repository
