import { describe, expect, it } from 'vitest';
import { renderCrochetTool, type ProgressStore } from '../src/panel/tool';

class MemoryProgressStore implements ProgressStore {
	readonly progress: Record<string, number> = {};
	readonly stitchProgress: Record<string, number> = {};

	getProgress(id: string): number {
		return this.progress[id] ?? 0;
	}

	async setProgress(id: string, done: number): Promise<void> {
		this.progress[id] = done;
	}

	getStitchProgress(id: string): number {
		return this.stitchProgress[id] ?? 0;
	}

	async setStitchProgress(id: string, count: number): Promise<void> {
		this.stitchProgress[id] = count;
	}
}

describe('stitch counter accessibility', () => {
	it('exposes aria labels that include their visible unit weights', () => {
		const container = document.createElement('div');
		const store = new MemoryProgressStore();

		renderCrochetTool('---\nid: stitch-aria\n---\nR1: sc, inc, sc\n', container, store);

		const add = () => container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn.mod-cta');
		expect(add()?.getAttribute('aria-label')).toBe('Add 1 stitch');

		add()?.click();
		expect(add()?.getAttribute('aria-label')).toBe('Add 2 stitches');

		const subtract = container.querySelector<HTMLButtonElement>('.crochet-tool-stitch-btn:not(.mod-cta)');
		expect(subtract?.getAttribute('aria-label')).toBe('Remove 1 stitch');
	});
});
