type DomOptionValue = string | readonly string[];

interface TestDomOptions {
	readonly cls?: DomOptionValue;
	readonly text?: string;
}

type ElementOptions = string | TestDomOptions;

function applyOptions(element: HTMLElement, options?: ElementOptions): void {
	if (options === undefined) return;
	if (typeof options === 'string') {
		element.addClass(options);
		return;
	}
	if (options.cls !== undefined) {
		const classes = typeof options.cls === 'string' ? [options.cls] : options.cls;
		element.addClasses([...classes]);
	}
	if (options.text !== undefined) {
		element.textContent = options.text;
	}
}

Object.defineProperty(HTMLElement.prototype, 'addClass', {
	value: function addClass(this: HTMLElement, cls: string): void {
		this.classList.add(cls);
	},
});

Object.defineProperty(HTMLElement.prototype, 'addClasses', {
	value: function addClasses(this: HTMLElement, classes: readonly string[]): void {
		for (const cls of classes) this.classList.add(cls);
	},
});

Object.defineProperty(HTMLElement.prototype, 'empty', {
	value: function empty(this: HTMLElement): void {
		this.replaceChildren();
	},
});

Object.defineProperty(HTMLElement.prototype, 'createDiv', {
	value: function createDiv(
		this: HTMLElement,
		options?: ElementOptions,
	): HTMLDivElement {
		const element = this.ownerDocument.createElement('div');
		applyOptions(element, options);
		this.appendChild(element);
		return element;
	},
});

Object.defineProperty(HTMLElement.prototype, 'createSpan', {
	value: function createSpan(
		this: HTMLElement,
		options?: ElementOptions,
	): HTMLSpanElement {
		const element = this.ownerDocument.createElement('span');
		applyOptions(element, options);
		this.appendChild(element);
		return element;
	},
});

Object.defineProperty(HTMLElement.prototype, 'createEl', {
	value: function createEl<K extends keyof HTMLElementTagNameMap>(
		this: HTMLElement,
		tagName: K,
		options?: ElementOptions,
	): HTMLElementTagNameMap[K] {
		const element = this.ownerDocument.createElement(tagName);
		applyOptions(element, options);
		this.appendChild(element);
		return element;
	},
});
