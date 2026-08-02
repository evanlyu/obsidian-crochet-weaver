import { CHAIN, makesSpace } from '../render/symbols';
import type { GraphStitch } from './graph';

// What a round leaves for the next round to work into, in working order.
//
// Not every place is a stitch. A run of chains between two anchors is worked
// into as one thing — the space it makes — and the round above says so: "in
// next ch-2 sp". So a round's places are its stitches, with each run of chains
// standing as one space, and the round above walks this list rather than the
// stitch list.

export interface GraphPlace {
	id: string;
	roundIndex: number;
	// Position in the round's working order.
	index: number;
	kind: 'stitch' | 'space';
	// What the pattern would call it: a stitch name, or "ch-2 sp".
	type: string;
	// The stitches this place is made of: one for a stitch, the chains for a
	// space. A place is drawn as these; it has no symbol of its own.
	stitchIds: readonly string[];
	// Set on the stitches of a motif worked into one place, so a round above can
	// ask for the middle stitch of "the next 7-dc shell".
	motif?: { size: number; index: number };
}

export function placesOf(roundIndex: number, stitches: readonly GraphStitch[]): GraphPlace[] {
	const places: GraphPlace[] = [];
	let chains: GraphStitch[] = [];

	const closeChainRun = () => {
		if (chains.length === 0) return;
		places.push({
			id: `r${roundIndex}p${places.length}`,
			roundIndex,
			index: places.length,
			kind: 'space',
			type: `${chains[0]?.symbol ?? CHAIN}-${chains.length} sp`,
			stitchIds: chains.map((chain) => chain.id),
		});
		chains = [];
	};

	for (const stitch of stitches) {
		if (makesSpace(stitch.symbol)) {
			chains.push(stitch);
			continue;
		}
		closeChainRun();
		places.push({
			id: `r${roundIndex}p${places.length}`,
			roundIndex,
			index: places.length,
			kind: 'stitch',
			type: stitch.symbol,
			stitchIds: [stitch.id],
			motif: stitch.motif,
		});
	}
	closeChainRun();
	return places;
}

// Whether a place answers to what a step asked for. A stitch answers to its own
// name and to the generic "st"; a space answers to "ch-N sp" of its own length
// and to the generic "sp".
export function placeMatches(place: GraphPlace, type: string): boolean {
	if (place.kind === 'space') return type === place.type || type === 'sp';
	return type === place.type || type === 'st';
}

// The middle stitch of a shell of N stitches worked into one place — what "in
// center dc of next 7-dc shell" means.
export function isShellCenter(place: GraphPlace, size: number): boolean {
	return place.motif !== undefined && place.motif.size === size && place.motif.index === (size - 1) / 2;
}

export interface CursorSelection {
	place: GraphPlace;
	// Places the search passed over on the way. A written pattern does not count
	// them out — "in next ch-2 sp" means "past whatever is in between" — so they
	// are recorded here and marked used, which is what lets a lace round still
	// account for the round below exactly once.
	skipped: readonly GraphPlace[];
}

// Where a round is working, over the places of the round below.
//
// A round is cyclic, so the cursor wraps; it may run more than one lap in a
// pattern that works into the same place twice, which is why positions are kept
// as running numbers rather than as indices into the list.
export class RoundCursor {
	private readonly uses = new Map<string, number>();
	private position: number;
	private selected: number | undefined;
	// Whether this round has said where anything goes, rather than counting its
	// way along. A round that names its places is written cyclically — it starts
	// where it says it starts — so what it leaves at the seam is a gap; a round
	// that just counts and comes up short has miscounted.
	private navigated = false;
	private readonly skipped = new Set<string>();

	constructor(
		private readonly places: readonly GraphPlace[],
		entry: number,
		private readonly direction: 1 | -1,
	) {
		this.position = entry;
		this.selected = places.length > 0 ? entry : undefined;
	}

	get length(): number {
		return this.places.length;
	}

	// Every place this round has used, however it used it.
	get used(): ReadonlyMap<string, number> {
		return this.uses;
	}

	// The places it used by passing over them rather than working into them.
	get passed(): ReadonlySet<string> {
		return this.skipped;
	}

	// Whether this round said where its stitches go, rather than counting its
	// way along. Only such a round can be held to working the round below
	// exactly once: a shorthand round that works twice into a stitch is how an
	// increase has always been written.
	get saidWhere(): boolean {
		return this.navigated;
	}

	at(position: number): GraphPlace | undefined {
		if (this.places.length === 0) return undefined;
		const index = ((position % this.places.length) + this.places.length) % this.places.length;
		return this.places[index];
	}

	// The running number a place was reached at, which keeps counting past the
	// end of the round so the layout can turn it into an angle without a jump
	// from one lap to the next. A round working backwards counts down, and the
	// unwrapping handles that: position -1 is the last place of the round below,
	// one lap back.
	slotOf(position: number): number {
		return position;
	}

	// A step written with no target works into the next places in order, one per
	// stitch it is worked into.
	takeSequential(count: number): { places: GraphPlace[]; slots: number[] } {
		const places: GraphPlace[] = [];
		const slots: number[] = [];
		for (let taken = 0; taken < count; taken++) {
			const position = this.position;
			const place = this.at(position);
			if (place === undefined) break;
			this.use(place);
			places.push(place);
			slots.push(this.slotOf(position));
			this.selected = position;
			this.position = position + this.direction;
		}
		return { places, slots };
	}

	// "in next ch-2 sp", "in next sc", "in center dc of next 7-dc shell": look
	// forward in the direction this round is working until the asked-for place
	// turns up, passing over whatever is in between.
	takeNext(matches: (place: GraphPlace) => boolean): (CursorSelection & { slot: number }) | undefined {
		this.navigated = true;
		const found = this.search(matches);
		if (found === undefined) return undefined;
		for (const place of found.skipped) this.pass(place);
		this.use(found.place);
		this.selected = found.position;
		this.position = found.position + this.direction;
		return { place: found.place, skipped: found.skipped, slot: this.slotOf(found.position) };
	}

	// "in same st", "in same ch-1 sp": the place the round is already working
	// into. Using it again does not use it twice — the stitches worked there are
	// siblings of one motif, which is the whole point of saying "same".
	takeSame(): { place: GraphPlace; slot: number; fresh: boolean } | undefined {
		if (this.selected === undefined) return undefined;
		const place = this.at(this.selected);
		if (place === undefined) return undefined;
		const fresh = (this.uses.get(place.id) ?? 0) === 0;
		if (fresh) {
			this.use(place);
			this.position = this.selected + this.direction;
		}
		return { place, slot: this.slotOf(this.selected), fresh };
	}

	// Where the round is working now, without using it: what a chain or a picot
	// is attached to, since neither is worked into the round below.
	peek(): { place: GraphPlace; slot: number } | undefined {
		if (this.selected === undefined) return undefined;
		const place = this.at(this.selected);
		return place === undefined ? undefined : { place, slot: this.slotOf(this.selected) };
	}

	// A slip stitch worked only to get to where the round starts. It selects a
	// place and uses nothing, not even what it passed on the way: the round
	// simply begins there.
	moveToNext(matches: (place: GraphPlace) => boolean): GraphPlace | undefined {
		this.navigated = true;
		const found = this.search(matches);
		if (found === undefined) return undefined;
		this.selected = found.position;
		this.position = found.position;
		return found.place;
	}

	// "skip 2": passing places over on purpose.
	skip(count: number): GraphPlace[] {
		this.navigated = true;
		const skipped: GraphPlace[] = [];
		for (let taken = 0; taken < count; taken++) {
			const place = this.at(this.position);
			if (place === undefined) break;
			this.pass(place);
			skipped.push(place);
			this.position += this.direction;
		}
		return skipped;
	}

	// Whatever is left when the round closes is what the round passed at its
	// seam — the gap between where it stopped and where it started. That is a
	// fact about a cyclic round, not a mistake, so it is accounted for here;
	// anything left over that is not one run is left unused and reported.
	finish(): void {
		if (!this.navigated) return;
		const unused = this.places.filter((place) => (this.uses.get(place.id) ?? 0) === 0);
		if (unused.length === 0 || unused.length === this.places.length) return;
		if (!isOneRun(unused.map((place) => place.index), this.places.length)) return;
		for (const place of unused) this.pass(place);
	}

	private search(
		matches: (place: GraphPlace) => boolean,
	): { place: GraphPlace; position: number; skipped: GraphPlace[] } | undefined {
		const skipped: GraphPlace[] = [];
		for (let step = 0; step < this.places.length; step++) {
			const position = this.position + step * this.direction;
			const place = this.at(position);
			if (place === undefined) return undefined;
			if (matches(place)) return { place, position, skipped };
			skipped.push(place);
		}
		return undefined;
	}

	private use(place: GraphPlace): void {
		this.uses.set(place.id, (this.uses.get(place.id) ?? 0) + 1);
	}

	// Used by being passed over: accounted for, but nothing was worked into it.
	private pass(place: GraphPlace): void {
		this.use(place);
		this.skipped.add(place.id);
	}
}

// Whether these positions form one unbroken run around a cyclic round.
function isOneRun(indices: readonly number[], length: number): boolean {
	if (indices.length <= 1) return true;
	const present = new Set(indices);
	let starts = 0;
	for (const index of indices) {
		const before = (index - 1 + length) % length;
		if (!present.has(before)) starts++;
	}
	return starts === 1;
}
