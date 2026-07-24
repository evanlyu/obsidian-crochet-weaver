import { describe, expect, it } from 'vitest';
import { resolveOptions, resolvePanelOptions } from '../src/options';
import { parse } from '../src/parser';
import type { CrochetAst } from '../src/types';
import type { CrochetWeaverSettings } from '../src/settings';

const SETTINGS: CrochetWeaverSettings = {
	languagePreference: 'auto',
	symbolRotation: 'smart',
	scale: 1,
	strokeWidth: 1.5,
	ringSpacing: 30,
	highlightIncDec: false,
	chartMarkerColor: '#1971c2',
	showTool: false,
	showPatternText: false,
	patternTextStyle: 'raw',
	panelPosition: 'right',
	showGrid: false,
	gridDefaultShape: 'polar',
	gridDefaultRounds: 6,
	gridDefaultColumns: 12,
	gridDefaultRows: 6,
	progress: {},
	stitchProgress: {},
};

function parseChart(source: string): CrochetAst {
	return parse(source) as CrochetAst;
}

describe('chart option resolution', () => {
	it('uses global settings when frontmatter does not override options', () => {
		const options = resolveOptions(parseChart('R1: sc\n'), SETTINGS);

		expect(options).toEqual({
			rotation: 'smart',
			ringSpacing: 30,
			grid: false,
			scale: 1,
			strokeWidth: 1.5,
			highlightIncDec: false,
			chartMarkerColor: '#1971c2',
		});
	});

	it('uses valid frontmatter overrides', () => {
		const options = resolveOptions(
			parseChart(`---
rotation: all
spacing: 40
scale: 1.25
stroke: 2
highlight: yes
---
R1: sc
`),
			SETTINGS,
		);

		expect(options).toEqual({
			rotation: 'all',
			ringSpacing: 40,
			grid: false,
			scale: 1.25,
			strokeWidth: 2,
			highlightIncDec: true,
			chartMarkerColor: '#1971c2',
		});
	});

	it('falls back to global settings for invalid overrides', () => {
		const options = resolveOptions(
			parseChart(`---
rotation: sideways
spacing: nope
scale: -1
stroke: 0
highlight: maybe
---
R1: sc
`),
			SETTINGS,
		);

		expect(options).toEqual({
			rotation: 'smart',
			ringSpacing: 30,
			grid: false,
			scale: 1,
			strokeWidth: 1.5,
			highlightIncDec: false,
			chartMarkerColor: '#1971c2',
		});
	});

	it('rejects partial strings for numeric values', () => {
		const options = resolveOptions(
			parseChart(`---
spacing: 40px
scale: 1.25abc
stroke: 2.0.0
---
R1: sc
`),
			SETTINGS,
		);

		expect(options).toEqual(expect.objectContaining({
			ringSpacing: 30,
			scale: 1,
			strokeWidth: 1.5,
		}));
	});

	it('resolves grid from frontmatter or the global setting, with invalid values falling back', () => {
		expect(resolveOptions(parseChart('R1: sc\n'), SETTINGS).grid).toBe(false);
		expect(resolveOptions(parseChart('R1: sc\n'), { ...SETTINGS, showGrid: true }).grid).toBe(true);
		expect(resolveOptions(parseChart('---\ngrid: on\n---\nR1: sc\n'), SETTINGS).grid).toBe(true);
		expect(resolveOptions(parseChart('---\ngrid: off\n---\nR1: sc\n'), { ...SETTINGS, showGrid: true }).grid).toBe(
			false,
		);
		expect(resolveOptions(parseChart('---\ngrid: maybe\n---\nR1: sc\n'), { ...SETTINGS, showGrid: true }).grid).toBe(
			true,
		);
	});

	it('resolves gridCount from rounds for round/spiral charts and from rows for flat charts', () => {
		const round = resolveOptions(
			parseChart('---\ntype: round\nrounds: 8\n---\nR1: 6 sc in MR\n'),
			SETTINGS,
		);
		expect(round.gridCount).toBe(8);

		const flat = resolveOptions(parseChart('---\ntype: flat\nrows: 5\n---\nR1: sc\n'), SETTINGS);
		expect(flat.gridCount).toBe(5);

		const noOverride = resolveOptions(parseChart('R1: sc\n'), SETTINGS);
		expect(noOverride.gridCount).toBeUndefined();

		const invalid = resolveOptions(
			parseChart('---\ntype: round\nrounds: -1\n---\nR1: 6 sc in MR\n'),
			SETTINGS,
		);
		expect(invalid.gridCount).toBeUndefined();
	});

	it('resolves gridColumns from the columns frontmatter key', () => {
		expect(resolveOptions(parseChart('---\ncolumns: 16\n---\nR1: sc\n'), SETTINGS).gridColumns).toBe(16);
		expect(resolveOptions(parseChart('R1: sc\n'), SETTINGS).gridColumns).toBeUndefined();
		expect(resolveOptions(parseChart('---\ncolumns: 0\n---\nR1: sc\n'), SETTINGS).gridColumns).toBeUndefined();
	});
});

describe('embedded panel resolution', () => {
	it('uses global settings when frontmatter has no tool/text/position keys', () => {
		expect(resolvePanelOptions(parseChart('R1: sc\n'), SETTINGS)).toEqual({
			showTool: false,
			showText: false,
			position: 'right',
			textStyle: 'raw',
		});
	});

	it('falls back to global panel defaults when they are enabled', () => {
		const settings = { ...SETTINGS, showTool: true, showPatternText: true, panelPosition: 'below' as const };

		expect(resolvePanelOptions(parseChart('R1: sc\n'), settings)).toEqual({
			showTool: true,
			showText: true,
			position: 'below',
			textStyle: 'raw',
		});
	});

	it('lets frontmatter override the global panel defaults', () => {
		const options = resolvePanelOptions(
			parseChart(`---
tool: on
text: on
position: left
---
R1: sc
`),
			SETTINGS,
		);

		expect(options).toEqual({ showTool: true, showText: true, position: 'left', textStyle: 'raw' });
	});

	it('falls back to global settings for invalid frontmatter values', () => {
		const settings = { ...SETTINGS, showTool: true, panelPosition: 'below' as const };
		const options = resolvePanelOptions(
			parseChart(`---
tool: maybe
position: sideways
---
R1: sc
`),
			settings,
		);

		expect(options).toEqual({ showTool: true, showText: false, position: 'below', textStyle: 'raw' });
	});

	it('resolves textStyle from global settings or the readable frontmatter override', () => {
		expect(resolvePanelOptions(parseChart('R1: sc\n'), SETTINGS).textStyle).toBe('raw');
		expect(
			resolvePanelOptions(parseChart('R1: sc\n'), { ...SETTINGS, patternTextStyle: 'readable' }).textStyle,
		).toBe('readable');
		expect(
			resolvePanelOptions(parseChart('---\nreadable: on\n---\nR1: sc\n'), SETTINGS).textStyle,
		).toBe('readable');
		expect(
			resolvePanelOptions(
				parseChart('---\nreadable: off\n---\nR1: sc\n'),
				{ ...SETTINGS, patternTextStyle: 'readable' },
			).textStyle,
		).toBe('raw');
		expect(
			resolvePanelOptions(
				parseChart('---\nreadable: maybe\n---\nR1: sc\n'),
				{ ...SETTINGS, patternTextStyle: 'readable' },
			).textStyle,
		).toBe('readable');
	});

	it('lets a chart turn the tool off even when the global default is on', () => {
		const settings = { ...SETTINGS, showTool: true };
		const options = resolvePanelOptions(
			parseChart('---\ntool: off\n---\nR1: sc\n'),
			settings,
		);

		expect(options.showTool).toBe(false);
	});
});
