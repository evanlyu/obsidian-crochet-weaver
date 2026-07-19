# Crochet Weaver

**[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)**

Crochet Weaver renders crochet stitch charts from text patterns inside Obsidian notes. It works locally in Markdown code blocks and does not make network requests.

## Features

- Render `crochet` code blocks as themed SVG stitch charts.
- Support flat rows, concentric rounds, and continuous spirals.
- Use common crochet symbols for chains, single crochet, half double crochet, double crochet, treble stitches, slip stitch, increases, decreases, bobbles, popcorns, and post stitches.
- Add row-level `blo` / `flo` markers and round anchors such as magic ring or chain ring.
- Show a configurable-color marker at the first stitch of the next round on concentric charts.
- Render `crochet-tool` blocks as a readable row checklist with stitch counts, progress controls, and a per-row stitch counter.
- **Embed the progress tool or a read-only pattern-text list directly next to a `crochet` chart** (`tool: on` / `text: on`), so you never have to paste the same pattern into two code blocks.
- **Highlight the current row and target stitch on the chart itself** when the progress tool is embedded, in a configurable color.
- Store all progress locally in the plugin data file.
- Fully localized UI: English, Traditional Chinese, Simplified Chinese, and Japanese.

## Quick Start

See [`examples/demo.md`](examples/demo.md) for every feature in this README exercised in one note — chart types, every stitch, row modifiers, the row connector line, error handling, the progress tool, panel positioning, and a real pattern conversion.

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

Use an explicit `id` when you want progress to survive edits to the pattern text. If `id` is omitted, Crochet Weaver derives a local hash from the code block content, so editing the block can reset progress.

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
rotation: smart | all | none
tool: on | off
text: on | off
position: right | left | below
---
```

Global plugin settings are used by default. Valid frontmatter values override those settings for one chart. Invalid values fall back to the global settings. `tool`, `text`, and `position` fall back to their own global defaults the same way (see [Settings](#settings)). `showNextRoundMarker` and its marker color are global-only and have no frontmatter override.

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

Supported stitch names:

- `ch`
- `sc`
- `hdc`
- `dc`
- `tr`
- `dtr`
- `sl st`
- `fpdc`
- `bpdc`
- `bobble`
- `popcorn`
- `inc`
- `dec`
- `MR`

Quantity prefixes are supported:

```crochet
R1: 10 ch, 6 sc
```

Repeats use square brackets:

```crochet
R2: [sc, inc] x 6
```

Groups use parentheses and render as a fan from one stitch position:

```crochet
R3: (dc, ch, dc), sc
```

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

## Embedding the Progress Tool or Pattern Text

A `crochet` block's `tool` and `text` frontmatter keys (or their matching global settings) let the chart carry its own progress panel, so the pattern only ever needs to be written once:

- `tool: on` — embeds the full interactive progress tool (row checklist, progress bar, per-row stitch counter with `+1` / `−1` / reset, previous/complete/reset controls).
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

- **Language**: follow Obsidian or choose English, Traditional Chinese, Simplified Chinese, or Japanese.
- **Chart scale**: chart display scale.
- **Symbol stroke width**: SVG stroke width.
- **Round spacing**: spacing between round or spiral rings.
- **Highlight increases and decreases**: accent `inc` and `dec` stitches.
- **Show next round marker**: show a marker at the first stitch of the next round in concentric round charts.
- **Next round marker color**: color used for that marker.
- **Chart tool current-position color**: color used to highlight the current row/stitch on a chart with an embedded progress tool.
- **Show progress tool by default**: embed the progress tool on every `crochet` chart unless overridden per chart with `tool: on/off`.
- **Show pattern text by default**: embed the read-only pattern text on every `crochet` chart unless overridden per chart with `text: on/off`.
- **Panel position**: default position (right / left / below) for an embedded tool or text panel, overridable per chart with `position:`.
- **Round symbol rotation**: `smart`, `all`, or `none` rotation for round and spiral symbols.

Settings marked "overridable per chart" can be set with the matching frontmatter key (`scale`, `stroke`, `spacing`, `highlight`, `rotation`, `tool`, `text`, `position`). `showNextRoundMarker` and both marker colors are global-only.

## Safety Limits

Crochet Weaver validates parsed charts before layout expansion. Extremely large row counts, stitch counts, repeats, nesting depth, or total render items are rejected with an inline error instead of freezing the Obsidian preview.

Current limits:

- Maximum rows: 200
- Maximum stitch quantity: 1000
- Maximum repeat count: 500
- Maximum total rendered stitches: 5000
- Maximum nesting depth: 8

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

The parser is generated from `src/grammar.peggy` into `src/parser.ts`. Do not edit `src/parser.ts` by hand.

### AI-assisted authoring

If you use an AI assistant to write or convert crochet patterns into Crochet Weaver's syntax, point it at [`docs/ai-pattern-authoring.md`](docs/ai-pattern-authoring.md) — a self-contained reference to the pattern language written for that purpose. A ready-to-use Claude Code skill lives at [`.claude/skills/crochet-weaver-pattern/`](.claude/skills/crochet-weaver-pattern/).

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
