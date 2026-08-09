## Why

The plugin currently supports 14 stitch symbols (`ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `inc`, `dec`, `MR`), a small subset of standard JIS/US crochet chart notation. Reference symbol charts (Yunchen Studio 勾針用編織圖記號, Dabbles & Babbles crochet symbols chart) list the full standard set — post stitches at every height, crossed stitches, cluster/puff/popcorn families at multiple sizes, and N-together decreases — which real published patterns use constantly. Users converting real patterns hit unsupported-stitch parse errors immediately.

## What Changes

- Expand the pattern grammar and SVG symbol library with 32 new stitch names, covering the reference charts' US-notation symbol set:
  - Basic: `picot` (ch-3 picot / 結粒針), `rsc` (reverse single crochet, crab stitch / 包細編)
  - Post stitches completing the family around existing `fpdc`/`bpdc`: `fpsc`, `fphdc`, `fptr`, `bpsc`, `bphdc`, `bptr`
  - Crossed stitches (交叉針): `xhdc`, `xdc`, `xtr`
  - N-together decreases (併針): `sc2tog`, `sc3tog`, `hdc2tog`–`hdc5tog`, `dc2tog`–`dc5tog`
  - Clusters/puffs (玉針): `hdc2cl`, `hdc3cl`, `hdc5cl`, `dc2cl`, `dc3cl`, `dc5cl`, `tr2cl`, `tr3cl`, `tr5cl`
  - Popcorns (爆米花針): `hdc popcorn`, `tr popcorn` (existing `popcorn` remains the dc popcorn)
- N-into-one increases (the reference charts' V/shell symbols, N針併1針) are intentionally NOT new stitch names: the existing group syntax `(dc, dc)` / `(5 dc)` already renders exactly that fan-from-one-point symbol. Documented instead.
- Extend the `highlightIncDec` accent to also cover the new `*tog` decrease symbols (they are decreases).
- New symbols get SVG definitions, layout extents, and round-chart rotation behavior consistent with their stitch height.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `crochet-pattern-syntax`: the supported stitch-name list grows by 32 names, including multi-word (`hdc popcorn`) and digit-containing (`sc2tog`, `dc3cl`) names that must not collide with quantity-prefix or repeat syntax.
- `crochet-chart-rendering`: each new stitch renders through a chart-local SVG symbol definition; the inc/dec accent highlight extends to `*tog` decreases.

## Impact

- Affected source areas: `src/grammar.peggy` (regenerates `src/parser.ts`), `src/render.ts` (SYMBOLS, accent set), `src/layout/constants.ts` (extents, fixed orientation).
- No settings, i18n-string, tool, or persistence changes: stitch names are notation, not localized text, and the progress tool serializes steps generically.
- Affected tests: `tests/parser.test.ts`, new `tests/stitches.test.ts` (full-library parse/render sweep), `tests/render.test.ts`.
- Docs: stitch reference table in `README.md` + 3 translations, `examples/demo.md`, and the AI pattern-authoring guides (`docs/ai-pattern-authoring.md`, `.claude/skills/crochet-weaver-pattern/SKILL.md`) — both previously said "no hdc2tog/dc3tog token, use dec" for everything, which is no longer accurate.
- Version bump to 1.1.0 (`manifest.json`, `package.json`, `package-lock.json`, `versions.json`) since this is a user-facing feature addition; no GitHub release cut as part of this change.
- Purely additive; all existing pattern text keeps parsing and rendering identically.
