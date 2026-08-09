// The shapes a blank drafting grid is made of.
//
// A grid has no stitches; it is pure guide geometry sized by counts rather than
// by parsed pattern rows, so it has its own small config, options and layout
// shapes instead of borrowing CrochetAst / LayoutOptions / LayoutResult.

export type GridShape = 'polar' | 'rect';

// Flat key:value config parsed from a crochet-grid block, mirroring how
// CrochetConfig's frontmatter values are always raw strings until resolved.
export type GridConfig = Record<string, string>;

// Grid options resolved from global settings and per-block config.
export interface ResolvedGridOptions {
	shape: GridShape;
	rounds: number;
	columns: number;
	rows: number;
	scale: number;
	strokeWidth: number;
	ringSpacing: number;
}

// The circles and lines a grid is drawn from are plain geometry, shared with the
// guide layer of a real chart (see src/types.ts).
import type { GridCircle, GridLine } from '../types';

export type { GridCircle, GridLine };


export interface GridLayoutResult {
	width: number;
	height: number;
	circles: readonly GridCircle[];
	lines: readonly GridLine[];
}
