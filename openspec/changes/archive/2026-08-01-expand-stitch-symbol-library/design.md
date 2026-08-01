## Context

Stitch names live in three coordinated places: the Peggy grammar's `StitchName` ordered-choice rule (`src/grammar.peggy`, regenerated into `src/parser.ts`), the `SYMBOLS` map in `src/render.ts` (SVG glyph per name, stamped as chart-local `<defs>` + `<use>`), and `src/layout/constants.ts` (`SYMBOL_EXTENT` half-heights for bounding boxes, `FIXED_ORIENTATION` for round-chart rotation). A name missing from any one of the three either fails to parse, renders as an empty `<use>`, or gets a default extent/rotation.

Two grammar mechanics constrain naming:
- `Stitch = count:Integer? _ name:StitchName ![a-zA-Z0-9_]` — PEG does not backtrack into a succeeded subexpression, so once `StitchName` matches a prefix (`sc` inside `sc2tog`), the trailing word-boundary lookahead fails the whole `Stitch` rule with no retry. Every longer name MUST be listed before its prefix inside `StitchName` itself.
- A leading integer is a quantity (`2 dc` = two dc). Names must not begin with a digit, or `2dc-cl` would lex as quantity 2 × `dc-cl`.

## Goals / Non-Goals

**Goals:**
- Support the full US-notation symbol set from the two reference charts as parseable stitch names with recognizable JIS-style glyphs.
- Keep naming aligned with common US pattern abbreviations (`sc2tog`, `fptr`, `picot`), with digits mid-name (`dc3cl`) rather than leading.
- One completeness test that sweeps every supported name through parse → layout → render and asserts its `<use>` resolves to a real symbol definition, so the three coordinated maps can never silently drift.

**Non-Goals:**
- No dedicated names for N-into-one increases/shells: group syntax `(dc, dc)`, `(5 dc)` already renders the fan symbol; adding `dc2in1`-style names would duplicate an existing capability.
- No chain-arch, joining-bar, direction-of-work, or begin/end meta-symbols from the second chart — arches are just `ch` runs, and the rest are diagram annotations, not stitches.
- No color/spec-line pixel-perfect fidelity to the reference charts; glyphs follow the plugin's existing minimal stroke style and can be visually refined later.

## Decisions

- **Naming scheme.** `*Ntog` for decreases (standard US), `*Ncl` for clusters/puffs (digit mid-name avoids the quantity-prefix collision; "cl" is the standard cluster abbreviation), `fp*`/`bp*` completing the existing post-stitch prefixes, `x*` for crossed stitches, and two-word `hdc popcorn` / `tr popcorn` following the existing `sl st` two-word precedent (existing `popcorn` stays the dc popcorn for backward compatibility, likewise `bobble` and the sc-level `inc`/`dec`).
- **Grammar ordering.** All compound/longer names listed before their prefixes in `StitchName` (`hdc popcorn`, `hdc2tog`…, then `hdc`; `sc2tog` before `sc`; `tr2cl`/`tr popcorn` before `tr`; etc.), per the no-backtracking constraint above.
- **Glyph construction is systematic, not bespoke**: post stitches = base symbol + the existing fpdc/bpdc hook curve; crossed = two crossed legs + per-height yarn-over ticks; togs = legs converging to a joined top (bar for hdc/dc heights, apex × for sc); clusters = ellipse outline + interior legs by count + yarn-over bars by height; popcorns = the existing cup-with-knot shape at hdc/tr heights.
- **Rotation and extents.** `rsc` joins the fixed-orientation set (sc-like, symmetric); everything else rotates outward under `smart` like other tall symbols. Extents follow the established height ladder (sc≈6 → dtr≈13).
- **Accent highlight extends to `*tog`.** They are decreases; the `highlightIncDec` setting's intent ("highlight increases and decreases") covers them. `inc`/`dec` behavior unchanged.
- **Stitch weight stays 1 for all new names.** A `dc2tog` outputs one stitch (weight 1 in the tool's counter); only `inc` outputs 2. Consumption from the previous row is not modeled today for `dec` either, so togs are consistent.

## Risks / Trade-offs

- [Three maps (grammar / SYMBOLS / extents) must stay in sync as the library grows] → Mitigation: the new completeness test derives its list once and asserts parse + symbol-def resolution for every name, failing on any drift.
- [`xdc`-style names are less universal than `sc2tog`] → Mitigation: README documents each name next to its chart-symbol description (crossed dc etc.); grammar cost of adding aliases later is trivial.
- [PEG ordering mistakes silently break short names (`sc` failing after `sc2tog` added)] → Mitigation: the sweep test parses every name, including all short prefixes, in one row.
