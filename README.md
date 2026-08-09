# Crochet Weaver

**[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)**

Crochet Weaver renders crochet stitch charts from text patterns inside Obsidian notes. It works locally in Markdown code blocks and does not make network requests.

## Features

- Render `crochet` code blocks as themed SVG stitch charts.
- Support flat rows, concentric rounds, and continuous spirals.
- Use common crochet symbols for chains, single crochet, half double crochet, double crochet, treble stitches, slip stitch, increases, decreases, bobbles, popcorns, and post stitches.
- Add row-level `blo` / `flo` markers and round anchors such as magic ring or chain ring.
- **Chart lace the way it is written**: say where a stitch goes (`5 dc in next ch-2 sp`, `sc in center dc of next 7-dc shell`), and shells fan from the space they are worked into, chain runs are drawn as the curve they hang in, and V-stitches, picots, joins, turns and "repeat R11-R14" rounds are read as written.
- Keep every graph-driven stitch on its real ancestry while numbered round changes stay clear inside their measured seam.
- Render `crochet-tool` blocks as a readable row checklist with stitch counts, progress controls, and a per-row stitch counter.
- **Embed the progress tool or a read-only pattern-text list directly next to a `crochet` chart** (`tool: on` / `text: on`), so you never have to paste the same pattern into two code blocks.
- **Highlight the current row and target stitch on the chart itself** when the progress tool is embedded, in a configurable color.
- **Mark yarn color changes** with a `color <name>` step, mid-row or per-round — the chart flags each switch with a small colored ring (without repainting the stitches themselves), and the tool/text panels spell it out as "change to `<color>`".
- **Show pattern text in a fully translated, readable style** (`readable: on`) instead of raw shorthand — e.g. `短針6` instead of `6 sc` — in any of the eight interface languages.
- **Pan and scroll charts that are larger than their note pane** instead of squeezing them to fit — drag with the mouse, or use native touch/trackpad scrolling; a chart that overflows opens centered.
- **Copy the AI pattern-authoring reference from Settings**, in any of four languages, ready to paste into an AI chat for help converting or writing patterns.
- Store all progress locally in the plugin data file.
- Fully localized UI in eight languages: English, Traditional Chinese, Simplified Chinese, Japanese, Korean, German, French, and Spanish.

## Quick Start

See [`examples/demo.md`](examples/demo.md) for every feature in this README exercised in one note — chart types, every stitch, row modifiers, the row connector line, error handling, the progress tool (including its readable text style and yarn color changes), panel positioning, and a real pattern conversion.

Add a `crochet` code block to a note:

```crochet
---
type: round
scale: 1.25
highlight: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

### Chart + progress tool, one source of truth

Add `tool: on` to embed the interactive progress tool (row checklist, stitch counter) right next to the chart — no separate `crochet-tool` block needed:

```crochet
---
id: coaster-small
type: round
tool: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

Prefer a plain, non-interactive shorthand list next to the chart instead? Use `text: on`:

```crochet
---
type: round
text: on
---
R1: 6 sc in MR
R2: [sc, inc] x 6
```

You can still use a standalone `crochet-tool` block if you only want the checklist, without a chart:

```crochet-tool
---
id: coaster-small
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6, sl st
```

Use an explicit `id` when you want progress to survive edits to the pattern text. It must contain 1–80 ASCII letters, digits, `_`, or `-`; an omitted or invalid `id` falls back to a local hash of the block content, so editing the block can reset progress.

## Let an AI write the pattern for you

You do not have to learn the syntax to use the plugin. Hand an AI assistant the **crochet-weaver-pattern skill** once, then give it any written pattern — from a book, a PDF, a shop listing, or your own shorthand — and paste back what it returns.

1. **Copy the skill.** Settings → Crochet Weaver → **Copy the pattern skill**, and press the button for the language you want (English, 繁體中文, 简体中文, 日本語).
2. **Start a chat** with any assistant (Claude, ChatGPT, whichever you use) and paste the skill in as the first message. It is self-contained: nothing else has to be installed or fetched.
3. **Paste your pattern** and ask for a chart. For example:

    > Here is the pattern for the head of an amigurumi bunny. Convert it into one Crochet Weaver `crochet` block, `type: round`, with the progress tool on.
    >
    > R1: 6 sc in magic ring (6)
    > R2: inc in each st around (12)
    > R3: (sc, inc) around (18)
    > R4–R6: sc around (18)
    > R7: (sc, dec) around (12)

4. **Paste the block it returns** into a note, in Reading or Live Preview mode:

    ````markdown
    ```crochet
    ---
    type: round
    tool: on
    id: bunny-head
    ---
    R1: 6 sc in MR
    R2: [inc] x 6
    R3: [sc, inc] x 6
    R4: 18 sc
    R5: 18 sc
    R6: 18 sc
    R7: [sc, dec] x 6
    ```
    ````

5. **Check it before you crochet it.** The chart and the row list are generated from what the assistant wrote, so read the stitch counts in the progress panel against the source's own `(N)` numbers. If a row is off, say so in the chat — the skill tells the assistant how counting works, so "R7 should end on 12 stitches" is usually enough to get a fix.

**Using Claude Code?** Drop [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/) into your project's or your home `.claude/skills/` folder and the skill loads itself whenever you paste a crochet pattern.

**If something can't be converted**, the assistant is told to say so rather than guess — an unsupported stitch, or an instruction that has no chart meaning. Those are worth reading; a silently "working" chart that drops a stitch is worse than a note that says it could not.

## Pattern Syntax

### Frontmatter

Crochet blocks may start with flat YAML-like frontmatter:

```yaml
---
type: flat | round | spiral
id: optional-progress-id
scale: 1.5
stroke: 2
spacing: 40
highlight: on
style: radial | japanese | continuous
lace: on | off
sector: on | degrees
wholeRounds: positive-integer
grid: on | off
rounds: positive-integer
rows: positive-integer
columns: positive-integer
tool: on | off
text: on | off
readable: on | off
position: right | left | below
---
```

Global plugin settings are used by default where an option has one. Valid frontmatter values override those settings for one chart; invalid values fall back to the corresponding global default or are ignored for presentation-only options such as `sector`. The lace, sector, grid-guide, and panel options are explained in their sections below.

### Rows

Rows can use either label form:

```crochet
R1: 10 ch
Row 2: sc, hdc, dc
```

Supported row modifiers:

```crochet
R1: blo, 6 sc in MR
R2: flo, 6 sc in ch ring
```

- `blo`: mark the whole row or round as back-loop-only.
- `flo`: mark the whole row or round as front-loop-only.
- `in MR`: add a magic-ring center anchor for round or spiral charts.
- `in ch ring`: add a chain-ring center anchor.

### Stitches

Supported stitch names, following standard US chart notation — 46 in total:

| Symbol | Category | Description |
| --- | --- | --- |
| `ch` | Basic | Chain |
| `sc` | Basic | Single crochet |
| `hdc` | Basic | Half double crochet |
| `dc` | Basic | Double crochet |
| `tr` | Basic | Treble crochet |
| `dtr` | Basic | Double treble crochet |
| `sl st` | Basic | Slip stitch |
| `MR` | Basic | Magic ring |
| `picot` | Basic | Ch-3 picot |
| `rsc` | Basic | Reverse single crochet (crab stitch) |
| `inc` | Shaping | Increase (2 sc in one stitch) |
| `dec` | Shaping | Decrease (sc2tog shorthand) |
| `sc2tog`, `sc3tog` | Shaping | Single crochet 2/3 together |
| `hdc2tog`…`hdc5tog` | Shaping | Half double crochet 2–5 together |
| `dc2tog`…`dc5tog` | Shaping | Double crochet 2–5 together |
| `fpsc`, `fphdc`, `fpdc`, `fptr` | Post stitch | Front post sc/hdc/dc/tr |
| `bpsc`, `bphdc`, `bpdc`, `bptr` | Post stitch | Back post sc/hdc/dc/tr |
| `xhdc`, `xdc`, `xtr` | Crossed | 1-stitch crossed hdc/dc/tr |
| `hdc2cl`, `hdc3cl`, `hdc5cl` | Cluster/puff | 2/3/5-hdc cluster (puff) |
| `dc2cl`, `dc3cl`, `dc5cl` | Cluster/puff | 2/3/5-dc cluster |
| `tr2cl`, `tr3cl`, `tr5cl` | Cluster/puff | 2/3/5-tr cluster |
| `bobble` | Cluster/puff | Generic bobble/puff |
| `popcorn` | Popcorn | 5-dc popcorn |
| `hdc popcorn` | Popcorn | 5-hdc popcorn |
| `tr popcorn` | Popcorn | 5-tr popcorn |

N-into-one increases and shells have no dedicated names — see the Groups example below.

Quantity prefixes are supported:

```crochet
R1: 10 ch, 6 sc
```

Repeats use square brackets, written `x 6` or `rep 6` — both mean the same:

```crochet
R2: [sc, inc] x 6
R2: [sc, inc] rep 6
```

A bare `rep` repeats the group until the round below is used up, so you don't have to count:

```crochet
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst
```

Each go at `[2 sc, inc]` works into three stitches and R1 has six, so that is two goes. If the round below doesn't divide evenly the chart says so rather than guessing.

A stitch's count can go either side of its name — `6 sc`, `sc6` and `sc 6` are the same — and a slip stitch may be written `sl st`, `slst`, `sl-st` or `sl_st`.

A round's opening chain and closing slip stitch are drawn at the seam. The join always counts zero. A beginning chain counts as the one stitch it replaces when written as `ch 3 (counts as dc)`, or when an unannotated chain is joined at its top; `ch 1 (does not count as a st)` and a chain joined elsewhere count zero.

Groups use parentheses and render as a fan from one stitch position — this is also how N-into-one increases and shells are written (there are no dedicated `2dc-in-1` names; `(dc, dc)` or `(5 dc)` draws exactly that chart symbol):

```crochet
R3: (dc, ch, dc), sc, (5 dc)
```

### Lace and motifs

A lace pattern says where each stitch goes instead of counting along the round below, and Crochet Weaver reads that directly:

```crochet
---
type: round
style: japanese
---
R1: MR, ch 3 (counts as dc), 23 dc in MR,
    sl st to top of beginning ch-3. (24 dc)

R2: ch 1 (does not count as a st),
    sc in same st, ch 1,
    [sc in next dc, ch 1] x23,
    sl st to first sc.
    (24 sc + 24 ch-1 sp = 48 sts)

R3: sl st into next ch-1 sp,
    ch 3, 2 dc in same ch-1 sp,
    sc in next ch-1 sp,
    [3 dc in next ch-1 sp,
     sc in next ch-1 sp] x11,
    sl st to top of beginning ch-3.
    (12 reps, 4 sts per rep)

R4: turn,
    [V2 in next sc, ch 1,
     sc in center dc of next 3-dc shell,
     picot, ch 1] x12,
    sl st to join.
```

| Written | What it means |
| --- | --- |
| `in next dc` / `in next ch-2 sp` / `in next picot` | the next place of that kind, passing over whatever is in between |
| `in same st` / `in same ch-1 sp` | the place the step before used — its stitches join that motif |
| `in center dc of next 7-dc shell` | the middle stitch of the next 7-double shell |
| `5 dc in next ch-2 sp` | one shell of five, worked into one space and drawn as a fan |
| `V2` / `V3` | `(dc, ch 2, dc)` / `(dc, ch 3, dc)` into one place, with a space of its own |
| `ch 3 (counts as dc)` | the beginning chain stands in for a stitch |
| `sl st into next ch-1 sp` | move across to that space; nothing is worked into it yet |
| `turn` | written first: this round is worked the other way round |
| `R15-R18: repeat R11-R14.` | expands into real rounds before the chart is drawn |

Add `lace: on` to the frontmatter to have the chart printed the way a book prints lace: no lines drawn around the rounds, no round numbers, and the symbols drawn larger against the openwork. It changes only what is drawn around the pattern, never what the pattern is.

Add `wholeRounds: 4` alongside it to draw the first four rounds entire and fan out only after them — the middle of a piece is where the pattern is still being set up, so a book draws it whole. Rounds sit as far apart as their own stitches are tall — a round of single crochets closer than a round of double trebles — unless a chart or the settings names a `spacing`. Add `sector: 90` (or `sector: on`, which means 90) to draw **one wedge of the chart instead of the whole circle** — a round of twelve identical motifs says everything it has to say in one slice of itself, which is how a book prints it. The whole chart is still worked out; the wedge is what gets drawn, starting at the seam, and a motif that falls on the edge is kept whole rather than sliced in half.

A run of chains between two stitches becomes one chain space the next round can work into, and every chain of it is still drawn and countable. An unannotated beginning chain counts as the stitch it replaces when the round closes to the top of it — so a pattern written this way needs nothing added to it.

Lace is drawn by the `japanese` and `continuous` round styles, which place every stitch from what it is worked into; `radial` spreads a round evenly, as it always has.

### Color changes

A `color <name>` step (a CSS color name or `#hex` code) marks where a pattern switches yarn — mid-row, or at the start of a row/round:

```crochet
R6: 8 sc, color white, 8 sc, color black, 8 sc
```

It applies to every stitch from that point on — through the rest of the row and every later row — until another `color` step changes it; there's no "reset to no color" token. The stitch symbols stay the chart's normal theme color; instead, the first stitch of each new color gets a small hollow ring in that color, and the progress tool / pattern-text panels spell it out as "change to `<color>`".

## Chart Types

### Flat

`type: flat` renders rows in an alternating flat-row layout.

```crochet
---
type: flat
---
R1: 10 ch
R2: 10 sc
R3: 10 dc
```

### Round

`type: round` renders each row as a concentric round. A trailing `sl st` is treated as a join and is excluded from round stitch-count spacing.

```crochet
---
type: round
---
R1: 6 sc in MR
R2: [sc, inc] x 6, sl st
```

`style: japanese` switches a round chart to Japanese-pattern-book styling: a continuous spiral guide winds through the rounds (as crochet-in-the-round really is one spiralling line), stepping out to the next round at each starting seam, with each round numbered in red at that seam. An `in MR` center is printed as `わ`; an `in ch ring` center keeps the chain-stitch ovals that form the ring rather than using the unverified abbreviation `ち`.

Shaping is drawn the way the books do it: as a symbol of its own round, in line with the plain stitches. An `inc` is a **V** whose point sits on the round's inner edge at its parent and whose two arms end at the actual positions of the two child stitches. A `dec` (or an `scNtog`) is the **∧**: its feet lean toward the stitches it closed over and its point stands above them; unusually wide decreases are compacted so the mark stays readable. Nothing floats in the gap between two rounds, and every endpoint continues to describe real stitch ancestry.

Underneath, every stitch is placed from the previous-round stitch it is worked into, and records it: an ordinary stitch keeps its unique parent's angle exactly, an increase's two stitches balance around their shared source, and a decrease sits between all of its sources. With automatic spacing (`spacing` omitted), a crowded round grows to the smallest radius where those parent-derived angles fit. With an explicit `spacing`, every round-to-round gap stays exactly that size. Exact parent angles are retained whenever symbols fit at their configured size; if several differently placed shaping rounds make inherited targets collide, a deterministic minimum-movement pass restores working order and clearance without applying a local per-round scale. The corrected bearings are reconciled inward through the recorded graph, so later stitches still sit on the displayed parent stitch or V endpoint and every V stays centred on its real source. Every stitch therefore keeps the size resolved from the user's setting across all rounds. This rule is based on measured geometry rather than a particular round or stitch count, keeps balanced V marks, and never deletes a stitch.

`style: continuous` uses that same layout and spells the correspondence out instead of printing it: every stitch keeps its own symbol — including **both** stitches an increase makes — and lines are drawn from them to the stitch below they are worked into. Useful for checking a pattern, or for reading a chart when you don't already know the book symbols.

In both, nothing is grouped or packed: every stitch simply follows the stitch below it. A round written as a repeat — `[2 sc, inc] x 6` — still reads as six wedges, because its six increases sit above the six stitches they are worked into. A round that neither writes repeats nor shapes — the straight sides of a basket, `R9: 40 sc` — copies the round below. A free-form round that deliberately skips places still keeps every stitch it does work directly over its recorded source; it is never replaced with an unrelated evenly spaced ring.

The first stitch worked into the center ring stays at twelve o'clock. Round numbers start just to its right and target another half degree toward twelve o'clock on each outer round, forming a subtle inward guide instead of a rigid spoke. The seam reserves room for its join, step, number, and opening chain when geometry permits; 10px side clearance is a minimum, while configured round spacing is exact. Any additional ancestry-derived seam room remains available, and the number/separator packet moves only inside that measured surplus—it stops before the final stitch instead of rotating the stitches to reach its preferred bearing. The layout follows the continuously clear path from the measured seam slot toward the preferred bearing and stops at the first collision, so a number remains on the opening side of its separator and wholly before its closing join even when clear space exists beyond them. This uses measured digit and symbol footprints and works the same when a partial chart begins at R4, R16, or any other round.

The default `style: radial` keeps the original evenly spread layout with the stock `inc`/`dec` glyphs; the global **Round chart style** setting changes the default for all charts.

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
```

### Spiral

`type: spiral` renders all rows along a single continuous spiral.

```crochet
---
type: spiral
---
R1: 6 sc in MR
R2: [sc, inc] x 6
R3: [2 sc, inc] x 6
```

## Blank Drafting Grid

`crochet-grid` renders a blank grid for sketching a new design by hand — no stitches, no progress tracking, just guide geometry.

```crochet-grid
shape: polar
rounds: 6
columns: 12
```

- `shape: polar` (default) draws `rounds` concentric ring circles and `columns` evenly spaced radial spokes.
- `shape: rect` draws a `rows` by `columns` rectangular mesh instead:

  ```crochet-grid
  shape: rect
  rows: 8
  columns: 8
  ```

- `scale`, `stroke`, and `spacing` behave the same as they do for `crochet` charts; `spacing` sets the ring gap for `polar` or the cell size for `rect`.
- Run the **Insert blank crochet grid** command to insert a starter block pre-filled with your grid defaults.

## Grid Guide Overlay

Unlike the standalone blank grid above, a `grid: on` key on a real `crochet` block draws a faint reference guide *behind your actual chart*, aligned to its real geometry — useful for seeing "which round am I on" at a glance, especially alongside the embedded progress tool.

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

- `type: round` / `type: spiral`: one guide ring per round, at that round's real radius (spiral rings approximate "round N" as the radius reached by the end of row N, since a spiral has no discrete rounds). Guide spokes default to the last round's stitch count, evenly spaced by angle.
- `type: flat`: a row/column mesh sized to the chart's real row height and stitch width — a reference frame, not a guarantee every stitch past row 0 sits exactly on an intersection (rows alternate direction).
- By default the guide matches the pattern's own extent — no extra config needed. Add `rounds:` (round/spiral) or `rows:` (flat) and/or `columns:` to extend the guide *beyond* the real pattern (e.g., to preview how many more rounds a design might need); these can only extend the guide, never shrink it below the real extent.
- Turn it on for every chart by default with the **Show background grid guide** setting.

## Embedding the Progress Tool or Pattern Text

A `crochet` block's `tool` and `text` frontmatter keys (or their matching global settings) let the chart carry its own progress panel, so the pattern only ever needs to be written once:

- `tool: on` — embeds the full interactive progress tool (row checklist, progress bar, weighted per-row stitch counter with add / subtract / reset, previous/complete/reset controls).
- `text: on` — embeds a read-only shorthand list of the rows (label, normalized steps, stitch count), with no progress tracking or buttons. Useful if you just want the notation next to the picture.
- If both are truthy, `tool` wins (it already shows everything `text` would).
- `position: right | left | below` controls where the panel sits relative to the chart. `right` (default) and `left` sit side by side and wrap to a stacked layout on narrow widths; `below` always stacks.

## Progress Tool

Whether embedded (`tool: on`) or standalone (`crochet-tool` block), the progress tool tracks two levels of detail:

- **Row/round progress** — click a row to jump to it, or use Previous / Complete round / Reset. A segmented bar shows how many rows are done.
- **Stitch counter** — for the current row, tap the `+` button once per pattern unit (e.g., `+2` for an `inc`). Reaching the row's full stitch count automatically completes that row and resets the counter to zero, so you can keep tapping straight through row boundaries. The `−` button corrects an overcount, and a reset button clears the current row's count without touching row progress. Going back a round, completing a round, resetting, or clicking a row all reset the stitch counter for the new current row.

When the tool is embedded next to its chart (`tool: on`), the chart highlights your current position live: the current row gets a subtle wash, and the exact next stitch gets a stronger highlight, both in the color set by **Chart tool current-position color**. Standalone `crochet-tool` blocks and `text: on` panels have no chart to highlight, so they don't show this.

## Settings

Open the plugin settings tab to configure global defaults:

- **Language**: follow Obsidian or choose one of eight — English, Traditional Chinese, Simplified Chinese, Japanese, Korean, German, French, or Spanish. Stitch names and every message are translated in all of them; the AI pattern-authoring reference is written in the first four.
- **Chart scale**: chart display scale.
- **Symbol stroke width**: SVG stroke width.
- **Round spacing**: spacing between round or spiral rings.
- **Highlight increases and decreases**: accent `inc` and `dec` stitches.
- **Increase and decrease color**: the color those symbols are drawn in when the highlight above is on.
- **Chart tool current-position color**: color used to highlight the current row/stitch on a chart with an embedded progress tool.
- **Show progress tool by default**: embed the progress tool on every `crochet` chart unless overridden per chart with `tool: on/off`.
- **Show pattern text by default**: embed the read-only pattern text on every `crochet` chart unless overridden per chart with `text: on/off`.
- **Pattern text style**: show raw shorthand or fully translated readable stitch names, overridable per chart with `readable: on/off`.
- **Panel position**: default position (right / left / below) for an embedded tool or text panel, overridable per chart with `position:`.
- **Show background grid guide**: draw the round/row reference guide behind every `crochet` chart by default, overridable per chart with `grid: on/off`.
- **Round chart style**: `radial` (evenly spread stitches), `japanese` (round separators, parent-placed stitches, printed V/∧ shaping, and round numbers), or `continuous` (same layout, every stitch drawn and joined by lines to the round below).
- **Grid default shape**: `polar` or `rect` default for new `crochet-grid` blocks.
- **Grid default rounds**: default ring count for a `polar` grid.
- **Grid default columns**: default column/spoke count for a grid block.
- **Grid default rows**: default row count for a `rect` grid.

Settings marked "overridable per chart" can be set with the matching frontmatter key (`scale`, `stroke`, `spacing`, `highlight`, `style`, `tool`, `text`, `position`, `grid`). `chartMarkerColor` is global-only. `crochet-grid` blocks use their own config keys (`shape`, `rounds`, `columns`, `rows`, plus `scale`/`stroke`/`spacing`); the `grid` guide overlay on a real `crochet` chart adds `rounds`/`rows`/`columns` on top of that chart's own frontmatter, always as an extension of its real extent.

## Safety Limits

Crochet Weaver validates parsed charts before layout expansion. Extremely large row counts, stitch counts, repeats, nesting depth, or total render items are rejected with an inline error instead of freezing the Obsidian preview.

Current limits:

- Maximum rows: 200
- Maximum stitch quantity: 1000
- Maximum repeat count: 500
- Maximum total rendered stitches: 5000
- Maximum nesting depth: 8
- Maximum grid rounds: 40 (applies to both `crochet-grid` blocks and a `crochet` chart's `grid: on` guide `rounds:` override)
- Maximum grid columns: 72 (same scope as above)
- Maximum grid rows: 40 (same scope as above)

## Privacy

Crochet Weaver runs locally inside Obsidian.

- No telemetry.
- No network requests.
- No vault scanning.
- Pattern text is parsed only from the rendered code block.
- Progress (row and stitch) is stored locally in the plugin `data.json` file.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the plugin:

```bash
npm run build
```

Lint the project:

```bash
npm run lint
```

The parser is generated from `src/pattern/grammar.peggy` into `src/pattern/parser.ts`. Do not edit the generated file by hand.

### The pattern skill

The knowledge an assistant needs lives in [`skills/crochet-weaver-pattern/`](skills/crochet-weaver-pattern/) — `SKILL.md` plus `.zh-TW`, `.zh-CN` and `.ja` versions. See [Let an AI write the pattern for you](#let-an-ai-write-the-pattern-for-you) for the workflow. When you edit a SKILL file, run `npm run generate-skill` so the copy bundled into the plugin (`src/skill-content.ts`) matches; the build, tests and lint all run it first, and a test compares the two byte for byte.

## Manual Install

Build the plugin, then copy these files into your vault plugin folder:

```text
<Vault>/.obsidian/plugins/crochet-weaver/
  manifest.json
  main.js
  styles.css
```

Reload Obsidian and enable **Crochet Weaver** in **Settings -> Community plugins**.

## Release

1. Update `manifest.json` and `package.json` to the same SemVer version.
2. Update `versions.json` so the plugin version maps to the minimum Obsidian app version.
3. Run `npm test`, `npm run build`, and `npm run lint`.
4. Create a Git tag that exactly matches the manifest version, without a leading `v`.
5. Publish a GitHub release with `manifest.json`, `main.js`, and `styles.css` as release assets.
