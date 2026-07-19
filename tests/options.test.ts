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
	showNextRoundMarker: true,
	nextRoundMarkerColor: '#e8590c',
	chartMarkerColor: '#1971c2',
	showTool: false,
	showPatternText: false,
	panelPosition: 'right',
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
			scale: 1,
			strokeWidth: 1.5,
			highlightIncDec: false,
			showNextRoundMarker: true,
			nextRoundMarkerColor: '#e8590c',
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
			scale: 1.25,
			strokeWidth: 2,
			highlightIncDec: true,
			showNextRoundMarker: true,
			nextRoundMarkerColor: '#e8590c',
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
			scale: 1,
			strokeWidth: 1.5,
			highlightIncDec: false,
			showNextRoundMarker: true,
			nextRoundMarkerColor: '#e8590c',
			chartMarkerColor: '#1971c2',
		});
	});
});

describe('embedded panel resolution', () => {
	it('uses global settings when frontmatter has no tool/text/position keys', () => {
		expect(resolvePanelOptions(parseChart('R1: sc\n'), SETTINGS)).toEqual({
			showTool: false,
			showText: false,
			position: 'right',
		});
	});

	it('falls back to global panel defaults when they are enabled', () => {
		const settings = { ...SETTINGS, showTool: true, showPatternText: true, panelPosition: 'below' as const };

		expect(resolvePanelOptions(parseChart('R1: sc\n'), settings)).toEqual({
			showTool: true,
			showText: true,
			position: 'below',
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

		expect(options).toEqual({ showTool: true, showText: true, position: 'left' });
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

		expect(options).toEqual({ showTool: true, showText: false, position: 'below' });
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
