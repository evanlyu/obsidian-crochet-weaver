// Crochet Weaver pattern grammar (Peggy + ts-pegjs).
// Run `npm run generate-parser` to generate src/parser.ts. Do not edit parser.ts by hand.
// Actions are TypeScript copied into the generated .ts file, so they must type-check.

{{
	function makeStitch(name: string, count: number | null) {
		return { type: 'StitchNode', stitch: name, count: count ?? 1 };
	}
}}

Document
	= __ meta:Frontmatter? rows:Row+ __ {
			return {
				type: 'CrochetChart',
				config: meta ?? { type: 'flat' },
				rows: rows,
			};
		}

// --- Config block: flat YAML-like frontmatter with key: value pairs only. ---

Frontmatter
	= '---' _ EOL lines:ConfigLine* '---' _ (EOL / EOF) {
			const config: Record<string, string> = { type: 'flat' };
			for (const line of lines) config[line.key] = line.value;
			return config;
		}

ConfigLine
	= !'---' _ key:Word _ ':' _ value:RestOfLine (EOL / EOF) {
			return { key, value };
		}

RestOfLine = [^\r\n]* { return text().trim(); }

// --- Row ---
// PEG ordered choices do not backtrack after a successful branch, so 'Row' must
// be listed before 'R'. Otherwise "Row 1:" is consumed as 'R' and then fails.

// The anchor usually ends the row ("R1: 6 sc in MR"), but some patterns also
// join round 1 right after the anchor ("R1: 6 sc in MR, sl st"). 'tail' picks
// up any steps written after the anchor so they aren't lost.
Row
	= __ num:RowLabel _ ':' _ loop:LoopMod? head:Steps _ ','? _ anchor:RingAnchor? tail:(_ ','? _ s:Steps { return s; })? _ (EOL / EOF) {
			return {
				type: 'Row',
				num: num,
				loop: loop ?? undefined,
				steps: tail ? [...head, ...tail] : head,
				anchor: anchor ?? undefined,
			};
		}

RowLabel = ('Row'i / 'R'i) _ digits:[0-9]+ { return parseInt(digits.join(''), 10); }

// Row-level loop modifiers: BLO/FLO after the row label and before stitches.
LoopMod
	= 'blo'i ![a-zA-Z] _ ','? _ { return 'blo'; }
	/ 'flo'i ![a-zA-Z] _ ','? _ { return 'flo'; }

// Round center anchors: in MR or in ch ring.
// The 'in' token does not conflict with 'inc': when 'inc' fails at the missing
// trailing c, PEG backtracks and lets RingAnchor parse the anchor.
RingAnchor
	= 'in'i _ 'MR'i { return 'MR'; }
	/ 'in'i _ 'ch'i _ 'ring'i { return 'ch ring'; }

// --- Step sequence ---

Steps
	= head:Step tail:(_ ','? _ step:Step { return step; })* {
			return [head, ...tail];
		}

Step = Repeat / Group / Stitch

// Repeat block: [sc, inc] x 6.
Repeat
	= '[' _ inner:Steps _ ']' _ 'x'i _ count:Integer {
			return { type: 'RepeatNode', count: count, children: inner };
		}

// Group: multiple stitches worked into the same stitch, e.g. (dc, ch, dc).
Group
	= '(' _ inner:Steps _ ')' {
			return { type: 'GroupNode', children: inner };
		}

// Basic stitch, optionally prefixed with a quantity: 10 ch.
// The trailing negative lookahead is a word boundary so "chain" is not parsed as ch + ain.
Stitch
	= count:Integer? _ name:StitchName ![a-zA-Z0-9_] {
			return makeStitch(name, count);
		}

StitchName
	= 'sl' _ 'st' { return 'sl st'; }
	/ 'ch'
	/ 'sc'
	/ 'hdc'
	/ 'dtr'
	/ 'dc'
	/ 'tr'
	/ 'fpdc'
	/ 'bpdc'
	/ 'bobble'
	/ 'popcorn'
	/ 'inc'
	/ 'dec'
	/ 'MR'i { return 'MR'; }

// --- Lexical rules ---

Integer = [0-9]+ { return parseInt(text(), 10); }
Word = [a-zA-Z0-9_-]+ { return text(); }

_ 'inline whitespace' = [ \t]*
__ 'whitespace' = [ \t\r\n]*
EOL = '\r\n' / '\n' / '\r'
EOF = !.
