## 1. OpenSpec reconciliation

- [x] 1.1 Validate and archive the completed `add-lace-motif-charting` change into the main specs
- [x] 1.2 Audit recent round-layout commits against the main rendering spec
- [x] 1.3 Specify the current round-number incline, bounded seam room, localized taper, and shaping endpoint rules
- [x] 1.4 Correct the explicit progress-ID and automatic fallback contract

## 2. README and skill synchronization

- [x] 2.1 Update all four READMEs with the eight UI languages and current `radial` style name
- [x] 2.2 Document every current chart frontmatter option
- [x] 2.3 Correct beginning-chain counting and written-unit progress behavior
- [x] 2.4 Update all four skill files with the complete option table and remove contradictory beginning-chain guidance
- [x] 2.5 Regenerate the bundled `src/skill-content.ts`

## 3. Regression protection and cleanup

- [x] 3.1 Add documentation conformance tests for current options, style names, count rules, and localized crochet blocks
- [x] 3.2 Add direct option-resolution coverage for lace, sector, and whole-round options
- [x] 3.3 Preserve the legacy Obsidian settings fallback without internally calling deprecated `display()`
- [x] 3.4 Remove duplicated and retired-name implementation comments

## 4. Verification

- [x] 4.1 Run `openspec validate --all`
- [x] 4.2 Run `npm test`
- [x] 4.3 Run `npm run lint` with zero warnings
- [x] 4.4 Run `npm run build`
- [x] 4.5 Review the final diff for generated or unrelated changes
