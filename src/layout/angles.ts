// Circular-angle helpers for round layouts.
//
// Angles are degrees and, within one round, are kept *continuous*: they keep
// decreasing with stitch order (clockwise) instead of wrapping into a fixed
// range. "Later in the round" therefore always means "smaller angle", which is
// what makes ordering, minimum-gap and mean-of-parents arithmetic safe across
// the 0°/360° seam — a decrease merging the last and first stitch of a round
// sees its parents at, say, -330° and -360°, never at 30° and 0°.

// Signed difference from `from` to `to` along the shortest arc, in (-180, 180].
export function shortestAngleDelta(from: number, to: number): number {
	return ((((to - from) % 360) + 540) % 360) - 180;
}

// Circular mean, reported in the same lap as the first angle. Plain arithmetic
// averaging is wrong across the seam — (350 + 10) / 2 reads as 180 when the
// real midpoint is 0 — and a plain atan2 circular mean would give the right
// direction but drop the lap, breaking the continuity the layout depends on.
// Measuring every angle as an offset from the first one fixes both.
export function meanAngle(angles: readonly number[]): number {
	const base = angles[0];
	if (base === undefined) return 0;
	let sum = 0;
	for (const angle of angles) sum += shortestAngleDelta(base, angle);
	return base + sum / angles.length;
}

// Wraps an angle into [0, 360).
export function normalizeAngle(angle: number): number {
	return ((angle % 360) + 360) % 360;
}

// Angular size (degrees) of an arc `arcPx` long at this radius.
export function arcToDegrees(arcPx: number, radius: number): number {
	if (radius <= 0) return 360;
	return (arcPx / radius) * (180 / Math.PI);
}

// Projects target angles onto the nearest sequence that keeps working order and
// leaves at least `minGap` between neighbours — the layout spec's two
// hard constraints (order, then overlap), solved for the least total squared
// movement away from the ancestry targets (its lowest-priority "displacement"
// term). Targets are continuous degrees decreasing with stitch order; so is the
// result, so a stitch can never overtake its neighbour.
export function enforceOrderAndGap(targets: readonly number[], minGaps: readonly number[]): number[] {
	// Flip to increasing coordinates and fold the required gaps out of them
	// (v_k = -angle_k - the gaps owed before k). "Ordered and at least that far
	// apart" becomes plain "non-decreasing", which isotonic regression solves
	// exactly.
	const owed = cumulative(minGaps, targets.length);
	const shifted = targets.map((target, k) => -target - (owed[k] ?? 0));
	return isotonicFit(shifted).map((value, k) => -(value + (owed[k] ?? 0)));
}

// Running total of the gaps owed before each stitch.
function cumulative(minGaps: readonly number[], count: number): number[] {
	const owed = [0];
	for (let k = 1; k < count; k++) owed.push((owed[k - 1] ?? 0) + (minGaps[k - 1] ?? 0));
	return owed;
}

// Least-squares non-decreasing fit (pool adjacent violators).
function isotonicFit(values: readonly number[]): number[] {
	const blocks: { value: number; count: number }[] = [];
	for (const value of values) {
		let block = { value, count: 1 };
		for (;;) {
			const last = blocks[blocks.length - 1];
			if (last === undefined || last.value <= block.value) break;
			blocks.pop();
			const count = last.count + block.count;
			block = { value: (last.value * last.count + block.value * block.count) / count, count };
		}
		blocks.push(block);
	}
	const fitted: number[] = [];
	for (const block of blocks) {
		for (let i = 0; i < block.count; i++) fitted.push(block.value);
	}
	return fitted;
}

// Keeps a whole round inside one turn: the wrap-around gap between the last
// stitch and the first must also be at least `minGap`. Any excess is squeezed
// out of the roomiest gaps first (each gap keeps its minimum), so crowding is
// shared rather than dumped on one pair of stitches.
export function fitTurn(angles: readonly number[], minGaps: readonly number[]): number[] {
	const first = angles[0];
	const last = angles[angles.length - 1];
	if (first === undefined || last === undefined || angles.length < 2) return [...angles];

	// The wrap-around gap is the one after the last stitch.
	const maxSpan = 360 - (minGaps[angles.length - 1] ?? 0);
	const span = first - last;
	if (span <= maxSpan) return [...angles];

	let owed = 0;
	for (let k = 0; k + 1 < angles.length; k++) owed += minGaps[k] ?? 0;
	const slack = span - owed;
	const allowed = Math.max(0, maxSpan - owed);
	const scale = slack > 0 ? allowed / slack : 0;

	const fitted = [first];
	for (let k = 1; k < angles.length; k++) {
		const gap = (angles[k - 1] ?? 0) - (angles[k] ?? 0);
		const floor = minGaps[k - 1] ?? 0;
		fitted.push((fitted[k - 1] ?? 0) - (floor + Math.max(0, gap - floor) * scale));
	}
	return fitted;
}

// Closes a round's seam back to the room it actually needs.
//
// What is drawn at a seam — a round number, a step out to the next round — is
// the same size on every round of a chart. Its *angle* is not: ancestry hands a
// round the angles of the round below, seam gap and all, so the same wedge of
// the turn covers more and more arc the further out it is drawn, and the seam
// fans open into a widening corridor instead of reading as one channel.
//
// So a round spreads its stitches out into that surplus. The spread is measured
// from the point of the round opposite the seam, which does not move: stitches
// far from the seam keep the angle their ancestry gave them, and the ones beside
// it — the ones the corridor is actually too wide for — give way most. The whole
// surplus is used, so the seam takes the same physical width at every radius and
// the other stitches share the released room.
export function closeSeam(
	targets: readonly number[],
	seamTarget: number,
	fixed: readonly boolean[] = [],
): number[] {
	const count = targets.length;
	const first = targets[0];
	const last = targets[count - 1];
	if (count < 2 || first === undefined || last === undefined) return [...targets];

	const span = first - last;
	const excess = 360 - span - seamTarget;
	if (span <= 0 || excess <= 0) return [...targets];

	// Preserve every shaping stitch we can: moving a decrease out from between
	// the parents it joins makes the chart say something untrue. The surplus is
	// shared by the plain run after the last such stitch. When shaping itself
	// closes the round there is no untouched run to spend it in, so the whole
	// round shares it instead — changing the seam requires moving its last
	// stitch somewhere.
	let from = 0;
	for (let index = count - 2; index >= 0; index--) {
		if (fixed[index] === true) {
			from = index;
			break;
		}
	}
	if (fixed[count - 1] === true || from >= count - 1) from = 0;
	const goes = count - 1 - from;
	return targets.map((target, index) =>
		index <= from ? target : target - excess * ((index - from) / goes),
	);
}

// How strongly one pass pulls a stitch toward the midpoint of its neighbours.
const RELAX_WEIGHT = 0.4;

// Spreads the round back out after its ancestry has placed it.
//
// Ancestry alone only ever makes a round less even: a stitch sits on the one it
// is worked into, so wherever an increase squeezes a new pair in, that crowding
// is inherited by every round above while the untouched gaps grow with the
// radius — and the round ends up bunched on one side. Real fabric redistributes
// instead. So plain stitches drift toward the midpoint of their neighbours,
// while the stitches of an increase or decrease stay pinned (their position is
// what says which stitch they belong to), and every stitch is held within
// `maxDrift` of where it started, so evening out can never cost the
// correspondence. Order and spacing are re-imposed afterwards.
//
// `angles` is where the round was placed once order and spacing were imposed,
// which is also what the drift is measured from — not the raw ancestry targets.
// Those can ask for more of the ring than a turn holds, and holding a stitch
// near an angle the round could not give it would only undo the fitting.
//
// The round is relaxed as an open run from its first stitch to its last, not as
// a closed ring: the gap between those two is the seam (layout/seam.ts), which
// is reserved room rather than spacing to even out. Pulling its neighbours
// across it would drag them into the room kept for the round number and leave a
// hole behind them.
export function relaxSpacing(
	angles: readonly number[],
	movable: readonly boolean[],
	maxDrift: number,
	minGaps: readonly number[],
	passes = 3,
): number[] {
	const count = angles.length;
	if (count < 3 || maxDrift <= 0) return [...angles];

	let current = [...angles];
	for (let pass = 0; pass < passes; pass++) {
		const pulled = current.map((angle, k) => {
			// The first and last stitch have only the seam on their outer side, so
			// they stay where their ancestry put them and the round evens out
			// between them.
			if (movable[k] !== true || k === 0 || k === count - 1) return angle;
			const before = current[k - 1] ?? angle;
			const after = current[k + 1] ?? angle;
			const moved = angle + RELAX_WEIGHT * ((before + after) / 2 - angle);
			const from = angles[k] ?? angle;
			return Math.max(from - maxDrift, Math.min(from + maxDrift, moved));
		});
		current = fitTurn(enforceOrderAndGap(pulled, minGaps), minGaps);
	}
	return current;
}
