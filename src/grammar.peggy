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

Step = Repeat / Group / ColorChange / Stitch

// Mid-row yarn color change, e.g. "color white" or "color: #ffffff". Not a
// stitch — carries no width of its own, but sets the color every following
// stitch (in this row and any later row, until changed again) is rendered in.
ColorChange
	= 'color'i ![a-zA-Z0-9_] _ ':'? _ value:ColorValue ![a-zA-Z0-9_] {
			return { type: 'ColorChangeNode', color: value };
		}

ColorValue
	= '#' hex:$([0-9a-fA-F]+) { return '#' + hex; }
	/ $([a-zA-Z]+)

// Repeat block: [sc, inc] x 6, or the same written "rep 6" / "rep6".
// A bare "rep" repeats the group as many times as the previous round has
// stitches to work into; count is null until that round is known (see
// resolveRepeats), because the parser cannot see the round before this one.
Repeat
	= '[' _ inner:Steps _ ']' _ count:RepeatCount {
			return { type: 'RepeatNode', count: count, children: inner };
		}

RepeatCount
	= 'x'i _ count:Integer { return count; }
	/ 'rep'i _ count:Integer { return count; }
	/ 'rep'i ![a-zA-Z0-9_] { return null; }

// Group: multiple stitches worked into the same stitch, e.g. (dc, ch, dc).
Group
	= '(' _ inner:Steps _ ')' {
			return { type: 'GroupNode', children: inner };
		}

// Basic stitch with a quantity either side of the name: "10 ch", "ch10",
// "ch 10" — pattern books write it all three ways. The trailing negative
// lookahead is a word boundary so "chain" is not parsed as ch + ain; the
// stitch names that contain digits ("dc2tog", "tr5cl") are matched by
// StitchName first, so a suffix count can never eat part of one.
Stitch
	= before:Integer? _ name:StitchName after:(_ n:Integer { return n; })? ![a-zA-Z0-9_] {
			return makeStitch(name, after ?? before);
		}

// Ordered longest-first within each shared prefix: PEG never backtracks into a
// succeeded StitchName, so once 'sc' matches inside "sc2tog" the Stitch rule's
// word-boundary lookahead fails the whole step with no retry. Compound names
// ('hdc popcorn') and digit-containing names ('dc2tog', 'tr5cl') must all be
// listed before the plain name they start with.
// "sl st", "slst", "sl-st" and "sl_st" are the same stitch, normalized to the
// one spelling the symbol library and the rest of the plugin use.
StitchName
	= 'sl' [ \t_-]* 'st' { return 'sl st'; }
	/ 'hdc' _ 'popcorn' { return 'hdc popcorn'; }
	/ 'tr' _ 'popcorn' { return 'tr popcorn'; }
	/ 'hdc2tog'
	/ 'hdc3tog'
	/ 'hdc4tog'
	/ 'hdc5tog'
	/ 'hdc2cl'
	/ 'hdc3cl'
	/ 'hdc5cl'
	/ 'hdc'
	/ 'sc2tog'
	/ 'sc3tog'
	/ 'sc'
	/ 'dc2tog'
	/ 'dc3tog'
	/ 'dc4tog'
	/ 'dc5tog'
	/ 'dc2cl'
	/ 'dc3cl'
	/ 'dc5cl'
	/ 'dtr'
	/ 'dc'
	/ 'tr2cl'
	/ 'tr3cl'
	/ 'tr5cl'
	/ 'tr'
	/ 'ch'
	/ 'fpsc'
	/ 'fphdc'
	/ 'fpdc'
	/ 'fptr'
	/ 'bpsc'
	/ 'bphdc'
	/ 'bpdc'
	/ 'bptr'
	/ 'xhdc'
	/ 'xdc'
	/ 'xtr'
	/ 'rsc'
	/ 'picot'
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
