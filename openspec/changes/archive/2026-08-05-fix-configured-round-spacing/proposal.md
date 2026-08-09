## Why

The ancestry solver treats configured round spacing as a minimum and expands crowded outer rounds. This keeps symbols clear but silently changes the chart scale, producing visibly uneven bands despite a concrete spacing value.

## What Changes

- Treat positive round spacing from chart frontmatter or plugin settings as an exact interval.
- Keep every round after the first exactly one configured step beyond the previous round.
- Preserve parent-derived stitch angles and balanced increase geometry without expanding the radius.
- Retain collision-driven radius fitting only when spacing is automatic.
- Update layout regression coverage, README variants, the bundled pattern skill, and rendering specifications.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Explicit round spacing becomes a hard scale constraint instead of a minimum.

## Impact

- `src/layout/round.ts`: exact configured radius progression for all round styles.
- `src/layout/round-graph.ts`: configured-spacing precedence over ancestry collision fitting.
- `tests/layout.test.ts`: fixed-spacing regressions across radial, Japanese, and continuous styles.
- OpenSpec, README, and pattern-skill documentation.
