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
ip.setValue(`string.split('.') => [ /* Split into three parts; */
	base64 => json => { /* Convert from base64; Parse JSON; */
		alg: string.allowed('HS256', 'HS512'), /* Test for supported algo type */
		typ: string.allowed('JWT'),
	},
	base64 => json => { /* Convert from base64; Parse JSON; */
		?exp: unsigned, /* Optional exp */
		?iat: unsigned, /* Optional iat */
		?nbf: unsigned, /* Optional nbf */
		?name: ([..2..string,].join(' ')|string), /* Name can be:
			an array with first-name and last-name
			OR
			a string containing the full-name
		*/
		?city(='Somewhere'): string,
		...
	},
	base64 /* Convert from base64; */
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
const indentwith = '\t';
function php_stringify(struct, indent = null) {
	if(Array.isArray(struct)) {
		if(indent === null) {
			return `[${struct.map(v => php_stringify(v)).join(',')}]`;
		} else {
			const indent2 = `${indent ?? ''}${indentwith}`;
			return `[\n${struct.map(v => `${indent2}${php_stringify(v, indent2)}`).join(',\n')}\n${indent}]`;
		}
	} else if(typeof struct === 'object' && struct !== null) {
		if(indent === null) {
			return `[${Object.entries(struct).map(([k, v]) => `${JSON.stringify(k)}=>${php_stringify(v)}`).join(',')}]`;
		} else {
			const indent2 = `${indent ?? ''}${indentwith}`;
			return `[\n${Object.entries(struct).map(([k, v]) => `${indent2}${JSON.stringify(k)} => ${php_stringify(v, indent2)}`).join(',\n')}\n${indent}]`;
		}
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
			op.setValue(php_stringify(struct, min_chk.value ? null : ''));
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
php_chk.onchange = _ => {
	ty_chk.disabled = php_chk.value;
	updater();
};

ip.on('change', updater);
const [copyDefine, copyResult] = document.querySelectorAll('span.copy');
copyDefine.addEventListener('click', _ => {
	navigator.clipboard.writeText(ip.getValue().trim());
});
copyResult.addEventListener('click', _ => {
	navigator.clipboard.writeText(op.getValue().trim());
});