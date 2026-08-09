// Crochet Weaver pattern grammar (Peggy + ts-pegjs).
// Run `npm run generate-parser` to generate src/parser.ts. Do not edit parser.ts by hand.
// Actions are TypeScript copied into the generated .ts file, so they must type-check.

{{
	interface Target {
		kind: string;
		type?: string;
		size?: number;
	}

	function makeStitch(name: string, count: number | null, target?: Target | null) {
		const stitch: Record<string, unknown> = { type: 'StitchNode', stitch: name, count: count ?? 1 };
		if (target) {
			stitch.target = target;
			// A quantity and a target written as one instruction ("5 dc in next
			// ch-2 sp") is one motif worked into one place, not N instructions.
			if ((count ?? 1) > 1) stitch.motif = true;
		}
		return stitch;
	}

	// V2 and V3 are the pattern book's shorthand for a V-stitch: two doubles
	// with a chain space between them, all worked into one place. They are
	// expanded here so the graph and the chart deal in written stitches, and the
	// alias is kept so the chart can still name what it came from.
	function makeV(chains: number, target?: Target | null) {
		const group: Record<string, unknown> = {
			type: 'GroupNode',
			alias: `V${chains}`,
			children: [
				{ type: 'StitchNode', stitch: 'dc', count: 1 },
				{ type: 'StitchNode', stitch: 'ch', count: chains },
				{ type: 'StitchNode', stitch: 'dc', count: 1 },
			],
		};
		if (target) group.target = target;
		return group;
	}
}}

Document
	= __ meta:Frontmatter? rows:RowEntry+ __ {
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

RowEntry = RowRepeat / Row

// A round written as a repeat of earlier rounds: "R13: repeat R11." or
// "R15–R22: repeat R11–R14." Expanded into real rounds before anything reads
// the chart (see pattern/expand.ts), so this shape never leaves the parser.
RowRepeat
	= __ from:RowLabel to:(Dash r:RowLabel { return r; })? _ ':' S 'repeat'i S sourceFrom:RowLabel sourceTo:(Dash r:RowLabel { return r; })? S '.'? _ (EOL / EOF) {
			return {
				type: 'RowRepeat',
				from: from,
				to: to ?? from,
				sourceFrom: sourceFrom,
				sourceTo: sourceTo ?? sourceFrom,
			};
		}

Dash = S ('-' / '–' / '—') S

// The anchor usually ends the row ("R1: 6 sc in MR"), but some patterns also
// join round 1 right after the anchor ("R1: 6 sc in MR, sl st"). 'tail' picks
// up any steps written after the anchor so they aren't lost.
//
// A round's body may run over several lines: 'S' lets a step separator cross a
// newline when the next line is indented, which is how pattern books set a long
// round. The trailing count annotation is written after the round's final
// period, so the step list ends before it is read.
Row
	= __ num:RowLabel _ ':' S loop:LoopMod? head:Steps S ','? S anchor:RingAnchor? tail:(S ','? S s:Steps { return s; })? S '.'? S count:CountAnnotation? _ '.'? _ (EOL / EOF) {
			const steps = tail ? [...head, ...tail] : head;
			return {
				type: 'Row',
				num: num,
				loop: loop ?? undefined,
				steps: steps,
				anchor: anchor ?? undefined,
				turn: steps.some((step: { type: string }) => step.type === 'TurnNode') ? true : undefined,
				count: count ?? undefined,
			};
		}

RowLabel = ('Row'i / 'R'i) _ digits:[0-9]+ { return parseInt(digits.join(''), 10); }

// --- Count annotation ---
// What the pattern says the round is worth: "(24 dc)", "(24 sc + 24 ch-1 sp =
// 48 sts)", "(12 reps, 4 sts per rep)". The total is whichever number the form
// names as the total: after '=', the product of reps and per-rep, or the lone
// leading number.

CountAnnotation
	= '(' _ body:$[^)\r\n]* ')' {
			const text = body.trim();
			const sum = /=\s*(\d+)/.exec(text);
			if (sum !== null) return { total: parseInt(sum[1], 10), text: text };
			const perRep = /(\d+)\s*reps?\s*,\s*(\d+)\s*sts?\s*per\s*rep/i.exec(text);
			if (perRep !== null) {
				const reps = parseInt(perRep[1], 10);
				const each = parseInt(perRep[2], 10);
				return { total: reps * each, reps: reps, perRep: each, text: text };
			}
			const total = /^(\d+)/.exec(text);
			if (total !== null) return { total: parseInt(total[1], 10), text: text };
			return undefined;
		}

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
	= head:Step tail:(S ','? S step:Step { return step; })* {
			return [head, ...tail];
		}

// Ordered so that the written forms that begin with a stitch name — a join or a
// repositioning slip stitch, a beginning chain carrying a count note — are read
// as what they are before the plain stitch rule claims their first word.
Step
	= TurnStep
	/ JoinStep
	/ RepositionStep
	/ SkipStep
	/ BeginningChain
	/ Repeat
	/ GroupStep
	/ ColorChange
	/ VStitch
	/ Stitch

// Turning the work. Written at the start of the round it applies to.
TurnStep = 'turn'i ![a-zA-Z] { return { type: 'TurnNode' }; }

// The slip stitch a round closes with, and what it closes to.
JoinStep
	= SlSt S 'to'i ![a-zA-Z] S target:JoinTarget {
			return { type: 'JoinNode', ...target };
		}

JoinTarget
	= 'top'i S 'of'i S ('beginning'i / 'beg'i) S 'ch'i '-'? _ [0-9]* { return { target: 'beginning-ch' }; }
	/ 'first'i S name:StitchName { return { target: 'first', stitch: name }; }
	/ 'join'i ![a-zA-Z] { return { target: 'join' }; }

// A slip stitch worked only to move to where the round starts.
RepositionStep
	= SlSt S ('into'i / 'in'i) ![a-zA-Z] S target:Target {
			return { type: 'RepositionNode', target: target };
		}

SkipStep
	= ('skip'i / 'sk'i) ![a-zA-Z] S count:Integer {
			return { type: 'SkipNode', count: count };
		}

// A beginning chain written with what it is worth. A chain written without a
// note stays an ordinary stitch here; which round it opens, and whether it
// stands in for a stitch, is settled once the whole round is known.
BeginningChain
	= 'ch'i S count:Integer S '(' _ note:$[^)\r\n]* ')' {
			const text = note.trim();
			if (/does\s+not\s+count/i.test(text)) {
				return { type: 'StitchNode', stitch: 'ch', count: count, beginning: { counts: false } };
			}
			const as = /counts?\s+as\s+(?:an?\s+)?([a-z][a-z ]*?)\s*$/i.exec(text);
			if (as !== null) {
				return { type: 'StitchNode', stitch: 'ch', count: count, beginning: { counts: true, as: as[1].trim() } };
			}
			error(`A beginning chain note must say what it counts as, or that it does not count: "(${text})"`);
		}

// V2 / V3: two doubles with a chain space between them, worked into one place.
VStitch
	= 'V'i chains:[23] ![a-zA-Z0-9_] target:StepTarget? {
			return makeV(parseInt(chains, 10), target);
		}

GroupStep
	= group:Group target:StepTarget? {
			if (target) group.target = target;
			return group;
		}

// "in <place>", where a step says what it is worked into.
StepTarget = S 'in'i ![a-zA-Z] S target:Target { return target; }

Target
	= 'center'i S 'dc'i S 'of'i S 'next'i S size:Integer _ '-'? _ 'dc'i S 'shell'i {
			if (size !== 3 && size !== 5 && size !== 7 && size !== 9) {
				error(`A shell center is only defined for a 3-, 5-, 7-, or 9-dc shell, not a ${size}-dc shell.`);
			}
			return { kind: 'shell-center', size: size };
		}
	/ 'same'i S type:TargetKind { return { kind: 'same', type: type }; }
	/ 'same'i ![a-zA-Z] { return { kind: 'same', type: 'st' }; }
	/ 'next'i S type:TargetKind { return { kind: 'next', type: type }; }

// The places a round below offers: its stitches, by name or generically, and
// the chain spaces between them.
TargetKind
	= 'ch'i _ '-'? _ chains:Integer _ 'sp'i ![a-zA-Z] { return `ch-${chains} sp`; }
	/ 'st'i ![a-zA-Z] { return 'st'; }
	/ 'sp'i ![a-zA-Z] { return 'sp'; }
	/ 'picot'i ![a-zA-Z] { return 'picot'; }
	/ name:StitchName ![a-zA-Z0-9_] { return name; }

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
	= '[' S inner:Steps S ']' S count:RepeatCount {
			return { type: 'RepeatNode', count: count, children: inner };
		}

RepeatCount
	= 'x'i _ count:Integer { return count; }
	/ 'rep'i _ count:Integer { return count; }
	/ 'rep'i ![a-zA-Z0-9_] { return null; }

// Group: multiple stitches worked into the same stitch, e.g. (dc, ch, dc).
Group
	= '(' S inner:Steps S ')' {
			return { type: 'GroupNode', children: inner };
		}

// Basic stitch with a quantity either side of the name: "10 ch", "ch10",
// "ch 10" — pattern books write it all three ways. The trailing negative
// lookahead is a word boundary so "chain" is not parsed as ch + ain; the
// stitch names that contain digits ("dc2tog", "tr5cl") are matched by
// StitchName first, so a suffix count can never eat part of one.
Stitch
	= before:Integer? _ name:StitchName after:(_ n:Integer { return n; })? ![a-zA-Z0-9_] target:StepTarget? {
			return makeStitch(name, after ?? before, target);
		}

// Ordered longest-first within each shared prefix: PEG never backtracks into a
// succeeded StitchName, so once 'sc' matches inside "sc2tog" the Stitch rule's
// word-boundary lookahead fails the whole step with no retry. Compound names
// ('hdc popcorn') and digit-containing names ('dc2tog', 'tr5cl') must all be
// listed before the plain name they start with.
// "sl st", "slst", "sl-st" and "sl_st" are the same stitch, normalized to the
// one spelling the symbol library and the rest of the plugin use.
SlSt = 'sl'i [ \t_-]* 'st'i ![a-zA-Z] { return 'sl st'; }

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

// Whitespace between the steps of one round. A round's body may be set over
// several lines, so this crosses a newline when — and only when — the next line
// is indented: a new row label starts at the margin, and a blank line ends the
// round, so neither is ever swallowed as a continuation.
S 'step separator' = [ \t]* (EOL [ \t]+)? [ \t]*
EOL = '\r\n' / '\n' / '\r'
EOF = !.
