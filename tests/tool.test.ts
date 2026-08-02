import { describe, expect, it } from 'vitest';
import { renderCrochetPatternText, renderCrochetTool, type ProgressStore } from '../src/panel/tool';

class MemoryProgressStore implements ProgressStore {
	readonly progress: Record<string, number> = {};
	readonly stitchProgress: Record<string, number> = {};
	lastId = '';

	getProgress(id: string): number {
		return this.progress[id] ?? 0;
	}

	async setProgress(id: string, done: number): Promise<void> {
		this.lastId = id;
		this.progress[id] = done;
	}

	getStitchProgress(id: string): number {
		return this.stitchProgress[id] ?? 0;
	}

	async setStitchProgress(id: string, count: number): Promise<void> {
		this.stitchProgress[id] = count;
	}
}

function hasOwnProgress(progress: Record<string, number>, id: string): boolean {
	return Object.prototype.hasOwnProperty.call(progress, id);
}

describe('crochet progress tool', () => {
	it('renders valid panels and progress controls', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool(`---
id: pouch
type: round
---
R1: [sc, inc] x 2, sl st in MR
R2: 6 sc
`, container, store, 'zh-TW');

		expect(container.querySelector('.crochet-tool')).not.toBeNull();
		expect(container.querySelector('.crochet-tool-title')?.textContent).toBe('同心圓環織');
		expect(container.querySelector('.crochet-tool-count')?.textContent).toBe('6 針');
		expect(container.textContent).toContain('[sc, inc] × 2, sl st in MR');
	});

	it('renders invalid syntax errors', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('R1: chain\n', container, store, 'zh-TW');

		expect(container.querySelector('.crochet-weaver-error')).not.toBeNull();
		expect(container.textContent).toContain('織圖語法錯誤');
	});

	it('uses explicit ids and automatic ids for progress persistence', () => {
		const explicitContainer = document.createElement('div');
		const autoContainer = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: scarf\n---\nR1: sc\n', explicitContainer, store);
		explicitContainer.querySelector<HTMLButtonElement>('.crochet-tool-controls .mod-cta')?.click();

		expect(store.progress.scarf).toBe(1);

		renderCrochetTool('R1: sc\n', autoContainer, store);
		autoContainer.querySelector<HTMLButtonElement>('.crochet-tool-controls .mod-cta')?.click();

		expect(store.lastId).toMatch(/^auto-/);
		expect(store.progress[store.lastId]).toBe(1);
	});

	it('falls back to automatic ids for unsafe explicit progress ids', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: __proto__\n---\nR1: sc\n', container, store);
		container.querySelector<HTMLButtonElement>('.crochet-tool-controls .mod-cta')?.click();

		expect(store.lastId).toMatch(/^auto-/);
		expect(hasOwnProgress(store.progress, '__proto__')).toBe(false);
	});

	it('updates progress with next, previous, reset, and row click controls', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: controls\n---\nR1: sc\nR2: sc\n', container, store, 'zh-TW');

		container.querySelector<HTMLButtonElement>('.crochet-tool-controls .mod-cta')?.click();
		expect(store.progress.controls).toBe(1);
		expect(container.querySelector('.crochet-tool-progress-text')?.textContent).toBe('1 / 2 行完成');

		container.querySelector<HTMLButtonElement>('.crochet-tool-controls button')?.click();
		expect(store.progress.controls).toBe(0);

		container.querySelectorAll<HTMLElement>('.crochet-tool-row')[1]?.click();
		expect(store.progress.controls).toBe(2);

		const buttons = container.querySelectorAll<HTMLButtonElement>('.crochet-tool-controls button');
		buttons[2]?.click();
		expect(store.progress.controls).toBe(0);
	});

	it('renders Japanese progress text when requested', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: ja\ntype: round\n---\nR1: sc\n', container, store, 'ja');

		expect(container.querySelector('.crochet-tool-title')?.textContent).toBe('同心円の輪編み');
		expect(container.querySelector('.crochet-tool-count')?.textContent).toBe('1 目');
	});

	it('translates the row list and its aria-label when the readable style is passed', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: readable-tool\ntype: round\n---\nR1: 6 sc in MR\n', container, store, 'zh-TW', 'readable');

		const row = container.querySelector('.crochet-tool-row');
		expect(row?.querySelector('.crochet-tool-steps')?.textContent).toBe('魔術環(短針6)');
		expect(row?.getAttribute('aria-label')).toContain('魔術環(短針6)');
	});

	it('marks completed and current rows from stored progress', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		store.progress.rows = 1;

		renderCrochetTool('---\nid: rows\n---\nR1: sc\nR2: sc\n', container, store);
		const rows = container.querySelectorAll('.crochet-tool-row');

		expect(rows[0]?.classList.contains('is-done')).toBe(true);
		expect(rows[1]?.classList.contains('is-current')).toBe(true);
	});

	it('renders accessible row buttons and progressbar semantics', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: aria\n---\nR1: sc\nR2: sc\n', container, store);
		const row = container.querySelector('.crochet-tool-row');
		const progress = container.querySelector('.crochet-tool-bar');

		expect(row).toBeInstanceOf(HTMLButtonElement);
		expect(row?.getAttribute('aria-label')).toContain('R1');
		expect(progress?.getAttribute('role')).toBe('progressbar');
		expect(progress?.getAttribute('aria-valuemin')).toBe('0');
		expect(progress?.getAttribute('aria-valuemax')).toBe('2');
		expect(progress?.getAttribute('aria-valuenow')).toBe('0');
	});
});

describe('stitch counter', () => {
	it('renders a counter for the current row, hidden once the pattern is complete', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: stitch-basic\n---\nR1: 3 sc\n', container, store, 'zh-TW');

		expect(container.querySelector('.crochet-tool-stitch-label')?.textContent).toBe('R1 針數');
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('0 / 3 針');

		store.progress['stitch-basic'] = 1;
		const completedContainer = document.createElement('div');
		renderCrochetTool('---\nid: stitch-basic\n---\nR1: 3 sc\n', completedContainer, store, 'zh-TW');

		expect(completedContainer.querySelector('.crochet-tool-stitch-counter')).toBeNull();
	});

	it('increments and decrements the stitch count', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: stitch-inc\n---\nR1: 5 sc\n', container, store);

		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();
		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();
		expect(store.stitchProgress['stitch-inc']).toBe(2);
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('2 / 5 stitches');

		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn:not(.mod-cta)')?.click();
		expect(store.stitchProgress['stitch-inc']).toBe(1);
	});

	it('advances by a whole unit\'s weight per click, so one inc takes one click for its 2 stitches', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: stitch-weighted\n---\nR1: sc, inc, sc\n', container, store);

		const add = () => container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta');
		expect(add()?.textContent).toBe('+1');

		add()?.click();
		expect(store.stitchProgress['stitch-weighted']).toBe(1);
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('1 / 4 stitches');
		expect(add()?.textContent).toBe('+2');

		add()?.click();
		expect(store.stitchProgress['stitch-weighted']).toBe(2);
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('3 / 4 stitches');

		const subtract = container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn:not(.mod-cta)');
		expect(subtract?.textContent).toBe('−2');
		subtract?.click();
		expect(store.stitchProgress['stitch-weighted']).toBe(1);
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('1 / 4 stitches');
	});

	it('auto-completes the row and resets the counter when the stitch total is reached', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: stitch-auto\n---\nR1: 2 sc\nR2: 3 sc\n', container, store);

		const clickAdd = () => container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();
		clickAdd();
		clickAdd();

		expect(store.progress['stitch-auto']).toBe(1);
		expect(store.stitchProgress['stitch-auto']).toBe(0);
		expect(container.querySelector('.crochet-tool-stitch-label')?.textContent).toBe('R2 stitches');
	});

	it('resets the stitch counter via the dedicated reset button', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		store.stitchProgress['stitch-reset'] = 2;

		renderCrochetTool('---\nid: stitch-reset\n---\nR1: 5 sc\n', container, store);
		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-reset')?.click();

		expect(store.stitchProgress['stitch-reset']).toBe(0);
		expect(store.progress['stitch-reset']).toBeUndefined();
	});

	it('resets both round progress and the stitch counter via the reset-all button', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: reset-all\n---\nR1: sc\nR2: 3 sc\n', container, store);
		container.querySelector<HTMLButtonElement>('.crochet-tool-row')?.click();
		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();
		expect(store.progress['reset-all']).toBe(1);
		expect(store.stitchProgress['reset-all']).toBe(1);

		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-reset-all')?.click();

		expect(store.progress['reset-all']).toBe(0);
		expect(store.stitchProgress['reset-all']).toBe(0);
	});

	it('resets the stitch counter when previous, complete, reset, or row-click change the current row', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		store.stitchProgress['stitch-row-change'] = 2;

		renderCrochetTool('---\nid: stitch-row-change\n---\nR1: sc\nR2: sc\n', container, store);
		container.querySelector<HTMLButtonElement>('.crochet-tool-controls .mod-cta')?.click();

		expect(store.stitchProgress['stitch-row-change']).toBe(0);
	});
});

describe('chart highlight reporting', () => {
	it('reports the current row and target unit on initial paint', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		const targets: Array<{ rowIndex: number; unitIndex?: number } | undefined> = [];

		renderCrochetTool(
			'---\nid: highlight-initial\n---\nR1: sc, inc, sc\n',
			container,
			store,
			'en',
			'raw',
			(target) => targets.push(target),
		);

		expect(targets.at(-1)).toEqual({ rowIndex: 0, unitIndex: 0 });
	});

	it('reports the next unit as the stitch counter advances', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		const targets: Array<{ rowIndex: number; unitIndex?: number } | undefined> = [];

		renderCrochetTool(
			'---\nid: highlight-advance\n---\nR1: sc, inc, sc\n',
			container,
			store,
			'en',
			'raw',
			(target) => targets.push(target),
		);
		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();

		expect(targets.at(-1)).toEqual({ rowIndex: 0, unitIndex: 1 });
	});

	it('reports the next row after auto-advancing, and undefined once complete', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		const targets: Array<{ rowIndex: number; unitIndex?: number } | undefined> = [];

		renderCrochetTool(
			'---\nid: highlight-complete\n---\nR1: sc\n',
			container,
			store,
			'en',
			'raw',
			(target) => targets.push(target),
		);
		container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta')?.click();

		expect(targets.at(-1)).toBeUndefined();
	});
});

describe('read-only pattern text', () => {
	it('renders rows, counts, and title without any progress UI', () => {
		const container = document.createElement('div');

		renderCrochetPatternText(`---
type: round
---
R1: [sc, inc] x 2, sl st in MR
R2: 6 sc
`, container, 'zh-TW');

		expect(container.querySelector('.crochet-pattern-text')).not.toBeNull();
		expect(container.querySelector('.crochet-pattern-text-title')?.textContent).toBe('同心圓環織');
		expect(container.querySelector('.crochet-pattern-text-count')?.textContent).toBe('6 針');
		expect(container.textContent).toContain('[sc, inc] × 2, sl st in MR');
		expect(container.querySelector('button')).toBeNull();
		expect(container.querySelector('.crochet-tool-bar')).toBeNull();
		expect(container.querySelectorAll('.crochet-pattern-text-row')).toHaveLength(2);
	});

	it('renders invalid syntax errors', () => {
		const container = document.createElement('div');

		renderCrochetPatternText('R1: chain\n', container, 'zh-TW');

		expect(container.querySelector('.crochet-weaver-error')).not.toBeNull();
		expect(container.textContent).toContain('織圖語法錯誤');
	});

	it('renders localized titles', () => {
		const container = document.createElement('div');

		renderCrochetPatternText('---\ntype: round\n---\nR1: sc\n', container, 'ja');

		expect(container.querySelector('.crochet-pattern-text-title')?.textContent).toBe('同心円の輪編み');
	});

	it('keeps raw shorthand by default and only translates when the readable style is requested', () => {
		const raw = document.createElement('div');
		renderCrochetPatternText('---\ntype: round\n---\nR1: 6 sc in MR\n', raw, 'zh-TW');
		expect(raw.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('6 sc in MR');

		const readable = document.createElement('div');
		renderCrochetPatternText('---\ntype: round\n---\nR1: 6 sc in MR\n', readable, 'zh-TW', 'readable');
		expect(readable.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('魔術環(短針6)');
	});

	it('always shows a count in readable style, even for singular units, and falls back to the abbreviation in English', () => {
		const container = document.createElement('div');
		renderCrochetPatternText('R1: sc, inc, sc\n', container, 'en', 'readable');
		expect(container.querySelector('.crochet-pattern-text-steps')?.textContent).toBe(
			'single crochet1, increase1, single crochet1',
		);
	});

	it('translates stitches inside groups and repeats, keeping the surrounding punctuation', () => {
		const group = document.createElement('div');
		renderCrochetPatternText('R1: (dc, ch, dc)\n', group, 'zh-TW', 'readable');
		expect(group.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('(長針1, 鎖針1, 長針1)');

		const repeat = document.createElement('div');
		renderCrochetPatternText('R1: [sc, inc] x 6\n', repeat, 'zh-TW', 'readable');
		expect(repeat.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('[短針1, 加針1] × 6');
	});

	it('shows a localized "change to <color>" phrase for color-change steps in both styles', () => {
		const raw = document.createElement('div');
		renderCrochetPatternText('R1: 8 sc, color white, 8 sc\n', raw, 'en');
		expect(raw.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('8 sc, change to white, 8 sc');

		const zhTW = document.createElement('div');
		renderCrochetPatternText('R1: 8 sc, color white, 8 sc\n', zhTW, 'zh-TW');
		expect(zhTW.querySelector('.crochet-pattern-text-steps')?.textContent).toBe('8 sc, 換成 white, 8 sc');
	});
});

describe('crochet progress tool: rounds counted the way they are written', () => {
	it('shows a mesh round as the number of stitches the pattern prints', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool(`---
id: written-count
type: round
---
R1: MR, ch 3 (counts as dc), 23 dc in MR, sl st to top of beginning ch-3. (24 dc)

R2: ch 1 (does not count as a st),
    sc in same st, ch 1,
    [sc in next dc, ch 1] x23,
    sl st to first sc.
    (24 sc + 24 ch-1 sp = 48 sts)
`, container, store);

		const counts = Array.from(container.querySelectorAll('.crochet-tool-count')).map((el) => el.textContent);
		expect(counts).toEqual(['24 stitches', '48 stitches']);
	});

	it('advances a motif in one click, by what the motif is worth', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool(`---
id: written-motif
type: round
---
R1: 5 dc in next ch-2 sp, sc in next picot, V3 in next sc.
`, container, store);

		const add = () => container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta');
		expect(add()?.textContent).toBe('+5');

		add()?.click();
		expect(store.stitchProgress['written-motif']).toBe(1);
		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('5 / 11 stitches');
	});

	it('reads a position stored under an older row total against the row as it is worth now', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();
		// Three instructions in the round; a stored position past the end of it.
		store.stitchProgress['written-stale'] = 99;

		renderCrochetTool(`---
id: written-stale
type: round
---
R1: 6 sc in MR
R2: 6 sc
`, container, store);

		expect(container.querySelector('.crochet-tool-stitch-count')?.textContent).toBe('6 / 6 stitches');
		expect(store.progress['written-stale']).toBeUndefined();
	});
});
