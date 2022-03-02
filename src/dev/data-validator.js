import { Parser } from './parser [min-json]/data-validator [min json] parser.js';
import { Ret, Types } from './data-types.js';

export function logErrorTrace(...data) {
	let trace = (new Error).stack.split('\n');
	trace.shift();
	// console.error(...data, ...trace.map(v => `\n${v}`));
}

function isObject(obj) {
	return (obj !== null && typeof obj === 'object');
}

export class DataValidator {
	static New(strs, ...exps) {
		function expToString(exp) {
			switch (typeof exp) {
				case 'object':
					return JSON.stringify(exp);
					break;
				case 'function': 
					return expToString(exp());
				default:
					return String(exp);
			}
		}
		const struct = [];
		for(let i = 0, l = strs.length - 1; i < l; i++) {
			struct.push(strs[i]);
			struct.push(expToString(exps[i]));
		}
		struct.push(strs[strs.length - 1]);
		try {
			return new DataValidator(Parser.parse(struct.join('')));
		} catch (err) {
			if(err instanceof Parser.SyntaxError) {
				throw new Error(`Parse Error; Line:${err.location.start.line}; Column:${err.location.start.column}; ${err.message}`);
			} else {
				throw new Error(err.message);
			}
		}
	}
	static #checkStruct(struct) {
		// console.log('Checking\n\tstruct', struct);
		if(!isObject(struct)) {
			return Ret.Invalid('Not an object');
		}
		const {ty = null, rf = [], nxt = null} = struct;

		// console.log('\tty:', ty, 'rf:', rf, 'nxt:', nxt);

		switch(ty) {
			case null:
				return Ret.Invalid('Type missing');
			case '@arr@':
				{
						const list = struct.list ?? [];
					for(const [idx, item] of Object.entries(list)) {
						const iTest = DataValidator.#checkStruct(item);
						if(!iTest.valid) {
							iTest.error = `[${idx}]: ${iTest.error}`;
							return iTest;
						}
					}
				}
				break;
			case '@obj@':
				{
					const list = struct.list ?? {};
					for(const [idx, item] of Object.entries(list)) {
						const iTest = DataValidator.#checkStruct(item);
						if(!iTest.valid) {
							iTest.error = `{${idx}}: ${iTest.error}`;
							return iTest;
						}
					}
				}
				break;
			case '@or@':
				{
					const opts = struct.opts ?? {};
					for(const [idx, item] of Object.entries(opts)) {
						const iTest = DataValidator.#checkStruct(item);
						if(!iTest.valid) {
							iTest.error = `{multi-type}: ${iTest.error}`;
							return iTest;
						}
					}
				}
				break;
			default:
				{
					if(!Types.contains(ty)) {
						return Ret.Invalid(`Unknown type: '${ty}'`);
					}
				}
				break;
		}
		for(const r of rf) {
			const fn = r.fn ?? 'undefined';
			if(!Types.containsRF(ty, fn)) {
				return Ret.Invalid(`Unknown formatter: '${ty}.${fn}'`);
			}
		}
		if(nxt !== null) {
			const nxtTest = DataValidator.#checkStruct(nxt);
			if(!nxtTest.valid) {
				nxtTest.error = `${Types.getName(ty)} => \n\t${nxtTest.error.replaceAll('\n', '\n\t')}`;
				return nxtTest;
			}
		}
		return Ret.Valid();
	}
	#struct;
	constructor(struct) {
		const test = DataValidator.#checkStruct(struct);
		// console.log('Error:', test.error);
		if(test.error !== null) {
			throw new Error(`TypeError: ${test.error}`);
		}
		this.#struct = struct;
	}
	validate(value) {
		return DataValidator.#validate(value, this.#struct);
	}
	static #arrayListMaker(list) {
		list.idx = -1;
		list.len = list.length - 1;
		list.more = 0;
		list.next = function(lastError = false) {
			// console.log('\t\tnext called; idx:', this.idx, '; len:', this.len, '; more:', this.more, '; fail:', lastError);
			if(this.more === 0) {
				this.idx++;
				this.more = 'reset';
				if(this.idx > this.len) {
					return 'error';
				}
				return this.next();
			}
			if(this.more === 'reset') {
				this.more = this[this.idx].more ?? 1;
				return this.next(lastError);
			}
			if(this.more === 'many') {
				if(lastError) {
					if(this.idx === this.len) {
						return 'error';
					}
					this.more = 0;
					return this.next(lastError);
				} else {
					return this[this.idx];
				}
			}
			this.more--;
			return this[this.idx];
		};
	}
	static #validate(value, struct) {
		// console.log('Vaidating; \n\tstruct:', struct, '\n\tvalue:', value);
		const {ty = null, rf = [], nxt = null} = struct;

		// console.log('\tty:', ty, 'rf:', rf, 'nxt:', nxt);
		switch(ty) {
			case '@arr@':
				{
					if(!Array.isArray(value)) {
						return Ret.Invalid(`Expected array; Received ${JSON.stringify(value)};`)
					}
					const ret = [];
					const list = struct.list ?? [];
					DataValidator.#arrayListMaker(list);
					let nxtTy = list.next();
					const entries = Object.entries(value);
					for(let e = 0, eout = entries.length; e < eout; e++) {
						const [idx, item] = entries[e];
						if(nxtTy === 'error') {
							return Ret.Invalid(`[${idx}] Index out of bounds`);
						}
						let t = DataValidator.#validate(item, nxtTy);
						if(!t.valid) {
							if(list.more === 'many' && list.idx !== list.len) {
								nxtTy = list.next(true);
								e--;
								continue;							
							} else {
								return Ret.Invalid(`[${idx}]: ${t.error}`);
							}
						}
						// ret[idx] = t.value; // Allows empty slots in array
						ret.push(t.value);
						nxtTy = list.next();
					}
					value = ret;
				}
				break;
			case '@obj@':
				{
					if(!isObject(value)) {
						return Ret.Invalid(`Expected object; Received ${JSON.stringify(value)};`)
					}
					const list = struct.list ?? {};
					const keys = Object.keys(list);
					{
						const missingKeys = ((req, vk) => {
							const m = [];
							for(const r of req) {
								if(!vk.includes(r)) {
									m.push(`{${r}}`);
								}
							}
							return m;
						})(keys.filter(k => !list[k].opt), Object.keys(value));
						if(missingKeys.length !== 0) {
							return Ret.Invalid(`Missing object key(s): ${missingKeys.join(', ')}; Received ${JSON.stringify(value)};`)
						}
					}
					const keep_extra = struct.keep_extra ?? false;
					const ret = {};
					for(const [k, item] of Object.entries(value)) {
						if(keys.includes(k)) {
							const t = DataValidator.#validate(item, list[k]);
							if(!t.valid) {
								return Ret.Invalid(`{${k}}: ${t.error}`);
							}
							ret[k] = t.value;
						} else if(keep_extra) {
							ret[k] = item;
						}
					}
					value = ret;
				}
				break;
			case '@or@':
				{
					const opts = struct.opts ?? [];
					let t = null;
					for(const o of opts) {
						t = DataValidator.#validate(value, o);
						if(t.valid) {
							break;
						}
					}
					if(t === null || !t.valid) {
						return Ret.Invalid(`Expected type(s): (${opts.map(o => o.ty ?? 'undefined').join('|')}); Received: ${JSON.stringify(value)};`);
					}
					value = t.value;
				}
				break;
			default:
				{
					let t = Types.parse(ty, value);
					if(!t.valid) {
						return Ret.Invalid(`Expected type: ${Types.getName(ty)}; Received: ${JSON.stringify(value)};`);
					}
					value = t.value;
				}
				break;
		}
		for(const r of rf) {
			let {fn = 'undefined', args = []} = r;
			// console.log('\n\t\tFormatter:', fn, '; args:', args, ';\n\t\tpre-value:', value);
			let t = (Types.getRF(ty, fn, false))(value, ...args);
			if(!t.valid) {
				t.error ??= `Cannot convert ${JSON.stringify(value)};`;
				return Ret.Invalid(`Formatter '${Types.getName(ty)}.${fn}' error: ${t.error}`);
			}
			value = t.value;
			// console.log('\n\t\tpost-value:', value);
		}
		if(nxt !== null) {
			const nxtTest = DataValidator.#validate(value, nxt);
			if(!nxtTest.valid) {
				nxtTest.error = `${Types.getName(ty)} => \n\t${nxtTest.error.replaceAll('\n', '\n\t')}`;
				return nxtTest;
			}
			value = nxtTest.value;
		}
		return Ret.Valid(value);
	}
}