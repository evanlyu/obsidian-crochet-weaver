---
name: crochet-weaver-pattern
description: Convert a written crochet pattern — from a book, PDF, website, or shorthand notes — into the Crochet Weaver plugin's `crochet` / `crochet-tool` Markdown syntax for Obsidian, or write a new pattern in it from a description. Use whenever someone pastes a crochet pattern and asks for a chart, asks to convert something to Crochet Weaver, or asks for a Crochet Weaver-compatible pattern.
license: MIT
---

# Crochet Weaver pattern skill

**[English](SKILL.md) | [繁體中文](SKILL.zh-TW.md) | [简体中文](SKILL.zh-CN.md) | [日本語](SKILL.ja.md)**

This skill is written for an AI assistant. It is self-contained: paste the whole file into a chat, or point an agent at it, and it has everything needed to convert or write a pattern in Crochet Weaver syntax — the small text language the Crochet Weaver Obsidian plugin's `crochet` / `crochet-tool` code blocks understand.

## When to use it

- Someone pastes a written crochet pattern and wants a chart from it.
- Someone asks to convert a pattern into Crochet Weaver syntax.
- Someone describes a piece and asks for a pattern written in that syntax.

## How to work through it

1. Choose the chart type — see "Choosing a chart type".
2. Convert row by row with the phrase table. Never invent a token.
3. Count the stitches each row produces and check them against the source's own "(N)" annotations.
4. Decide whether the block also carries a progress panel (`tool:` / `text:`).
5. Run the checklist at the end before answering.

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
| `id` | 1–80 ASCII letters, digits, `_`, or `-` | derived from block content | Set this whenever you also embed or write a `crochet-tool`/`tool: on` panel, so progress survives edits to the pattern text. |
| `scale` | positive number | plugin setting | Display scale. |
| `stroke` | positive number | plugin setting | SVG stroke width. |
| `spacing` | positive number | plugin setting | Pixel gap between round/spiral rings. |
| `highlight` | `on`/`off`/`true`/`false`/`yes`/`no`/`1`/`0` | plugin setting | Accent-colors `inc`/`dec` stitches. |
| `style` | `radial` \| `japanese` \| `continuous` | plugin setting | Round-chart drawing style. `japanese` gives Japanese-pattern-book styling: a continuous spiral guide winds through the rounds, stitches sit above the previous-round stitch they're worked into, an `inc` is a **V** and a `dec` an **∧** drawn in line with the round's own stitches, rounds are numbered. `continuous` uses the same layout but draws every stitch's own symbol and links each one to the stitch below it — useful for checking a conversion. Only affects `type: round`. |
| `lace` | boolean (as above) | `off` | Pattern-book lace presentation: hide round guides and numbers, enlarge symbols, and stand chain runs out into the openwork. |
| `sector` | `on` or a number between 0 and 360 | full chart | Draw one wedge of a round chart; `on` means 90 degrees. |
| `wholeRounds` | positive integer | none | Keep this many center rounds whole before applying `sector`. |
| `grid` | boolean (as above) | plugin setting | Draw a background guide aligned to the real chart. |
| `rounds` / `rows` / `columns` | positive integer | chart extent | Extend the background guide beyond the real pattern; never shrink it. |
| `tool` | boolean (as above) | plugin setting | Embeds the interactive progress tool next to the chart. See "Embedding a progress panel". |
| `text` | boolean (as above) | plugin setting | Embeds a read-only shorthand list next to the chart (ignored if `tool` is also on). |
| `readable` | boolean (as above) | plugin setting | Show translated full stitch names instead of raw shorthand in the tool/text panel. |
| `position` | `right` \| `left` \| `below` | plugin setting | Where an embedded `tool`/`text` panel sits relative to the chart. |

An invalid value silently falls back to the matching global setting, or is ignored when that option has no global default (such as `sector`) — it will not error, so double-check values you're unsure about rather than relying on a visible failure.

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

**Stitch**, with an optional count on either side of the name — `6 sc`, `sc6` and `sc 6` all mean the same thing, so you can keep whichever form the source uses:

```
sc          → one single crochet
10 ch       → ten chains
ch2         → two chains
sc 6        → six single crochets
```

A slip stitch may be written `sl st`, `slst`, `sl-st` or `sl_st` — all four are read as the same stitch.

**Repeat**, square brackets + a count. `x 6`, `x6`, `rep 6` and `rep6` are all the same — use whichever matches the source:

```
[sc, inc] x 6      → (sc, inc) repeated 6 times
[sc, inc] rep 6    → the same thing
```

A bare `rep` with no number means "repeat until the round below is used up", which is what "around" / "to end of round" means in a written pattern. The count is worked out from the previous round, so you don't have to do the arithmetic:

```
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst    → 2 repeats: 6 stitches below, 3 worked into per repeat
```

Only use bare `rep` where the source really does say "around" — if the round below doesn't divide evenly by what one repeat works into, the chart reports an error rather than guessing, and a bare `rep` on row 1 has nothing to work into and is an error too. When the source states the number, write the number.

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

The chain a round opens with **is** supported: preserve the source's plain or annotated leading `ch` step (`R2: ch, [2 sc, inc] rep, slst`). It is drawn at the seam. `ch 3 (counts as dc)` counts as one replacement stitch; `ch 1 (does not count as a st)` counts zero; an unannotated beginning chain counts as one only when that round closes to its top. The closing `sl st` and a `mr` written as a step (`R1: mr, ch, sc6, slst`) always count zero.

Write these only where the source does. On a flat chart `turn` has no chart meaning, so `ch 1, turn` can be dropped.

### Color changes

The keyword `color` (optionally followed by `:`), then a CSS color name or `#hex` code, as its own step anywhere in the row — usually at the start of a row, or dropped in mid-row right where the source says to switch yarn:

```
R6: 8 sc, color white, 8 sc, color black, 8 sc
```

It has no width of its own (it doesn't count as a stitch). It applies to every stitch from that point on — through the rest of this row and every later row — and counts as normal, until another `color` step changes it again; there's no "reset to no color" token. The stitch symbols themselves always stay the chart's normal theme color — a literal `black`/`white` value only names the yarn, it isn't painted onto the symbols (that would go illegible in a dark or light theme, and would fight with the progress tool's own current-position highlight). Instead, the first stitch of each new color gets a small hollow ring in that color, so the switch is easy to spot without covering the stitch underneath it. The tool and pattern-text panels also spell it out as "change to `<color>`" right where it happens.

Use the exact color word or hex code the source gives (`white`, `black`, `#ff8800`, …) — don't invent or normalize colors the source doesn't state, and don't add `color` steps at all if the source never specifies yarn color for that piece.

### Lace: saying where a stitch goes

A lace pattern does not count its way along the round below — it says where each stitch goes. Write that the way the source does, with `in` and the place:

```
sc in next dc                          → the next double crochet below
5 dc in next ch-2 sp                   → five doubles, all worked into the next chain space
dc in same st                          → the same place the step before used
sc in center dc of next 7-dc shell     → the middle stitch of the next 7-double shell
sl st into next ch-1 sp                → move across to that space; nothing is worked into it yet
skip 2                                 → pass two places over on purpose
```

The places a round offers the next round are its stitches (`st`, `sc`, `dc`, `picot`, …) **and the chain spaces between them**: any run of chains written between two stitches becomes one `ch-N sp`. Looking for `next <place>` passes over whatever is in between, so you never have to write the skips out — exactly as the source does not.

**Shells and V-stitches.** A quantity with a target is one motif worked into one place, and it is drawn as a fan opening from that place:

```
5 dc in next ch-2 sp                   → one five-double shell
V2 in next sc                          → (dc, ch 2, dc) into one stitch; V3 is the ch-3 version
(dc, ch 2, dc) in next sc              → the same thing written out
```

The chain run inside a V is a space of its own, so the next round can work `in next ch-2 sp`. An odd shell has a centre a later round can name: `in center dc of next 5-dc shell`.

**Beginning chains, joins, turns.**

```
ch 3 (counts as dc)                    → the chain stands in for the round's first double
ch 1 (does not count as a st)          → height only
sl st to top of beginning ch-3         → close the round to that chain
sl st to first sc
sl st to join
turn                                   → written first: this round is worked the other way round
```

A beginning chain written **without** a note is decided by the round's own join: closing to the top of that chain means it stands in for a stitch, and closing anywhere else means it does not. So a pattern that writes a bare `ch 3` and joins to `top of beginning ch-3` needs no annotation added — keep it as written.

**Rounds written as a repeat of earlier rounds.** Either dash works, and each expands into a real round before the chart is drawn:

```
R13: repeat R11.
R15-R18: repeat R11-R14.
```

**Printing it the way a book does.** Add `lace: on` to the frontmatter of a lace chart: no lines are drawn around the rounds, no round numbers are printed, and the symbols are drawn larger against the openwork. It changes only what is drawn around the pattern, never what the pattern is — so add it when the user wants the pattern-book look, and leave it off when they want the rounds marked out and numbered.

**One wedge instead of the whole circle.** `sector: 90` (or `sector: on`) — with `wholeRounds: 4` to keep the first rounds entire — draws one slice of a round chart rather than all of it — which is how a book prints a round of twelve identical motifs. Add it when the user wants the chart to read as a fan rather than a full disc, or when a whole round would be too big to see; leave it off when they want every repeat drawn.

**A round may be written over several lines.** An indented line belongs to the round above it, and a blank line ends the round — so a long round can be kept in the shape the source printed it, commas, final period and count annotation included.

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
| "(sc, inc) 6 times" / "repeat 6 times" | `[sc, inc] x 6` (or `[sc, inc] rep 6`) |
| "(2 sc, inc) around" / "repeat to end of round" | `[2 sc, inc] rep` |
| "ch 1" at the start of a round | leading `ch` step on that row |
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
- **A chain a round opens with counts only if the pattern says it does**: `ch 3 (counts as dc)` counts as the one stitch it replaces, `ch 1 (does not count as a st)` counts nothing, and an unannotated beginning chain counts as a stitch when the round closes to the top of it and nothing otherwise. A `mr` written as a step and the `sl st` that closes a round always count nothing — they are drawn, but they are instructions rather than stitches of the fabric.
- A chain **in the middle** of a row is a real stitch and counts one each, even though the next round works into the space the run makes rather than into the chains. `R2: ch 1 (does not count as a st), sc in same st, ch 1, [sc in next dc, ch 1] x23, sl st to first sc` counts 48: twenty-four single crochets and twenty-four chains.
- A picot, a repositioning `sl st into next ch-1 sp`, a `turn` and a `skip` all count nothing.
- A chain space is not a stitch of its own: it counts only as the chains that made it.

After converting, add up each row's stitches and compare to the source pattern's own "(N sc)" annotations. A mismatch almost always means an increase/decrease got flattened into plain stitches (or vice versa) somewhere.

## Choosing a chart type

- **`round`** — concentric rings from a center point. Use for anything worked in the round with joins (hats, coasters, amigurumi pieces, granny squares worked as circles). This is the most common choice for amigurumi. Add `style: japanese` in frontmatter when the user asks for the printed-book look (enclosed rounds, parent-aligned stitches, numbered rounds); it changes only how the chart is drawn, never how the pattern is written.
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

- `tool: on` — full interactive checklist next to the chart: row-by-row list, progress bar, and a weighted per-row stitch counter. Tap once per written unit; the button adds that unit's weight (`inc` is `+2`, and a V/shell adds its full weight at once). The chart also highlights the current row/stitch live.
- `text: on` — same row list, but read-only (no buttons, no progress, no chart highlight). Use when the person just wants the shorthand next to the picture.
- Always set an explicit `id` when using `tool: on` (or a standalone `crochet-tool`) if you expect the pattern text to be edited later — otherwise progress is keyed to a hash of the block content and resets on edit.

## Output format checklist

Before returning your answer:

1. Picked one chart `type` and justified it if it's not obvious from the source.
2. Every row converted with the phrase table above — no invented stitch tokens.
3. Row-1 anchor set if the source uses a magic ring or chain ring.
4. Trailing `sl st`, and a leading `ch`, added only where the source explicitly writes them.
5. Bare `rep` used only where the source says "around" / "to end of round"; an explicit number written wherever the source gives one.
6. Ran the stitch-counting rule against the source's own "(N)" annotations for at least the first few rows.
7. For any decrease/cluster, picked the token matching the source's stated height and count (`sc2tog` vs `hdc3tog` vs `dc5tog`, etc.) instead of defaulting everything to `dec`.
8. Asked the user (or picked a sensible default) for `tool: on` vs `text: on` vs neither, if they didn't specify.
9. Flagged anything you couldn't represent (unsupported stitch, ambiguous instruction) instead of silently guessing.
10. Added a `color <name>` step wherever the source explicitly changes yarn color, using its exact color word/hex — and added none where the source never states a color.
11. Returned one fenced ` ```crochet ` block (plus a second ` ```crochet-tool ` block only if they explicitly asked for a separate standalone tracker).
