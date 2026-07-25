# Crochet Weaver — AI Pattern Authoring Reference

**[English](ai-pattern-authoring.md) | [繁體中文](ai-pattern-authoring.zh-TW.md) | [简体中文](ai-pattern-authoring.zh-CN.md) | [日本語](ai-pattern-authoring.ja.md)**

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
| `style` | `standard` \| `book` | plugin setting | Round-chart drawing style. `book` gives Japanese-pattern-book styling: a continuous spiral guide winds through the rounds, stitches sit above the previous-round stitch they're worked into, inc/dec glyphs stretch to connect, rounds are numbered. Only affects `type: round`. |
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

**Case-sensitive, lowercase**, except `MR` which is case-insensitive. Two-word names (`sl st`, `hdc popcorn`, `tr popcorn`) are written with a literal space, exactly as shown — 46 names total:

| Category | Names |
|---|---|
| Basic | `ch` `sc` `hdc` `dc` `tr` `dtr` `sl st` `MR` `picot` `rsc` |
| Shaping | `inc` `dec` |
| N-together decreases | `sc2tog` `sc3tog` `hdc2tog` `hdc3tog` `hdc4tog` `hdc5tog` `dc2tog` `dc3tog` `dc4tog` `dc5tog` |
| Post stitches | `fpsc` `fphdc` `fpdc` `fptr` `bpsc` `bphdc` `bpdc` `bptr` |
| Crossed stitches | `xhdc` `xdc` `xtr` |
| Clusters / puffs | `hdc2cl` `hdc3cl` `hdc5cl` `dc2cl` `dc3cl` `dc5cl` `tr2cl` `tr3cl` `tr5cl` `bobble` |
| Popcorns | `popcorn` (5-dc) `hdc popcorn` (5-hdc) `tr popcorn` (5-tr) |

**Every stitch except `inc` outputs 1 stitch for counting purposes** — that includes every N-together decrease (`dc3tog` still counts as 1, same as `dec`), every post/crossed stitch, every cluster/puff, and every popcorn. Only `inc` outputs 2.

**Decreases — pick the right token, don't default to `dec` for everything.** `dec` is specifically the simple sc-height 2-together decrease (the common amigurumi "invisible decrease" / "sc2tog" case with no stated height) — keep using it for that. But if the source states a stitch height or a together-count other than sc2, use the matching dedicated token instead, so the chart shows the right symbol at the right height:

- "sc2tog" / "invisible decrease" / unspecified amigurumi decrease → `dec` (or `sc2tog` — they render as different glyphs but count identically; prefer `dec` unless the source specifically writes "sc2tog")
- "sc3tog" → `sc3tog`
- "hdc2tog" through "hdc5tog" (any hdc-height N-together) → `hdc2tog`…`hdc5tog`
- "dc2tog" through "dc5tog" (any dc-height N-together) → `dc2tog`…`dc5tog`

There is still no dedicated token for N-into-one **increases** — those are groups, not stitch names (see "Group" below): "2 dc in next st" → `(dc, dc)`, "shell: 5 dc in next st" → `(5 dc)`.

There is no turning-chain concept — omit `ch 1, turn` / `ch 3, turn` type instructions; they don't change the chart.

### Color changes

The keyword `color` (optionally followed by `:`), then a CSS color name or `#hex` code, as its own step anywhere in the row — usually at the start of a row, or dropped in mid-row right where the source says to switch yarn:

```
R6: 8 sc, color white, 8 sc, color black, 8 sc
```

It has no width of its own (it doesn't count as a stitch). It applies to every stitch from that point on — through the rest of this row and every later row — and counts as normal, until another `color` step changes it again; there's no "reset to no color" token. The stitch symbols themselves always stay the chart's normal theme color — a literal `black`/`white` value only names the yarn, it isn't painted onto the symbols (that would go illegible in a dark or light theme, and would fight with the progress tool's own current-position highlight). Instead, the first stitch of each new color gets a small hollow ring in that color, so the switch is easy to spot without covering the stitch underneath it. The tool and pattern-text panels also spell it out as "change to `<color>`" right where it happens.

Use the exact color word or hex code the source gives (`white`, `black`, `#ff8800`, …) — don't invent or normalize colors the source doesn't state, and don't add `color` steps at all if the source never specifies yarn color for that piece.

## Phrase → token cheat sheet

Use this to translate common written-pattern phrasing. When in doubt, prefer `inc`/`dec` (which are chart-meaningful, weighted stitches) over spelling out "2 sc in next st" as two separate `sc`s — that would double-count stitches and throw off every round after it.

| Written pattern says | Write |
|---|---|
| "magic ring", "magic circle", "adjustable ring" | `in MR` anchor on row 1 |
| "ch 2, join with sl st to form a ring" (or similar) | `in ch ring` anchor on row 1 |
| "2 sc in same st" / "2 sc in next st" / "sc, inc" style increase | `inc` |
| "invisible decrease" / unspecified amigurumi "2 sts tog" | `dec` |
| "sc2tog" (stated explicitly) | `sc2tog` |
| "sc3tog" | `sc3tog` |
| "hdc2tog" … "hdc5tog" | `hdc2tog` … `hdc5tog` |
| "dc2tog" … "dc5tog" | `dc2tog` … `dc5tog` |
| "sc in each st around" for a round of N known stitches | `N sc` (write the literal count) |
| "(sc, inc) 6 times" / "repeat 6 times" | `[sc, inc] x 6` |
| "(dc, ch 1, dc) in next st" (shell/corner) | `(dc, ch, dc)` |
| "2 dc in next st" (V-stitch increase) | `(dc, dc)` |
| "5 dc in next st" (shell) | `(5 dc)` |
| "join with sl st" at the end of a round | trailing `sl st` on that row |
| "working in back loops only" | `blo` after the row label |
| "working in front loops only" | `flo` after the row label |
| "ch 1, turn" / "turn" (flat rows) | omit — no chart effect |
| "FPdc" / "front post dc" | `fpdc` (also `fpsc`, `fphdc`, `fptr` at other heights) |
| "BPdc" / "back post dc" | `bpdc` (also `bpsc`, `bphdc`, `bptr` at other heights) |
| "cross 2 dc" / "crossed dc" (1-stitch cross) | `xdc` (also `xhdc`, `xtr` at other heights) |
| "3-dc cluster" / "dc3tog" used as a decorative cluster (not a decrease) | `dc3cl` (context matters — see note below) |
| "puff stitch" (typically hdc-based) | `hdc2cl` / `hdc3cl` / `hdc5cl` by stitch count |
| "popcorn stitch" (5 dc, most common) | `popcorn` |
| "5-hdc popcorn" / "5-tr popcorn" | `hdc popcorn` / `tr popcorn` |
| "picot" / "ch-3 picot" | `picot` |
| "crab stitch" / "reverse single crochet" | `rsc` |
| "change to white" / "8 sc BLACK, change to WHITE, …" (yarn color change) | `color white` step where the switch happens |

**Cluster vs. decrease ambiguity**: some patterns write "3tog" to mean an actual decrease (3 stitches become 1 — use `sc3tog`/`hdc3tog`/`dc3tog`) and others use "cluster" language for a *decorative* bundle of stitches worked into the *same* stitch that doesn't reduce the stitch count the same way (use `dc3cl`/`hdc3cl`/etc., or a group like `(dc, dc, dc)` if genuinely just 3 stitches fanned into one spot). Read the surrounding stitch-count annotations — if the row's total drops, it's a decrease token; if the count stays flat, it's a cluster/group.

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
- Every other stitch name = 1 output stitch — this includes every N-together decrease (`dc3tog` still counts as 1, same as `dec`), every post/crossed stitch, every cluster/puff, and every popcorn, not just the original basic set.
- A group `(...)` = sum of its children's weights.
- A repeat `[...] x N` = N × (sum of its children's weights).
- **A trailing `sl st` at the very end of a row is treated as a join and excluded from the count** — don't count it, and don't be surprised the chart doesn't count it either.

After converting, add up each row's stitches and compare to the source pattern's own "(N sc)" annotations. A mismatch almost always means an increase/decrease got flattened into plain stitches (or vice versa) somewhere.

## Choosing a chart type

- **`round`** — concentric rings from a center point. Use for anything worked in the round with joins (hats, coasters, amigurumi pieces, granny squares worked as circles). This is the most common choice for amigurumi. Add `style: book` in frontmatter when the user asks for the printed-book look (enclosed rounds, parent-aligned stitches, numbered rounds); it changes only how the chart is drawn, never how the pattern is written.
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
6. For any decrease/cluster, picked the token matching the source's stated height and count (`sc2tog` vs `hdc3tog` vs `dc5tog`, etc.) instead of defaulting everything to `dec`.
7. Asked the user (or picked a sensible default) for `tool: on` vs `text: on` vs neither, if they didn't specify.
8. Flagged anything you couldn't represent (unsupported stitch, ambiguous instruction) instead of silently guessing.
9. Added a `color <name>` step wherever the source explicitly changes yarn color, using its exact color word/hex — and added none where the source never states a color.
10. Returned one fenced ` ```crochet ` block (plus a second ` ```crochet-tool ` block only if they explicitly asked for a separate standalone tracker).
