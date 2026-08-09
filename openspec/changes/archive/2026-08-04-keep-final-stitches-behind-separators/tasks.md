## 1. Separator-safe placement

- [x] 1.1 Reproduce a final stitch landing on the number side of its separator
- [x] 1.2 Calculate the marker packet's safe turn from real seam surplus
- [x] 1.3 Open the closing edge only from measured neighbouring gap slack
- [x] 1.4 Move closing instructions with the number and separator
- [x] 1.5 Clamp protected increase markers rather than rotating their V marks

## 2. Regression coverage

- [x] 2.1 Assert R4, R5, and R7-R9 final stitches remain opposite their labels
- [x] 2.2 Assert the final symbol keeps physical clearance from the separator
- [x] 2.3 Keep every space-rich increase V below the 0.5px arm-difference limit
- [x] 2.4 Bound long-chart number-bearing safety deviations below one degree

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
