# Japanese crochet-chart notation for round starts

Checked: 2026-08-05

## Question

For a Japanese-style crochet chart worked in the round:

- Should an adjustable yarn-ring / magic-ring start be shown as `わ`?
- Should a ring made from chain stitches be shown as `ち`?

## Conclusion

`わ` is well-supported for an adjustable yarn-ring start. A first-party Clover
pattern places `わ` at the centre of its chart and its instructions explicitly
say `わの作り目で編みはじめ` and then `わの中に針を入れ`. This is the same
construction commonly called a magic or adjustable ring in English.

`ち` is **not verified as a conventional Japanese chart marker for a chain
start**. The Japanese first-party sources checked instead call the stitch
`くさり編み` / `鎖編み` and represent it with the normal chain-stitch symbol.
When those stitches are closed into a ring, the chart draws the chain-stitch
ovals in a loop and the slip stitch that closes them. It does not replace that
structure with `ち`.

Therefore the safe implementation rule is:

| Parsed construction | Japanese-style centre rendering |
| --- | --- |
| Adjustable yarn ring / magic ring (`MR`) | Centre label `わ` |
| `ch N` joined with a slip stitch to form a ring | Draw the `N` chain-stitch symbols and joining slip stitch when the model supports them; do **not** label it `ち` |
| Linear chain foundation | Draw the chain-stitch symbols; there is no round-centre label |
| Ambiguous or unspecified centre | Keep a neutral fallback rather than guessing `わ` or `ち` |

If the current renderer can only show a single centre label, `鎖` could be used
as an explicit product label, but that would be a local explanatory convention,
not a verified standard chart symbol. Prefer the real chain-stitch geometry.

## Evidence

### 1. Clover chart: `わ` is printed at the centre of an adjustable ring

Clover's *はじめてのかぎ針編み グラニーコースター* shows `わ` in the
centre of the published chart. Its instructions directly pair that centre mark
with the construction:

- `わの作り目で編みはじめ`
- `わの中に針を入れ`

Source: [Clover, はじめてのかぎ針編み グラニーコースター (PDF)](https://clover.co.jp/wp-content/uploads/2024/03/3_granny_coaster.pdf)

This directly supports `MR` → `わ`.

### 2. Clover distinguishes the two round-start constructions

Clover's crochet basics page names two separate ways to begin circular crochet:

- `くさり編みでわを作る方法`
- `糸端を指に巻いてわを作る方法`

For the chain version, it says to join the first chain with a slip stitch and
work the first round around the chain. For the yarn-ring version, it separately
shows the wrapped-yarn construction and how to tighten the centre.

Source: [Clover, かぎ針編みの基礎-2／基本の編み方](https://clover.co.jp/knitting/crochet_basic.html)

This distinction means the renderer should decide from the actual construction,
not merely from the fact that both finished starts are circular.

### 3. Clover chain-ring chart uses stitch symbols, not `ち`

Clover's *お花がかわいいモチーフの編み方* explicitly describes its start as
`作り目（くさりでわを作ります）`. The construction instructions say to make
five chains and slip stitch into the first chain. In the accompanying chart,
the centre is drawn as the closed loop of chain-stitch ovals plus its join; it
is not replaced with a kana label.

Source: [Clover, お花がかわいいモチーフの編み方 (PDF)](https://www.clover.co.jp/pdf_dl/howto/pdf/ami_k3.pdf)

This directly supports chain ring → chain symbols, and provides no support for
chain ring → `ち`.

### 4. Japanese Vogue teaches chain stitch as an ordinary stitch symbol

Nihon Vogue's official crochet reference lists `鎖編み目` under
`編み目記号の編み方`, displays its stitch symbol, and teaches repeated chain
stitches by count. Its related *amimono* reference cites the publisher's
*新装版 かぎ針編みの編み目記号* as the source.

Sources:

- [日本ヴォーグ社, 編み目記号の編み方 — 鎖編み目](https://www.tezukuritown.com/nv/c/ckihonkk4/)
- [amimono / 毛糸だま編集部, かぎ針編み「鎖編み目」](https://amimono.me/article/detail.html?id=140)

This supports rendering chain foundations with the standard stitch symbol
rather than inventing a one-kana abbreviation.

### 5. Japanese stitch symbols are a maintained national standard

The Japanese Standards Association lists JIS L 0201:1995, *編目記号*, as active
and most recently confirmed on 2025-10-20. Its scope is stitch symbols used for
hand knitting and household knitting machines.

Source: [日本規格協会, JIS L 0201:1995 編目記号](https://webdesk.jsa.or.jp/books/W11M0090/index/?bunsyo_id=JIS+L+0201%3A1995)

The public catalogue does not expose enough of the paid standard to use it as
direct evidence about the centre label. It does, however, reinforce that
product-specific shorthand should not be presented as standard without a
source.

## Confidence and limitation

- High confidence: adjustable yarn ring / magic ring → `わ`.
- High confidence: a chain stitch is represented by its normal stitch symbol.
- High confidence: `ち` should not be implemented as a claimed Japanese
  convention based on the checked evidence.
- Moderate confidence about every publisher's layout: chart typography can
  vary, but no high-trust source checked used `ち` for a chain-ring start.
