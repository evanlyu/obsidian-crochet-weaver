# Crochet Weaver — Full Feature Demo

This note exercises every feature of Crochet Weaver in one place: all three chart types (including book-style round charts), every supported stitch, row modifiers and anchors, the row-to-row connector line, error handling, the progress tool (standalone and embedded) — including its readable pattern-text style and yarn color changes — panel positioning, frontmatter overrides, and a real pattern conversion. Open it with the plugin enabled to see every block render.

## 1. Chart Types

### Flat

`type: flat` lays rows out in an alternating back-and-forth path (see the row connector line in section 4).

```crochet
---
type: flat
---
R1: 10 ch
R2: 10 sc
R3: 10 dc
```

### Round

`type: round` lays each row out as a concentric ring around a center anchor.

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

### Spiral

`type: spiral` continues every row along one uninterrupted spiral instead of resetting to a new ring per row.

```crochet
---
type: spiral
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

## 2. Stitches

### Reference table: the 32 stitches added in this update

The library started with 14 basic names (`ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `MR`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `inc`, `dec`) and grew to 46 with these 32 additions, matching standard US/JIS crochet chart symbol references:

| Symbol | Category | Description |
| --- | --- | --- |
| `picot` | Basic | Ch-3 picot |
| `rsc` | Basic | Reverse single crochet (crab stitch) |
| `sc2tog`, `sc3tog` | Decrease | Single crochet 2/3 together |
| `hdc2tog`, `hdc3tog`, `hdc4tog`, `hdc5tog` | Decrease | Half double crochet 2–5 together |
| `dc2tog`, `dc3tog`, `dc4tog`, `dc5tog` | Decrease | Double crochet 2–5 together |
| `fpsc`, `fphdc`, `fptr` | Post stitch | Front post sc/hdc/tr (fpdc already existed) |
| `bpsc`, `bphdc`, `bptr` | Post stitch | Back post sc/hdc/tr (bpdc already existed) |
| `xhdc`, `xdc`, `xtr` | Crossed | 1-stitch crossed hdc/dc/tr |
| `hdc2cl`, `hdc3cl`, `hdc5cl` | Cluster/puff | 2/3/5-hdc cluster (puff) |
| `dc2cl`, `dc3cl`, `dc5cl` | Cluster/puff | 2/3/5-dc cluster |
| `tr2cl`, `tr3cl`, `tr5cl` | Cluster/puff | 2/3/5-tr cluster |
| `hdc popcorn`, `tr popcorn` | Popcorn | 5-hdc/5-tr popcorn (dc popcorn already existed as `popcorn`) |

N-into-one increases and shells (the V/fan symbols) aren't new stitch names — the existing group syntax `(dc, dc)` / `(5 dc)` already draws them; see the last block below.

### Every supported symbol

Basic stitches — five heights (sc through dtr) read taller as more yarn-over slashes appear:

```crochet
---
type: flat
---
R1: ch, sc, hdc, dc, tr, dtr, sl st, MR, picot, rsc, inc, dec
```

Post stitches (front/back at every height) and crossed stitches:

```crochet
---
type: flat
---
R1: fpsc, fphdc, fpdc, fptr, bpsc, bphdc, bpdc, bptr, xhdc, xdc, xtr
```

N-together decreases (these also pick up the inc/dec accent highlight):

```crochet
---
type: flat
---
R1: sc2tog, sc3tog, hdc2tog, hdc3tog, hdc4tog, hdc5tog, dc2tog, dc3tog, dc4tog, dc5tog
```

Clusters, puffs, bobbles, and popcorns:

```crochet
---
type: flat
---
R1: hdc2cl, hdc3cl, hdc5cl, dc2cl, dc3cl, dc5cl, tr2cl, tr3cl, tr5cl, bobble, hdc popcorn, popcorn, tr popcorn
```

N-into-one increases and shells are written as groups — `(dc, dc)` or `(5 dc)` renders the V/shell fan symbol directly, so they need no dedicated names:

```crochet
---
type: flat
---
R1: 3 sc, (hdc, hdc), 3 sc, (dc, dc, dc), 3 sc, (5 dc), 3 sc
```

### Quantity prefixes

A leading number repeats a stitch that many times.

```crochet
---
type: flat
---
R1: 10 ch, 6 sc, 3 dc
```

### Repeats — `[...] x N`

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6
```

### Groups — `(...)`, multiple stitches into one stitch

Groups fan out from a single anchor point — useful for shells, corners, and clusters.

```crochet
---
type: flat
---
R1: 5 sc, (dc, ch, dc), 5 sc
```

## 3. Row Modifiers and Anchors

### Back loop only / front loop only

`blo` and `flo` mark the whole row.

```crochet
---
type: round
---
R1: 6 sc in MR
R2: blo, [inc] x 6
R3: flo, [sc, inc] x 6
```

### Magic ring vs. chain ring center

`in MR` (magic ring):

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
```

`in ch ring` (small ring of chains instead of a magic ring):

```crochet
---
type: round
---
R1: 6 sc in ch ring
R2: [inc] x 6
```

### Joining a round

A trailing `sl st` is drawn as a join between the last and first stitch of that round, and is excluded from the round's stitch-count spacing.

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6, sl st
```

## 4. Row Connector (the "S" turning path)

`type: flat` rows alternate direction; a faint arrowed line connects the end of one row to the start of the next so the back-and-forth working path reads at a glance.

```crochet
---
type: flat
---
R1: 8 sc
R2: 8 sc
R3: 8 sc
R4: 8 sc
```

## 5. Error Handling

### Syntax errors show line and column

`chain` is not a supported stitch name (it's `ch`) — this fails to parse and reports exactly where.

```crochet
R1: 10 chain
```

### Safety limits

Extremely large row counts, stitch counts, repeat counts, nesting depth, or total rendered stitches are rejected with an inline error instead of freezing the preview. Current limits: 200 rows, 1000 per quantity prefix, 500 per repeat, 5000 total rendered stitches, 8 levels of nesting — see the README for details. Not demonstrated here since a chart that size isn't useful to render.

## 6. Progress Tool

### Standalone `crochet-tool` block

A checklist with row-by-row shorthand, a progress bar, and a per-row stitch counter — no chart.

```crochet-tool
---
type: round
id: demo-standalone-tool
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

### Embedded tool — `tool: on`

Same pattern, chart and tool together in one block — no need to write it twice. The chart also highlights your current row and target stitch live as you use the tool.

```crochet
---
type: round
tool: on
id: demo-embedded-tool
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

### Embedded read-only text — `text: on`

The shorthand list without progress tracking — for when you just want the notation next to the picture.

```crochet
---
type: round
text: on
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
```

### Readable pattern text style — `readable: on`

By default the tool and text panel show the shorthand you typed (`6 sc in MR`). `readable: on` translates it into full, localized stitch names instead (e.g. `短針6` for Traditional Chinese, `single crochet6` for English) — override the global "Pattern text style" setting for one chart. The anchor leads and wraps the rest: `魔術環(短針6)` rather than trailing it like the raw form does.

```crochet
---
type: round
tool: on
readable: on
id: demo-readable-text
---
R1: 6 sc in MR
R2: [inc] x 6
```

### Stitch counter and `inc`/`dec` weight

`inc` is one physical stitch worth 2 output stitches, so tapping `+` on an `inc` target advances the counter by 2 in a single tap (the button label shows `+2`) instead of requiring two taps — try it on R2 below.

```crochet
---
type: round
tool: on
id: demo-stitch-counter-weight
---
R1: 6 sc in MR
R2: [inc] x 6
```

## 7. Panel Position

`position: right` (default) and `position: left` sit beside the chart and wrap to a stacked layout on narrow widths; `position: below` always stacks.

`position: left`:

```crochet
---
type: round
tool: on
position: left
id: demo-position-left
---
R1: 6 sc in MR
R2: [inc] x 6
```

`position: below`:

```crochet
---
type: round
tool: on
position: below
id: demo-position-below
---
R1: 6 sc in MR
R2: [inc] x 6
```

## 8. Frontmatter Overrides

`scale`, `stroke`, `spacing`, `highlight`, and `rotation` override the matching global setting for one chart only.

```crochet
---
type: round
scale: 1.5
stroke: 2
spacing: 40
highlight: on
rotation: all
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
```

## 9. Real Pattern Conversion

A common written amigurumi opening:

```text
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
```

Converted to Crochet Weaver syntax, with the progress tool embedded for working the piece:

```crochet
---
type: round
tool: on
id: demo-amigurumi-ball-opening
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

## 10. Progress Identity

Set an explicit `id:` (used throughout this file, e.g. `demo-embedded-tool`) so progress survives edits to the pattern text. Without one, Crochet Weaver derives a hash from the block's own content, and editing that content can reset progress — try removing `id: demo-standalone-tool` above and see the id-derivation note in the README's Quick Start section.

## 11. Blank Drafting Grid

`crochet-grid` blocks render a blank grid for sketching a new design by hand — no stitches, no progress tracking, just guide geometry. Use the **Insert blank crochet grid** command (Command Palette) to drop in a starter block pre-filled with your grid-default settings.

### Polar shape (default) — concentric rings + radial spokes

`rounds` sets the ring count, `columns` sets the spoke count.

```crochet-grid
shape: polar
rounds: 6
columns: 12
```

### Rectangular shape — row/column mesh

`rows` by `columns` cells, useful for planning a flat design.

```crochet-grid
shape: rect
rows: 8
columns: 8
```

### Sizing overrides

`scale`, `stroke`, and `spacing` behave the same as they do for `crochet` charts — `spacing` sets the ring gap here instead of the mesh's default cell size.

```crochet-grid
shape: polar
rounds: 8
columns: 16
spacing: 20
stroke: 1
```

### Error handling

A malformed config line (not `key: value`) reports which line is wrong:

```crochet-grid
shape: polar
this is not a config line
```

Excessive `rounds`, `columns`, or `rows` are rejected the same way — current grid limits: 40 rounds, 72 columns, 40 rows.

## 12. Grid Guide Overlay (on a real chart)

`grid: on` draws a faint reference guide *behind a real chart's own stitches*, aligned to its real geometry — different from the blank `crochet-grid` block above, which has no stitches at all.

### Round chart, default alignment

No extra config needed — one guide ring per real round, spokes matching the last round's stitch count.

```crochet
---
type: round
grid: on
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

### Extending the guide beyond the real pattern

`rounds:` (and `columns:`) can extend the guide past the real round count — useful for previewing how many more rounds a design might need. They can only extend the guide, never shrink it below the real extent.

```crochet
---
type: round
grid: on
rounds: 7
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6, sl st
```

### Spiral chart

Spiral has no discrete rounds, so each guide ring approximates "round N" as the radius the spiral reaches by the end of row N.

```crochet
---
type: spiral
grid: on
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
```

### Flat chart

A row/column mesh sized to the chart's real row height and stitch width — a reference frame, not a per-stitch guarantee past row 0 (rows alternate direction).

```crochet
---
type: flat
grid: on
---
R1: 8 sc
R2: 8 sc
R3: 8 sc
R4: 8 sc
```

## 13. Yarn Color Changes

A `color <name>` step — a CSS color name or `#hex` code — marks where a pattern switches yarn. It has no width of its own (it doesn't count as a stitch) and applies to every stitch from that point on — through the rest of the row and every later row — until another `color` step changes it again; there's no "reset to no color" token.

The stitch symbols themselves stay the chart's normal theme color (painting them the literal yarn color would go illegible in a dark or light theme, and would double up with the progress tool's own current-position highlight below). Instead, the first stitch of each new color gets a small hollow ring in that color, and the tool/text panels spell it out as "change to `<color>`" right where it happens.

```crochet
---
type: round
tool: on
id: demo-color-change
---
R1: color black, 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: 8 sc, color white, 8 sc, color black, 8 sc
```

## 14. Book-Style Round Charts

`style: japanese` switches a round chart to Japanese-pattern-book styling: a continuous spiral guide winds through the rounds (as crochet-in-the-round really is one spiralling line), stepping out to the next round at each starting seam; every stitch sits directly above the previous-round stitch it is worked into (an increase fans its two stitches out from its parent, a decrease converges the parents it merges); the `inc`/`dec` glyphs stretch into wide book-style V/∧ shapes reaching the stitches they connect; and each round is numbered in red at the seam — which drifts diagonally with the increases, just like a printed chart. The default `style: radial` keeps the original evenly spread layout; the global **Round chart style** setting changes the default for every chart.

```crochet
---
type: round
style: japanese
---
R1: 8 sc in MR
R2: [inc] x 8
R3: [sc, inc] x 8
R4: [2 sc, inc] x 8
R5: [3 sc, inc] x 8
R6: [4 sc, inc] x 8
```

Decreases converge the same way:

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [inc] x 6
R3: 12 sc
R4: [dec] x 6
```

## 15. Round Chart Styles, Side by Side

The same six rounds in each of the three styles. Everything else — spacing, scale, stitch symbols — is identical, so the only difference is how a round chart is drawn.

`style: radial` — each round's stitches spread evenly from the centre, with the stock `inc`/`dec` glyphs. It shows what a round contains, not which stitch is worked into which.

```crochet
---
type: round
style: radial
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
R5: [3 sc, inc] x 6
R6: 30 sc
```

`style: japanese` — the traditional pattern-book chart: a spiral guide encloses each round, every stitch sits over the stitch it is worked into, an increase is the V and a decrease the ∧, and each round is numbered in red beside the round-change step.

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
R5: [3 sc, inc] x 6
R6: 30 sc
```

`style: continuous` — the same layout, with every stitch drawn as itself and a line from each shaping stitch down to the stitch it is worked into. Useful for checking a conversion, or for reading a chart without knowing the printed symbols.

```crochet
---
type: round
style: continuous
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
R5: [3 sc, inc] x 6
R6: 30 sc
```

## 16. Shaping a Whole Piece

An amigurumi ball worked from the top down: increase rounds, straight rounds, then decrease rounds mirroring the increases. Watch how each ∧ converges onto the two stitches it closes over, and how the seam channel keeps the same width all the way out.

```crochet
---
type: round
style: japanese
tool: on
id: demo-ball
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
R5: 24 sc
R6: 24 sc
R7: [2 sc, dec] x 6
R8: [sc, dec] x 6
R9: [dec] x 6
```

A flat triangle, shaped at one edge only — each row one stitch shorter than the last:

```crochet
---
type: flat
---
R1: 10 sc
R2: 8 sc, dec
R3: 7 sc, dec
R4: 6 sc, dec
R5: 5 sc, dec
```

## 17. Worked in Taller Stitches

Rings are sized from the symbols they draw: the same twelve stitches need a longer ring as double crochet than as single crochet, and a round opening with `ch 3` gets room for all three chains at its seam.

```crochet
---
type: round
style: japanese
---
R1: ch 3, 12 dc in MR, sl st
R2: ch 3, [dc, inc] x 6, sl st
R3: ch 3, [2 dc, inc] x 6, sl st
```

A flat swatch climbing through the heights — chain foundation, then single, half double, double and treble crochet:

```crochet
---
type: flat
---
R1: 12 ch
R2: 12 sc
R3: 12 hdc
R4: 12 dc
R5: 12 tr
```

## 18. A Granny Square

Shells worked into the spaces of the round below. Groups `( ... )` put several stitches into one place; the `ch` between them is the corner space.

```crochet
---
type: round
style: japanese
---
R1: ch 3, [(3 dc), ch] x 4, sl st
R2: ch 3, [(3 dc), ch, (3 dc), ch] x 4, sl st
R3: ch 3, [(3 dc), ch, (3 dc), ch, (3 dc), ch] x 4, sl st
```

## 19. Textured Stitches in Context

Post stitches, popcorns, clusters and crossed stitches, each in a round of plain stitches so the symbol is easy to pick out.

```crochet
---
type: round
style: japanese
---
R1: 12 dc in MR
R2: [dc, fpdc, dc, bpdc] x 3
R3: [3 dc, popcorn] x 3
R4: [3 dc, dc3cl] x 3
R5: [2 dc, xdc] x 4
```

A picot edging and a crab-stitch (reverse single crochet) border, worked flat:

```crochet
---
type: flat
---
R1: 12 sc
R2: [3 sc, picot] x 3
R3: 12 rsc
```

## 20. Colorwork

Yarn changes mid-round, each marked with a ring in the new color on the first stitch worked in it. The color is whatever the pattern says — a name or a hex value.

```crochet
---
type: round
style: japanese
tool: on
id: demo-colorwork
---
R1: 6 sc in MR
R2: [inc] x 6
R3: color #e8734a, 6 sc, color #f2c14e, 6 sc
R4: color #6ab04c, 9 sc, color #4a90d9, 9 sc
```

## 21. Repeat Forms

Three ways to write the same kind of round, and one that is worked out from the round below.

```crochet
---
type: round
---
R1: 12 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] rep 6
R4: [3 sc, inc] rep
```

`x 6` and `rep 6` are the same thing. A bare `rep` repeats until the round below is used up — R4 works into R3's 24 stitches, four at a time, so it repeats six times. If the round below does not divide evenly by one repeat, the chart says so with the numbers involved instead of guessing a count.

## 22. When It Cannot Be Charted in One Piece

A closed 3D shape — a ball, a head, a bag — cannot be read as one top-down round chart: the increase rounds, the straight rounds and the decrease rounds all overlap on the page. Chart the part that reads well, and let the progress tool carry the rest of the pattern as text.

```crochet
---
type: round
style: japanese
text: on
id: demo-partial-chart
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

```crochet-tool
---
id: demo-partial-rest
---
R5: 24 sc
R6: 24 sc
R7: 24 sc
R8: [2 sc, dec] x 6
R9: [sc, dec] x 6
R10: [dec] x 6
```
