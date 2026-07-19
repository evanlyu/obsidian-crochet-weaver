# Crochet Weaver — Full Feature Demo

This note exercises every feature of Crochet Weaver in one place: all three chart types, every supported stitch, row modifiers and anchors, the row-to-row connector line, error handling, the progress tool (standalone and embedded), panel positioning, frontmatter overrides, and a real pattern conversion. Open it with the plugin enabled to see every block render.

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

### Every supported symbol

`ch`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `sl st`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `inc`, `dec`, `MR` — five stitch heights (sc through dtr) read taller as more yarn-over slashes appear.

```crochet
---
type: flat
---
R1: ch, sc, hdc, dc, tr, dtr, sl st, fpdc, bpdc, bobble, popcorn, inc, dec
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

### Next-round marker

Shown by default at the first stitch of the next round on concentric charts — toggle and recolor it from plugin settings (**Show next round marker** / **Next round marker color**).

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
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
