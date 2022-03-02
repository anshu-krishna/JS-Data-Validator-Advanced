export class Ret {
	value;
	valid;
	error;
	constructor(valid, value) {
		this.valid = valid;
		this.value = valid ? value : null;
		this.error = valid ? null : value;
	}
	static Valid(value = null) {
		return new Ret(true, value);
	}
	static Invalid(reason = null) {
		return new Ret(false, reason);
	}
}
function ordinal(n) {
	let s = ["th", "st", "nd", "rd"];
	let v = n%100;
	return n + (s[(v-20)%10] || s[v] || s[0]);
}
// function ordinal(i) {
// 	let j = i % 10, k = i % 100;
// 	if (j === 1 && k !== 11) { return `${i}st`; }
//     if (j === 2 && k !== 12) { return `${i}nd`; }
// 	if (j === 3 && k !== 13) { return `${i}rd`; }
// 	return `${i}th`;
// }

export function checkParameterType(checkList, ...params) {
	for(const [p, val] of Object.entries(params)) {
		if(typeof val !== checkList[p]) {
			return Ret.Invalid(`Expected ${checkList[p]} as ${ordinal(parseInt(p) + 1)} parameter; Received: ${JSON.stringify(val)}`);
		}
	}
	return null;
}
class TypeStore {
	#init = null;
	#store = {
		'@arr@' : {
			rf: {
				slice: function (value, begin = 0, end = null) {
					if(!Array.isArray(value)) {
						return Ret.Invalid(`Expected array; Received: ${JSON.stringify(value)}`);
					}
					end ??= value.length - 1;
					const typeCheck = checkParameterType(['number', 'number'], begin, end);
					if(typeCheck !== null) { return typeCheck; }
					return Ret.Valid(value.slice(begin, end));
				},
				at: function (value, pos = 0) {
					if(!Array.isArray(value)) {
						return Ret.Invalid(`Expected array; Received: ${JSON.stringify(value)}`);
					}
					const typeCheck = checkParameterType(['number'], pos);
					if(typeCheck !== null) { return typeCheck; }

					return Ret.Valid(value.at(pos));
				},
				join: function(value, on = ',') {
					if(!Array.isArray(value)) {
						return Ret.Invalid(`Expected array; Received: ${JSON.stringify(value)}`);
					}
					const typeCheck = checkParameterType(['string'], on);
					if(typeCheck !== null) { return typeCheck; }

					return Ret.Valid(value.join(on));
				}
			}
		},
		'@obj@' : {
			rf: {
				slice: function(value, ...keys) {
					const ret = [];
					for(const k of keys) {
						if(Object.hasOwn(value, k)) {
							ret.push([k, value[k]]);
						}
					}
					switch(keys.length) {
						case 0: return Ret.Valid(null);
						case 1: return (ret.length === 0) ? Ret.Valid(null) : Ret.Valid(ret[0][1]);
						default: return Ret.Valid(Object.fromEntries(ret));
					}
				}
			}
		},
		'@or@': {},
		'null' : {
			//name: 'null',
			parse: function (value) {
				if(value === null) {
					return Ret.Valid(null);
				}
				value = (new String(value)).toLowerCase();
				if(value === '' || value === 'null') {
					return Ret.Valid(null);
				}
				return Ret.Invalid();
			}
		},
		'any' : {
			// name: 'any',
			parse: function (value) {
				return Ret.Valid(value);
			},
			rf: {
				allowed: function(val, ...opts) {
					if(opts.includes(val)) {
						return Ret.Valid(val);
					}
					return Ret.Invalid(`Value ${JSON.stringify(val)} not allowed`);
				},
				toString: function(value) {
					switch(typeof value) {
						case "object":
							return value === null ? 'null' : Ret.Valid(JSON.stringify(value));
						case "undefined":
							return Ret.Valid('');
						case "boolean":
						case "string":
						case "bigint":
						case "number":
							return Ret.Valid((new String(value)).valueOf());
						case "function":
						case "symbol":
						default:
							return Ret.Invalid(`Cannot convert ${JSON.stringify(value)} to string`);
					}
				},
				__native__: function(value, fn, ...args) {
					const checkType = checkParameterType(['string', fn]);
					if(checkType !== null) { return checkType; }
					const toCall = value[fn] ?? null;
					if(typeof toCall !== 'function') {
						return Ret.Invalid(`There is no native function '${fn}' for type '${Object.prototype.toString.call(value)}'`);
					}
					try {
						const res = toCall.call(value, ...args);
						return Ret.Valid(res);
					} catch (error) {
						return Ret.Invalid(error.message);
					}
				}
			}
		},
		'string' : {
			// name: 'string',
			parse: function(value) {
				switch(typeof value) {
					case "object":
						return value === null ? 'null' : Ret.Valid(JSON.stringify(value));
					case "undefined":
						return Ret.Valid('');
					case "boolean":
					case "string":
					case "bigint":
					case "number":
						return Ret.Valid((new String(value)).valueOf());
					case "function":
					case "symbol":
					default:
						return Ret.Invalid();
				}
			},
			rf: {
				split: function(val, on = ' ') {
					if(typeof val === 'string') {
						return Ret.Valid(val.split(on));
					}
					return Ret.Invalid(`Expected string; Received: ${JSON.stringify(val)}`);
				},
				lower: function(val) {
					if(typeof val === 'string') {
						return Ret.Valid(val.toLowerCase());
					}
					return Ret.Invalid(`Expected string; Received: ${JSON.stringify(val)}`);
				},
				upper: function(val) {
					if(typeof val === 'string') {
						return Ret.Valid(val.toUpperCase());
					}
					return Ret.Invalid(`Expected string; Received: ${JSON.stringify(val)}`);
				},
				title: function(val) {
					if(typeof val === 'string') {
						return Ret.Valid(val.replace(/\w\S*/g, txt => `${txt.charAt(0).toUpperCase()}${txt.substring(1).toLowerCase()}`));
					}
					return Ret.Invalid(`Expected string; Received: ${JSON.stringify(val)}`);
				},
				slice: function (value, begin = 0, end = null) {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					end ??= value.length - 1;
					const typeCheck = checkParameterType(['number', 'number'], begin, end);
					if(typeCheck !== null) { return typeCheck; }
					return Ret.Valid(value.slice(begin, end));
				},
				padStart: function (value, maxLength, padWith = ' ') {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					const typeCheck = checkParameterType(['number', 'string'], maxLength, padWith);
					if(typeCheck !== null) { return typeCheck; }
					
					return Ret.Valid(value.padStart(maxLength, padWith));
				},
				padEnd: function (value, maxLength, padWith = ' ') {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					const typeCheck = checkParameterType(['number', 'string'], maxLength, padWith);
					if(typeCheck !== null) { return typeCheck; }

					return Ret.Valid(value.padEnd(maxLength, padWith));
				},
				replace: function (value, search, replaceWith) {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					const typeCheck = checkParameterType(['string', 'string'], search, replaceWith);
					if(typeCheck !== null) { return typeCheck; }

					return Ret.Valid(value.replaceAll(search, replaceWith));
				},
				trim: function (value) {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					return Ret.Valid(value.trim());
				},
				trimStart: function (value) {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					return Ret.Valid(value.trimStart());
				},
				trimEnd: function (value, maxLength, padWith = ' ') {
					if(typeof value !== 'string') {
						return Ret.Invalid(`Expected string; Received: ${JSON.stringify(value)}`);
					}
					return Ret.Valid(value.trimEnd());
				},
			}
		},
		'float' : {
			// name: 'float',
			parse: function(value) {
				switch(typeof value) {
					// case "bigint":
					// 	return Ret.Valid(value);
					case "boolean":
						return Ret.Valid(value ? 1 : 0);
					case "object":
						value = String(value);
					case "string":
						if(value.match(/[\n\r\s]+/)) {
							value = NaN;
						} else {
							value = (Number(value)).valueOf();
						}
					case "number":
						if(!Number.isNaN(value)) {
							return Ret.Valid(value);
						}
						break;
					case "function":
					case "symbol":
					case "undefined":
					default:
						break;
				}
				return Ret.Invalid();
			}
		},
		'bool': {
			parse: function(value) {
				return Ret.Valid(Boolean(value).valueOf());
			}
		},
	}
	constructor() {
		this.addType({
			type: 'int',
			// name: 'int',
			parse: (val) => {
				const {valid, value} = this.parse('float', val);
				if(valid && Number.isInteger(value)) {
					return Ret.Valid(value);
				}
				return Ret.Invalid();
			}
		});
		this.addType({
			type: 'unsigned',
			// name: 'unsigned',
			parse: (val) => {
				const {valid, value} = this.parse('int', val);
				if(valid && value >= 0) {
					return Ret.Valid(value);
				}
				return Ret.Invalid();
			}
		});
		this.addType({
			type: 'num',
			parse: (value) => {
				return this.parse('float', value);
			}
		},);
		this.addType({
			type: 'email',
			name: 'email(string)',
			parse: (val) => {
				const {valid, value} = this.parse('string', val);
				if(!valid) {
					return Ret.Invalid();
				}
				const node = document?.createElement('input');
				if(node !== null) {
					node.type = 'email';
					node.value = value;
					return node.checkValidity() ? Ret.Valid(value) : Ret.Invalid();
				} else {
					return (/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(value)) ? Ret.Valid(value) : Ret.Invalid();
				}
			}
		});
		this.addType({
			type: 'hex',
			name: 'hex(string)',
			parse: (val) => {
				const {valid, value} = this.parse('string', val);
				if(!valid) {
					return Ret.Invalid();
				}
				return /^[0-9a-f]+$/i.test(value) ? Ret.Valid(Number(value).valueOf()) : Ret.Invalid();
			}
		});
		this.addType({
			type: 'timestamp',
			name: 'timestamp(string)',
			parse: (input) =>{
				const {valid, value} = this.parse('string', input);
				if(!valid) {
					return Ret.Invalid();
				}
				let val = (new Date(value)).valueOf();
				if(val === NaN) {
					val = Date.parse(value)
				}
				return val === NaN ? Ret.Invalid() : Ret.Valid(val);
			}
		});
		this.addType({
			type: 'url',
			name: 'url(string)',
			parse: (input) => {
				const {valid, value} = this.parse('string', input);
				if(!valid) {
					return Ret.Invalid();
				}
				try {
					return Ret.Valid((new URL(value)).valueOf());
				} catch (error) {
					return Ret.Invalid();
				}
			}
		});
		this.addType({
			type: 'json',
			name: 'json(string)',
			parse: (input) => {
				const {valid, value} = this.parse('string', input);
				if(!valid) {
					return Ret.Invalid();
				}
				try {
					return Ret.Valid(JSON.parse(value));
				} catch (error) {
					return Ret.Invalid();
				}
			}
		});
		this.addType({
			type: 'base64',
			name: 'base64(string)',
			parse: (input) => {
				const {valid, value} = this.parse('string', input);
				if(!valid) {
					return Ret.Invalid();
				}
				try {
					return Ret.Valid(atob(value.replace(/-/g, '+').replace(/_/g, '/')));
				} catch (error) {
					return Ret.Invalid();
				}
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'range',
			fn: function (value, min = null, max = null) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				if(min !== null && typeof min !== 'number') {
					return Ret.Invalid(`Expected number as 1st parameter; Received: ${JSON.stringify(min)}`);
				}
				if(max !== null && typeof max !== 'number') {
					return Ret.Invalid(`Expected number as 2nd parameter; Received: ${JSON.stringify(max)}`);
				}
				if(
					(min !== null && value < min)
					|| (max !== null && value > max)
				) {
					return Ret.Invalid(`Expected range [${min ?? 'null'}, ${max ?? 'null'}]; Received: ${JSON.stringify(value)}`);
				}
				return Ret.Valid(value);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'add',
			fn: function(value, secondNumber = 0) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				
				return Ret.Valid(value + secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'sub',
			fn: function(value, secondNumber = 0) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				
				return Ret.Valid(value - secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'mul',
			fn: function(value, secondNumber = 1) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				
				return Ret.Valid(value * secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'div',
			fn: function(value, secondNumber = 0) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				if(secondNumber === 0) {
					return Ret.Invalid('Cannot divide by zero');
				}
				return Ret.Valid(value / secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'mod',
			fn: function(value, secondNumber = 0) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				if(secondNumber === 0) {
					return Ret.Invalid('Cannot mod by zero');
				}
				return Ret.Valid(value % secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'exp',
			fn: function(value, secondNumber = 0) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', secondNumber]);
				if(checkType !== null) { return checkType; }
				
				return Ret.Valid(value ** secondNumber);
			}
		});
		this.addRF({
			types: ['float', 'num', 'int', 'unsigned'],
			rfName: 'round',
			fn: function(value, size = 2) {
				if(typeof value !== 'number') {
					return Ret.Invalid(`Expected number; Received: ${JSON.stringify(value)}`);
				}
				const checkType = checkParameterType(['number', size]);
				if(checkType !== null) { return checkType; }
				
				return Ret.Valid(Number(value.toFixed(size)));
			}
		});
		this.reInit();
	}
	addType({type, name = null, parse, rf = null} = {}) {
		if(
			typeof type !== 'string'
			|| (name !== null) && typeof name !== 'string'
			|| typeof parse !== 'function'
			|| typeof rf !== 'object'
		) {
			throw new Error(`Invalid values in addType`);
		}
		this.#store[type] = {
			parse: parse
		};
		if(name !== null) {
			this.#store[type].name = name;
		}
		if(rf !== null) {
			this.#store[type].rf = rf;
		}
	}
	addRF({types, rfName, fn} = {}) {
		if(!Array.isArray(types)) {
			types = [types];
		}
		for(const t of types) {
			if(typeof t !== 'string') {
				throw new Error(`Invalid types in addRF`);
			}
		}
		if(typeof rfName !== 'string' || typeof fn !== 'function') {
			throw new Error(`Invalid RF/Fn in addRF`);
		}
		for(const t of types) {
			if(typeof this.#store[t] !== 'object') {
				throw new Error(`Type '${t}' does not exist`);
			}
			if(typeof this.#store[t].rf !== 'object') {
				this.#store[t].rf = {};
			}
			this.#store[t].rf[rfName] = fn;
		}
	}
	contains(ty) {
		return this.#init.types.includes(ty);
	}
	containsRF(ty, rf, checkType = true) {
		if(checkType && !this.contains(ty)) { return false; }
		if(this.#init.rf.includes(`${ty}.${rf}`)) {
			return true;
		}
		return this.#init.rf.includes(`any.${rf}`);
	}
	reInit() {
		this.#init = {
			types: Object.keys(this.#store),
			rf: Object.entries(this.#store).map(v => {
				const [key, {rf = {}}] = v;
				return Object.keys(rf).map(k => `${key}.${k}`)
			}).flat(1)
		};
		// console.log(`\tTypes Info:`, this.#init);
	}
	getType(ty, checkExistance = true) {
		if(checkExistance && !this.contains(ty)) { return null; }
		return this.#store[ty];
	}
	getRF(ty, rf, checkExistance = true) {
		if(checkExistance && !this.containsRF(ty, rf)) { return null; }
		if(Object.hasOwn(this.#store[ty].rf?? {}, rf)) {
			return this.#store[ty].rf[rf];
		}
		return this.#store.any.rf[rf];
	}
	getName(ty) {
		switch(ty) {
			case '@arr@': return 'array';
			case '@obj@': return 'object';
			case '@or@': return 'multi-type';
			default: return Types.getType(ty)?.name ?? ty;
		}
	}
	parse(ty, value) {
		ty = this.getType(ty);
		if(ty === null) {
			return Ret.Invalid(`Unknown type: '${ty}'`);
		}
		return ty.parse(value);
	}
}
export const Types = new TypeStore();