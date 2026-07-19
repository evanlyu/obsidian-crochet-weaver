# Crochet Weaver — AI Pattern Authoring Reference

This document is written **for an AI assistant** (Claude, ChatGPT, or any other model) that a crocheter has asked to convert a written pattern — or write a new one — into Crochet Weaver syntax: the small text language the Crochet Weaver Obsidian plugin's `crochet` / `crochet-tool` code blocks understand.

Paste this whole file into any AI chat, or point an agent at it, before asking it to convert a pattern.

## What you're generating

A Crochet Weaver pattern is a fenced Markdown code block:

````markdown
```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
```
````

The block language is either:
- `crochet` — renders an SVG stitch chart, optionally with an embedded progress panel.
- `crochet-tool` — renders only a progress checklist (row list + stitch counter), no chart. Same pattern syntax inside.

Your job is almost always to produce a `crochet` block. Only use `crochet-tool` if the user explicitly says they don't want a chart, or already has a separate chart block and wants a standalone tracker for it.

## Block anatomy

```
[optional frontmatter block]
R1: <steps>
R2: <steps>
...
```

### Frontmatter

Optional, delimited by `---` lines, flat `key: value` pairs (no nesting, no lists):

| Key | Values | Default | Notes |
|---|---|---|---|
| `type` | `flat` \| `round` \| `spiral` | `flat` | See "Choosing a chart type" below. |
| `id` | any string | derived from block content | Set this whenever you also embed or write a `crochet-tool`/`tool: on` panel, so progress survives edits to the pattern text. |
| `scale` | positive number | plugin setting | Display scale. |
| `stroke` | positive number | plugin setting | SVG stroke width. |
| `spacing` | positive number | plugin setting | Pixel gap between round/spiral rings. |
| `highlight` | `on`/`off`/`true`/`false`/`yes`/`no`/`1`/`0` | plugin setting | Accent-colors `inc`/`dec` stitches. |
| `rotation` | `smart` \| `all` \| `none` | plugin setting | Symbol rotation in round/spiral charts. `smart` is almost always right. |
| `tool` | boolean (as above) | plugin setting | Embeds the interactive progress tool next to the chart. See "Embedding a progress panel". |
| `text` | boolean (as above) | plugin setting | Embeds a read-only shorthand list next to the chart (ignored if `tool` is also on). |
| `position` | `right` \| `left` \| `below` | plugin setting | Where an embedded `tool`/`text` panel sits relative to the chart. |

Any invalid value silently falls back to the plugin's global setting — it will not error, so double-check values you're unsure about rather than relying on a visible failure.

### Rows

```
R1: <steps>
Row 2: <steps>
```

Both `R<n>:` and `Row <n>:` are accepted (case-insensitive on the label word). Row numbers are whatever you write — they don't have to be sequential, but sequential is what every real pattern and every example in this doc uses. **Only row 1's anchor (`in MR` / `in ch ring`) is actually rendered** as the chart's center — you can still write it on other rows for readability in a shared tool/text list, but it has no visual effect there.

Optional row-level modifier, right after the colon, before any steps:

```
R1: blo, 6 sc
R2: flo, 6 sc
```

- `blo` — back loop only for the whole row.
- `flo` — front loop only for the whole row.

Optional trailing anchor, at the very end of the row (only meaningful on row 1):

```
R1: 6 sc in MR
R1: 6 sc in ch ring
```

- `in MR` — magic ring center.
- `in ch ring` — small ring of chain stitches as the center (use when the source pattern says "chain N, join with sl st to form a ring" instead of a magic ring).

### Steps

Comma-separated (commas are optional but keep them — real patterns read better with them). Each step is one of:

**Stitch**, optionally prefixed with a count:

```
sc          → one single crochet
10 ch       → ten chains
```

**Repeat**, square brackets + `x` + count — use whenever the source pattern repeats a unit a fixed number of times:

```
[sc, inc] x 6      → (sc, inc) repeated 6 times
```

**Group**, parentheses — multiple stitches worked into *one* stitch/space (shells, clusters, corners); renders as a fan from a single position:

```
(dc, ch, dc)       → dc, ch, dc all into the same stitch
```

Repeats and groups can nest and contain each other.

### Supported stitch names

**Case-sensitive, lowercase**, except `MR` which is case-insensitive:

`ch` `sc` `hdc` `dc` `tr` `dtr` `sl st` `fpdc` `bpdc` `bobble` `popcorn` `inc` `dec` `MR`

There is no `hdc2tog`/`dc3tog`/etc. token — represent a written "X sts together" decrease as `dec` (it renders as one symbol and counts as producing 1 output stitch, which is what matters for stitch counts and the chart). There is no turning-chain concept — omit `ch 1, turn` / `ch 3, turn` type instructions; they don't change the chart.

## Phrase → token cheat sheet

Use this to translate common written-pattern phrasing. When in doubt, prefer `inc`/`dec` (which are chart-meaningful, weighted stitches) over spelling out "2 sc in next st" as two separate `sc`s — that would double-count stitches and throw off every round after it.

| Written pattern says | Write |
|---|---|
| "magic ring", "magic circle", "adjustable ring" | `in MR` anchor on row 1 |
| "ch 2, join with sl st to form a ring" (or similar) | `in ch ring` anchor on row 1 |
| "2 sc in same st" / "2 sc in next st" / "sc, inc" style increase | `inc` |
| "sc2tog" / "dc2tog" / "invisible decrease" / "2 sts tog" | `dec` |
| "sc in each st around" for a round of N known stitches | `N sc` (write the literal count) |
| "(sc, inc) 6 times" / "repeat 6 times" | `[sc, inc] x 6` |
| "(dc, ch 1, dc) in next st" (shell/corner) | `(dc, ch, dc)` |
| "join with sl st" at the end of a round | trailing `sl st` on that row |
| "working in back loops only" | `blo` after the row label |
| "working in front loops only" | `flo` after the row label |
| "ch 1, turn" / "turn" (flat rows) | omit — no chart effect |

### Worked example

Source (a very common amigurumi ball opening):

```
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
```

Converts to:

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

Sanity-check with the counting rule below: R2 = 6 `inc` × 2 stitches each = 12 ✓. R3 = 6 × (1 + 2) = 18 ✓. R4 = 6 × (2 + 2) = 24 ✓.

## Stitch counting rule (for sanity-checking your conversion)

Crochet Weaver computes a row's stitch count the same way real patterns annotate "(N sc)":

- `inc` = 2 output stitches.
- Everything else (`sc`, `hdc`, `dc`, `tr`, `dtr`, `ch`, `sl st`, `fpdc`, `bpdc`, `bobble`, `popcorn`, `dec`) = 1 output stitch.
- A group `(...)` = sum of its children's weights.
- A repeat `[...] x N` = N × (sum of its children's weights).
- **A trailing `sl st` at the very end of a row is treated as a join and excluded from the count** — don't count it, and don't be surprised the chart doesn't count it either.

After converting, add up each row's stitches and compare to the source pattern's own "(N sc)" annotations. A mismatch almost always means an increase/decrease got flattened into plain stitches (or vice versa) somewhere.

## Choosing a chart type

- **`round`** — concentric rings from a center point. Use for anything worked in the round with joins (hats, coasters, amigurumi pieces, granny squares worked as circles). This is the most common choice for amigurumi.
- **`spiral`** — one continuous spiral, no per-round joins. Use only when the source pattern explicitly says "continuous spiral, do not join, place a stitch marker" — most amigurumi patterns that say "join" or number their rounds discretely should be `round`, not `spiral`.
- **`flat`** — alternating back-and-forth rows. Use for scarves, blankets worked flat, anything turned at the end of each row.

### Known limitation — don't fight it

A top-down `round` chart places every round at least one ring-spacing step farther out than the round before it — including decrease rounds. A decrease round does not shrink the ring back inward; it spreads fewer stitches around a same-or-larger ring instead, so rounds never overlap each other. This means a full pattern (increases, straight rounds, and decreases) can be charted in a single `round` block. What it still **cannot** do is curve back inward into a realistic closed 3D silhouette (e.g. a sphere) — the decrease portion will read as a continuously widening spiral of rings rather than a shape tapering back to a point. This matches how published amigurumi charts work too (they only diagram the flat/increase portion, not the finished 3D shape).

If a pattern's rounds go increase → straight → decrease, it's fine to chart every round in one `round` block — nothing will overlap. Add `tool: on` (or a separate `crochet-tool` block) so the full row-by-row pattern is trackable regardless of how the chart looks.

## Embedding a progress panel

Don't create two code blocks with the same pattern typed twice. Instead, add one frontmatter key to the single `crochet` block:

```crochet
---
type: round
tool: on
id: my-pattern
---
R1: 6 sc in MR
R2: [inc] x 6
```

- `tool: on` — full interactive checklist next to the chart: row-by-row list, progress bar, and a per-row stitch counter (`+1` per stitch made, auto-completes the row on reaching its total). The chart also highlights the current row/stitch live.
- `text: on` — same row list, but read-only (no buttons, no progress, no chart highlight). Use when the person just wants the shorthand next to the picture.
- Always set an explicit `id` when using `tool: on` (or a standalone `crochet-tool`) if you expect the pattern text to be edited later — otherwise progress is keyed to a hash of the block content and resets on edit.

## Output format checklist

Before returning your answer:

1. Picked one chart `type` and justified it if it's not obvious from the source.
2. Every row converted with the phrase table above — no invented stitch tokens.
3. Row-1 anchor set if the source uses a magic ring or chain ring.
4. Trailing `sl st` added only where the source explicitly joins the round.
5. Ran the stitch-counting rule against the source's own "(N)" annotations for at least the first few rows.
6. Asked the user (or picked a sensible default) for `tool: on` vs `text: on` vs neither, if they didn't specify.
7. Flagged anything you couldn't represent (unsupported stitch, ambiguous instruction) instead of silently guessing.
8. Returned one fenced ` ```crochet ` block (plus a second ` ```crochet-tool ` block only if they explicitly asked for a separate standalone tracker).
