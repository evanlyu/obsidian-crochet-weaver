## Context

The runtime is already the source of truth for the recent round-layout fixes. This change does not redesign that geometry; it makes the specification and public guidance describe what the tested implementation now guarantees.

The synchronization boundary has four layers:

1. OpenSpec states the behavioral contract.
2. TypeScript implements it.
3. Tests prove both runtime behavior and documentation coverage.
4. README and skill files explain the same contract to users and assistants.

## Goals / Non-Goals

**Goals:**

- Remove contradictions between the main specs and current numbered-round geometry.
- Keep all four README and skill languages aligned on syntax tokens and behavior.
- Turn the discovered documentation mismatches into regression tests.
- Preserve Obsidian 1.8.7 compatibility while making lint clean.

**Non-Goals:**

- Change the current round geometry or introduce a new style.
- Translate the pattern skill into the four additional UI languages.
- Raise the minimum Obsidian version or remove the legacy settings renderer.
- Refactor the large graph/layout modules during a documentation reconciliation.

## Decisions

**Describe the tested geometry precisely.** The first stitch worked into the center ring remains at twelve o'clock. Number labels begin at -50 degrees and each outer round moves another -0.5 degrees toward twelve o'clock. Large plain one-to-one rounds may keep at most 10 px beyond the numbered seam's minimum, with any closing correction tapered to zero within the nearest quarter of the round.

**Separate increase truth from decrease legibility.** An increase V has three semantically exact endpoints: its parent and its two produced children. Those endpoints are not compacted into artificial symmetry. A decrease may still compact a wide or one-sided source opening because the mark must remain legible while leaning toward every source it merges.

**Treat documentation as a tested interface.** Tests enumerate the chart frontmatter keys that the runtime resolves, reject the retired public style name, require current beginning-chain and weighted-progress examples, and compare every fenced `crochet` example byte-for-byte across localized skill files.

**Keep legacy settings compatibility behind one private renderer.** Obsidian before 1.13 still calls `display()`. The public override remains, but internal refreshes call an undecorated private method so the supported fallback does not create a deprecation warning.

**Reject unsafe progress IDs by falling back.** An explicit progress ID is used only when it has 1–80 ASCII letters, digits, underscores, or hyphens and is not a reserved object-property name. Any absent or invalid ID uses the existing content hash.

## Risks / Trade-offs

- More documentation assertions mean adding a frontmatter option requires a deliberate README and skill update. That is intentional interface discipline.
- Exact round-number bearings are now a documented contract; changing the visual guide later requires a spec change and test update.
- Localized prose can still differ stylistically, but syntax tokens and executable examples remain identical.
