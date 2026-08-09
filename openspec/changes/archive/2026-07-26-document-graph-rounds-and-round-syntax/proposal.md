## Why

Round charts inferred their shape from stitch *counts*: a round of 6 becoming a round of 7 says an increase happened, but not where, so increases and decreases were drawn as stock glyphs spread evenly around the round and rarely landed near the stitches they actually belonged to. Against real patterns (a lemon-slice motif, a penguin head, a 15-round basket) the chart stopped corresponding to the pattern within a few rounds.

This change rebuilds round layout on a real stitch graph — every stitch knows which previous-round stitch(es) it is worked into — and draws shaping the way Japanese pattern books do, as a symbol of its own round. Alongside it, the pattern language now accepts several forms real patterns are written in that the parser rejected outright (`rep`, a round's opening chain, suffix stitch counts, every spelling of a slip stitch).

Like `document-usability-and-color-updates`, this work was done conversationally against a running vault rather than propose-first, so this change is written retroactively to bring the spec baseline back in line with what ships.

## What Changes

- Add a stitch-graph layer (`src/layout/graph.ts`): every stitch has an identity, the previous-round stitches it is worked into, and the next-round stitches worked into it; the first round records the center ring as its source. `validateStitchGraph()` reports skipped, twice-used, orphaned, and unconsumed stitches as facts about the pattern before anything is drawn.
- Position each round from that ancestry instead of spreading it evenly: plain stitches sit over their parent, an increase's pair straddles the stitch below, a decrease sits between the stitches it merged (wrap-safe across the 0°/360° seam). Working order is a hard constraint; a minimum per-pair gap keeps symbols from colliding; leftover slack is shared among the plain stitches near the shaping.
- Draw shaping as a symbol **of its own round**, in line with the plain stitches (`style: book`): `inc` is a V rooted on the round's inner edge with arms reaching its outer edge, `dec`/`scNtog` is a ∧ with feet on the stitches it closed over. Nothing floats between rounds; each mark is sized to its round's band.
- Add a third round style, `linked`: the same layout, but every stitch keeps its own symbol and lines connect it to the stitch below it.
- **Remove the "Symbol rotation" setting and the `rotation` frontmatter key.** Round-chart symbols always face outward, which is the only orientation in which BLO/FLO loop bars point at the right side of the stitch.
- Add an **"Increase and decrease color"** setting (`highlightColor`, default `#8b5cf6`) for the accent applied when increase/decrease highlighting is on.
- Extend the pattern language: `rep N` / `repN` / `x N` / `xN` repeat counts; a **bare `rep`** inferred from the round below, with explicit errors when it doesn't divide evenly or has no previous round; stitch counts on either side of the name (`6 sc`, `sc6`, `sc 6`); `sl st` / `slst` / `sl-st` / `sl_st`; a round's opening `ch` and a `mr` written as a step, both drawn but excluded from the round's stitch total, as is the closing `sl st`.
- Update the four-language README and AI pattern-authoring reference (plus its bundled copy) for the new syntax, the third round style, and the removed rotation setting.

## Capabilities

### Modified Capabilities
- `crochet-pattern-syntax`: repeat-count forms including the inferred bare `rep`; suffix stitch counts; slip-stitch spellings; the round's opening chain / `mr` step and what does and does not count toward a round's stitch total.
- `crochet-chart-rendering`: graph-driven round placement; book and linked round styles; shaping drawn in-band; symbols always facing outward (rotation setting removed); the configurable increase/decrease accent color.
- `ai-pattern-authoring-reference`: the reference documents the new syntax and the third round style.

## Impact

- Affected source: `src/layout/graph.ts`, `angles.ts`, `round-graph.ts`, `shaping.ts`, `links.ts` (all new), `src/layout/{round,polar,steps,constants}.ts`, `src/resolve-repeats.ts` (new), `src/parse-chart.ts`, `src/grammar.peggy` (regenerates `src/parser.ts`), `src/render.ts`, `src/types.ts`, `src/options.ts`, `src/settings.ts`, `src/settings-data.ts`, `src/i18n.ts`, `src/budget.ts`, `styles.css`.
- Docs: `README.md` + three translations, `docs/ai-pattern-authoring*.md` (four files) and the generated `src/ai-doc-content.ts`, `CHANGELOG.md` (1.3.0 entry).
- Persisted data: `highlightColor` defaults to the previous hard-coded accent; the removed `rotation` setting is ignored if present, and a `rotation` frontmatter key is inert rather than an error.
- No version bump beyond the 1.3.0 already in `manifest.json`.
