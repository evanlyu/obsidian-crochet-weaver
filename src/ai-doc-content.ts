// Generated from docs/ai-pattern-authoring*.md — keep these in sync by hand
// whenever that doc changes; this is what "Copy AI pattern-authoring instructions"
// in the settings tab copies to the clipboard, bundled so it works fully offline
// (docs/*.md itself never ships with the installed plugin).
import type { Locale } from './i18n';

export const AI_PATTERN_AUTHORING_DOCS: Record<Locale, string> = {
	en: `# Crochet Weaver — AI Pattern Authoring Reference

**[English](ai-pattern-authoring.md) | [繁體中文](ai-pattern-authoring.zh-TW.md) | [简体中文](ai-pattern-authoring.zh-CN.md) | [日本語](ai-pattern-authoring.ja.md)**

This document is written **for an AI assistant** (Claude, ChatGPT, or any other model) that a crocheter has asked to convert a written pattern — or write a new one — into Crochet Weaver syntax: the small text language the Crochet Weaver Obsidian plugin's \`crochet\` / \`crochet-tool\` code blocks understand.

Paste this whole file into any AI chat, or point an agent at it, before asking it to convert a pattern.

## What you're generating

A Crochet Weaver pattern is a fenced Markdown code block:

\`\`\`\`markdown
\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`
\`\`\`\`

The block language is either:
- \`crochet\` — renders an SVG stitch chart, optionally with an embedded progress panel.
- \`crochet-tool\` — renders only a progress checklist (row list + stitch counter), no chart. Same pattern syntax inside.

Your job is almost always to produce a \`crochet\` block. Only use \`crochet-tool\` if the user explicitly says they don't want a chart, or already has a separate chart block and wants a standalone tracker for it.

## Block anatomy

\`\`\`
[optional frontmatter block]
R1: <steps>
R2: <steps>
...
\`\`\`

### Frontmatter

Optional, delimited by \`---\` lines, flat \`key: value\` pairs (no nesting, no lists):

| Key | Values | Default | Notes |
|---|---|---|---|
| \`type\` | \`flat\` \\| \`round\` \\| \`spiral\` | \`flat\` | See "Choosing a chart type" below. |
| \`id\` | any string | derived from block content | Set this whenever you also embed or write a \`crochet-tool\`/\`tool: on\` panel, so progress survives edits to the pattern text. |
| \`scale\` | positive number | plugin setting | Display scale. |
| \`stroke\` | positive number | plugin setting | SVG stroke width. |
| \`spacing\` | positive number | plugin setting | Pixel gap between round/spiral rings. |
| \`highlight\` | \`on\`/\`off\`/\`true\`/\`false\`/\`yes\`/\`no\`/\`1\`/\`0\` | plugin setting | Accent-colors \`inc\`/\`dec\` stitches. |
| \`style\` | \`standard\` \\| \`book\` \\| \`linked\` | plugin setting | Round-chart drawing style. \`book\` gives Japanese-pattern-book styling: a continuous spiral guide winds through the rounds, stitches sit above the previous-round stitch they're worked into, an \`inc\` is a **V** and a \`dec\` an **∧** drawn in line with the round's own stitches, rounds are numbered. \`linked\` uses the same layout but draws every stitch's own symbol and links each one to the stitch below it — useful for checking a conversion. Only affects \`type: round\`. |
| \`tool\` | boolean (as above) | plugin setting | Embeds the interactive progress tool next to the chart. See "Embedding a progress panel". |
| \`text\` | boolean (as above) | plugin setting | Embeds a read-only shorthand list next to the chart (ignored if \`tool\` is also on). |
| \`position\` | \`right\` \\| \`left\` \\| \`below\` | plugin setting | Where an embedded \`tool\`/\`text\` panel sits relative to the chart. |

Any invalid value silently falls back to the plugin's global setting — it will not error, so double-check values you're unsure about rather than relying on a visible failure.

### Rows

\`\`\`
R1: <steps>
Row 2: <steps>
\`\`\`

Both \`R<n>:\` and \`Row <n>:\` are accepted (case-insensitive on the label word). Row numbers are whatever you write — they don't have to be sequential, but sequential is what every real pattern and every example in this doc uses. **Only row 1's anchor (\`in MR\` / \`in ch ring\`) is actually rendered** as the chart's center — you can still write it on other rows for readability in a shared tool/text list, but it has no visual effect there.

Optional row-level modifier, right after the colon, before any steps:

\`\`\`
R1: blo, 6 sc
R2: flo, 6 sc
\`\`\`

- \`blo\` — back loop only for the whole row.
- \`flo\` — front loop only for the whole row.

Optional trailing anchor, at the very end of the row (only meaningful on row 1):

\`\`\`
R1: 6 sc in MR
R1: 6 sc in ch ring
\`\`\`

- \`in MR\` — magic ring center.
- \`in ch ring\` — small ring of chain stitches as the center (use when the source pattern says "chain N, join with sl st to form a ring" instead of a magic ring).

### Steps

Comma-separated (commas are optional but keep them — real patterns read better with them). Each step is one of:

**Stitch**, with an optional count on either side of the name — \`6 sc\`, \`sc6\` and \`sc 6\` all mean the same thing, so you can keep whichever form the source uses:

\`\`\`
sc          → one single crochet
10 ch       → ten chains
ch2         → two chains
sc 6        → six single crochets
\`\`\`

A slip stitch may be written \`sl st\`, \`slst\`, \`sl-st\` or \`sl_st\` — all four are read as the same stitch.

**Repeat**, square brackets + a count. \`x 6\`, \`x6\`, \`rep 6\` and \`rep6\` are all the same — use whichever matches the source:

\`\`\`
[sc, inc] x 6      → (sc, inc) repeated 6 times
[sc, inc] rep 6    → the same thing
\`\`\`

A bare \`rep\` with no number means "repeat until the round below is used up", which is what "around" / "to end of round" means in a written pattern. The count is worked out from the previous round, so you don't have to do the arithmetic:

\`\`\`
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst    → 2 repeats: 6 stitches below, 3 worked into per repeat
\`\`\`

Only use bare \`rep\` where the source really does say "around" — if the round below doesn't divide evenly by what one repeat works into, the chart reports an error rather than guessing, and a bare \`rep\` on row 1 has nothing to work into and is an error too. When the source states the number, write the number.

**Group**, parentheses — multiple stitches worked into *one* stitch/space (shells, clusters, corners); renders as a fan from a single position:

\`\`\`
(dc, ch, dc)       → dc, ch, dc all into the same stitch
\`\`\`

Repeats and groups can nest and contain each other.

### Supported stitch names

**Case-sensitive, lowercase**, except \`MR\` which is case-insensitive. Two-word names (\`sl st\`, \`hdc popcorn\`, \`tr popcorn\`) are written with a literal space, exactly as shown — 46 names total:

| Category | Names |
|---|---|
| Basic | \`ch\` \`sc\` \`hdc\` \`dc\` \`tr\` \`dtr\` \`sl st\` \`MR\` \`picot\` \`rsc\` |
| Shaping | \`inc\` \`dec\` |
| N-together decreases | \`sc2tog\` \`sc3tog\` \`hdc2tog\` \`hdc3tog\` \`hdc4tog\` \`hdc5tog\` \`dc2tog\` \`dc3tog\` \`dc4tog\` \`dc5tog\` |
| Post stitches | \`fpsc\` \`fphdc\` \`fpdc\` \`fptr\` \`bpsc\` \`bphdc\` \`bpdc\` \`bptr\` |
| Crossed stitches | \`xhdc\` \`xdc\` \`xtr\` |
| Clusters / puffs | \`hdc2cl\` \`hdc3cl\` \`hdc5cl\` \`dc2cl\` \`dc3cl\` \`dc5cl\` \`tr2cl\` \`tr3cl\` \`tr5cl\` \`bobble\` |
| Popcorns | \`popcorn\` (5-dc) \`hdc popcorn\` (5-hdc) \`tr popcorn\` (5-tr) |

**Every stitch except \`inc\` outputs 1 stitch for counting purposes** — that includes every N-together decrease (\`dc3tog\` still counts as 1, same as \`dec\`), every post/crossed stitch, every cluster/puff, and every popcorn. Only \`inc\` outputs 2.

**Decreases — pick the right token, don't default to \`dec\` for everything.** \`dec\` is specifically the simple sc-height 2-together decrease (the common amigurumi "invisible decrease" / "sc2tog" case with no stated height) — keep using it for that. But if the source states a stitch height or a together-count other than sc2, use the matching dedicated token instead, so the chart shows the right symbol at the right height:

- "sc2tog" / "invisible decrease" / unspecified amigurumi decrease → \`dec\` (or \`sc2tog\` — they render as different glyphs but count identically; prefer \`dec\` unless the source specifically writes "sc2tog")
- "sc3tog" → \`sc3tog\`
- "hdc2tog" through "hdc5tog" (any hdc-height N-together) → \`hdc2tog\`…\`hdc5tog\`
- "dc2tog" through "dc5tog" (any dc-height N-together) → \`dc2tog\`…\`dc5tog\`

There is still no dedicated token for N-into-one **increases** — those are groups, not stitch names (see "Group" below): "2 dc in next st" → \`(dc, dc)\`, "shell: 5 dc in next st" → \`(5 dc)\`.

The chain a round opens with **is** supported: write it as a plain \`ch\` step at the start of the row (\`R2: ch, [2 sc, inc] rep, slst\`). It is drawn at the round's seam, but it is not a stitch of the fabric — it adds nothing to the round's count and the next round does not work into it. The same goes for the \`sl st\` that closes a round, and for a \`mr\` written as a step (\`R1: mr, ch, sc6, slst\`) instead of as an \`in MR\` anchor.

Write these only where the source does. On a flat chart \`turn\` has no chart meaning, so \`ch 1, turn\` can be dropped.

### Color changes

The keyword \`color\` (optionally followed by \`:\`), then a CSS color name or \`#hex\` code, as its own step anywhere in the row — usually at the start of a row, or dropped in mid-row right where the source says to switch yarn:

\`\`\`
R6: 8 sc, color white, 8 sc, color black, 8 sc
\`\`\`

It has no width of its own (it doesn't count as a stitch). It applies to every stitch from that point on — through the rest of this row and every later row — and counts as normal, until another \`color\` step changes it again; there's no "reset to no color" token. The stitch symbols themselves always stay the chart's normal theme color — a literal \`black\`/\`white\` value only names the yarn, it isn't painted onto the symbols (that would go illegible in a dark or light theme, and would fight with the progress tool's own current-position highlight). Instead, the first stitch of each new color gets a small hollow ring in that color, so the switch is easy to spot without covering the stitch underneath it. The tool and pattern-text panels also spell it out as "change to \`<color>\`" right where it happens.

Use the exact color word or hex code the source gives (\`white\`, \`black\`, \`#ff8800\`, …) — don't invent or normalize colors the source doesn't state, and don't add \`color\` steps at all if the source never specifies yarn color for that piece.

## Phrase → token cheat sheet

Use this to translate common written-pattern phrasing. When in doubt, prefer \`inc\`/\`dec\` (which are chart-meaningful, weighted stitches) over spelling out "2 sc in next st" as two separate \`sc\`s — that would double-count stitches and throw off every round after it.

| Written pattern says | Write |
|---|---|
| "magic ring", "magic circle", "adjustable ring" | \`in MR\` anchor on row 1 |
| "ch 2, join with sl st to form a ring" (or similar) | \`in ch ring\` anchor on row 1 |
| "2 sc in same st" / "2 sc in next st" / "sc, inc" style increase | \`inc\` |
| "invisible decrease" / unspecified amigurumi "2 sts tog" | \`dec\` |
| "sc2tog" (stated explicitly) | \`sc2tog\` |
| "sc3tog" | \`sc3tog\` |
| "hdc2tog" … "hdc5tog" | \`hdc2tog\` … \`hdc5tog\` |
| "dc2tog" … "dc5tog" | \`dc2tog\` … \`dc5tog\` |
| "sc in each st around" for a round of N known stitches | \`N sc\` (write the literal count) |
| "(sc, inc) 6 times" / "repeat 6 times" | \`[sc, inc] x 6\` (or \`[sc, inc] rep 6\`) |
| "(2 sc, inc) around" / "repeat to end of round" | \`[2 sc, inc] rep\` |
| "ch 1" at the start of a round | leading \`ch\` step on that row |
| "(dc, ch 1, dc) in next st" (shell/corner) | \`(dc, ch, dc)\` |
| "2 dc in next st" (V-stitch increase) | \`(dc, dc)\` |
| "5 dc in next st" (shell) | \`(5 dc)\` |
| "join with sl st" at the end of a round | trailing \`sl st\` on that row |
| "working in back loops only" | \`blo\` after the row label |
| "working in front loops only" | \`flo\` after the row label |
| "ch 1, turn" / "turn" (flat rows) | omit — no chart effect |
| "FPdc" / "front post dc" | \`fpdc\` (also \`fpsc\`, \`fphdc\`, \`fptr\` at other heights) |
| "BPdc" / "back post dc" | \`bpdc\` (also \`bpsc\`, \`bphdc\`, \`bptr\` at other heights) |
| "cross 2 dc" / "crossed dc" (1-stitch cross) | \`xdc\` (also \`xhdc\`, \`xtr\` at other heights) |
| "3-dc cluster" / "dc3tog" used as a decorative cluster (not a decrease) | \`dc3cl\` (context matters — see note below) |
| "puff stitch" (typically hdc-based) | \`hdc2cl\` / \`hdc3cl\` / \`hdc5cl\` by stitch count |
| "popcorn stitch" (5 dc, most common) | \`popcorn\` |
| "5-hdc popcorn" / "5-tr popcorn" | \`hdc popcorn\` / \`tr popcorn\` |
| "picot" / "ch-3 picot" | \`picot\` |
| "crab stitch" / "reverse single crochet" | \`rsc\` |
| "change to white" / "8 sc BLACK, change to WHITE, …" (yarn color change) | \`color white\` step where the switch happens |

**Cluster vs. decrease ambiguity**: some patterns write "3tog" to mean an actual decrease (3 stitches become 1 — use \`sc3tog\`/\`hdc3tog\`/\`dc3tog\`) and others use "cluster" language for a *decorative* bundle of stitches worked into the *same* stitch that doesn't reduce the stitch count the same way (use \`dc3cl\`/\`hdc3cl\`/etc., or a group like \`(dc, dc, dc)\` if genuinely just 3 stitches fanned into one spot). Read the surrounding stitch-count annotations — if the row's total drops, it's a decrease token; if the count stays flat, it's a cluster/group.

### Worked example

Source (a very common amigurumi ball opening):

\`\`\`
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
\`\`\`

Converts to:

\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
\`\`\`

Sanity-check with the counting rule below: R2 = 6 \`inc\` × 2 stitches each = 12 ✓. R3 = 6 × (1 + 2) = 18 ✓. R4 = 6 × (2 + 2) = 24 ✓.

## Stitch counting rule (for sanity-checking your conversion)

Crochet Weaver computes a row's stitch count the same way real patterns annotate "(N sc)":

- \`inc\` = 2 output stitches.
- Every other stitch name = 1 output stitch — this includes every N-together decrease (\`dc3tog\` still counts as 1, same as \`dec\`), every post/crossed stitch, every cluster/puff, and every popcorn, not just the original basic set.
- A group \`(...)\` = sum of its children's weights.
- A repeat \`[...] x N\` = N × (sum of its children's weights).
- **The chain a round opens with, a \`mr\` written as a step, and the \`sl st\` that closes the round are all excluded from the count** — they are drawn, but they are instructions rather than stitches of the fabric, and the next round works into neither. \`R1: mr, ch, sc6, slst\` counts 6.
- A chain or slip stitch **in the middle** of a row is a real stitch and does count — only the round's opening and its closing join are treated this way.

After converting, add up each row's stitches and compare to the source pattern's own "(N sc)" annotations. A mismatch almost always means an increase/decrease got flattened into plain stitches (or vice versa) somewhere.

## Choosing a chart type

- **\`round\`** — concentric rings from a center point. Use for anything worked in the round with joins (hats, coasters, amigurumi pieces, granny squares worked as circles). This is the most common choice for amigurumi. Add \`style: book\` in frontmatter when the user asks for the printed-book look (enclosed rounds, parent-aligned stitches, numbered rounds); it changes only how the chart is drawn, never how the pattern is written.
- **\`spiral\`** — one continuous spiral, no per-round joins. Use only when the source pattern explicitly says "continuous spiral, do not join, place a stitch marker" — most amigurumi patterns that say "join" or number their rounds discretely should be \`round\`, not \`spiral\`.
- **\`flat\`** — alternating back-and-forth rows. Use for scarves, blankets worked flat, anything turned at the end of each row.

### Known limitation — don't fight it

A top-down \`round\` chart places every round at least one ring-spacing step farther out than the round before it — including decrease rounds. A decrease round does not shrink the ring back inward; it spreads fewer stitches around a same-or-larger ring instead, so rounds never overlap each other. This means a full pattern (increases, straight rounds, and decreases) can be charted in a single \`round\` block. What it still **cannot** do is curve back inward into a realistic closed 3D silhouette (e.g. a sphere) — the decrease portion will read as a continuously widening spiral of rings rather than a shape tapering back to a point. This matches how published amigurumi charts work too (they only diagram the flat/increase portion, not the finished 3D shape).

If a pattern's rounds go increase → straight → decrease, it's fine to chart every round in one \`round\` block — nothing will overlap. Add \`tool: on\` (or a separate \`crochet-tool\` block) so the full row-by-row pattern is trackable regardless of how the chart looks.

## Embedding a progress panel

Don't create two code blocks with the same pattern typed twice. Instead, add one frontmatter key to the single \`crochet\` block:

\`\`\`crochet
---
type: round
tool: on
id: my-pattern
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`

- \`tool: on\` — full interactive checklist next to the chart: row-by-row list, progress bar, and a per-row stitch counter (\`+1\` per stitch made, auto-completes the row on reaching its total). The chart also highlights the current row/stitch live.
- \`text: on\` — same row list, but read-only (no buttons, no progress, no chart highlight). Use when the person just wants the shorthand next to the picture.
- Always set an explicit \`id\` when using \`tool: on\` (or a standalone \`crochet-tool\`) if you expect the pattern text to be edited later — otherwise progress is keyed to a hash of the block content and resets on edit.

## Output format checklist

Before returning your answer:

1. Picked one chart \`type\` and justified it if it's not obvious from the source.
2. Every row converted with the phrase table above — no invented stitch tokens.
3. Row-1 anchor set if the source uses a magic ring or chain ring.
4. Trailing \`sl st\`, and a leading \`ch\`, added only where the source explicitly writes them.
5. Bare \`rep\` used only where the source says "around" / "to end of round"; an explicit number written wherever the source gives one.
6. Ran the stitch-counting rule against the source's own "(N)" annotations for at least the first few rows.
7. For any decrease/cluster, picked the token matching the source's stated height and count (\`sc2tog\` vs \`hdc3tog\` vs \`dc5tog\`, etc.) instead of defaulting everything to \`dec\`.
8. Asked the user (or picked a sensible default) for \`tool: on\` vs \`text: on\` vs neither, if they didn't specify.
9. Flagged anything you couldn't represent (unsupported stitch, ambiguous instruction) instead of silently guessing.
10. Added a \`color <name>\` step wherever the source explicitly changes yarn color, using its exact color word/hex — and added none where the source never states a color.
11. Returned one fenced \` \`\`\`crochet \` block (plus a second \` \`\`\`crochet-tool \` block only if they explicitly asked for a separate standalone tracker).
`,
	'zh-TW': `# Crochet Weaver — AI 織圖撰寫參考文件

**[English](ai-pattern-authoring.md) | [繁體中文](ai-pattern-authoring.zh-TW.md) | [简体中文](ai-pattern-authoring.zh-CN.md) | [日本語](ai-pattern-authoring.ja.md)**

這份文件是寫給 **AI 助理**（Claude、ChatGPT 或其他模型）使用的，當鉤織愛好者請你把一份文字織圖──或是從描述直接生成新織圖──轉換成 Crochet Weaver 語法時參考：這是 Crochet Weaver Obsidian 外掛的 \`crochet\` / \`crochet-tool\` 程式碼區塊所能理解的一種簡短文字語言。

在請 AI 轉換織圖之前，把整份文件貼進任何 AI 對話中，或讓代理程式（agent）參考這份文件。

## 你要產生的內容

一份 Crochet Weaver 織圖是一個 Markdown 圍籬程式碼區塊：

\`\`\`\`markdown
\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`
\`\`\`\`

區塊語言有兩種：
- \`crochet\` ── 渲染成 SVG 織圖，可選擇是否內嵌進度面板。
- \`crochet-tool\` ── 只渲染進度檢查清單（行列表 + 針數計數器），沒有織圖。內部的織圖語法相同。

你的任務幾乎都是產生 \`crochet\` 區塊。只有在使用者明確表示不需要織圖，或已經有另一個織圖區塊、只想要獨立的進度追蹤器時，才使用 \`crochet-tool\`。

## 區塊結構

\`\`\`
[選用的 frontmatter 區塊]
R1: <步驟>
R2: <步驟>
...
\`\`\`

### Frontmatter

選用，以 \`---\` 分隔的行包住，是單純的 \`key: value\` 配對（不可巢狀、不可用清單）：

| 鍵 | 值 | 預設 | 說明 |
|---|---|---|---|
| \`type\` | \`flat\` \\| \`round\` \\| \`spiral\` | \`flat\` | 見下方「選擇織圖類型」。 |
| \`id\` | 任意字串 | 由區塊內容推導 | 當你同時內嵌或撰寫 \`crochet-tool\`／\`tool: on\` 面板時，務必設定這個值，這樣即使之後編輯織圖文字，進度也不會遺失。 |
| \`scale\` | 正數 | 外掛設定值 | 顯示縮放比例。 |
| \`stroke\` | 正數 | 外掛設定值 | SVG 線條粗細。 |
| \`spacing\` | 正數 | 外掛設定值 | 圈與圈（round/spiral）之間的像素間距。 |
| \`highlight\` | \`on\`/\`off\`/\`true\`/\`false\`/\`yes\`/\`no\`/\`1\`/\`0\` | 外掛設定值 | 將 \`inc\`/\`dec\` 針目標示為強調色。 |
| \`style\` | \`standard\` \\| \`book\` \\| \`linked\` | 外掛設定值 | 環織織圖的繪製樣式。\`book\` 為日本鉤織書風格：一條連續螺旋線繞過每一圈、針目對齊上一圈鉤入的針目、加針畫成 **V**、減針畫成 **∧** 並與該圈其他針目並排、並標示圈數。\`linked\` 使用同樣的排版，但每一針都畫出自己的符號，並連線到它所鉤入的下方針目──適合用來檢查轉換結果。只影響 \`type: round\`。 |
| \`tool\` | 布林值（同上） | 外掛設定值 | 在織圖旁內嵌互動式進度工具。見「內嵌進度面板」。 |
| \`text\` | 布林值（同上） | 外掛設定值 | 在織圖旁內嵌唯讀的縮寫清單（若 \`tool\` 也開啟則會被忽略）。 |
| \`position\` | \`right\` \\| \`left\` \\| \`below\` | 外掛設定值 | 內嵌的 \`tool\`／\`text\` 面板相對於織圖要放在哪個位置。 |

任何無效的值都會安靜地退回外掛的全域設定──不會報錯，所以對不確定的值要自行再三確認，不要指望會有明顯的失敗提示。

### 行（Rows）

\`\`\`
R1: <步驟>
Row 2: <步驟>
\`\`\`

\`R<n>:\` 與 \`Row <n>:\` 兩種寫法都可以（標籤文字不分大小寫）。行數字可以隨你填寫──不一定要連續，但本文件中每個範例、以及每份真實織圖，都是照順序編號。**只有第 1 行的起針方式（\`in MR\` / \`in ch ring\`）真的會被渲染**成織圖的中心──你仍然可以在其他行也寫上起針方式以方便閱讀（例如在共用的 tool/text 清單中），但那不會有任何視覺效果。

選用的「行級」修飾詞，緊接在冒號之後、任何步驟之前：

\`\`\`
R1: blo, 6 sc
R2: flo, 6 sc
\`\`\`

- \`blo\` ── 整行只挑後半針（back loop only）。
- \`flo\` ── 整行只挑前半針（front loop only）。

選用的結尾起針方式，寫在該行的最尾端（只有第 1 行才有意義）：

\`\`\`
R1: 6 sc in MR
R1: 6 sc in ch ring
\`\`\`

- \`in MR\` ── 魔術環中心。
- \`in ch ring\` ── 用一小圈鎖針當中心（當原始織圖寫的是「鎖 N 針，用引拔針接成一個環」而不是魔術環時使用）。

### 步驟（Steps）

以逗號分隔（逗號可省略，但保留逗號會讓真實織圖更好讀）。每個步驟是下列其中一種：

**針目**，數量可以寫在名稱前面或後面──\`6 sc\`、\`sc6\`、\`sc 6\` 意思完全相同，原文怎麼寫就怎麼寫：

\`\`\`
sc          → 一針短針
10 ch       → 十針鎖針
ch2         → 兩針鎖針
sc 6        → 六針短針
\`\`\`

引拔針可以寫成 \`sl st\`、\`slst\`、\`sl-st\` 或 \`sl_st\`，四種都會被讀成同一個針法。

**重複**，用方括號 + 次數。\`x 6\`、\`x6\`、\`rep 6\`、\`rep6\` 都一樣，原文怎麼寫就用哪一種：

\`\`\`
[sc, inc] x 6      → (sc, inc) 重複 6 次
[sc, inc] rep 6    → 同上
\`\`\`

沒有數字的 \`rep\` 表示「重複到上一圈的針目用完為止」，也就是文字織圖裡的「繞一圈」／「重複到該圈結束」。次數會由上一圈算出來，你不必自己算：

\`\`\`
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst    → 2 次：下面有 6 針，每一次鉤入 3 針
\`\`\`

只有在原文真的寫「繞一圈」時才用單獨的 \`rep\`──若上一圈的針數無法被一次重複所鉤入的針數整除，織圖會直接報錯而不是自行猜測；第 1 行的 \`rep\` 沒有可鉤入的圈，同樣是錯誤。原文有寫次數時，就把數字寫出來。

**群組**，用括號──多個針目織進「同一個」針目或空間裡（貝殼針、玉針、轉角常見）；渲染時會從同一個位置呈扇形展開：

\`\`\`
(dc, ch, dc)       → dc、ch、dc 都織進同一針
\`\`\`

重複與群組可以互相巢狀。

### 支援的針法名稱

**區分大小寫，一律小寫**，\`MR\` 除外（不分大小寫）。兩個單字的名稱（\`sl st\`、\`hdc popcorn\`、\`tr popcorn\`）要照樣寫出中間的空格──總共 46 種：

| 分類 | 名稱 |
|---|---|
| 基本針法 | \`ch\` \`sc\` \`hdc\` \`dc\` \`tr\` \`dtr\` \`sl st\` \`MR\` \`picot\` \`rsc\` |
| 加減針 | \`inc\` \`dec\` |
| N 併 1 減針 | \`sc2tog\` \`sc3tog\` \`hdc2tog\` \`hdc3tog\` \`hdc4tog\` \`hdc5tog\` \`dc2tog\` \`dc3tog\` \`dc4tog\` \`dc5tog\` |
| 引拔針柱針法 | \`fpsc\` \`fphdc\` \`fpdc\` \`fptr\` \`bpsc\` \`bphdc\` \`bpdc\` \`bptr\` |
| 交叉針 | \`xhdc\` \`xdc\` \`xtr\` |
| 玉針／泡泡針 | \`hdc2cl\` \`hdc3cl\` \`hdc5cl\` \`dc2cl\` \`dc3cl\` \`dc5cl\` \`tr2cl\` \`tr3cl\` \`tr5cl\` \`bobble\` |
| 爆米花針 | \`popcorn\`（5 長針） \`hdc popcorn\`（5 中長針） \`tr popcorn\`（5 長長針） |

**除了 \`inc\` 以外，每種針法在計數時都算 1 針產出**──包含每一種 N 併 1 減針（例如 \`dc3tog\` 仍然算 1 針，跟 \`dec\` 一樣）、每一種前引／後引針、每一種交叉針、每一種玉針／泡泡針、每一種爆米花針。只有 \`inc\` 會產出 2 針。

**減針──選對正確的代號，不要每次都用 \`dec\` 打發。** \`dec\` 專指最基本的短針高度兩併一減針（也就是常見的娃娃編「隱形減針」／未特別註明高度的 sc2tog）──這種情況繼續用 \`dec\` 就好。但如果原文有註明針目高度、或併針數量不是「短針兩併一」，就要改用對應的專用代號，讓織圖顯示正確高度的符號：

- 「sc2tog」／「隱形減針」／未註明的娃娃編減針 → \`dec\`（或 \`sc2tog\`──兩者渲染出的符號不同，但計數方式一樣；除非原文明確寫「sc2tog」，否則優先用 \`dec\`）
- 「sc3tog」 → \`sc3tog\`
- 「hdc2tog」到「hdc5tog」（任何中長針高度的 N 併 1） → \`hdc2tog\`…\`hdc5tog\`
- 「dc2tog」到「dc5tog」（任何長針高度的 N 併 1） → \`dc2tog\`…\`dc5tog\`

目前還沒有專門代表「N 針織進 1 針」**加針**的代號──那些要用群組表示，不是針法名稱（見下方「群組」）：「在下一針織 2 長針」→ \`(dc, dc)\`，「貝殼針：在下一針織 5 長針」→ \`(5 dc)\`。

每圈開頭的起立鎖針**是**支援的：直接在該行開頭寫一個 \`ch\` 步驟（\`R2: ch, [2 sc, inc] rep, slst\`）。它會畫在該圈的接縫處，但不是織物的針目──不計入該圈針數，上一圈也不會鉤入它。結尾接合的 \`sl st\`，以及寫成步驟（而非 \`in MR\` 起針）的 \`mr\`（\`R1: mr, ch, sc6, slst\`）也一樣。

這些只有在原文有寫時才寫。平面織圖的「翻面」對織圖沒有意義，因此「鎖 1 針，翻面」可以省略。

### 換色

關鍵字 \`color\`（後面可加 \`:\`），接著寫 CSS 顏色名稱或 \`#hex\` 色碼，本身是獨立的一個步驟，可以寫在該行任何位置──通常放在行首，或直接插在原文說明換線的那個位置：

\`\`\`
R6: 8 sc, color white, 8 sc, color black, 8 sc
\`\`\`

它本身不佔寬度（不算一針）。從這個步驟開始，之後的每一針──包含這一行剩下的部分，以及之後所有行──都套用這個顏色，並照常計數，直到下一個 \`color\` 步驟改變顏色為止；沒有「恢復成無顏色」的寫法。針目符號本身一律維持織圖原本的主題色──\`black\`／\`white\` 這類字面顏色只是用來標記毛線顏色，不會真的畫成那個顏色（在深色或淺色主題下都可能變得看不清楚，也會跟進度工具自己的「目前位置」標示互相干擾）。取而代之的是：每次換成新顏色的第一針，會在旁邊畫一個該顏色的空心圓圈，讓換色位置一眼就能看出來，同時又不會遮住底下的針目符號。進度工具與織圖文字面板也會直接寫出「換成 \`<顏色>\`」提示換線的位置。

請直接使用原文寫的顏色字或色碼（\`white\`、\`black\`、\`#ff8800\` 等）──不要自行發明或轉換原文沒提到的顏色，原文完全沒提到顏色的部件也不要加上 \`color\` 步驟。

## 常見用語 → 代號對照表

用這張表把常見的文字織圖用語轉換成代號。有疑慮時，優先使用 \`inc\`／\`dec\`（這是織圖真正認得、有加權的針目），不要把「在下一針織 2 短針」拆成兩個獨立的 \`sc\`──那樣會讓針數被算兩次，並打亂之後每一圈的針數。

| 原始織圖寫法 | 轉換成 |
|---|---|
| 「魔術環」、「魔法圈」、「可調式圈」 | 第 1 行用 \`in MR\` 起針 |
| 「鎖 2 針，引拔接成一個環」（或類似寫法） | 第 1 行用 \`in ch ring\` 起針 |
| 「同一針織 2 短針」／「下一針織 2 短針」／「短針、加針」這類加針 | \`inc\` |
| 「隱形減針」／未註明的娃娃編「2 針併 1」 | \`dec\` |
| 「sc2tog」（原文明確寫出） | \`sc2tog\` |
| 「sc3tog」 | \`sc3tog\` |
| 「hdc2tog」…「hdc5tog」 | \`hdc2tog\` … \`hdc5tog\` |
| 「dc2tog」…「dc5tog」 | \`dc2tog\` … \`dc5tog\` |
| 「每針織短針，繞一圈」，針數已知為 N | \`N sc\`（直接寫出實際針數） |
| 「(短針、加針) 重複 6 次」／「重複 6 次」 | \`[sc, inc] x 6\`（或 \`[sc, inc] rep 6\`） |
| 「(短針 2 針、加針) 繞一圈」／「重複到該圈結束」 | \`[2 sc, inc] rep\` |
| 一圈開頭的「鎖 1 針」 | 該行開頭加上 \`ch\` 步驟 |
| 「(長針、鎖 1、長針) 織進下一針」（貝殼針／轉角） | \`(dc, ch, dc)\` |
| 「下一針織 2 長針」（V 形加針） | \`(dc, dc)\` |
| 「下一針織 5 長針」（貝殼針） | \`(5 dc)\` |
| 一圈結尾「引拔針接合」 | 該行結尾加上 \`sl st\` |
| 「只挑後半針織」 | 行標籤後加上 \`blo\` |
| 「只挑前半針織」 | 行標籤後加上 \`flo\` |
| 「鎖 1 針，翻面」／「翻面」（平織列） | 省略──不影響織圖 |
| 「FPdc」／「前引長針」 | \`fpdc\`（其他高度還有 \`fpsc\`、\`fphdc\`、\`fptr\`） |
| 「BPdc」／「後引長針」 | \`bpdc\`（其他高度還有 \`bpsc\`、\`bphdc\`、\`bptr\`） |
| 「交叉 2 長針」／「交叉長針」（單針交叉） | \`xdc\`（其他高度還有 \`xhdc\`、\`xtr\`） |
| 「3 針長針玉針」／被當成裝飾玉針使用的「dc3tog」（不是減針） | \`dc3cl\`（要看上下文──見下方附註） |
| 「泡泡針」（通常是中長針底） | 依針數用 \`hdc2cl\` / \`hdc3cl\` / \`hdc5cl\` |
| 「爆米花針」（最常見是 5 長針） | \`popcorn\` |
| 「5 中長針爆米花」／「5 長長針爆米花」 | \`hdc popcorn\` / \`tr popcorn\` |
| 「狗牙針」／「鎖 3 狗牙針」 | \`picot\` |
| 「小龍蝦針」／「反短針」 | \`rsc\` |
| 「換成白色」／「8 sc BLACK, change to WHITE, …」這類換線指示 | 在換線的位置寫 \`color white\` |

**玉針 vs. 減針的模糊地帶**：有些織圖用「3tog」表示真正的減針（3 針變 1 針──用 \`sc3tog\`／\`hdc3tog\`／\`dc3tog\`），也有些用「玉針／cluster」這種說法表示織進**同一針**、不會像減針那樣減少針數的裝飾性針目群（用 \`dc3cl\`／\`hdc3cl\` 等，或如果真的只是 3 針扇形織進一個位置，也可以用群組如 \`(dc, dc, dc)\`）。多留意該行前後的針數註記──如果整行的針數變少，就是減針代號；如果針數不變，就是玉針／群組。

### 範例演練

原文（娃娃編最常見的起頭方式）：

\`\`\`
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
\`\`\`

轉換成：

\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
\`\`\`

用下方的計數規則驗算：R2 = 6 個 \`inc\` × 每個 2 針 = 12 ✓。R3 = 6 × (1 + 2) = 18 ✓。R4 = 6 × (2 + 2) = 24 ✓。

## 針數計數規則（用來驗算你的轉換結果）

Crochet Weaver 計算一行針數的方式，跟真實織圖標註「(N sc)」的方式一樣：

- \`inc\` = 產出 2 針。
- 其他所有針法名稱 = 產出 1 針──包含每一種 N 併 1 減針（\`dc3tog\` 仍然算 1 針，跟 \`dec\` 一樣）、每一種前引／後引針、每一種交叉針、每一種玉針／泡泡針、每一種爆米花針，不只是最初的基本針法。
- 一個群組 \`(...)\` = 其內部所有子項權重的總和。
- 一個重複 \`[...] x N\` = N × （其內部所有子項權重的總和）。
- **每圈開頭的鎖針、寫成步驟的 \`mr\`，以及結尾接合的 \`sl st\`，都不計入針數**──它們會被畫出來，但屬於指示而不是織物的針目，上一圈也不會鉤入它們。\`R1: mr, ch, sc6, slst\` 算 6 針。
- 寫在**一行中間**的鎖針或引拔針則是真正的針目，要計入──只有一圈的開頭與結尾接合會被這樣處理。

轉換完成後，把每一行的針數加總，跟原始織圖自己標註的「(N sc)」比對。如果對不上，幾乎都是某個地方的加針或減針被誤植成一般針目（或反過來）。

## 選擇織圖類型

- **\`round\`（圓編）** ── 從中心點往外的同心圓。用於任何有接合（join）的圈織作品（帽子、杯墊、娃娃編各部位、以圓形織的祖母方格）。這是娃娃編最常用的選擇。使用者若想要鉤織書那種畫法（圈線框住每一圈、針目對齊、標示圈數），在 frontmatter 加上 \`style: book\` 即可；它只改變織圖的畫法，完全不影響織圖的寫法。
- **\`spiral\`（螺旋）** ── 一條連續螺旋，每圈之間沒有接合。只有在原始織圖明確寫「連續螺旋，不要接合，放記號扣」時才使用──大多數寫「接合」或有明確編號分圈的娃娃編織圖，應該用 \`round\`，不是 \`spiral\`。
- **\`flat\`（平織）** ── 來回交替的橫列。用於圍巾、平織毯子，以及任何在每列結尾要翻面的作品。

### 已知限制──不要硬碰硬

由上往下的 \`round\` 織圖，每一圈都會比前一圈至少多往外一個圈距（ring-spacing）的距離──包含減針圈也是。減針圈不會讓圓圈往內縮小；而是把較少的針目分散在同樣大小或更大的圓圈上，所以各圈永遠不會互相重疊。這代表一份完整織圖（加針、平織、減針都有）可以全部畫在同一個 \`round\` 區塊裡。但它仍然**無法**呈現真正往內收攏、變成封閉立體形狀（例如球體）的樣子──減針的部分會被畫成持續往外擴大的螺旋圈，而不是收攏成一個點的形狀。這其實跟已出版的娃娃編織圖慣例一樣（它們通常只畫平面／加針的部分，不畫成品的立體形狀）。

如果一份織圖的圈數是加針 → 平織 → 減針，把每一圈都畫在同一個 \`round\` 區塊裡完全沒問題──不會有任何重疊。可以加上 \`tool: on\`（或另外一個 \`crochet-tool\` 區塊），這樣不論織圖外觀如何，逐行的完整織圖都能被追蹤進度。

## 內嵌進度面板

不要建立兩個內容重複的程式碼區塊。只要在同一個 \`crochet\` 區塊的 frontmatter 加一個鍵就好：

\`\`\`crochet
---
type: round
tool: on
id: my-pattern
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`

- \`tool: on\` ── 在織圖旁顯示完整互動檢查清單：逐行列表、進度條，以及每行的針數計數器（每織一針按一次 \`+1\`，織到該行總針數會自動完成該行）。織圖也會即時標示目前的行／針。
- \`text: on\` ── 同樣的逐行列表，但唯讀（沒有按鈕、沒有進度、織圖不會標示）。適合對方只是想要旁邊有縮寫文字對照圖片時使用。
- 使用 \`tool: on\`（或獨立的 \`crochet-tool\`）時，如果預期之後會編輯織圖文字，務必設定明確的 \`id\`──否則進度會依區塊內容的雜湊值決定，一旦編輯內容就會重置。

## 輸出格式檢查清單

回覆之前，請確認：

1. 已選定一種織圖 \`type\`，若不是顯而易見的選擇，說明理由。
2. 每一行都用上方對照表轉換過──沒有自創的針法代號。
3. 若原文使用魔術環或鎖針環，第 1 行已設定起針方式。
4. 只有在原文明確寫出開頭的鎖針或結尾的接合時，才加上開頭的 \`ch\` 與結尾的 \`sl st\`。
5. 只有在原文寫「繞一圈」／「重複到該圈結束」時才用單獨的 \`rep\`；原文有給次數就把數字寫出來。
6. 至少對前幾行套用了針數計數規則，跟原文自己的「(N)」註記做過驗算。
7. 每個減針／玉針都選對了符合原文所述高度與併針數量的代號（例如 \`sc2tog\` vs \`hdc3tog\` vs \`dc5tog\` 等），而不是全部都用 \`dec\` 打發。
8. 如果使用者沒有特別指定，已詢問（或自行挑選合理預設值）要用 \`tool: on\`、\`text: on\`，還是都不用。
9. 標出任何你無法呈現的地方（不支援的針法、模糊不清的指示），而不是悄悄用猜的。
10. 在原文明確換線的地方加上 \`color <顏色>\` 步驟，使用原文寫的確切顏色字或色碼；原文沒提到顏色的地方就不要加。
11. 回覆一個圍籬 \` \`\`\`crochet \` 區塊（只有在對方明確要求獨立追蹤器時，才額外附上第二個 \` \`\`\`crochet-tool \` 區塊）。
`,
	'zh-CN': `# Crochet Weaver — AI 织图撰写参考文档

**[English](ai-pattern-authoring.md) | [繁體中文](ai-pattern-authoring.zh-TW.md) | [简体中文](ai-pattern-authoring.zh-CN.md) | [日本語](ai-pattern-authoring.ja.md)**

这份文档是写给 **AI 助手**（Claude、ChatGPT 或其他模型）使用的，当钩织爱好者请你把一份文字织图——或者直接根据描述生成新织图——转换成 Crochet Weaver 语法时参考：这是 Crochet Weaver Obsidian 插件的 \`crochet\` / \`crochet-tool\` 代码块所能理解的一种简短文本语言。

在请 AI 转换织图之前，把整份文档粘贴进任意 AI 对话，或者让智能体（agent）参考这份文档。

## 你要生成的内容

一份 Crochet Weaver 织图就是一个 Markdown 围栏代码块：

\`\`\`\`markdown
\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`
\`\`\`\`

代码块语言有两种：
- \`crochet\` —— 渲染成 SVG 织图，可以选择是否内嵌进度面板。
- \`crochet-tool\` —— 只渲染进度检查清单（逐行列表 + 针数计数器），没有织图。内部的织图语法相同。

你的任务几乎都是生成 \`crochet\` 代码块。只有当用户明确表示不需要织图，或者已经有另一个织图代码块、只想要一个独立的进度追踪器时，才使用 \`crochet-tool\`。

## 代码块结构

\`\`\`
[可选的 frontmatter 部分]
R1: <步骤>
R2: <步骤>
...
\`\`\`

### Frontmatter

可选，用 \`---\` 分隔的两行包住，是单纯的 \`key: value\` 键值对（不能嵌套，不能用列表）：

| 键 | 取值 | 默认值 | 说明 |
|---|---|---|---|
| \`type\` | \`flat\` \\| \`round\` \\| \`spiral\` | \`flat\` | 见下方“选择织图类型”。 |
| \`id\` | 任意字符串 | 由代码块内容推导 | 当你同时内嵌或编写 \`crochet-tool\`／\`tool: on\` 面板时，务必设置这个值，这样即使之后编辑织图文本，进度也不会丢失。 |
| \`scale\` | 正数 | 插件设置值 | 显示缩放比例。 |
| \`stroke\` | 正数 | 插件设置值 | SVG 线条粗细。 |
| \`spacing\` | 正数 | 插件设置值 | 圈与圈（round/spiral）之间的像素间距。 |
| \`highlight\` | \`on\`/\`off\`/\`true\`/\`false\`/\`yes\`/\`no\`/\`1\`/\`0\` | 插件设置值 | 把 \`inc\`/\`dec\` 针目标记为强调色。 |
| \`style\` | \`standard\` \\| \`book\` \\| \`linked\` | 插件设置值 | 环织织图的绘制样式。\`book\` 为日本钩织书风格：一条连续螺旋线绕过每一圈、针目对齐上一圈钩入的针目、加针画成 **V**、减针画成 **∧** 并与该圈其他针目并排、并标注圈数。\`linked\` 使用同样的排版，但每一针都画出自己的符号，并连线到它所钩入的下方针目——适合用来检查转换结果。只影响 \`type: round\`。 |
| \`tool\` | 布尔值（同上） | 插件设置值 | 在织图旁内嵌交互式进度工具。见“内嵌进度面板”。 |
| \`text\` | 布尔值（同上） | 插件设置值 | 在织图旁内嵌只读的缩写列表（如果 \`tool\` 也开启则会被忽略）。 |
| \`position\` | \`right\` \\| \`left\` \\| \`below\` | 插件设置值 | 内嵌的 \`tool\`／\`text\` 面板相对于织图放在哪个位置。 |

任何无效的值都会静默地回退到插件的全局设置——不会报错，所以对不确定的值要自己反复确认，不要指望会有明显的失败提示。

### 行（Rows）

\`\`\`
R1: <步骤>
Row 2: <步骤>
\`\`\`

\`R<n>:\` 和 \`Row <n>:\` 两种写法都可以（标签文字不区分大小写）。行号可以随你填写——不一定要连续，但本文档里的每个示例、以及每份真实织图，都是按顺序编号的。**只有第 1 行的起针方式（\`in MR\` / \`in ch ring\`）才会真正被渲染**成织图的中心——你仍然可以在其他行也写上起针方式方便阅读（比如在共享的 tool/text 列表里），但那不会有任何视觉效果。

可选的“行级”修饰符，紧跟在冒号之后、任何步骤之前：

\`\`\`
R1: blo, 6 sc
R2: flo, 6 sc
\`\`\`

- \`blo\` —— 整行只挑后半针（back loop only）。
- \`flo\` —— 整行只挑前半针（front loop only）。

可选的结尾起针方式，写在该行最末尾（只有第 1 行才有意义）：

\`\`\`
R1: 6 sc in MR
R1: 6 sc in ch ring
\`\`\`

- \`in MR\` —— 魔术环中心。
- \`in ch ring\` —— 用一小圈锁针作为中心（当原始织图写的是“锁 N 针，用引拔针接成一个环”而不是魔术环时使用）。

### 步骤（Steps）

用逗号分隔（逗号可以省略，但保留逗号会让真实织图更易读）。每个步骤是下列其中一种：

**针目**，数量可以写在名称前面或后面——\`6 sc\`、\`sc6\`、\`sc 6\` 意思完全相同，原文怎么写就怎么写：

\`\`\`
sc          → 一针短针
10 ch       → 十针锁针
ch2         → 两针锁针
sc 6        → 六针短针
\`\`\`

引拔针可以写成 \`sl st\`、\`slst\`、\`sl-st\` 或 \`sl_st\`，四种都会被读成同一个针法。

**重复**，用方括号 + 次数。\`x 6\`、\`x6\`、\`rep 6\`、\`rep6\` 都一样，原文怎么写就用哪一种：

\`\`\`
[sc, inc] x 6      → (sc, inc) 重复 6 次
[sc, inc] rep 6    → 同上
\`\`\`

没有数字的 \`rep\` 表示“重复到上一圈的针目用完为止”，也就是文字织图里的“绕一圈”／“重复到该圈结束”。次数会由上一圈算出来，你不必自己算：

\`\`\`
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst    → 2 次：下面有 6 针，每一次钩入 3 针
\`\`\`

只有在原文真的写“绕一圈”时才用单独的 \`rep\`——若上一圈的针数无法被一次重复所钩入的针数整除，织图会直接报错而不是自行猜测；第 1 行的 \`rep\` 没有可钩入的圈，同样是错误。原文有写次数时，就把数字写出来。

**分组**，用圆括号——多个针目织入“同一个”针目或空间里（贝壳针、枣针、转角常见）；渲染时会从同一个位置呈扇形展开：

\`\`\`
(dc, ch, dc)       → dc、ch、dc 都织入同一针
\`\`\`

重复和分组可以互相嵌套。

### 支持的针法名称

**区分大小写，一律小写**，\`MR\` 除外（不区分大小写）。两个单词的名称（\`sl st\`、\`hdc popcorn\`、\`tr popcorn\`）要照样写出中间的空格——一共 46 种：

| 分类 | 名称 |
|---|---|
| 基础针法 | \`ch\` \`sc\` \`hdc\` \`dc\` \`tr\` \`dtr\` \`sl st\` \`MR\` \`picot\` \`rsc\` |
| 加减针 | \`inc\` \`dec\` |
| N 并 1 减针 | \`sc2tog\` \`sc3tog\` \`hdc2tog\` \`hdc3tog\` \`hdc4tog\` \`hdc5tog\` \`dc2tog\` \`dc3tog\` \`dc4tog\` \`dc5tog\` |
| 引拔柱针法 | \`fpsc\` \`fphdc\` \`fpdc\` \`fptr\` \`bpsc\` \`bphdc\` \`bpdc\` \`bptr\` |
| 交叉针 | \`xhdc\` \`xdc\` \`xtr\` |
| 枣针／泡芙针 | \`hdc2cl\` \`hdc3cl\` \`hdc5cl\` \`dc2cl\` \`dc3cl\` \`dc5cl\` \`tr2cl\` \`tr3cl\` \`tr5cl\` \`bobble\` |
| 爆米花针 | \`popcorn\`（5 长针） \`hdc popcorn\`（5 中长针） \`tr popcorn\`（5 长长针） |

**除了 \`inc\` 以外，每种针法计数时都算 1 针产出**——包括每一种 N 并 1 减针（比如 \`dc3tog\` 仍然算 1 针，跟 \`dec\` 一样）、每一种前引／后引针、每一种交叉针、每一种枣针／泡芙针、每一种爆米花针。只有 \`inc\` 会产出 2 针。

**减针——选对正确的代号，不要每次都用 \`dec\` 应付。** \`dec\` 专指最基本的短针高度两并一减针（也就是常见的玩偶编“隐形减针”／未特别注明高度的 sc2tog）——这种情况继续用 \`dec\` 就好。但如果原文注明了针目高度、或并针数量不是“短针两并一”，就要换成对应的专用代号，让织图显示正确高度的符号：

- “sc2tog”／“隐形减针”／未注明的玩偶编减针 → \`dec\`（或 \`sc2tog\`——两者渲染出的符号不同，但计数方式一样；除非原文明确写“sc2tog”，否则优先用 \`dec\`）
- “sc3tog” → \`sc3tog\`
- “hdc2tog”到“hdc5tog”（任何中长针高度的 N 并 1） → \`hdc2tog\`…\`hdc5tog\`
- “dc2tog”到“dc5tog”（任何长针高度的 N 并 1） → \`dc2tog\`…\`dc5tog\`

目前还没有专门表示“N 针织入 1 针”**加针**的代号——那些要用分组表示，不是针法名称（见下方“分组”）：“在下一针织 2 长针”→ \`(dc, dc)\`，“贝壳针：在下一针织 5 长针”→ \`(5 dc)\`。

每圈开头的起立锁针**是**支持的：直接在该行开头写一个 \`ch\` 步骤（\`R2: ch, [2 sc, inc] rep, slst\`）。它会画在该圈的接缝处，但不是织物的针目——不计入该圈针数，上一圈也不会钩入它。结尾接合的 \`sl st\`，以及写成步骤（而不是 \`in MR\` 起针）的 \`mr\`（\`R1: mr, ch, sc6, slst\`）也一样。

这些只有在原文有写时才写。平面织图的“翻面”对织图没有意义，因此“锁 1 针，翻面”可以省略。

### 换色

关键字 \`color\`（后面可以加 \`:\`），接着写 CSS 颜色名称或 \`#hex\` 色码，本身是独立的一个步骤，可以写在该行任意位置——通常放在行首，或者直接插在原文说明换线的那个位置：

\`\`\`
R6: 8 sc, color white, 8 sc, color black, 8 sc
\`\`\`

它本身不占宽度（不算一针）。从这个步骤开始，之后的每一针——包括这一行剩下的部分，以及之后所有行——都套用这个颜色，并照常计数，直到下一个 \`color\` 步骤改变颜色为止；没有“恢复成无颜色”的写法。针目符号本身始终保持织图原本的主题色——\`black\`／\`white\` 这类字面颜色只是用来标记毛线颜色，并不会真的画成那个颜色（在深色或浅色主题下都可能变得难以辨认，也会和进度工具自己的“当前位置”标记互相干扰）。取而代之的是：每次换成新颜色的第一针旁边会画一个该颜色的空心圆圈，让换色位置一眼就能看出来，同时不会遮住底下的针目符号。进度工具与织图文字面板也会直接写出“换成 \`<颜色>\`”来提示换线的位置。

请直接使用原文写的颜色词或色码（\`white\`、\`black\`、\`#ff8800\` 等）——不要自行发明或转换原文没提到的颜色，原文完全没提到颜色的部件也不要加上 \`color\` 步骤。

## 常见说法 → 代号对照表

用这张表把常见的文字织图说法转换成代号。有疑问时，优先使用 \`inc\`／\`dec\`（这是织图真正认得、带权重的针目），不要把“在下一针织 2 短针”拆成两个独立的 \`sc\`——那样会让针数被算两次，并打乱之后每一圈的针数。

| 原始织图写法 | 转换成 |
|---|---|
| “魔术环”、“魔法环”、“可调节环” | 第 1 行用 \`in MR\` 起针 |
| “锁 2 针，引拔接成一个环”（或类似写法） | 第 1 行用 \`in ch ring\` 起针 |
| “同一针织 2 短针”／“下一针织 2 短针”／“短针、加针”这类加针 | \`inc\` |
| “隐形减针”／未注明的玩偶编“2 针并 1” | \`dec\` |
| “sc2tog”（原文明确写出） | \`sc2tog\` |
| “sc3tog” | \`sc3tog\` |
| “hdc2tog”…“hdc5tog” | \`hdc2tog\` … \`hdc5tog\` |
| “dc2tog”…“dc5tog” | \`dc2tog\` … \`dc5tog\` |
| “每针织短针，绕一圈”，针数已知为 N | \`N sc\`（直接写出实际针数） |
| “(短针、加针) 重复 6 次”／“重复 6 次” | \`[sc, inc] x 6\`（或 \`[sc, inc] rep 6\`） |
| “(短针 2 针、加针) 绕一圈”／“重复到该圈结束” | \`[2 sc, inc] rep\` |
| 一圈开头的“锁 1 针” | 该行开头加上 \`ch\` 步骤 |
| “(长针、锁 1、长针) 织入下一针”（贝壳针／转角） | \`(dc, ch, dc)\` |
| “下一针织 2 长针”（V 形加针） | \`(dc, dc)\` |
| “下一针织 5 长针”（贝壳针） | \`(5 dc)\` |
| 一圈结尾“引拔针接合” | 该行结尾加上 \`sl st\` |
| “只挑后半针织” | 行标签后加上 \`blo\` |
| “只挑前半针织” | 行标签后加上 \`flo\` |
| “锁 1 针，翻面”／“翻面”（平织行） | 省略——不影响织图 |
| “FPdc”／“前引长针” | \`fpdc\`（其他高度还有 \`fpsc\`、\`fphdc\`、\`fptr\`） |
| “BPdc”／“后引长针” | \`bpdc\`（其他高度还有 \`bpsc\`、\`bphdc\`、\`bptr\`） |
| “交叉 2 长针”／“交叉长针”（单针交叉） | \`xdc\`（其他高度还有 \`xhdc\`、\`xtr\`） |
| “3 针长针枣针”／被当作装饰枣针使用的“dc3tog”（不是减针） | \`dc3cl\`（要看上下文——见下方附注） |
| “泡芙针”（通常是中长针底） | 按针数用 \`hdc2cl\` / \`hdc3cl\` / \`hdc5cl\` |
| “爆米花针”（最常见是 5 长针） | \`popcorn\` |
| “5 中长针爆米花”／“5 长长针爆米花” | \`hdc popcorn\` / \`tr popcorn\` |
| “狗牙针”／“锁 3 狗牙针” | \`picot\` |
| “反短针”／“小龙虾针” | \`rsc\` |
| “换成白色”／“8 sc BLACK, change to WHITE, …”这类换线指示 | 在换线的位置写 \`color white\` |

**枣针 vs. 减针的模糊地带**：有些织图用“3tog”表示真正的减针（3 针变 1 针——用 \`sc3tog\`／\`hdc3tog\`／\`dc3tog\`），也有些用“枣针／cluster”这种说法表示织入**同一针**、不会像减针那样减少针数的装饰性针目组合（用 \`dc3cl\`／\`hdc3cl\` 等，或者如果真的只是 3 针扇形织入一个位置，也可以用分组如 \`(dc, dc, dc)\`）。多留意该行前后的针数标注——如果整行的针数变少，就是减针代号；如果针数不变，就是枣针／分组。

### 示例演练

原文（玩偶编最常见的起头方式）：

\`\`\`
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
\`\`\`

转换成：

\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
\`\`\`

用下方的计数规则验算：R2 = 6 个 \`inc\` × 每个 2 针 = 12 ✓。R3 = 6 × (1 + 2) = 18 ✓。R4 = 6 × (2 + 2) = 24 ✓。

## 针数计数规则（用来验算你的转换结果）

Crochet Weaver 计算一行针数的方式，跟真实织图标注“(N sc)”的方式一样：

- \`inc\` = 产出 2 针。
- 其他所有针法名称 = 产出 1 针——包括每一种 N 并 1 减针（\`dc3tog\` 仍然算 1 针，跟 \`dec\` 一样）、每一种前引／后引针、每一种交叉针、每一种枣针／泡芙针、每一种爆米花针，不只是最初的基础针法。
- 一个分组 \`(...)\` = 其内部所有子项权重的总和。
- 一个重复 \`[...] x N\` = N × （其内部所有子项权重的总和）。
- **每圈开头的锁针、写成步骤的 \`mr\`，以及结尾接合的 \`sl st\`，都不计入针数**——它们会被画出来，但属于指示而不是织物的针目，上一圈也不会钩入它们。\`R1: mr, ch, sc6, slst\` 算 6 针。
- 写在**一行中间**的锁针或引拔针则是真正的针目，要计入——只有一圈的开头与结尾接合会被这样处理。

转换完成后，把每一行的针数加总，跟原始织图自己标注的“(N sc)”比对。如果对不上，几乎都是某处的加针或减针被误写成普通针目（或者反过来）。

## 选择织图类型

- **\`round\`（圆编）** —— 从中心点向外的同心圆。用于任何有接合（join）的圈织作品（帽子、杯垫、玩偶编各部位、以圆形织的祖母方块）。这是玩偶编最常用的选择。用户若想要钩织书那种画法（圈线框住每一圈、针目对齐、标注圈数），在 frontmatter 加上 \`style: book\` 即可；它只改变织图的画法，完全不影响织图的写法。
- **\`spiral\`（螺旋）** —— 一条连续螺旋，每圈之间没有接合。只有在原始织图明确写“连续螺旋，不要接合，放记号扣”时才使用——大多数写“接合”或有明确编号分圈的玩偶编织图，应该用 \`round\`，而不是 \`spiral\`。
- **\`flat\`（平织）** —— 来回交替的横行。用于围巾、平织毯子，以及任何在每行结尾要翻面的作品。

### 已知局限——不要硬来

从上往下的 \`round\` 织图，每一圈都会比前一圈至少多向外一个圈距（ring-spacing）的距离——包括减针圈也是。减针圈不会让圆圈向内收缩；而是把较少的针目分散在同样大小或更大的圆圈上，所以各圈永远不会互相重叠。这意味着一份完整织图（加针、平织、减针都有）可以全部画在同一个 \`round\` 代码块里。但它仍然**无法**呈现真正向内收拢、变成封闭立体形状（比如球体）的样子——减针部分会被画成持续向外扩大的螺旋圈，而不是收拢成一个点的形状。这其实跟已出版的玩偶编织图惯例一样（它们通常只画平面／加针的部分，不画成品的立体形状）。

如果一份织图的圈数是加针 → 平织 → 减针，把每一圈都画在同一个 \`round\` 代码块里完全没问题——不会有任何重叠。可以加上 \`tool: on\`（或另外一个 \`crochet-tool\` 代码块），这样不论织图外观如何，逐行的完整织图都能追踪进度。

## 内嵌进度面板

不要创建两个内容重复的代码块。只需在同一个 \`crochet\` 代码块的 frontmatter 里加一个键就好：

\`\`\`crochet
---
type: round
tool: on
id: my-pattern
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`

- \`tool: on\` —— 在织图旁显示完整的交互式检查清单：逐行列表、进度条，以及每行的针数计数器（每织一针按一次 \`+1\`，织到该行总针数会自动完成该行）。织图也会实时标出当前的行／针。
- \`text: on\` —— 同样的逐行列表，但只读（没有按钮、没有进度、织图不会高亮）。适合对方只是想要旁边有缩写文字对照图片的情况。
- 使用 \`tool: on\`（或独立的 \`crochet-tool\`）时，如果预计之后会编辑织图文本，务必设置明确的 \`id\`——否则进度会依据代码块内容的哈希值决定，一旦编辑内容就会重置。

## 输出格式检查清单

回复之前，请确认：

1. 已选定一种织图 \`type\`，如果不是显而易见的选择，说明理由。
2. 每一行都用上方对照表转换过——没有自创的针法代号。
3. 如果原文使用魔术环或锁针环，第 1 行已设置起针方式。
4. 只有在原文明确写出开头的锁针或结尾的接合时，才加上开头的 \`ch\` 与结尾的 \`sl st\`。
5. 只有在原文写“绕一圈”／“重复到该圈结束”时才用单独的 \`rep\`；原文有给次数就把数字写出来。
6. 至少对前几行套用了针数计数规则，跟原文自己的“(N)”标注做过验算。
7. 每个减针／枣针都选对了符合原文所述高度与并针数量的代号（比如 \`sc2tog\` vs \`hdc3tog\` vs \`dc5tog\` 等），而不是全部都用 \`dec\` 应付。
8. 如果用户没有特别指定，已询问（或自行选择合理默认值）要用 \`tool: on\`、\`text: on\`，还是都不用。
9. 标出任何你无法呈现的地方（不支持的针法、含糊不清的指示），而不是悄悄用猜的。
10. 在原文明确换线的地方加上 \`color <颜色>\` 步骤，使用原文写的确切颜色词或色码；原文没提到颜色的地方就不要加。
11. 回复一个围栏 \` \`\`\`crochet \` 代码块（只有在对方明确要求独立追踪器时，才额外附上第二个 \` \`\`\`crochet-tool \` 代码块）。
`,
	ja: `# Crochet Weaver — AI 向け編み図作成リファレンス

**[English](ai-pattern-authoring.md) | [繁體中文](ai-pattern-authoring.zh-TW.md) | [简体中文](ai-pattern-authoring.zh-CN.md) | [日本語](ai-pattern-authoring.ja.md)**

このドキュメントは、かぎ針編みをする人から「文章の編み図を Crochet Weaver 記法に変換してほしい」「説明から新しい編み図を書いてほしい」と頼まれた **AI アシスタント**（Claude、ChatGPT、その他のモデル）向けに書かれています。Crochet Weaver 記法とは、Crochet Weaver Obsidian プラグインの \`crochet\` / \`crochet-tool\` コードブロックが理解できる、ごく小さなテキスト言語です。

編み図の変換を頼む前に、このファイル全体を AI とのチャットに貼り付けるか、エージェントにこのファイルを参照させてください。

## 生成するもの

Crochet Weaver の編み図は、Markdown のフェンス付きコードブロックです。

\`\`\`\`markdown
\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`
\`\`\`\`

コードブロックの言語は次の 2 種類です。
- \`crochet\` — SVG の編み図として描画され、進捗パネルを内蔵することもできます。
- \`crochet-tool\` — 進捗チェックリスト（段のリスト＋目数カウンター）だけを描画し、編み図は描画しません。中身の記法は同じです。

基本的にはほぼ常に \`crochet\` ブロックを生成してください。ユーザーが明示的に編み図を不要と言った場合、または既に別の編み図ブロックがあり単独の進捗トラッカーだけが欲しい場合にのみ \`crochet-tool\` を使います。

## ブロックの構造

\`\`\`
[任意の frontmatter ブロック]
R1: <ステップ>
R2: <ステップ>
...
\`\`\`

### Frontmatter

任意項目で、\`---\` の行で挟み、フラットな \`key: value\` の組だけで書きます（入れ子やリストは不可）。

| キー | 値 | 既定値 | メモ |
|---|---|---|---|
| \`type\` | \`flat\` \\| \`round\` \\| \`spiral\` | \`flat\` | 下記「編み図タイプの選び方」を参照。 |
| \`id\` | 任意の文字列 | ブロックの内容から自動生成 | \`crochet-tool\`／\`tool: on\` パネルを併用する場合は必ず設定してください。パターン文を後で編集しても進捗が保持されます。 |
| \`scale\` | 正の数値 | プラグイン設定 | 表示倍率。 |
| \`stroke\` | 正の数値 | プラグイン設定 | SVG の線の太さ。 |
| \`spacing\` | 正の数値 | プラグイン設定 | 輪編み／スパイラルの段と段の間隔（ピクセル）。 |
| \`highlight\` | \`on\`/\`off\`/\`true\`/\`false\`/\`yes\`/\`no\`/\`1\`/\`0\` | プラグイン設定 | \`inc\`/\`dec\` の目をアクセントカラーで強調表示します。 |
| \`style\` | \`standard\` \\| \`book\` \\| \`linked\` | プラグイン設定 | 輪編みチャートの描画スタイル。\`book\` は日本の編み物本風：連続したらせん線が各段を巡り、針目が前段の編み入れ先の真上に並び、増し目は **V**、減らし目は **∧** としてその段の針目と同じ列に描かれ、段数が表示されます。\`linked\` は同じ配置のまま、各針目の記号をそれぞれ描いて編み入れ先の目と線でつなぎます（変換の確認に便利です）。\`type: round\` にのみ影響します。 |
| \`tool\` | 真偽値（上記と同様） | プラグイン設定 | 編み図の横にインタラクティブな進捗ツールを埋め込みます。「進捗パネルを埋め込む」を参照。 |
| \`text\` | 真偽値（上記と同様） | プラグイン設定 | 編み図の横に読み取り専用の略記リストを埋め込みます（\`tool\` が有効な場合は無視されます）。 |
| \`position\` | \`right\` \\| \`left\` \\| \`below\` | プラグイン設定 | 埋め込んだ \`tool\`／\`text\` パネルを編み図に対してどこに配置するか。 |

無効な値はエラーにならず、静かにプラグインの全体設定にフォールバックします。目に見える失敗は起きないので、確信が持てない値は自分でよく確認してください。

### 段（Rows）

\`\`\`
R1: <ステップ>
Row 2: <ステップ>
\`\`\`

\`R<n>:\` と \`Row <n>:\` のどちらの書き方でも構いません（ラベルの文字は大文字・小文字を区別しません）。段番号は自由に書けます──連番である必要はありませんが、このドキュメントのすべての例、そして実際の編み図のほとんどは連番です。**実際に描画される起点として扱われるのは 1 段目の起点指定（\`in MR\` / \`in ch ring\`）だけ**です──他の段にも起点指定を書いて構いません（共有の tool/text リストで読みやすくするためなど）が、見た目には影響しません。

任意の「段レベル」の修飾子は、コロンの直後、ステップの前に書きます。

\`\`\`
R1: blo, 6 sc
R2: flo, 6 sc
\`\`\`

- \`blo\` — その段全体を後ろ半目（back loop only）で編む。
- \`flo\` — その段全体を前半目（front loop only）で編む。

任意の起点指定は、その段の一番最後に書きます（1 段目のみ意味を持ちます）。

\`\`\`
R1: 6 sc in MR
R1: 6 sc in ch ring
\`\`\`

- \`in MR\` — 魔法の輪（マジックリング）を中心にする。
- \`in ch ring\` — 鎖編みの小さな輪を中心にする（原文が「輪の作り目」ではなく「鎖 N 目を引き抜き編みでつないで輪にする」と書いている場合に使用）。

### ステップ（Steps）

カンマ区切りで書きます（カンマは省略可能ですが、付けておくと実際の編み図として読みやすくなります）。各ステップは次のいずれかです。

**針目**。数は名前の前でも後ろでも構いません──\`6 sc\`、\`sc6\`、\`sc 6\` はすべて同じ意味なので、原文の書き方をそのまま使えます。

\`\`\`
sc          → 細編み 1 目
10 ch       → 鎖編み 10 目
ch2         → 鎖編み 2 目
sc 6        → 細編み 6 目
\`\`\`

引き抜き編みは \`sl st\`、\`slst\`、\`sl-st\`、\`sl_st\` のいずれでも書け、4 つとも同じ針目として読まれます。

**繰り返し**。角括弧＋回数で表します。\`x 6\`、\`x6\`、\`rep 6\`、\`rep6\` はすべて同じなので、原文に合う書き方を選んでください。

\`\`\`
[sc, inc] x 6      → (sc, inc) を 6 回繰り返す
[sc, inc] rep 6    → 同じ意味
\`\`\`

数字のない \`rep\` は「下の段の目がなくなるまで繰り返す」という意味で、文章の編み図でいう「くるりと 1 周」「段の終わりまで繰り返す」に当たります。回数は前段から計算されるので、自分で計算する必要はありません。

\`\`\`
R1: mr, ch, sc6, slst
R2: ch, [2 sc, inc] rep, slst    → 2 回：下に 6 目あり、1 回で 3 目に編み入れる
\`\`\`

数字なしの \`rep\` は、原文が本当に「1 周」と言っている場合にのみ使ってください──前段の目数が 1 回分の編み入れ目数で割り切れない場合、勝手に決めずにエラーとして知らせます。1 段目の \`rep\` は編み入れる前段がないので、これもエラーです。原文に回数が書かれている場合は、その数字を書いてください。

**グループ**。丸括弧で表し、複数の針目を「同じ 1 目（または空間）」に編み入れる場合に使います（貝殻編み、玉編み、角編みなどでよく使う）。描画時には同じ位置から扇形に展開されます。

\`\`\`
(dc, ch, dc)       → dc、ch、dc をすべて同じ目に編み入れる
\`\`\`

繰り返しとグループは互いに入れ子にできます。

### 対応している針目名

**大文字・小文字を区別し、基本は小文字**で書きます。\`MR\` だけは大文字・小文字を区別しません。2 語からなる名前（\`sl st\`、\`hdc popcorn\`、\`tr popcorn\`）は、間のスペースをそのまま書いてください。全部で 46 種類あります。

| 分類 | 名前 |
|---|---|
| 基本の針目 | \`ch\` \`sc\` \`hdc\` \`dc\` \`tr\` \`dtr\` \`sl st\` \`MR\` \`picot\` \`rsc\` |
| 増減目 | \`inc\` \`dec\` |
| N目一度の減目 | \`sc2tog\` \`sc3tog\` \`hdc2tog\` \`hdc3tog\` \`hdc4tog\` \`hdc5tog\` \`dc2tog\` \`dc3tog\` \`dc4tog\` \`dc5tog\` |
| 引き上げ編み（ポスト編み） | \`fpsc\` \`fphdc\` \`fpdc\` \`fptr\` \`bpsc\` \`bphdc\` \`bpdc\` \`bptr\` |
| 交差編み | \`xhdc\` \`xdc\` \`xtr\` |
| 玉編み／パフステッチ | \`hdc2cl\` \`hdc3cl\` \`hdc5cl\` \`dc2cl\` \`dc3cl\` \`dc5cl\` \`tr2cl\` \`tr3cl\` \`tr5cl\` \`bobble\` |
| ポップコーン編み | \`popcorn\`（長編み 5 目） \`hdc popcorn\`（中長編み 5 目） \`tr popcorn\`（長々編み 5 目） |

**\`inc\` 以外のすべての針目は、目数の計算上 1 目として出力されます**──あらゆる N目一度の減目（\`dc3tog\` も \`dec\` と同じく 1 目扱い）、あらゆる表引き／裏引き編み、あらゆる交差編み、あらゆる玉編み／パフステッチ、あらゆるポップコーン編みも含みます。2 目を出力するのは \`inc\` だけです。

**減目 —— 何でも \`dec\` で済ませず、正しいトークンを選んでください。** \`dec\` は、細編みの高さで 2 目を 1 目にする最も基本的な減目（アミグルミでよく言う「隠し減目」／高さが明記されていない sc2tog）を専門に表します──この場合はそのまま \`dec\` を使ってください。ただし原文に針目の高さが明記されている場合や、併せる目数が「細編み 2 目一度」以外の場合は、対応する専用トークンに置き換えて、正しい高さの記号が編み図に表示されるようにしてください。

- 「sc2tog」／「隠し減目」／高さが明記されていないアミグルミの減目 → \`dec\`（または \`sc2tog\`──描画される記号は異なりますが目数の数え方は同じです。原文に明確に「sc2tog」と書かれていない限り \`dec\` を優先してください）
- 「sc3tog」 → \`sc3tog\`
- 「hdc2tog」〜「hdc5tog」（中長編みの高さの N目一度） → \`hdc2tog\`…\`hdc5tog\`
- 「dc2tog」〜「dc5tog」（長編みの高さの N目一度） → \`dc2tog\`…\`dc5tog\`

「N 目を 1 目に編み入れる」**増し目**専用のトークンはまだありません──それらはグループとして表現します（下記「グループ」を参照）。「次の目に長編み 2 目」→ \`(dc, dc)\`、「貝殻編み：次の目に長編み 5 目」→ \`(5 dc)\`。

段の最初の立ち上がりの鎖編みは**対応しています**。その段の先頭にそのまま \`ch\` ステップとして書いてください（\`R2: ch, [2 sc, inc] rep, slst\`）。段の継ぎ目に描かれますが、編み地の目ではないので、その段の目数には入らず、次の段もそこには編み入れません。段を閉じる \`sl st\` や、\`in MR\` の起点指定ではなくステップとして書いた \`mr\`（\`R1: mr, ch, sc6, slst\`）も同じ扱いです。

これらは原文にある場合にのみ書いてください。平編みの「編み地を返す」は編み図上の意味を持たないので、「鎖 1 目、編み地を返す」は省略できます。

### 配色の変更

キーワード \`color\`（後ろに \`:\` を付けてもよい）に続けて CSS の色名か \`#hex\` コードを書く、それ自体が独立したステップです。段のどこにでも書けます──たいていは段の先頭、または原文で糸を切り替えると書かれている位置にそのまま挿入します。

\`\`\`
R6: 8 sc, color white, 8 sc, color black, 8 sc
\`\`\`

それ自体には幅がありません（目数には数えません）。このステップ以降のすべての針目──この段の残りと、それ以降のすべての段──にこの色が適用され、目数は通常どおり数えられます。次の \`color\` ステップで変更されるまで有効で、「色指定なしに戻す」というトークンはありません。針目の記号そのものは常に編み図本来のテーマカラーのままです──\`black\`／\`white\` のような文字どおりの色は毛糸の色を示すためのラベルであり、実際にその色で描画されるわけではありません（ダークテーマやライトテーマで見えにくくなったり、進捗ツール自身の「現在位置」ハイライトと競合したりするためです）。その代わり、新しい色に変わった最初の針目の横にその色の小さな中抜きの円を描き、針目の記号自体は隠さずに切り替え位置がひと目で分かるようにしています。進捗ツールとパターン文字パネルにも、切り替わる位置に「\`<色>\` に変更」とそのまま表示されます。

原文に書かれている色の単語やカラーコードをそのまま使ってください（\`white\`、\`black\`、\`#ff8800\` など）──原文にない色を考え出したり置き換えたりせず、原文が色をまったく指定していないパーツには \`color\` ステップを追加しないでください。

## 原文表現 → トークン対応表

よくある文章表現の編み図をトークンに変換する際にこの表を使ってください。迷ったときは、意味のある重み付き針目である \`inc\`／\`dec\` を優先し、「次の目に細編み 2 目」を 2 つの独立した \`sc\` に分解しないでください──それをすると目数が二重にカウントされ、以降のすべての段の目数がずれてしまいます。

| 原文の表現 | 変換先 |
|---|---|
| 「魔法の輪」「マジックリング」「調節可能な輪」 | 1 段目に \`in MR\` を起点指定 |
| 「鎖 2 目、引き抜き編みでつないで輪にする」（または類似表現） | 1 段目に \`in ch ring\` を起点指定 |
| 「同じ目に細編み 2 目」／「次の目に細編み 2 目」／「細編み、増し目」のような増し目 | \`inc\` |
| 「隠し減目」／高さが明記されていないアミグルミの「2 目一度」 | \`dec\` |
| 「sc2tog」（原文に明記） | \`sc2tog\` |
| 「sc3tog」 | \`sc3tog\` |
| 「hdc2tog」…「hdc5tog」 | \`hdc2tog\` … \`hdc5tog\` |
| 「dc2tog」…「dc5tog」 | \`dc2tog\` … \`dc5tog\` |
| 目数が N と分かっている場合の「くるりと 1 周、細編み」 | \`N sc\`（実際の目数をそのまま書く） |
| 「(細編み、増し目) を 6 回」／「6 回繰り返す」 | \`[sc, inc] x 6\`（または \`[sc, inc] rep 6\`） |
| 「(細編み 2 目、増し目) をくるりと 1 周」／「段の終わりまで繰り返す」 | \`[2 sc, inc] rep\` |
| 段の最初の「鎖 1 目」 | その段の先頭に \`ch\` ステップを追加 |
| 「次の目に (長編み、鎖 1、長編み)」（貝殻編み／角） | \`(dc, ch, dc)\` |
| 「次の目に長編み 2 目」（V字の増し目） | \`(dc, dc)\` |
| 「次の目に長編み 5 目」（貝殻編み） | \`(5 dc)\` |
| 段の最後で「引き抜き編みでつなぐ」 | その段の末尾に \`sl st\` を追加 |
| 「後ろ半目だけ編む」 | 段ラベルの後ろに \`blo\` |
| 「前半目だけ編む」 | 段ラベルの後ろに \`flo\` |
| 「鎖 1 目、編み地を返す」／「返す」（平編みの段） | 省略する──編み図に影響なし |
| 「FPdc」／「表引き長編み」 | \`fpdc\`（他の高さは \`fpsc\`、\`fphdc\`、\`fptr\`） |
| 「BPdc」／「裏引き長編み」 | \`bpdc\`（他の高さは \`bpsc\`、\`bphdc\`、\`bptr\`） |
| 「長編み 2 目を交差」／「交差長編み」（1 目分の交差） | \`xdc\`（他の高さは \`xhdc\`、\`xtr\`） |
| 「長編み 3 目の玉編み」／減目ではなく装飾として使われる「dc3tog」 | \`dc3cl\`（文脈による──下記の注記を参照） |
| 「パフステッチ」（多くは中長編みベース） | 目数に応じて \`hdc2cl\` / \`hdc3cl\` / \`hdc5cl\` |
| 「ポップコーン編み」（最も一般的なのは長編み 5 目） | \`popcorn\` |
| 「中長編み 5 目のポップコーン」／「長々編み 5 目のポップコーン」 | \`hdc popcorn\` / \`tr popcorn\` |
| 「ピコット」／「鎖 3 目のピコット」 | \`picot\` |
| 「逆細編み」／「ザリガニ編み」 | \`rsc\` |
| 「白に変更」／「8 sc BLACK, change to WHITE, …」のような配色変更の指示 | 切り替わる位置に \`color white\` |

**玉編み vs. 減目のあいまいなケース**：原文が「3tog」を本当の減目（3 目が 1 目になる──\`sc3tog\`／\`hdc3tog\`／\`dc3tog\` を使う）の意味で使っている場合と、**同じ 1 目**に編み入れる装飾的な針目のまとまり（減目のようには目数が減らない──\`dc3cl\`／\`hdc3cl\` などを使う。あるいは本当にただ 3 目を 1 か所に扇形で編み入れるだけなら \`(dc, dc, dc)\` のようなグループでも構いません）を指して「玉編み／cluster」と表現している場合があります。その段の前後にある目数の注記をよく確認してください──段全体の目数が減っていれば減目トークン、目数が変わらなければ玉編み／グループです。

### 変換例

原文（アミグルミの起点として最もよくあるパターン）：

\`\`\`
1. 6 sc in a magic ring. (6)
2. Inc in each st around. (12)
3. (Sc, inc) around. (18)
4. (2 sc, inc) around. (24)
\`\`\`

変換後：

\`\`\`crochet
---
type: round
---
R1: 6 sc in MR
R2: [inc] x 6
R3: [sc, inc] x 6
R4: [2 sc, inc] x 6
\`\`\`

下記の目数計算ルールで検算します。R2 = \`inc\` 6 個 × 各 2 目 = 12 ✓。R3 = 6 × (1 + 2) = 18 ✓。R4 = 6 × (2 + 2) = 24 ✓。

## 目数計算ルール（変換結果の検算用）

Crochet Weaver は、実際の編み図が「(N sc)」と注記するのと同じ方法で、段の目数を計算します。

- \`inc\` = 2 目を出力。
- それ以外のすべての針目名 = 1 目を出力──あらゆる N目一度の減目（\`dc3tog\` も \`dec\` と同じく 1 目扱い）、あらゆる表引き／裏引き編み、あらゆる交差編み、あらゆる玉編み／パフステッチ、あらゆるポップコーン編みも含み、最初からある基本の針目だけではありません。
- グループ \`(...)\` = 内部の子要素の重みの合計。
- 繰り返し \`[...] x N\` = N × （内部の子要素の重みの合計）。
- **段の最初の鎖編み、ステップとして書いた \`mr\`、段を閉じる \`sl st\` は、いずれも目数に含まれません**──描画はされますが、編み地の目ではなく指示であり、次の段もそこには編み入れません。\`R1: mr, ch, sc6, slst\` は 6 目です。
- **段の途中**にある鎖編みや引き抜き編みは本物の針目なので数に入ります──この扱いになるのは、段の最初の立ち上がりと最後のつなぎ目だけです。

変換が終わったら、各段の目数を合計して、原文自身の「(N sc)」という注記と比較してください。数が合わない場合は、ほぼ必ずどこかで増し目や減目が普通の針目として平坦化されてしまっている（またはその逆）ことが原因です。

## 編み図タイプの選び方

- **\`round\`（輪編み）** — 中心点から外側へ広がる同心円。つなぎ（join）のある輪編み作品（帽子、コースター、アミグルミの各パーツ、円形のグラニースクエアなど）に使います。アミグルミで最もよく使われる選択肢です。編み物本のような描画（連続らせんの区切り線、針目の整列、段数表示）を求められたら frontmatter に \`style: book\` を追加してください。チャートの描き方だけが変わり、パターンの書き方には一切影響しません。
- **\`spiral\`（スパイラル）** — 段ごとのつなぎがない、1 本の連続した螺旋。原文に「連続スパイラル、つながずに段目リングを付ける」と明記されている場合にのみ使ってください──「つなぐ」と書かれていたり、段番号がはっきり振られていたりするほとんどのアミグルミ編み図は \`spiral\` ではなく \`round\` にすべきです。
- **\`flat\`（平編み）** — 交互に往復する段。マフラーや平編みのブランケットなど、各段の終わりで編み地を返す作品に使います。

### 既知の制限事項──無理に解決しようとしない

上から見た \`round\` 編み図は、どの段も必ず前の段より少なくとも 1 段分（ring-spacing）外側に配置されます──減目の段も例外ではありません。減目の段は輪を内側に縮めるのではなく、より少ない目数を同じかそれより大きな輪の上に配置し直すだけなので、段同士が重なることはありません。そのため、増し目・平編み・減目がすべて含まれる完全な編み図でも、1 つの \`round\` ブロックにまとめて描画できます。ただし、球体のような**本当に内側にすぼまって閉じた立体形状**を表現することは**できません**──減目の部分は、先端に向かってすぼまる形ではなく、外側に広がり続ける螺旋として描画されます。これは実際に出版されているアミグルミの編み図でも同じです（多くは平面／増し目の部分だけを図解し、完成品の立体形状は図解しません）。

編み図の段が 増し目 → 平編み → 減目 の順に進む場合でも、すべての段を 1 つの \`round\` ブロックにまとめて問題ありません──重なりは発生しません。\`tool: on\`（または別の \`crochet-tool\` ブロック）を追加すれば、編み図の見た目にかかわらず、段ごとの完全な編み図の進捗を追跡できます。

## 進捗パネルを埋め込む

同じパターンを 2 つのコードブロックに重複して書かないでください。代わりに、1 つの \`crochet\` ブロックの frontmatter にキーを 1 つ追加するだけで済みます。

\`\`\`crochet
---
type: round
tool: on
id: my-pattern
---
R1: 6 sc in MR
R2: [inc] x 6
\`\`\`

- \`tool: on\` — 編み図の横に完全なインタラクティブチェックリストを表示します：段ごとのリスト、進捗バー、各段の目数カウンター（1 目編むごとに \`+1\` を押し、その段の合計に達すると自動でその段を完了扱いにします）。編み図も現在の段／目をリアルタイムでハイライトします。
- \`text: on\` — 同じ段リストですが読み取り専用です（ボタンなし、進捗なし、編み図のハイライトなし）。相手が画像の横に略記の対応表だけ欲しい場合に使います。
- \`tool: on\`（または独立した \`crochet-tool\`）を使う場合、パターン文が後で編集される可能性があるなら、必ず明示的な \`id\` を設定してください──設定しないと、進捗はブロック内容のハッシュ値に紐づけられ、内容を編集するとリセットされてしまいます。

## 出力フォーマットのチェックリスト

回答を返す前に、次を確認してください。

1. 編み図の \`type\` を 1 つ選び、それが自明でない場合は理由を説明した。
2. すべての段を上記の対応表に沿って変換した──独自に考えた針目トークンを使っていない。
3. 原文が魔法の輪または鎖の輪を使っている場合、1 段目に起点指定を設定した。
4. 原文が明確に書いている場合にのみ、先頭の \`ch\` と末尾の \`sl st\` を追加した。
5. 数字なしの \`rep\` は原文が「1 周」「段の終わりまで」と書いている場合にのみ使い、回数が書かれている場合はその数字を書いた。
6. 少なくとも最初の数段について、目数計算ルールを原文自身の「(N)」という注記と照合して検算した。
7. すべての減目／玉編みについて、原文に記載された高さと併せる目数に一致するトークン（\`sc2tog\` vs \`hdc3tog\` vs \`dc5tog\` など）を選び、すべてを \`dec\` で済ませていない。
8. ユーザーが指定していない場合、\`tool: on\`、\`text: on\`、どちらも使わないかについて確認した（または適切な既定値を選んだ）。
9. 表現できなかった箇所（対応していない針目、あいまいな指示など）を、黙って推測するのではなく明示的に指摘した。
10. 原文が明確に糸の色を変えている箇所には、原文どおりの色の単語やカラーコードで \`color <色>\` ステップを追加した。原文が色を指定していない箇所には追加していない。
11. フェンス付きの \` \`\`\`crochet \` ブロックを 1 つ返した（相手が明示的に独立したトラッカーを求めた場合のみ、\` \`\`\`crochet-tool \` ブロックを追加で返す）。
`,
};
