## 1. Center geometry

- [x] 1.1 Reduce the magic-ring symbol radius and extent to 5px
- [x] 1.2 Reduce the compact inner seam share to produce a 28–29px first round
- [x] 1.3 Increase only the bounded post-shaping transition reserve

## 2. Regression coverage

- [x] 2.1 Assert the magic-ring extent is 5px
- [x] 2.2 Assert the default joined first-round radius is between 28px and 29px
- [x] 2.3 Preserve balanced increase and separator safety checks

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
