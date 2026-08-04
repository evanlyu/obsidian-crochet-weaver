# crochet-pattern-skill Specification

## Purpose
The plugin ships what an AI assistant needs in order to turn a written crochet pattern into Crochet Weaver syntax, in the form assistants already know how to load: a skill. It lives at `skills/crochet-weaver-pattern/`, is written in four languages, and is bundled into the compiled plugin so it can be copied from the settings tab without the repository.
## Requirements
### Requirement: Ship the pattern conversion knowledge as a skill
The system SHALL provide a self-contained skill, written for an AI assistant converting or authoring crochet patterns, in English, Traditional Chinese, Simplified Chinese, and Japanese, with all syntax tokens and code examples kept identical (untranslated) across every language version, and SHALL keep it current with the pattern language and the chart styles the plugin actually supports. It SHALL teach every direct note-form syntax needed to convert or preserve chart-relevant shell-fan instructions, including multiline rounds, beginning-chain count notes, slip-stitch joins, repositioning, current-round turns, typed targets, V2/V3 aliases, center-stitch selection, picot targets, chain-space counting rules, structured count annotations, source-repeat expansion, and the limits of chart syntax.

#### Scenario: Skill shape
- **WHEN** any language version of the skill is read
- **THEN** it SHALL open with YAML frontmatter carrying at least a `name` and a `description` saying both what the skill does and when to use it, so an agent can decide from the frontmatter alone whether to load it
- **AND** it SHALL be usable on its own — pasted into a chat, pointed at by an agent, or dropped into a skills folder — without needing another file from the repository

#### Scenario: Language parity
- **WHEN** any of the four language versions of the skill is compared to the others
- **THEN** every `crochet` code block and every backtick-quoted syntax token SHALL be byte-identical across all four versions

#### Scenario: Documents every supported repeat form
- **WHEN** the skill describes repeats
- **THEN** it SHALL cover `x N`, `rep N`, the bare `rep` inferred from the round below, and the source repeats `R13: repeat R11.` and `R15-R18: repeat R11-R14.`, including when a bare `rep` is an error rather than an inference

#### Scenario: Documents what a round's stitch count includes
- **WHEN** the skill states the stitch-counting rule
- **THEN** it SHALL say that a round's non-counting beginning chain, a `mr` written as a step, and the closing join are drawn but count zero, that a counted beginning chain (`ch 3 (counts as dc)`) counts as the one stitch it replaces, that each ordinary mid-round chain counts one, and that a chain space is not itself a stitch
- **AND** it SHALL say that a beginning chain written without a note counts as the stitch it replaces when the round closes to the top of that chain, so a pattern written the way `crochet-dev` writes R3 needs no annotation added

#### Scenario: Documents the available round styles
- **WHEN** the skill lists the `style` frontmatter values
- **THEN** it SHALL list `radial`, `japanese`, and `continuous`, and SHALL state that lace motifs are drawn by `japanese` and `continuous` rather than by a style of their own

#### Scenario: Bundled copy matches the files
- **WHEN** a skill file is updated
- **THEN** the copy bundled into the compiled plugin SHALL be regenerated from it and SHALL be byte-identical to it, and a stale bundle SHALL fail the test suite rather than ship

#### Scenario: Reference teaches multiline note form
- **WHEN** the reference explains the `crochet-dev` style
- **THEN** it SHALL state that indented continuation lines belong to the preceding row or range label until the next row label or blank boundary
- **AND** it SHALL state that commas and final periods are accepted

#### Scenario: Reference teaches beginning chain note forms
- **WHEN** the reference explains `ch 3 (counts as dc)` and `ch 1 (does not count as a st)`
- **THEN** it SHALL teach those forms as directly accepted Crochet Weaver syntax
- **AND** it SHALL state that the counted form contributes one replacement double crochet while the non-counting form contributes zero

#### Scenario: Reference teaches join note forms
- **WHEN** the reference explains `sl st to top of beginning ch-3`, `sl st to first sc`, or `sl st to join`
- **THEN** it SHALL teach those forms as directly accepted closing joins with written count weight 0

#### Scenario: Reference teaches repositioning
- **WHEN** the source says `sl st into next ch-1 sp`
- **THEN** the reference SHALL teach that exact form as a non-counting phase change that consumes nothing
- **AND** it SHALL state that the following produced step consumes the selected space

#### Scenario: Reference teaches current-round turn syntax
- **WHEN** a joined round starts with `turn`
- **THEN** the reference SHALL teach `turn` as a current-round instruction that reverses that round's next-target traversal and drawing direction while preserving motif child order
- **AND** it SHALL teach that the first round defaults RS, absent `turn` preserves side and direction, and `crochet-dev` R4 and later even rounds are WS while R5 and later odd rounds are RS through R22

#### Scenario: Reference teaches implicit skips from typed targets
- **WHEN** the reference explains `next dc`, `next ch-2 sp`, `next picot`, or `center dc of next 7-dc shell`
- **THEN** it SHALL state that the search advances in current traversal direction and records intervening previous-round target positions as implicitly skipped
- **AND** it SHALL present explicit `skip N` only as an accepted low-level alias, not as required `crochet-dev` output

#### Scenario: Reference teaches explicit targets
- **WHEN** the reference explains `same st`, `same ch-1 sp`, `next sc`, `next dc`, `next ch-1 sp`, `next ch-2 sp`, `next ch-3 sp`, `next picot`, or `center dc of next 3/5/7/9-dc shell`
- **THEN** it SHALL teach those matching note forms directly
- **AND** it SHALL explain that targets resolve through the current round's working cursor

#### Scenario: Reference teaches quantity-targeted motifs
- **WHEN** the reference explains `3 dc in next ch-1 sp`, `5 dc in next ch-2 sp`, `7 dc in next ch-3 sp`, or `9 dc in next ch-3 sp`
- **THEN** it SHALL state that the target applies to the whole quantity
- **AND** it SHALL state that the quantity forms one shell-fan motif sharing one consumed source, not N independent cursor-advancing stitches

#### Scenario: Reference teaches R3 first shell aggregation
- **WHEN** the reference explains `sl st into next ch-1 sp, ch 3, 2 dc in same ch-1 sp`
- **THEN** it SHALL state that these contiguous same-source outputs form one 3-dc shell fan
- **AND** it SHALL state that the same-space double crochets do not cause duplicate source consumption

#### Scenario: Reference teaches V aliases
- **WHEN** the source defines `V2=(dc,ch2,dc)` or `V3=(dc,ch3,dc)`
- **THEN** the reference SHALL allow emitting `V2` and `V3`
- **AND** it SHALL state that their internal spaces are targetable `ch-2 sp` and `ch-3 sp` spaces
- **AND** it SHALL state that V2 has written count 4 and V3 has written count 5

#### Scenario: Reference teaches written count versus graph nodes
- **WHEN** the reference explains row or round counts
- **THEN** it SHALL separate graph-produced stitch nodes, chain-space graph nodes, and written stitch-count weight
- **AND** it SHALL state that ordinary mid-round chains count one per chain, while the resulting space node adds no extra count
- **AND** it SHALL state that non-counting beginning chains, joins, repositioning, turns, skips, and picot embellishments in this pattern count 0

#### Scenario: Reference teaches required crochet-dev counts
- **WHEN** the reference explains the `crochet-dev` checks
- **THEN** it SHALL include R1 = replacement dc + 23 dc = 24, R2 = 24 sc + 24 ordinary ch1 = 48, R3 = 12 reps times 4 = 48, R4/R6 = 7 per repeat, R8 = 9 per repeat, and R10/R12 = 10 per repeat

#### Scenario: Reference teaches source-repeat expansion
- **WHEN** a source uses `R13: repeat R11.`, `R14: repeat R12.`, `R15–R18: repeat R11–R14.`, or `R19–R22: repeat R11–R14.`
- **THEN** the reference SHALL require the assistant to emit or preserve accepted source-repeat syntax that the parser expands into actual rounds
- **AND** it SHALL preserve source metadata outside chart rendering semantics when displayed

#### Scenario: Reference teaches progress totals
- **WHEN** the reference explains progress totals for the revised notation
- **THEN** it SHALL state that the progress panel uses the same written-count weight as structured count validation
- **AND** it SHALL state that R2 displays 48, not 24

#### Scenario: Reference preserves non-chart instructions as notes
- **WHEN** a source contains button-loop instructions, sewing instructions, gauge, sector chart presentation, or mixed circular/strip page layout notes
- **THEN** the reference SHALL tell the assistant to preserve them outside the `crochet` block as external notes rather than invent chart syntax

#### Scenario: Reference includes a lace example
- **WHEN** the reference gives examples of supported pattern conversion
- **THEN** it SHALL include at least one example using the original note forms for a counted beginning chain, a non-counting beginning chain, a `ch-1 sp`, V2/V3 internal spaces, a typed target that creates implicit skips, a picot target, a leading current-round `turn`, a source-repeat line, and a motif worked into a chain space

#### Scenario: Reference supports the crochet-dev fenced block directly
- **WHEN** a source uses the chart-relevant `crochet-dev` semantics from R1 through R22 in the original fenced-block marking style
- **THEN** the reference SHALL say those forms are directly accepted by Crochet Weaver
- **AND** it SHALL NOT require rewriting them into concise canonical aliases before parsing

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
