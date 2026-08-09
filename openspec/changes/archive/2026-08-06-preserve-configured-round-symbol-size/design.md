## Context

The plugin has one user-facing symbol-size setting. Layout measurements already use that global value. A later fixed-band fit nevertheless wrote `RenderItem.scale` per round:

1. exact ancestry targets were accepted while their common safe scale remained at least 0.6;
2. a round between 60% and 100% fit was rendered smaller instead of receiving angular clearance;
3. inward ancestry reconciliation could run the fit again and multiply an existing scale.

The reported chart therefore contained single crochets at six different local scales even though one global size was configured.

## Goals / Non-Goals

**Goals:**

- Keep the same stitch symbol at one configured size across all rounds.
- Preserve exact parent angles whenever configured-size symbols already fit.
- Resolve inherited collisions with deterministic minimum angular movement.
- Preserve fixed radial spacing, stitch counts, graph ancestry, and balanced shaping.
- Prevent reconciliation from multiplying render scales.

**Non-Goals:**

- Change the global symbol-size setting.
- Increase explicit round spacing.
- Add rules tied to a particular round number, stitch count, or pattern phrase.
- Resize only selected single crochets as a special case.

## Decisions

### Make configured size a hard layout input

The all-pairs tangential fit remains useful as a signal. A value below `1` now means the exact target angles collide at the configured symbol size and triggers order-and-gap projection. The value is never copied into `RenderItem.scale`.

### Remove all fixed-round local scaling

Graph-driven and standard round layouts no longer run a post-placement fixed-band scale pass. This ensures that symbol size is resolved once from settings and remains the same across rounds. Opening-chain transforms remain separate semantic rendering, not density scaling of real stitch symbols.

### Preserve ancestry through the existing reconciliation pass

When full-size clearance moves a dense round, the established inward reconciliation keeps ordinary children over displayed parents and keeps V marks centred. Removing its refit step also prevents multiplicative scaling.

## Risks / Trade-offs

- **Impossible combinations of tiny fixed spacing and very dense or tall symbols cannot satisfy every geometric preference simultaneously** → The explicit user choices for spacing and symbol size remain authoritative; bounded angular correction is attempted without silently changing either setting.
- **Projection may happen more often than with the old 0.6 threshold** → It occurs only on measured configured-size collisions and preserves the existing minimum-displacement and ancestry-reconciliation rules.
- **Standard radial charts no longer shrink locally** → Their established radius and even-spacing calculations remain, while rendered size now consistently reflects settings.

## Migration Plan

No stored data migration is required.

## Open Questions

None.
