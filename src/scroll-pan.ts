// Wraps a rendered chart/grid SVG in a scrollable, mouse-drag-to-pan viewport
// so large charts (many rounds or rows) stay at their real, configured size
// instead of being squeezed down by max-width to fit the note pane.
export function wrapScrollable(el: HTMLElement, svg: SVGSVGElement): void {
	const doc = el.ownerDocument;
	const wrapper = doc.createElement('div');
	wrapper.classList.add('crochet-weaver-canvas');
	wrapper.appendChild(svg);
	el.appendChild(wrapper);
	centerIfOverflowing(wrapper);

	let dragging = false;
	let startX = 0;
	let startY = 0;
	let startLeft = 0;
	let startTop = 0;

	wrapper.addEventListener('pointerdown', (event) => {
		// Touch/pen already get panning from native scroll; only mouse needs
		// click-and-drag since it has no scroll gesture of its own.
		if (event.pointerType !== 'mouse' || event.button !== 0) return;
		dragging = true;
		startX = event.clientX;
		startY = event.clientY;
		startLeft = wrapper.scrollLeft;
		startTop = wrapper.scrollTop;
		wrapper.classList.add('is-dragging');
		wrapper.setPointerCapture(event.pointerId);
	});
	wrapper.addEventListener('pointermove', (event) => {
		if (!dragging) return;
		wrapper.scrollLeft = startLeft - (event.clientX - startX);
		wrapper.scrollTop = startTop - (event.clientY - startY);
	});
	const endDrag = () => {
		dragging = false;
		wrapper.classList.remove('is-dragging');
	};
	wrapper.addEventListener('pointerup', endDrag);
	wrapper.addEventListener('pointercancel', endDrag);
}

// Opens on the chart's middle instead of its top-left corner whenever it's
// bigger than its viewport, since that's usually the most useful starting
// point (e.g. a round chart's center) — waits a frame so the wrapper has a
// real, laid-out size to measure before reading scrollWidth/clientWidth.
function centerIfOverflowing(wrapper: HTMLElement): void {
	const view = wrapper.ownerDocument.defaultView;
	const schedule = view?.requestAnimationFrame?.bind(view) ?? view?.setTimeout.bind(view) ?? (() => {});
	schedule(() => {
		if (wrapper.scrollWidth > wrapper.clientWidth) {
			wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
		}
		if (wrapper.scrollHeight > wrapper.clientHeight) {
			wrapper.scrollTop = (wrapper.scrollHeight - wrapper.clientHeight) / 2;
		}
	});
}
