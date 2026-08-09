## 1. Reproduction and placement fix

- [x] 1.1 Add a failing regression for the reported nine-round pattern
- [x] 1.2 Minimize the failure to two one-to-one rounds
- [x] 1.3 Return exact ancestry for every bijective ordinary round
- [x] 1.4 Keep numbered seam presentation independent from bijective stitches

## 2. Regression coverage

- [x] 2.1 Assert every R8 and R9 stitch in the reported pattern is at its parent's bearing
- [x] 2.2 Assert minimal small and large one-to-one rounds remain exact
- [x] 2.3 Preserve final-stitch separator safety and balanced increase marks
- [x] 2.4 Remove temporary diagnosis instrumentation and harnesses

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
