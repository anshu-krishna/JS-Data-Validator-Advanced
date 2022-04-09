import { DataValidator as DV, Parser } from '../src/data-validator.js';
const op = document.querySelector('#op');
const ty_chk = document.querySelector('#ty_chk');
const min_chk = document.querySelector('#min_chk');
const ip = new CodeMirror((elt) => {
	let ip = document.querySelector('#ip');
	document.body.querySelector('main').replaceChild(elt, ip);
	elt.id = 'ip';
}, {
	lineNumbers: true,
	theme: 'material-darker',
	smartInden: true,
	indentWithTabs: true,
	lineWrapping: true
});
function updater() {
	try {
		const txt = ip.getValue().trim();
		if(txt.length === 0) {
			op.innerText = '';
			op.classList.remove('err');
			return;
		}
		const struct = Parser.parse(txt);
		const dv = new DV(struct, ty_chk.value);
		op.innerText = min_chk.value ? JSON.stringify(struct) : JSON.stringify(struct, null, 4);
		op.classList.remove('err');
	} catch (error) {
		op.classList.add('err');
		if(error instanceof Parser.SyntaxError) {
			op.innerText = `ERROR:\nParse Error; Line:${error.location.start.line}; Column:${error.location.start.column}; ${error.message}`;
		} else {
			op.innerText = `ERROR:\n${error.message}`;
		}
	}
}
ty_chk.onchange = updater;
min_chk.onchange = updater;
ip.on('change', updater);