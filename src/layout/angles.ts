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
export function enforceOrderAndGap(targets: readonly number[], minGap: number): number[] {
	// Flip to increasing coordinates and fold the required gap out of them
	// (v_k = -angle_k - k * minGap). "Ordered and at least minGap apart" becomes
	// plain "non-decreasing", which isotonic regression solves exactly.
	const shifted = targets.map((target, k) => -target - k * minGap);
	return isotonicFit(shifted).map((value, k) => -(value + k * minGap));
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
export function fitTurn(angles: readonly number[], minGap: number): number[] {
	const first = angles[0];
	const last = angles[angles.length - 1];
	if (first === undefined || last === undefined || angles.length < 2) return [...angles];

	const maxSpan = 360 - minGap;
	const span = first - last;
	if (span <= maxSpan) return [...angles];

	const gaps = angles.length - 1;
	const slack = span - gaps * minGap;
	const allowed = Math.max(0, maxSpan - gaps * minGap);
	const scale = slack > 0 ? allowed / slack : 0;

	const fitted = [first];
	for (let k = 1; k < angles.length; k++) {
		const gap = (angles[k - 1] ?? 0) - (angles[k] ?? 0);
		const kept = minGap + Math.max(0, gap - minGap) * scale;
		fitted.push((fitted[k - 1] ?? 0) - kept);
	}
	return fitted;
}

// How strongly one relaxation pass pulls a stitch toward the midpoint of its
// neighbours. Deliberately gentle: even spacing is the lowest-priority goal.
const RELAX_WEIGHT = 0.4;

// Final, bounded whole-round relaxation (the layout spec's last stage): plain
// stitches drift toward the midpoint of their neighbours so the slack an
// increase or decrease creates is shared across the stitches after it instead
// of leaving one visible hole. Shaping stitches stay pinned — their position
// carries meaning — and every stitch is clamped to `maxDrift` from its ancestry
// target, so the round can never even itself out at the cost of the
// previous-round correspondence. Order and spacing are re-imposed afterwards.
export function relaxSpacing(
	angles: readonly number[],
	targets: readonly number[],
	movable: readonly boolean[],
	maxDrift: number,
	minGap: number,
	passes = 2,
): number[] {
	const count = angles.length;
	if (count < 3 || maxDrift <= 0) return [...angles];

	let current = [...angles];
	for (let pass = 0; pass < passes; pass++) {
		const pulled = current.map((angle, k) => {
			if (movable[k] !== true) return angle;
			// Neighbours are cyclic: the stitch before the first one is the last
			// stitch of the round, one lap up.
			const before = k === 0 ? (current[count - 1] ?? angle) + 360 : (current[k - 1] ?? angle);
			const after = k === count - 1 ? (current[0] ?? angle) - 360 : (current[k + 1] ?? angle);
			const moved = angle + RELAX_WEIGHT * ((before + after) / 2 - angle);
			const target = targets[k] ?? angle;
			return Math.max(target - maxDrift, Math.min(target + maxDrift, moved));
		});
		current = fitTurn(enforceOrderAndGap(pulled, minGap), minGap);
	}
	return current;
}
