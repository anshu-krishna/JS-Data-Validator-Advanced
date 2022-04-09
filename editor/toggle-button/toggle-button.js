class ToggleButton extends HTMLElement {
	static _meta = {
		tag: 'toggle-button',
		template: document.createElement('template')
	};
	#root;
	// #first = true;

	constructor() {
		super();
		this.#root = this.attachShadow({mode: 'closed'});
		this.#root.appendChild(ToggleButton._meta.template.content.cloneNode(true));
		this.addEventListener('click', _ => {
			if(this.hasAttribute('checked')) { this.removeAttribute('checked'); }
			else { this.setAttribute('checked', 'checked'); }
		});
	}
	get value() {
		return this.hasAttribute('checked');
	}
	// connectedCallback() {}
	// disconnectedCallback() {}
	// adoptedCallback() {}

	static get observedAttributes() {
		return ['checked'];
	}
	attributeChangedCallback(attrName, oldVal, newVal) {
		// if(this.#first) {
		// 	this.#first = false;
		// 	return;
		// }
		switch(attrName) {
			case 'checked':
				this.dispatchEvent(new Event('change'));
				break;
		}
	}
}
ToggleButton._meta.template.innerHTML = await fetch(String(new URL(import.meta.url + '/../toggle-button.html'))).then(html => html.text());
Object.freeze(ToggleButton);
customElements.define(ToggleButton._meta.tag, ToggleButton);