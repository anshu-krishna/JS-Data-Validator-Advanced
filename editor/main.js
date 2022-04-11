import { DataValidator as DV, Parser } from '../src/data-validator.js';
const ty_chk = document.querySelector('#ty_chk');
const min_chk = document.querySelector('#min_chk');
const php_chk = document.querySelector('#php_chk');

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
ip.setValue(`string.split('.') => [
	base64 => json => {
		alg: string._allowed('HS256', 'HS512'),
		typ: string._allowed('JWT'),
	},
	base64 => json => {
		exp: unsigned,
		iat: unsigned,
		nbf: unsigned,
		?name: ([..2..string,].join(' ')|string),
		?city(='Somewhere'): string,
		?vals: [...int],
		...
	},
	base64
]`);
const op = new CodeMirror((elt) => {
	let op = document.querySelector('#op');
	document.body.querySelector('main').replaceChild(elt, op);
	elt.id = 'op';
}, {
	lineNumbers: true,
	theme: 'material-darker',
	smartInden: true,
	indentWithTabs: true,
	lineWrapping: true,
	readOnly: true
});
function php_stringify(struct) {
	if(Array.isArray(struct)) {
		return `[${struct.map(v => php_stringify(v)).join(',')}]`;
	} else if(typeof struct === 'object' && struct !== null) {
		return `[${Object.entries(struct).map(([k, v]) => `${JSON.stringify(k)}=>${php_stringify(v)}`).join(',')}]`;
	} else {
		return JSON.stringify(struct);
	}
}
function updater() {
	const opnode = document.querySelector('#op');
	try {
		const txt = ip.getValue().trim();
		if(txt.length === 0) {
			op.setValue('');
			opnode.classList.remove('err');
			return;
		}
		const struct = Parser.parse(txt);
		const dv = new DV(struct, ty_chk.value);
		if(php_chk.value) {
			op.setValue(php_stringify(struct, min_chk.value));
		} else {
			op.setValue(min_chk.value ? JSON.stringify(struct) : JSON.stringify(struct, null, 4));
		}
		opnode.classList.remove('err');
	} catch (error) {
		opnode.classList.add('err');
		if(error instanceof Parser.SyntaxError) {
			op.setValue(`/*****\nERROR:\nParse Error; Line:${error.location.start.line}; Column:${error.location.start.column}; ${error.message}\n*****/`);
		} else {
			op.setValue(`/*****\nERROR:\n${error.message}\n*****/`);
		}
	}
}
ty_chk.onchange = updater;
min_chk.onchange = updater;
php_chk.addEventListener('change', _ => {
	min_chk.disabled = php_chk.value;
	updater();
});

ip.on('change', updater);
const [copyDefine, copyResult] = document.querySelectorAll('span.copy');
copyDefine.addEventListener('click', _ => {
	navigator.clipboard.writeText(ip.getValue().trim());
});
copyResult.addEventListener('click', _ => {
	navigator.clipboard.writeText(op.getValue().trim());
});