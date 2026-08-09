## 1. Regression loop

- [x] 1.1 Reproduce mixed-shaping parent drift with a deterministic two-round layout test.
- [x] 1.2 Add free-form regressions for ordinary-parent alignment in both graph-driven styles.
- [x] 1.3 Add a deliberate-skip regression proving mapped stitches retain ancestry without full-round consumption.
- [x] 1.4 Cover balanced Japanese increase marks through multiple arbitrary shaping rounds.

## 2. General ancestry solver

- [x] 2.1 Use ancestry targets for every later graph-driven round instead of gating on exact previous-round consumption.
- [x] 2.2 Preserve feasible ancestry targets unchanged for Japanese and continuous styles.
- [x] 2.3 Grow the current round radius until semantic targets satisfy symbol, shaping, and seam minimums.
- [x] 2.4 Keep a bounded deterministic projection only for contradictory mappings that cannot fit within one turn.
- [x] 2.5 Remove seam tapering, local relaxation, and mapping-shape exceptions that move valid semantic angles.

## 3. Seam presentation

- [x] 3.1 Move numbered markers, separators, and closing instructions only within measured seam surplus.
- [x] 3.2 Prevent marker alignment from rigidly rotating real stitches.
- [x] 3.3 Preserve the final stitch wholly on the closing side of its separator.
- [x] 3.4 Treat configured round spacing and 10px marker clearance as minimums.

## 4. Verification and documentation

- [x] 4.1 Run the complete layout regression suite.
- [x] 4.2 Render and visually inspect the 6→8→10→12 free-form chart, the nine-round head chart, and the 22-round crochet-dev chart.
- [x] 4.3 Update README, localized README, and bundled pattern-skill wording to describe the general solver.
- [x] 4.4 Run full test, lint, build, and OpenSpec validation.
