# Changelog

All notable changes to Crochet Weaver are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions match the plugin's `manifest.json`.

## [1.1.0]

### Added

- **Blank drafting grid (`crochet-grid` block)**: a new code-block language for sketching a design by hand, independent of any pattern — a blank polar grid (`shape: polar`, concentric rings + radial spokes sized by `rounds`/`columns`) or a rectangular mesh (`shape: rect`, sized by `rows`/`columns`). New global settings (`gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, `gridDefaultRows`) and an **"Insert blank crochet grid"** command that drops in a starter block pre-filled with your defaults.
- **Grid guide overlay on real charts (`grid: on`)**: any `crochet` block can now draw a faint reference guide behind its own stitches, aligned to the chart's real geometry — concentric round guides for `type: round`/`spiral` (spokes default to the outer round's stitch count), or a row/column mesh for `type: flat`. The guide matches the pattern's real extent by default; `rounds`/`rows` and `columns` frontmatter keys let it extend *beyond* the written pattern (e.g. to preview how many more rounds a design might need) but never shrink below it. New **"Show background grid guide"** global setting.
- **32 new stitch symbols**, bringing the supported library to 46: `picot`, `rsc` (reverse single crochet / crab stitch); N-together decreases `sc2tog`, `sc3tog`, `hdc2tog`–`hdc5tog`, `dc2tog`–`dc5tog`; post stitches `fpsc`, `fphdc`, `fptr`, `bpsc`, `bphdc`, `bptr`; crossed stitches `xhdc`, `xdc`, `xtr`; clusters/puffs `hdc2cl`/`3cl`/`5cl`, `dc2cl`/`3cl`/`5cl`, `tr2cl`/`3cl`/`5cl`; and popcorns `hdc popcorn`, `tr popcorn`. The `highlightIncDec` accent now also covers the new N-together decreases.
- Safety limits for the grid features (max 40 rounds, 72 columns, 40 rows) so a mistyped override can't generate an unbounded SVG, matching the existing pattern-chart budget checks.

### Changed

- Rewrote the stitch-name guidance in the AI pattern-authoring reference (`docs/ai-pattern-authoring.md`) and the `crochet-weaver-pattern` skill's fallback cheat sheet: previously both told an assistant to collapse every decrease into `dec` because dedicated tog/cluster tokens didn't exist yet.
- The flat-chart row-connector ("S" turning path) line is now more visible (`opacity: 0.5`, up from `0.2`).
- `README.md` (and its zh-TW/zh-CN/ja translations): stitch list replaced with a full reference table; new sections documenting the blank grid block and the grid guide overlay; updated Settings and Safety Limits sections.

### Notes

- All additions are backward compatible — existing `crochet`/`crochet-tool` blocks render identically; `grid`, `showGrid`, and the new stitch names are opt-in.
- No settings migration needed; new settings default to off/unused until configured.

## Earlier versions

Versions prior to 1.1.0 (1.0.0, 1.0.1) predate this changelog — see the git history for details.
