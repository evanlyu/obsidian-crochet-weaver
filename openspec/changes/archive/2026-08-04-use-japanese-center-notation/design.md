## Context

The pattern language already distinguishes `in MR` from `in ch ring`.
Japanese-style layout currently turns both anchors into the same geometry used
by other chart styles: `MR` becomes a hollow circle and `ch ring` becomes six
chain ovals.

Official Japanese instructional material and published charts use `わ` for the
yarn-loop start. Official chain-ring examples describe making a `わ` from chain
stitches and draw the actual chain ovals in the chart; no authoritative basis
was found for replacing that construction with `ち`.

## Goals and non-goals

### Goals

- Give Japanese-style magic-ring charts the printed `わ` center cue.
- Preserve the compact center size and every existing stitch position.
- Preserve the explicit chain-symbol ring for `in ch ring`.
- Keep other chart styles visually unchanged.

### Non-goals

- Do not add `わ` or `ち` to the pattern language.
- Do not treat the Japanese text as a stitch or count it in any round.
- Do not replace an explicit chain ring with an unverified abbreviation.

## Decisions

### Keep the semantic anchor, vary only its presentation

The center remains a `RenderItem` whose symbol is `MR`, so layout measurement,
normalization, geometry tests, and downstream identity all keep the same
semantic anchor. Japanese layout adds a narrowly scoped center label to that
item. The SVG renderer emits centered text instead of the hollow-circle glyph
when the label is present.

### Scope the label to `style: japanese`

Only the traditional Japanese renderer requests `わ`. `radial`, `continuous`,
and spiral charts keep the existing hollow-circle presentation, which avoids
silently changing non-Japanese chart conventions.

### Keep chain rings structural

`in ch ring` continues to render the six chain ovals that form the ring. The
construction stays visually distinguishable from the adjustable yarn loop and
does not gain a speculative `ち` label.

## Risks and mitigations

- Font metrics vary by platform. The label is centered with SVG text anchors
  and kept within the existing 5px center extent.
- A text branch could accidentally render both label and ring. A DOM-level
  regression asserts that the Japanese center produces text and no `MR` use.
- Style leakage could change other charts. Layout tests cover Japanese,
  continuous, radial, spiral, and chain-ring centers separately.
