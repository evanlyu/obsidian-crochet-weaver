## 1. Regression

- [x] Reproduce the overlap with the exact first rows `R4: 22 sc, sl st` and `R16: 4 sc, dec, 10 sc, dec, 6 sc, sl st`.
- [x] Assert positive number-to-join clearance for both single- and double-digit labels.
- [x] Cover every number in the reported R4–R8 and R16–R19 slices.
- [x] Assert that partial-chart numbers cannot cross their separators or extend to the far side of their closing joins.

## 2. Layout

- [x] Replace the first-visible-round bearing override with a geometry-based preferred-bearing fit.
- [x] Preserve the existing number column when it is clear.
- [x] Search the connected safe path and stop at its first collision rather than accepting a later clear endpoint.
- [x] Measure digit width and the filled join dot's readable footprint accurately.

## 3. Documentation and validation

- [x] Update the canonical rendering spec.
- [x] Synchronize README and pattern-skill language variants.
- [x] Run unit tests, lint, production build, and strict OpenSpec validation.
