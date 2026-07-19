import { describe, expect, it } from 'vitest';

describe('Obsidian DOM test helpers', () => {
	it('creates elements with Obsidian-style helper methods', () => {
		const root = document.createElement('section');

		const row = root.createDiv({ cls: ['crochet-tool-row', 'is-current'] });
		row.createSpan({ cls: 'crochet-tool-badge', text: 'R1' });

		expect(root.querySelector('.crochet-tool-row.is-current')).toBe(row);
		expect(row.textContent).toBe('R1');
	});
});
