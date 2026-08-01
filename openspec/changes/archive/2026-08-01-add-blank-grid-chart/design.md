## Context

The plugin today has exactly two code-block processors, both built on the same pipeline: parse block source with the `grammar.peggy`-generated parser into a `CrochetAst` (frontmatter `config` + stitch `rows`), validate it against `CHART_BUDGET` (`src/budget.ts`), resolve render/layout options from global settings + frontmatter (`src/options.ts`), then lay out (`src/layout.ts` dispatching on `config.type`) and render SVG (`src/render.ts`). Settings live in `CrochetWeaverSettings` (`src/settings-data.ts`) with a declarative `SETTING_DEFINITIONS` list that drives both the settings tab (`src/settings.ts`) and normalization (`normalizeSettings`).

A blank drafting grid has no stitches at all — it is pure guide geometry (concentric rings + spokes, or a rectangular mesh) sized by counts (`rounds`/`rows` and `columns`). Forcing it through the stitch grammar (`Document = ... rows:Row+`) would require the grammar to accept zero rows and would carry along machinery (repeat/group nesting, stitch-count budgets, progress-tool/pattern-text embedding, highlight-on-current-position) that has no meaning without stitches.

## Goals / Non-Goals

**Goals:**
- Render a blank polar (rings + spokes) or rectangular (mesh) drafting grid from a small, frontmatter-only code block.
- Reuse existing sizing/appearance settings (`scale`, `strokeWidth`, `ringSpacing`) and the existing settings-tab/i18n/normalization patterns wherever they already fit, rather than inventing parallel concepts.
- Apply the same safety-limit and inline-error conventions the `crochet` block already uses, scaled to this feature's own inputs (`rounds`, `columns`, `rows`).
- Offer a command that inserts a ready-to-edit `crochet-grid` block, so a user gets a working grid without hand-typing frontmatter.

**Non-Goals:**
- No stitch symbols, progress tracking, embedded tool/text panels, or highlight-current-position for grid blocks.
- No custom modal/properties dialog (like the reference screenshot's floating Properties panel) for editing rounds/columns after insertion — editing is via the code block's frontmatter text, consistent with every other chart option in this plugin.
- No change to `grammar.peggy`, the stitch parser, or the existing `crochet`/`crochet-tool` block behavior.

## Decisions

- **New `crochet-grid` block, not a `type: grid` value inside the existing `crochet` block.** Rejected extending `type` because (a) `Document = __ meta:Frontmatter? rows:Row+` requires at least one stitch row, so a zero-stitch grid would need a grammar change touching the shared parser used by the 200-row/1000-quantity/500-repeat safety limits; and (b) a blank grid has no rows for `tool`/`text` panel embedding or current-position highlighting to attach to, so folding it into `crochet` would mean those features silently no-op for `type: grid`, an inconsistency users would have to learn. A separate, smaller block keeps the stitch pipeline untouched and the grid pipeline trivial.
- **Hand-written flat `key: value` config parser, not a `grammar.peggy` extension.** The grid block only ever needs a frontmatter-shaped config (`shape`, `rounds`, `columns`, `rows`), so a small dedicated parser (mirroring the existing `Frontmatter`/`ConfigLine` rules structurally, but standalone) avoids growing the stitch grammar for an unrelated feature.
- **Reuse `scale`, `stroke`, and `spacing` frontmatter keys and their global settings.** `spacing` (→ `ringSpacing`) becomes the ring-to-ring gap for `shape: polar` and doubles as the cell size for `shape: rect`, so both shapes size consistently with existing round/spiral charts and no new "cell size" concept is needed. `scale` and `stroke` resolve exactly as they do today via `resolveOptions`.
- **New settings are limited to the four values a grid can't get anywhere else:** `gridDefaultShape`, `gridDefaultRounds`, `gridDefaultColumns`, `gridDefaultRows`. No new color setting — grid lines use `currentColor` (like stitch symbols already do) so they follow the active Obsidian theme automatically.
- **New, smaller safety-limit constants**, following the `CHART_BUDGET` pattern rather than reusing it directly (`maxStitchCount`/`maxRepeatCount`/`maxDepth` don't apply): `maxGridRounds: 40`, `maxGridColumns: 72`, `maxGridRows: 40`. These bound SVG element count (well under `maxRenderItems: 5000`) while comfortably covering realistic drafting use.
- **The insert command writes a plain text template** (a `crochet-grid` block pre-filled with the resolved defaults) at the cursor via the editor API, rather than opening a custom properties dialog. The existing plugin has no modals anywhere; every other option is edited as code-block frontmatter text, and the settings tab already provides the "change your defaults" surface. A dialog would be a one-off UI pattern for a single feature.

## Risks / Trade-offs

- [Two similar-but-separate block pipelines (stitch vs. grid) increase surface area] → Mitigation: the grid pipeline is intentionally minimal (no layout engine reuse beyond geometry constants like `BASE_RADIUS`/ring math), so the duplication is small and contained to one new module.
- [Users might expect `rounds`/`columns` on a grid block to somehow relate to an actual pattern's row count] → Mitigation: docs/README and the block's own naming (`crochet-grid`, not `crochet`) make clear this is a blank canvas, not a rendering of pattern text.
- [Reusing `spacing` for two different meanings (ring gap vs. cell size) could confuse users reading settings copy] → Mitigation: settings-tab description text for `ringSpacing` is updated to mention both uses; frontmatter behavior is unchanged (same key, same global default) so existing `crochet` blocks are unaffected.
