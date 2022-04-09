import { DataValidator as DV } from '../src/data-validator.js';
const op = document.querySelector('#op');
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
ip.on('change', () => {
	try {
		const dv = DV.New`${ip.getValue()}`;
		op.innerText = JSON.stringify(dv.struct, null, 4);
		op.classList.remove('err');
	} catch (error) {
		op.classList.add('err');
		op.innerText = `ERROR:\n${error.message}`;
	}
});