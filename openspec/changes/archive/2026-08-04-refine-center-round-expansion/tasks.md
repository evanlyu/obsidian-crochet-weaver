## 1. Center geometry

- [x] 1.1 Reduce the compact inner seam radius while preserving symbol-derived collision limits
- [x] 1.2 Recognize the first all-increase round above the center
- [x] 1.3 Give that round bounded seam flexibility and align only its numbered marker

## 2. Regression coverage

- [x] 2.1 Add a minimal R1/R2 test for the twelve-o'clock first stitch and nearly isosceles first V
- [x] 2.2 Assert the compact 30–31px first-round radius
- [x] 2.3 Keep the full nine-round pattern's seam, marker, and ancestry bounds covered
- [x] 2.4 Remove all temporary debugging instrumentation

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
