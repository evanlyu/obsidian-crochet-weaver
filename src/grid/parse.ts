import type { GridConfig } from './types';

const LINE_PATTERN = /^(?<key>[A-Za-z0-9_-]+)\s*:\s*(?<value>.*)$/;

export class GridParseError extends Error {
	readonly line: number;

	constructor(message: string, line: number) {
		super(message);
		this.name = 'GridParseError';
		this.line = line;
	}
}

// A crochet-grid block body is nothing but flat key: value config lines (no
// stitch rows, no frontmatter fences needed since the whole block is config).
export function parseGridConfig(source: string): GridConfig {
	const config: GridConfig = {};
	const lines = source.split(/\r\n|\r|\n/);
	lines.forEach((rawLine, index) => {
		const line = rawLine.trim();
		if (line.length === 0) return;
		const match = LINE_PATTERN.exec(line);
		const key = match?.groups?.key;
		const value = match?.groups?.value;
		if (key === undefined || value === undefined) {
			throw new GridParseError(`Invalid config line: "${line}"`, index + 1);
		}
		config[key.toLowerCase()] = value.trim();
	});
	return config;
}
