# Reference: the `crochet-dev` hat crown

This is the pattern the change is written against, copied verbatim from the note
it came from so the acceptance tasks in `tasks.md` have a source inside the repo.
Nothing here is a spec — the requirements live in `specs/`. Do not tidy the text:
its exact spelling is what the parser has to accept.

## The chart block (R1-R22)

Every task that says "the original `crochet-dev` fenced `crochet` block" means
this one. Note that R3's beginning chain is written bare, as `ch 3`, and is a
stitch only because the round closes `sl st to top of beginning ch-3`.

```crochet
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
     ch 2,
     sc in center dc of next 7-dc shell,
     picot,
     ch 2] x12,
    sl st to join.
    (12 reps, 9 sts per rep)

R9: turn,
    [9 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 10 sts per rep)

R10: turn,
     [V3 in next sc,
      ch 2,
      sc in center dc of next 9-dc shell,
      picot,
      ch 2] x12,
     sl st to join.
     (12 reps, 10 sts per rep)

R11: turn,
     [9 dc in next ch-3 sp,
      sc in next picot] x12,
     sl st to join.

R12: turn,
     [V3 in next sc,
      ch 2,
      sc in center dc of next 9-dc shell,
      picot,
      ch 2] x12,
     sl st to join.

R13: repeat R11.

R14: repeat R12.

R15–R18: repeat R11–R14.

R19–R22: repeat R11–R14.
```

## Written as prose, not as chart syntax

The note also carries two blocks that are notes for the maker rather than rows to
draw. They are listed here so the change does not accidentally grow syntax for
them: the first restates R11-R22 without row labels, the second is finishing.

```crochet
Odd rounds R11–R21:
[9 dc in next ch-3 sp, sc in next picot] x12.

Even rounds R12–R22:
[V3 in next sc, ch 2,
 sc in center dc of next 9-dc shell,
 picot, ch 2] x12.
```
```crochet
Button loop: ch 5
Sew the button onto R4.
```

## What each round exercises

| Round | What it is here for |
| --- | --- |
| R1 | counted beginning chain (annotated), join to the top of that chain, `(24 dc)` |
| R2 | non-counting beginning chain, `sc in same st`, 24 ordinary `ch 1` making 24 targetable `ch-1 sp`, written count 48 against 24 fabric stitches |
| R3 | reposition that consumes nothing, unannotated counted beginning chain, first shell aggregated across steps, twelve 3-dc shells |
| R4 | first leading `turn`, `V2`, `picot`, `center dc of next 3-dc shell` |
| R5, R7, R9 | quantity-targeted 5-, 7-, and 9-dc shells worked into one `ch-2 sp` |
| R6, R8 | `V2` with `ch 2` spacing, centers of the 5- and 7-dc shells |
| R10, R12 | `V3` and its internal `ch-3 sp` |
| R11 | 9-dc shell worked into a `ch-3 sp`, no count annotation |
| R13, R14 | single-round source repeats |
| R15-R18, R19-R22 | range repeats written with an en dash |
