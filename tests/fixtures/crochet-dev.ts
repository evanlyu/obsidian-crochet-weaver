// The hat crown from the `crochet-dev` note, copied verbatim from
// openspec/changes/add-lace-motif-charting/reference/crochet-dev-pattern.md.
// The exact wording is the point: this is the marking style the plugin has to
// accept without the pattern being rewritten first, so do not tidy it.

export const CROCHET_DEV_ROUNDS = `R1: MR, ch 3 (counts as dc), 23 dc in MR,
    sl st to top of beginning ch-3. (24 dc)

R2: ch 1 (does not count as a st),
    sc in same st, ch 1,
    [sc in next dc, ch 1] x23,
    sl st to first sc.
    (24 sc + 24 ch-1 sp = 48 sts)

R3: sl st into next ch-1 sp,
    ch 3, 2 dc in same ch-1 sp,
    sc in next ch-1 sp,
    [3 dc in next ch-1 sp,
     sc in next ch-1 sp] x11,
    sl st to top of beginning ch-3.
    (12 reps, 4 sts per rep)

R4: turn,
    [V2 in next sc,
     ch 1,
     sc in center dc of next 3-dc shell,
     picot,
     ch 1] x12,
    sl st to join.
    (12 reps, 7 sts per rep)

R5: turn,
    [5 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 6 sts per rep)

R6: turn,
    [V2 in next sc,
     ch 1,
     sc in center dc of next 5-dc shell,
     picot,
     ch 1] x12,
    sl st to join.
    (12 reps, 7 sts per rep)

R7: turn,
    [7 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 8 sts per rep)

R8: turn,
    [V2 in next sc,
     ch 2,
     sc in center dc of next 7-dc shell,
     picot,
     ch 2] x12,
    sl st to join.
    (12 reps, 9 sts per rep)

R9: turn,
    [9 dc in next ch-2 sp,
     sc in next picot] x12,
    sl st to join.
    (12 reps, 10 sts per rep)

R10: turn,
     [V3 in next sc,
      ch 2,
      sc in center dc of next 9-dc shell,
      picot,
      ch 2] x12,
     sl st to join.
     (12 reps, 10 sts per rep)

R11: turn,
     [9 dc in next ch-3 sp,
      sc in next picot] x12,
     sl st to join.

R12: turn,
     [V3 in next sc,
      ch 2,
      sc in center dc of next 9-dc shell,
      picot,
      ch 2] x12,
     sl st to join.

R13: repeat R11.

R14: repeat R12.

R15–R18: repeat R11–R14.

R19–R22: repeat R11–R14.
`;

export const CROCHET_DEV = `---
type: round
style: japanese
---
${CROCHET_DEV_ROUNDS}`;

// The rounds up to and including R{last}, for tests that only need the start of
// the pattern. Source repeats are dropped, since they name rounds further out.
export function crochetDevThrough(last: number): string {
	const rounds = CROCHET_DEV_ROUNDS.split(/\n\n+/)
		.filter((block) => {
			const num = /^R(\d+)/.exec(block.trim());
			return num !== null && Number(num[1]) <= last && !/repeat/.test(block);
		})
		.join('\n\n');
	return `---\ntype: round\nstyle: japanese\n---\n${rounds}\n`;
}
