# Crochet Weaver — Lace and Motifs

Lace is written differently from amigurumi shorthand: instead of counting along
the round below, a lace pattern says where each stitch goes. This note shows
every form Crochet Weaver reads, smallest first, ending with a whole hat crown
written exactly as its source note has it.

## 1. Chain spaces

A run of chains between two stitches becomes one space the next round can work
into. Every chain of it is still drawn, and still counts.

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.
R3: [sc in next sc, 5 dc in next ch-2 sp] x6, sl st to join.
```

## 2. Shells

A quantity with a target is one motif worked into one place, drawn as a fan
opening from it. The same round below can carry shells of any size.

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [sc, ch 3] x6, sl st to join.
R3: [sc in next sc, 7 dc in next ch-3 sp] x6, sl st to join.
```

## 3. V-stitches and picots

`V2` is `(dc, ch 2, dc)` worked into one place; `V3` is the ch-3 version. The
chain run inside a V is a space of its own, so the next round can work into it.
A picot is worked on the stitch just made and counts nothing.

```crochet
---
type: round
style: japanese
---
R1: 6 sc in MR
R2: [V2 in next sc, sc in next sc] x3, sl st to join.
R3: [sc in next ch-2 sp, picot, sc in next sc] x3, sl st to join.
```

## 4. Beginning chains, joins, and moving to the start

`ch 3 (counts as dc)` stands in for the round's first double crochet;
`ch 1 (does not count as a st)` is height only. A beginning chain written with
no note at all is decided by the round's own join. `sl st into next ch-1 sp`
moves across to where the round really starts and works into nothing.

```crochet
---
type: round
style: japanese
tool: on
---
R1: MR, ch 3 (counts as dc), 11 dc in MR, sl st to top of beginning ch-3. (12 dc)

R2: ch 1 (does not count as a st),
    sc in same st, ch 1,
    [sc in next dc, ch 1] x11,
    sl st to first sc.
    (12 sc + 12 ch-1 sp = 24 sts)

R3: sl st into next ch-1 sp,
    ch 3, 2 dc in same ch-1 sp,
    sc in next ch-1 sp,
    [3 dc in next ch-1 sp,
     sc in next ch-1 sp] x5,
    sl st to top of beginning ch-3.
    (6 reps, 4 sts per rep)
```

## 5. Turning, shell centres, and rounds written as repeats

`turn` at the head of a round works it the other way about, and the chart draws
it that way. A later round can name the middle stitch of a shell below it, and
a round can be written as a repeat of earlier rounds — with either dash.

```crochet
---
type: round
style: japanese
text: on
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
    [V2 in next sc,
     ch 1,
     sc in center dc of next 3-dc shell,
     picot,
     ch 1] x12,
    sl st to join.
    (12 reps, 7 sts per rep)

R5: turn,
    [5 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 6 sts per rep)

R6: turn,
    [V2 in next sc,
     ch 1,
     sc in center dc of next 5-dc shell,
     picot,
     ch 1] x12,
    sl st to join.
    (12 reps, 7 sts per rep)

R7: turn,
    [7 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 8 sts per rep)

R8: turn,
    [V2 in next sc,
     ch 1,
     sc in center dc of next 7-dc shell,
     picot,
     ch 1] x12,
    sl st to join.
    (12 reps, 7 sts per rep)

R9-R10: repeat R5-R6.
```

## 6. Printed the way a book prints lace

`lace: on` says what kind of chart this is: no lines drawn around the rounds, no
round numbers, and the symbols drawn larger against the openwork. It changes
only what is drawn around the pattern, never what the pattern is.

```crochet
---
type: round
style: japanese
lace: on
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

R5: turn,
    [5 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
```

## 7. One wedge instead of the whole circle

`sector: 90` draws a quarter of the chart, starting at the seam. A round of
twelve identical motifs says everything it has to say in one slice of itself,
so this is how a book prints it — and a motif on the edge is kept whole rather
than sliced.

```crochet
---
type: round
style: japanese
lace: on
sector: 90
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

R5: turn,
    [5 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
```

## 8. The same lace in continuous style

`style: continuous` draws the same graph, with a line from each stitch to the
place below it is worked into, so the correspondence is spelled out rather than
implied.

```crochet
---
type: round
style: continuous
---
R1: 6 sc in MR
R2: [sc, ch 2] x6, sl st to join.
R3: [sc in next sc, 5 dc in next ch-2 sp] x6, sl st to join.
```

## 9. What is not chart syntax

Finishing instructions are notes for the maker, not rows of the chart — a button
loop, sewing, gauge, blocking. Keep them as ordinary text beside the block:

> Button loop: ch 5. Sew the button onto R4.
