import type { ChartGridGuide, ChartLabel, ColorMarker, GridPoint, MotifStitch, RenderItem, ShapingMark } from '../types';

// Drawing one wedge of a round chart instead of the whole circle.
//
// A round of twelve identical motifs says everything it has to say in one slice
// of itself, and a pattern book prints it that way: the piece is drawn as a fan,
// with the rest understood. Nothing about the pattern changes — the whole chart
// is worked out exactly as before, and this keeps the part of it that falls
// inside the wedge.
//
// A motif is kept or dropped whole. Half a shell drawn at the edge of the wedge
// would read as a shell of three where the pattern says five, so a fan is
// judged by where it stands and then kept entire.

// The wedge is taken about the top of the chart, so it opens upward from the
// centre — the way a book prints a piece it has drawn part of.
const UP = -90;

// How close to the middle counts as being at the middle, in px.
const CENTRE = 24;

export interface SectorContents {
	items: RenderItem[];
	motifStitches: MotifStitch[];
	shapingMarks: ShapingMark[];
	labels: ChartLabel[];
	colorMarkers: ColorMarker[];
	gridGuide?: ChartGridGuide;
}

export function cropToSector(span: number, wholeRounds: number, contents: SectorContents): SectorContents {
	// The rounds a chart draws entire before it starts showing only a wedge: a
	// book draws the middle of a piece whole, where the pattern is still being
	// set up and every round is different, and fans out only once the rounds
	// have settled into the same motif over and over.
	const whole = (rowIndex: number | undefined): boolean => rowIndex !== undefined && rowIndex < wholeRounds;
	const inside = (x: number, y: number, rowIndex?: number): boolean =>
		// What is drawn at the middle — the ring the piece starts from — belongs
		// to no round and to every wedge.
		Math.hypot(x, y) < CENTRE || whole(rowIndex) || within(angleOf(x, y), span);

	// Every stitch of a motif goes where the motif goes.
	const keptMotifs = new Set<string>();
	const motifStitches = contents.motifStitches.filter((stitch) => {
		// A stitch is judged by where it stands, so a motif is kept or dropped
		// whole. The exception is the round worked into the ring at the middle:
		// every one of its stitches stands there, so where it stands says
		// nothing about which way it went — those are judged by their heads.
		const foot = stitch.segments[0]?.[0];
		const stands =
			foot === undefined || Math.hypot(foot.x, foot.y) < CENTRE
				? inside(stitch.x, stitch.y, stitch.rowIndex)
				: inside(foot.x, foot.y, stitch.rowIndex);
		if (stands) keptMotifs.add(stitch.stitchId ?? '');
		return stands;
	});

	return {
		items: contents.items.filter((item) => inside(item.x, item.y, item.rowIndex)),
		motifStitches,
		shapingMarks: contents.shapingMarks.filter((mark) => inside(mark.x, mark.y, mark.rowIndex)),
		labels: contents.labels.filter((label) => inside(label.x, label.y)),
		colorMarkers: contents.colorMarkers.filter((marker) => inside(marker.x, marker.y)),
		gridGuide: contents.gridGuide && cropGuide(span, contents.gridGuide),
	};
}

// A guide line is cut to the wedge rather than kept or dropped: it is one line
// running through every round, and only the part of it inside the slice belongs
// to what is drawn.
function cropGuide(span: number, guide: ChartGridGuide): ChartGridGuide {
	return {
		circles: [],
		lines: guide.lines.filter((line) => within(angleOf(line.x1, line.y1), span) && within(angleOf(line.x2, line.y2), span)),
		polylines: guide.polylines?.flatMap((polyline) => runsInside(polyline, span)),
	};
}

function runsInside(polyline: readonly GridPoint[], span: number): GridPoint[][] {
	const runs: GridPoint[][] = [];
	let run: GridPoint[] = [];
	for (const point of polyline) {
		if (within(angleOf(point.x, point.y), span)) {
			run.push(point);
		} else if (run.length > 1) {
			runs.push(run);
			run = [];
		} else {
			run = [];
		}
	}
	if (run.length > 1) runs.push(run);
	return runs;
}

// How far round from the top a point sits, either way, in degrees.
function angleOf(x: number, y: number): number {
	const degrees = (Math.atan2(y, x) * 180) / Math.PI;
	return Math.abs((((degrees - UP) % 360) + 540) % 360 - 180);
}

function within(angle: number, span: number): boolean {
	return angle <= span / 2;
}
