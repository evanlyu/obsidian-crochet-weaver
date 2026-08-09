## 1. Placement

- [x] 1.1 Detect whether raw increase ancestry satisfies every minimum gap and seam
- [x] 1.2 Preserve those angles only for space-rich Japanese increase rounds
- [x] 1.3 Align numbered marker contents independently only while every increase remains centred
- [x] 1.4 Carry bounded seam flexibility into the immediately following ordinary Japanese round

## 2. Regression coverage

- [x] 2.1 Reproduce the asymmetric V with the full nine-round pattern
- [x] 2.2 Assert that all 24 increase marks differ by less than 0.5px between arm lengths
- [x] 2.3 Keep existing collision, ancestry, seam, and continuous-style tests passing
- [x] 2.4 Remove temporary diagnostic changes

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
