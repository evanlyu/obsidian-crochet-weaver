## Context

`layoutRound`/`layoutSpiral`/`layoutFlat` each build a raw `RenderItem[]` in their own coordinate convention (round/spiral centered on the origin; flat starting at the origin and growing in -y per row), then call `normalize()` (`src/layout/normalize.ts`), which computes a bounding box from the items (padded by each symbol's visual extent), shifts everything into positive coordinates, and returns the final `LayoutResult` (`items`, `width`, `height`, optional `rowConnectors`). `renderSVG` (`src/render.ts`) then draws symbol `<use>` elements and row connectors from that result.

The standalone `crochet-grid-chart` capability already defined reusable guide-geometry shapes (`GridCircle { cx, cy, r }`, `GridLine { x1, y1, x2, y2 }` in `src/types.ts`) and a plain SVG renderer for them (`src/grid/render.ts`). This change reuses those same shapes for a guide layer computed *inside* the real chart's layout, not the separate blank-grid module.

## Goals / Non-Goals

**Goals:**
- Let a `crochet` chart draw round-guide circles (round/spiral) or a row/column mesh (flat) that lines up with the chart's real geometry, with zero extra config in the common case.
- Let `rounds`/`rows` and `columns` frontmatter keys extend the guide beyond the real pattern's extent (never below it), for previewing unwritten rounds/rows.
- Keep the guide layer purely additive: computed once per layout call, shifted through the same `normalize()` pass as everything else, rendered as one faint background layer before the stitch symbols.

**Non-Goals:**
- No per-stitch column alignment for `type: flat`'s zigzag rows beyond row 0 — the mesh is a reference frame over the chart's real bounding box (row height x stitch width cells), not a guarantee that every individual stitch sits exactly on a mesh intersection past the first row.
- No interaction between this guide and the standalone `crochet-grid` block/module — they share geometry *types* only, not code paths.
- No frontmatter override for the guide's color/opacity (styled once via `.crochet-weaver-grid-guide` in `styles.css`, following the same "global-only" precedent as `nextRoundMarkerColor`/`chartMarkerColor`).

## Decisions

- **Guide geometry is computed inside each `layout*` function, in the same raw (pre-`normalize`) coordinate space as the stitch items**, then passed into an extended `normalize(items, rowConnectors, gridGuide)` that both bbox-expands to include the guide (so an extended `rounds:`/`rows:` override isn't clipped) and shifts the guide by the same `(dx, dy)` as everything else. Computing it in a separate, later pass would require re-deriving each round's radius or each row's y-position from scratch; computing it inline reuses values already in hand (e.g., `layoutRound`'s running `radius` variable).
- **Round guide radii come from the actual per-round radius already computed by `nextRadius`, not a fresh formula.** This guarantees the guide ring for round N always matches exactly where round N's stitches really are. Extra rings beyond the real round count continue stepping by the resolved `ringSpacing`, matching the "every round moves outward by at least one ring-spacing step" rule the real layout already follows.
- **Spiral has no discrete rounds, so its guide ring for "round N" is the radius reached at the end of row N** (the spiral's continuous radius at that row boundary) — an approximation, called out in the spec as "the radius reached at the end of that row," not a claim of exact round alignment (a spiral doesn't have discrete rounds).
- **Guide columns (spokes) default to the last real round's/row's stitch count**, so by default the spokes land on the actual outer stitch positions — a second free alignment beyond just the ring radii. An explicit `columns:` override breaks that alignment intentionally (the user asked for a specific spoke count).
- **Flat guide is a simple axis-aligned mesh over the chart's real bounding box**, using `ROW_HEIGHT`/`STITCH_WIDTH` as the cell size, not a per-row zigzag-aware alignment. Rejected: mirroring each row's actual alternating start/direction — the added complexity (and resulting jagged, hard-to-read mesh) isn't worth it for what's meant to be a lightweight reference frame; a plain mesh already answers "roughly which row/column am I in."
- **`grid`/`showGrid` follows the same boolean frontmatter-override-of-global-setting pattern as `highlight`/`tool`/`text`.** `rounds`/`rows`/`columns` are frontmatter-only (no global default setting) since "extend beyond the real pattern by N" is inherently per-pattern, not a sensible global default.
- **No new color setting.** The guide uses a fixed muted style (`.crochet-weaver-grid-guide { opacity: ...; color: var(--text-faint) }`), consistent with how "reference, not content" elements should recede visually — same reasoning as the existing row-connector line's low opacity.

## Risks / Trade-offs

- [A `rounds:`/`rows:` override far beyond the real pattern inflates the chart's bounding box, making the real stitches look tiny] → Mitigation: this is the intended, requested behavior (previewing headroom); no clamping beyond the existing `GRID_BUDGET`-style safety limits (reused/mirrored here to prevent pathological input) is applied to visual proportion.
- [Flat mesh not aligning with every real stitch after row 0 could read as a bug rather than an intentional reference frame] → Mitigation: documented explicitly in the README as "a reference frame, not a per-stitch guide," matching the Non-Goals above.
- [Reusing `GridCircle`/`GridLine` types across two otherwise-unrelated modules (`crochet-grid-chart` and this change) could tempt future unification that isn't warranted] → Mitigation: called out explicitly in Non-Goals that the two stay separate code paths; shared types only.
