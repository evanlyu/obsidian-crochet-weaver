## Why

Uniform scaling alone can fail when several shaping rounds place two inherited stitch centers almost together. The scale calculation then approaches zero, so a later plain round still contains every stitch in data but appears empty. Fixed radial spacing must remain exact, yet no valid stitch may disappear or be drawn on top of another.

## What Changes

- Detect when exact inherited angles would force a fixed-spacing round below a readable common scale.
- Preserve exact ancestry when it remains readable.
- Otherwise apply the existing deterministic minimum-movement order-and-clearance projection before scaling.
- Scale symbol clearance proportionally with the symbols so distinct centers never produce a zero scale merely to retain a fixed-size gap.
- Keep fixed radii, written order, the first semantic target, balanced shaping marks, and every real stitch.
- Add the reported 6→12→18→24→28→32→36→40 regression followed by six 40-stitch rounds and a decrease round.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crochet-chart-rendering`: Fixed-spacing graph layouts now prefer exact ancestry, but use bounded minimum angular displacement when exact inherited targets would make stitches effectively disappear.

## Impact

- `src/layout/clarity.ts`: readable-scale measurement and proportional-clearance scaling.
- `src/layout/round-graph.ts`: geometry-triggered fixed-spacing projection.
- `tests/layout.test.ts`: full visible-stitch, overlap, shaping-balance, and decrease-count regression.
- README, bundled pattern-skill sources, and rendering specification.
