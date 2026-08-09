## Context

Graph-driven round layout already builds an exact stitch graph, but its geometry previously treated that graph as advisory outside a few protected cases. A valid ancestry placement could then be changed by seam closing, order fitting, local relaxation, or a rigid turn used to align round numbers. Separate checks for the first expansion round, space-rich Japanese increases, exact one-to-one rounds, large ordinary rounds, and stitches shaped by the next round made the result depend on pattern shape rather than one invariant.

The chart must accept free-form shaping, deliberate skips, joins, turns, chain spaces, and long patterns. Stitch ancestry is semantic data; round-number and separator position are presentation data.

## Goals / Non-Goals

**Goals:**

- Preserve every valid parent-derived angle in Japanese and continuous layouts.
- Keep ordinary children on their unique parent, increase children balanced around their shared parent, and decreases centred over their sources.
- Satisfy symbol, shaping, and seam clearance without moving semantic angles.
- Keep the numbered marker packet inside measured seam surplus and behind the final stitch.
- Use one geometry rule for all round numbers, stitch counts, shaping mixes, and deliberate skips.

**Non-Goals:**

- Change radial-style even spacing.
- Hide invalid source order or contradictory graph mappings.
- Change stitch counting, parsing, graph construction, or progress-tool identity.
- Turn concentric round charts into a realistic inward-curving 3D silhouette.

## Decisions

### Treat ancestry angles as immutable semantic targets

The first round has no stitch parents and remains evenly spaced. Every later graph-driven round uses its recorded source slots:

- one source and one child: the child keeps the source angle;
- one source and multiple children: the children use balanced offsets around that source;
- multiple sources and one child: the child uses their seam-safe circular mean;
- motif children: the fan remains centred on its source in written order.

Whether every previous-round place was consumed is retained as validation metadata, not used as a layout switch. Deliberately skipped places therefore do not erase the ancestry of stitches that were worked.

**Alternative rejected:** fall back to even spacing for non-bijective rounds. This produces tidy circles but draws stitches over unrelated parents.

### Grow radius instead of moving semantic angles

At the candidate radius, the layout computes ancestry targets and the exact angular minimum for every symbol gap and the numbered seam. If they already fit, it returns the targets unchanged. Otherwise it expands the current radius until the same targets satisfy all constraints, using exponential bracketing followed by deterministic binary refinement.

This makes explicit `spacing` a minimum: it remains exact when ancestry fits and grows only when necessary to keep the chart truthful and collision-free.

**Alternative rejected:** close seam slack, relax plain stitches, or move one child of a shaping group. Each changes which parent a symbol appears to use or makes an increase scalene.

### Keep presentation geometry inside the seam

Round numbers, the round-change separator, and closing instructions form an ordered packet. The packet may move toward the preferred number bearing only by the surplus measured inside the actual seam. It stops before crossing the final stitch. Real stitches are never rigidly rotated to place a label.

**Alternative rejected:** rotate the entire round to keep the number column exact. The column looked regular while every parent connection moved by the same false angle.

### Retain one bounded fallback only for contradictory mappings

If no feasible radius is found after bounded growth, the layout uses its order-and-minimum-gap projection anchored to the first target. This is not a normal presentation path and does not switch to even spacing; it prevents an invalid source order from producing an unbounded chart while graph validation reports the mapping problem.

## Risks / Trade-offs

- **A dense ancestry pattern can produce a larger-than-requested round gap** → Treat spacing as a minimum, keep the smallest feasible radius through binary refinement, and preserve scroll/pan for oversized charts.
- **Repeated constraint checks add layout work** → Return immediately when the candidate radius fits; only constrained rounds perform bounded bracketing and refinement.
- **A contradictory mapping may still need projected geometry** → Keep the fallback deterministic and rely on typed graph validation rather than silently pretending the mapping is even.
- **Marker bearings may no longer form a mathematically exact column** → Separator safety and stitch truth take priority; the marker still moves as far toward its preferred bearing as measured seam surplus permits.

## Migration Plan

No data migration is required. Existing pattern syntax and settings remain compatible. Deploy the layout and spec changes together; rollback is a code rollback with no persisted-state conversion.

## Open Questions

None.
