## 1. Grammar

- [x] 1.1 Add the 32 new stitch names to `StitchName` in `src/grammar.peggy`, ordering every longer name before its prefix (`hdc popcorn`/`hdc5tog`/`hdc2cl` before `hdc`; `sc2tog` before `sc`; `dc2tog`/`dc2cl` before `dc`; `tr2cl`/`tr popcorn` before `tr`)
- [x] 1.2 Regenerate the parser via `npm run generate-parser` (happens automatically in test/build scripts)

## 2. Rendering

- [x] 2.1 Add SVG symbol specs to `SYMBOLS` in `src/render.ts` for all 32 names: post hooks on the fpdc/bpdc pattern, crossed legs with per-height ticks, tog legs joined at top, cluster ellipses with interior legs and yarn-over bars, hdc/tr popcorn cups. Also exported `supportedSymbolNames()` so tests can enumerate the library.
- [x] 2.2 Extend `ACCENT_STITCHES` with the ten `*tog` names

## 3. Layout

- [x] 3.1 Add `SYMBOL_EXTENT` entries for all 32 names following the height ladder (`src/layout/constants.ts`)
- [x] 3.2 Add `rsc` to `FIXED_ORIENTATION` (`src/layout/constants.ts`)

## 4. Tests

- [x] 4.1 New `tests/stitches.test.ts`: sweep every supported stitch name through parse → flat layout → `renderSVG`, asserting the stitch node name round-trips and the `<use>` href resolves to a real `<defs>` symbol id in the same SVG; plus an all-names-in-one-row prefix-shadowing test
- [x] 4.2 Update `tests/parser.test.ts` to cover one representative of each naming family; quantity + compound (`3 dc2tog`, `2 hdc popcorn`) and prefix-shadowing cases live in `tests/stitches.test.ts`
- [x] 4.3 Add a `tests/render.test.ts` case asserting a `*tog` item gets `crochet-weaver-accent` when `highlightIncDec` is on (and that clusters do not)

## 5. Docs

- [x] 5.1 Replace the bulleted stitch list with a full reference table (symbol/category/description) in `README.md`, `README.zh-TW.md`, `README.zh-CN.md`, `README.ja.md`, and document that N-into-one increases/shells are written with group syntax `(dc, dc)` / `(5 dc)`
- [x] 5.2 Add a "32 stitches added in this update" reference table to `examples/demo.md` (section 2) alongside the existing rendered demo blocks, grouped by category; the vault's root `demo.md` already mirrors this file 1:1 (confirmed byte-identical after the edit)
- [x] 5.3 Rewrite the stale stitch-name/decrease guidance in `docs/ai-pattern-authoring.md` (the "no hdc2tog/dc3tog token" line was no longer true) and the compressed fallback cheat sheet in `.claude/skills/crochet-weaver-pattern/SKILL.md`: full 46-name reference, explicit `dec` vs. `sc2tog`/`hdc*tog`/`dc*tog` decision guidance, cluster-vs-decrease ambiguity note, post/crossed/popcorn/picot/rsc phrase-table rows, updated counting rule and output checklists

## 6. Release

- [x] 6.1 Bump version to 1.1.0 in `manifest.json`, `package.json`, `package-lock.json` (root `version` fields only — not dependency versions), and add a `1.1.0` entry to `versions.json`
- [ ] 6.2 Cut an actual GitHub release (tag + release notes) — not done as part of this change; only the version numbers were bumped

## 7. Verification

- [x] 7.1 Run `npm run lint` and `npm test` and fix any failures (171 tests passing; 1 pre-existing deprecation warning unrelated to this change)
- [x] 7.2 Run `npm run build` so the vault's symlinked `main.js` picks up the new library
