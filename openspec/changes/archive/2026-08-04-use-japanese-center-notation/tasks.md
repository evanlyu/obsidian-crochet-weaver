## 1. Center presentation

- [x] 1.1 Add narrowly scoped center-label metadata to the render item
- [x] 1.2 Attach `わ` only to Japanese-style magic-ring centers
- [x] 1.3 Render the centered Japanese label without also stamping the hollow ring
- [x] 1.4 Add theme-compatible center-label styling

## 2. Documentation and regression coverage

- [x] 2.1 Document the verified Japanese center convention in README and bundled skills
- [x] 2.2 Test Japanese magic-ring and chain-ring layout metadata
- [x] 2.3 Test Japanese center text in the rendered SVG
- [x] 2.4 Test that radial, continuous, and spiral centers remain unchanged

## 3. Verification

- [x] 3.1 Run `openspec validate --all`
- [x] 3.2 Run `npm test`
- [x] 3.3 Run `npm run lint` with zero warnings
- [x] 3.4 Run `npm run build`
- [x] 3.5 Review the final diff and generated artifacts
