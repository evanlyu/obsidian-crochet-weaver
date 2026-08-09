## Why

The completed lace change was still active even though its implementation, tests, README material, and skill content had shipped together. Archiving it exposed a second drift: the main rendering spec still described the older rigid round-number line, fixed-width numbered seam, and one-size-fits-all shaping cap, while the current layout deliberately preserves more stitch ancestry.

The public documentation had drifted independently. Three localized READMEs still named the retired `standard` style, all four READMEs or skills contained an unconditional zero-count statement for beginning chains, localized progress text still described `+1` per stitch instead of written-unit weights, and the skill's frontmatter table omitted current lace, sector, grid, and readable options.

## What Changes

- Record the current numbered-round contract: first stitch at twelve o'clock, a half-degree-per-round inward number guide, bounded extra seam room, and seam correction localized near the opening.
- Record that an increase V keeps its three endpoints on the real parent and child positions, while only a decrease may compact a very wide opening for readability.
- Correct progress-ID requirements to match the runtime's 1–80 character safe-ID grammar and automatic-hash fallback.
- Synchronize all four README and skill languages with current options, style names, beginning-chain counts, weighted progress, and supported UI languages.
- Add documentation conformance tests so current frontmatter, syntax examples, and localized crochet code blocks cannot drift silently.
- Keep the Obsidian pre-1.13 settings fallback while avoiding an internal deprecated `display()` call, and remove stale duplicated or retired-name comments.

## Capabilities

### Modified Capabilities

- `crochet-chart-rendering`: document current numbered-seam ancestry and shaping endpoint behavior.
- `crochet-progress-tool`: document the actual safe explicit-ID and automatic fallback behavior.
- `crochet-pattern-skill`: require the README and all localized skill copies to describe the current executable contract.

## Impact

- OpenSpec archive and main capability specs.
- English, Traditional Chinese, Simplified Chinese, and Japanese README and skill files.
- Generated bundled skill content.
- Documentation and option-resolution tests.
- Settings fallback implementation comments and warning-free refresh path.
