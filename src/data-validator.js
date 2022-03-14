/*************************
 * Other Functions / Classes
 *************************/
function isObject(obj) {
	return (obj !== null && typeof obj === 'object');
}
// function ordinal(n) {
// 	let s = ["th", "st", "nd", "rd"];
// 	let v = n%100;
// 	return n + (s[(v-20)%10] || s[v] || s[0]);
// }
// function ordinal(i) {
// 	let j = i % 10, k = i % 100;
// 	if (j === 1 && k !== 11) { return `${i}st`; }
//     if (j === 2 && k !== 12) { return `${i}nd`; }
// 	if (j === 3 && k !== 13) { return `${i}rd`; }
// 	return `${i}th`;
// }
export class Ret {
	value; valid; error;
	constructor(valid, value) {
		valid = !! valid;
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
/*************************
 * Parser
 *************************/
 const Parser = (function () {
	"use strict";

	function peg_subclass(child, parent) {
		function ctor() { this.constructor = child; }
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();
	}

	function peg_SyntaxError(message, expected, found, location) {
		this.message = message;
		this.expected = expected;
		this.found = found;
		this.location = location;
		this.name = "SyntaxError";

		if (typeof Error.captureStackTrace === "function") {
			Error.captureStackTrace(this, peg_SyntaxError);
		}
	}

	peg_subclass(peg_SyntaxError, Error);

	peg_SyntaxError.buildMessage = function (expected, found) {
		let DESCRIBE_EXPECTATION_FNS = {
			literal: function (expectation) {
				return "\"" + literalEscape(expectation.text) + "\"";
			},

			"class": function (expectation) {
				let escapedParts = "",
					i;

				for (i = 0; i < expectation.parts.length; i++) {
					escapedParts += expectation.parts[i] instanceof Array
						? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
						: classEscape(expectation.parts[i]);
				}

				return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
			},

			any: function (expectation) {
				return "any character";
			},

			end: function (expectation) {
				return "end of input";
			},

			other: function (expectation) {
				return expectation.description;
			}
		};

		function hex(ch) {
			return ch.charCodeAt(0).toString(16).toUpperCase();
		}

		function literalEscape(s) {
			return s
				.replace(/\\/g, '\\\\')
				.replace(/"/g, '\\"')
				.replace(/\0/g, '\\0')
				.replace(/\t/g, '\\t')
				.replace(/\n/g, '\\n')
				.replace(/\r/g, '\\r')
				.replace(/[\x00-\x0F]/g, function (ch) { return '\\x0' + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return '\\x' + hex(ch); });
		}

		function classEscape(s) {
			return s
				.replace(/\\/g, '\\\\')
				.replace(/\]/g, '\\]')
				.replace(/\^/g, '\\^')
				.replace(/-/g, '\\-')
				.replace(/\0/g, '\\0')
				.replace(/\t/g, '\\t')
				.replace(/\n/g, '\\n')
				.replace(/\r/g, '\\r')
				.replace(/[\x00-\x0F]/g, function (ch) { return '\\x0' + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return '\\x' + hex(ch); });
		}

		function describeExpectation(expectation) {
			return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
		}

		function describeExpected(expected) {
			let descriptions = new Array(expected.length),
				i, j;

			for (i = 0; i < expected.length; i++) {
				descriptions[i] = describeExpectation(expected[i]);
			}

			descriptions.sort();

			if (descriptions.length > 0) {
				for (i = 1, j = 1; i < descriptions.length; i++) {
					if (descriptions[i - 1] !== descriptions[i]) {
						descriptions[j] = descriptions[i];
						j++;
					}
				}
				descriptions.length = j;
			}

			switch (descriptions.length) {
				case 1:
					return descriptions[0];

				case 2:
					return descriptions[0] + " or " + descriptions[1];

				default:
					return descriptions.slice(0, -1).join(", ")
						+ ", or "
						+ descriptions[descriptions.length - 1];
			}
		}

		function describeFound(found) {
			return found ? "\"" + literalEscape(found) + "\"" : "end of input";
		}

		return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	};

	function peg_parse(input, options) {
		options = options !== void 0 ? options : {};

		let peg_FAILED = {},

			peg_startRuleFunctions = { Format: peg_parseFormat },
			peg_startRuleFunction = peg_parseFormat,

			peg_c0 = "=>",
			peg_c1 = peg_literalExpectation("=>", false),
			peg_c2 = function (head, v) { return v; },
			peg_c3 = function (head, tail) {
				let chain = [head, ...tail];
				while (chain.length > 1) {
					const last = chain.pop();
					chain[chain.length - 1].nx = last;
				}
				return chain[0];
			},
			peg_c4 = "|",
			peg_c5 = peg_literalExpectation("|", false),
			peg_c6 = function (head, v) { return v; },
			peg_c7 = function (head, tail, fn) {
				const ls = [head, ...tail];
				if (ls.length === 1) {
					let fnList = [...ls[0]?.fn ?? [], ...(fn ?? [])];
					if (fnList.length === 0) { fnList = null; }
					return type_maker({ ...ls[0], fn: fnList });
				}
				return type_maker({ ty: "@or@", ls: ls, fn: fn });
			},
			peg_c8 = function (head, tail) { return [head, ...tail]; },
			peg_c9 = function (list, fn) { return type_maker({ ty: "@arr@", ls: list ?? [], fn: fn }); },
			peg_c10 = function (head, tail) { return Object.fromEntries([head, ...tail]); },
			peg_c11 = "...",
			peg_c12 = peg_literalExpectation("...", false),
			peg_c13 = function (list, keep, fn) {
				const ret = type_maker({ ty: "@obj@", ls: list, fn: fn });
				if (keep ?? false) { ret.kp = true; }
				return ret;
			},
			peg_c14 = function (ty, fn) {
				return type_maker({ ty: ty, fn: fn });
			},
			peg_c15 = peg_otherExpectation("identifier:data-type pair"),
			peg_c16 = "?",
			peg_c17 = peg_literalExpectation("?", false),
			peg_c18 = "=",
			peg_c19 = peg_literalExpectation("=", false),
			peg_c20 = function (opt, name, v) { return { val: v }; },
			peg_c21 = function (opt, name, def, value) {
				if (opt === null) { value.rq = true; }
				if (def !== null) { value.def = def.val; }
				return [name, value];
			},
			peg_c22 = function (repeat, format) {
				if (repeat) { format.rpt = repeat; }
				return format;
			},
			peg_c23 = peg_otherExpectation("repeat-count"),
			peg_c24 = "..",
			peg_c25 = peg_literalExpectation("..", false),
			peg_c26 = function (count) { return parseFloat(count); },
			peg_c27 = function () { return 'yes'; },
			peg_c28 = peg_otherExpectation("function-list"),
			peg_c29 = function (head, tail) { return [head, ...tail]; },
			peg_c30 = peg_otherExpectation("function"),
			peg_c31 = ".",
			peg_c32 = peg_literalExpectation(".", false),
			peg_c33 = function (func, vl) { return vl; },
			peg_c34 = function (func, args) {
				const ret = { fn: func };
				if (args) { ret.args = args; }
				return ret;
			},
			peg_c35 = "null",
			peg_c36 = peg_literalExpectation("null", false),
			peg_c37 = function () { return null; },
			peg_c38 = peg_otherExpectation("bool"),
			peg_c39 = "false",
			peg_c40 = peg_literalExpectation("false", false),
			peg_c41 = function () { return false; },
			peg_c42 = "true",
			peg_c43 = peg_literalExpectation("true", false),
			peg_c44 = function () { return true; },
			peg_c45 = peg_otherExpectation("object"),
			peg_c46 = function (head, m) { return m; },
			peg_c47 = function (members) { return members !== null ? members : {}; },
			peg_c48 = peg_otherExpectation("key:val pair"),
			peg_c49 = function (name, value) { return [name, value]; },
			peg_c50 = peg_otherExpectation("key"),
			peg_c51 = function () { return text(); },
			peg_c52 = peg_otherExpectation("identifier"),
			peg_c53 = /^[_a-z$]/i,
			peg_c54 = peg_classExpectation(["_", ["a", "z"], "$"], false, true),
			peg_c55 = /^[0-9a-z$_]/i,
			peg_c56 = peg_classExpectation([["0", "9"], ["a", "z"], "$", "_"], false, true),
			peg_c57 = function (values) { return values ?? []; },
			peg_c58 = peg_otherExpectation("value-list"),
			peg_c59 = peg_otherExpectation("number"),
			peg_c60 = "-",
			peg_c61 = peg_literalExpectation("-", false),
			peg_c62 = function () { return parseFloat(text()); },
			peg_c63 = /^[eE]/,
			peg_c64 = peg_classExpectation(["e", "E"], false, false),
			peg_c65 = "+",
			peg_c66 = peg_literalExpectation("+", false),
			peg_c67 = "0",
			peg_c68 = peg_literalExpectation("0", false),
			peg_c69 = /^[1-9]/,
			peg_c70 = peg_classExpectation([["1", "9"]], false, false),
			peg_c71 = /^[0-9]/,
			peg_c72 = peg_classExpectation([["0", "9"]], false, false),
			peg_c73 = peg_otherExpectation("string"),
			peg_c74 = "\"",
			peg_c75 = peg_literalExpectation("\"", false),
			peg_c76 = function (chars) { return chars.join(""); },
			peg_c77 = "'",
			peg_c78 = peg_literalExpectation("'", false),
			peg_c79 = "`",
			peg_c80 = peg_literalExpectation("`", false),
			peg_c81 = /^[^\0-\x1F\\"]/,
			peg_c82 = peg_classExpectation([["\0", "\x1F"], "\\", "\""], true, false),
			peg_c83 = function (esc) { return esc; },
			peg_c84 = /^[^\0-\x1F\\']/,
			peg_c85 = peg_classExpectation([["\0", "\x1F"], "\\", "'"], true, false),
			peg_c86 = /^[^\0-\x1F\\`]/,
			peg_c87 = peg_classExpectation([["\0", "\x1F"], "\\", "`"], true, false),
			peg_c88 = peg_otherExpectation("Escaped-Char"),
			peg_c89 = "\\\\",
			peg_c90 = peg_literalExpectation("\\\\", false),
			peg_c91 = function () { return '\\'; },
			peg_c92 = "\\\"",
			peg_c93 = peg_literalExpectation("\\\"", false),
			peg_c94 = function () { return '"'; },
			peg_c95 = "\\'",
			peg_c96 = peg_literalExpectation("\\'", false),
			peg_c97 = function () { return "'"; },
			peg_c98 = "\\`",
			peg_c99 = peg_literalExpectation("\\`", false),
			peg_c100 = function () { return "`"; },
			peg_c101 = "\\b",
			peg_c102 = peg_literalExpectation("\\b", false),
			peg_c103 = function () { return "\b"; },
			peg_c104 = "\\f",
			peg_c105 = peg_literalExpectation("\\f", false),
			peg_c106 = function () { return "\f"; },
			peg_c107 = "\\n",
			peg_c108 = peg_literalExpectation("\\n", false),
			peg_c109 = function () { return "\n"; },
			peg_c110 = "\\r",
			peg_c111 = peg_literalExpectation("\\r", false),
			peg_c112 = function () { return "\r"; },
			peg_c113 = "\\t",
			peg_c114 = peg_literalExpectation("\\t", false),
			peg_c115 = function () { return "\t"; },
			peg_c116 = "\\u",
			peg_c117 = peg_literalExpectation("\\u", false),
			peg_c118 = function (digits) { return String.fromCharCode(parseInt(digits, 16)); },
			peg_c119 = "[",
			peg_c120 = peg_literalExpectation("[", false),
			peg_c121 = "]",
			peg_c122 = peg_literalExpectation("]", false),
			peg_c123 = "(",
			peg_c124 = peg_literalExpectation("(", false),
			peg_c125 = ")",
			peg_c126 = peg_literalExpectation(")", false),
			peg_c127 = "{",
			peg_c128 = peg_literalExpectation("{", false),
			peg_c129 = "}",
			peg_c130 = peg_literalExpectation("}", false),
			peg_c131 = ":",
			peg_c132 = peg_literalExpectation(":", false),
			peg_c133 = ",",
			peg_c134 = peg_literalExpectation(",", false),
			peg_c135 = peg_otherExpectation("whitespace"),
			peg_c136 = /^[ \t\n\r]/,
			peg_c137 = peg_classExpectation([" ", "\t", "\n", "\r"], false, false),
			peg_c138 = peg_otherExpectation("hex-char"),
			peg_c139 = /^[0-9a-f]/i,
			peg_c140 = peg_classExpectation([["0", "9"], ["a", "f"]], false, true),

			peg_currPos = 0,
			peg_savedPos = 0,
			peg_posDetailsCache = [{ line: 1, column: 1 }],
			peg_maxFailPos = 0,
			peg_maxFailExpected = [],
			peg_silentFails = 0,

			peg_result;

		if ("startRule" in options) {
			if (!(options.startRule in peg_startRuleFunctions)) {
				throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
			}

			peg_startRuleFunction = peg_startRuleFunctions[options.startRule];
		}

		function text() {
			return input.substring(peg_savedPos, peg_currPos);
		}

		function location() {
			return peg_computeLocation(peg_savedPos, peg_currPos);
		}

		function expected(description, location) {
			location = location !== void 0 ? location : peg_computeLocation(peg_savedPos, peg_currPos)

			throw peg_buildStructuredError(
				[peg_otherExpectation(description)],
				input.substring(peg_savedPos, peg_currPos),
				location
			);
		}

		function error(message, location) {
			location = location !== void 0 ? location : peg_computeLocation(peg_savedPos, peg_currPos)

			throw peg_buildSimpleError(message, location);
		}

		function peg_literalExpectation(text, ignoreCase) {
			return { type: "literal", text: text, ignoreCase: ignoreCase };
		}

		function peg_classExpectation(parts, inverted, ignoreCase) {
			return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
		}

		function peg_anyExpectation() {
			return { type: "any" };
		}

		function peg_endExpectation() {
			return { type: "end" };
		}

		function peg_otherExpectation(description) {
			return { type: "other", description: description };
		}

		function peg_computePosDetails(pos) {
			let details = peg_posDetailsCache[pos], p;

			if (details) {
				return details;
			} else {
				p = pos - 1;
				while (!peg_posDetailsCache[p]) {
					p--;
				}

				details = peg_posDetailsCache[p];
				details = {
					line: details.line,
					column: details.column
				};

				while (p < pos) {
					if (input.charCodeAt(p) === 10) {
						details.line++;
						details.column = 1;
					} else {
						details.column++;
					}

					p++;
				}

				peg_posDetailsCache[pos] = details;
				return details;
			}
		}

		function peg_computeLocation(startPos, endPos) {
			let startPosDetails = peg_computePosDetails(startPos),
				endPosDetails = peg_computePosDetails(endPos);

			return {
				start: {
					offset: startPos,
					line: startPosDetails.line,
					column: startPosDetails.column
				},
				end: {
					offset: endPos,
					line: endPosDetails.line,
					column: endPosDetails.column
				}
			};
		}

		function peg_fail(expected) {
			if (peg_currPos < peg_maxFailPos) { return; }

			if (peg_currPos > peg_maxFailPos) {
				peg_maxFailPos = peg_currPos;
				peg_maxFailExpected = [];
			}

			peg_maxFailExpected.push(expected);
		}

		function peg_buildSimpleError(message, location) {
			return new peg_SyntaxError(message, null, null, location);
		}

		function peg_buildStructuredError(expected, found, location) {
			return new peg_SyntaxError(
				peg_SyntaxError.buildMessage(expected, found),
				expected,
				found,
				location
			);
		}

		function peg_parseFormat() {
			let s0, s1, s2, s3, s4, s5, s6, s7, s8;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				s2 = peg_parseType();
				if (s2 !== peg_FAILED) {
					s3 = [];
					s4 = peg_currPos;
					s5 = peg_parse_();
					if (s5 !== peg_FAILED) {
						if (input.substr(peg_currPos, 2) === peg_c0) {
							s6 = peg_c0;
							peg_currPos += 2;
						} else {
							s6 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c1); }
						}
						if (s6 !== peg_FAILED) {
							s7 = peg_parse_();
							if (s7 !== peg_FAILED) {
								s8 = peg_parseType();
								if (s8 !== peg_FAILED) {
									peg_savedPos = s4;
									s5 = peg_c2(s2, s8);
									s4 = s5;
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
						} else {
							peg_currPos = s4;
							s4 = peg_FAILED;
						}
					} else {
						peg_currPos = s4;
						s4 = peg_FAILED;
					}
					while (s4 !== peg_FAILED) {
						s3.push(s4);
						s4 = peg_currPos;
						s5 = peg_parse_();
						if (s5 !== peg_FAILED) {
							if (input.substr(peg_currPos, 2) === peg_c0) {
								s6 = peg_c0;
								peg_currPos += 2;
							} else {
								s6 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c1); }
							}
							if (s6 !== peg_FAILED) {
								s7 = peg_parse_();
								if (s7 !== peg_FAILED) {
									s8 = peg_parseType();
									if (s8 !== peg_FAILED) {
										peg_savedPos = s4;
										s5 = peg_c2(s2, s8);
										s4 = s5;
									} else {
										peg_currPos = s4;
										s4 = peg_FAILED;
									}
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
						} else {
							peg_currPos = s4;
							s4 = peg_FAILED;
						}
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c3(s2, s3);
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parse_();
				if (s1 !== peg_FAILED) {
					s2 = peg_parseType();
					if (s2 !== peg_FAILED) {
						s1 = [s1, s2];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			}

			return s0;
		}

		function peg_parseType() {
			let s0, s1, s2, s3, s4, s5, s6, s7, s8;

			s0 = peg_currPos;
			s1 = peg_parseORB();
			if (s1 !== peg_FAILED) {
				s2 = peg_parseFormat();
				if (s2 !== peg_FAILED) {
					s3 = [];
					s4 = peg_currPos;
					s5 = peg_parse_();
					if (s5 !== peg_FAILED) {
						if (input.charCodeAt(peg_currPos) === 124) {
							s6 = peg_c4;
							peg_currPos++;
						} else {
							s6 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c5); }
						}
						if (s6 !== peg_FAILED) {
							s7 = peg_parse_();
							if (s7 !== peg_FAILED) {
								s8 = peg_parseFormat();
								if (s8 !== peg_FAILED) {
									peg_savedPos = s4;
									s5 = peg_c6(s2, s8);
									s4 = s5;
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
						} else {
							peg_currPos = s4;
							s4 = peg_FAILED;
						}
					} else {
						peg_currPos = s4;
						s4 = peg_FAILED;
					}
					while (s4 !== peg_FAILED) {
						s3.push(s4);
						s4 = peg_currPos;
						s5 = peg_parse_();
						if (s5 !== peg_FAILED) {
							if (input.charCodeAt(peg_currPos) === 124) {
								s6 = peg_c4;
								peg_currPos++;
							} else {
								s6 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c5); }
							}
							if (s6 !== peg_FAILED) {
								s7 = peg_parse_();
								if (s7 !== peg_FAILED) {
									s8 = peg_parseFormat();
									if (s8 !== peg_FAILED) {
										peg_savedPos = s4;
										s5 = peg_c6(s2, s8);
										s4 = s5;
									} else {
										peg_currPos = s4;
										s4 = peg_FAILED;
									}
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
						} else {
							peg_currPos = s4;
							s4 = peg_FAILED;
						}
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parseCRB();
						if (s4 !== peg_FAILED) {
							s5 = peg_parseFuncList();
							if (s5 === peg_FAILED) {
								s5 = null;
							}
							if (s5 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c7(s2, s3, s5);
								s0 = s1;
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseOSB();
				if (s1 !== peg_FAILED) {
					s2 = peg_currPos;
					s3 = peg_parseArrayFormat();
					if (s3 !== peg_FAILED) {
						s4 = [];
						s5 = peg_currPos;
						s6 = peg_parseCOMMA();
						if (s6 !== peg_FAILED) {
							s7 = peg_parseArrayFormat();
							if (s7 !== peg_FAILED) {
								peg_savedPos = s5;
								s6 = peg_c6(s3, s7);
								s5 = s6;
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
						while (s5 !== peg_FAILED) {
							s4.push(s5);
							s5 = peg_currPos;
							s6 = peg_parseCOMMA();
							if (s6 !== peg_FAILED) {
								s7 = peg_parseArrayFormat();
								if (s7 !== peg_FAILED) {
									peg_savedPos = s5;
									s6 = peg_c6(s3, s7);
									s5 = s6;
								} else {
									peg_currPos = s5;
									s5 = peg_FAILED;
								}
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
						}
						if (s4 !== peg_FAILED) {
							s5 = peg_parseCOMMA();
							if (s5 === peg_FAILED) {
								s5 = null;
							}
							if (s5 !== peg_FAILED) {
								peg_savedPos = s2;
								s3 = peg_c8(s3, s4);
								s2 = s3;
							} else {
								peg_currPos = s2;
								s2 = peg_FAILED;
							}
						} else {
							peg_currPos = s2;
							s2 = peg_FAILED;
						}
					} else {
						peg_currPos = s2;
						s2 = peg_FAILED;
					}
					if (s2 === peg_FAILED) {
						s2 = null;
					}
					if (s2 !== peg_FAILED) {
						s3 = peg_parseCSB();
						if (s3 !== peg_FAILED) {
							s4 = peg_parseFuncList();
							if (s4 === peg_FAILED) {
								s4 = null;
							}
							if (s4 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c9(s2, s4);
								s0 = s1;
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					s1 = peg_parseOCB();
					if (s1 !== peg_FAILED) {
						s2 = peg_currPos;
						s3 = peg_parseIdfVal();
						if (s3 !== peg_FAILED) {
							s4 = [];
							s5 = peg_currPos;
							s6 = peg_parseCOMMA();
							if (s6 !== peg_FAILED) {
								s7 = peg_parseIdfVal();
								if (s7 !== peg_FAILED) {
									peg_savedPos = s5;
									s6 = peg_c6(s3, s7);
									s5 = s6;
								} else {
									peg_currPos = s5;
									s5 = peg_FAILED;
								}
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
							while (s5 !== peg_FAILED) {
								s4.push(s5);
								s5 = peg_currPos;
								s6 = peg_parseCOMMA();
								if (s6 !== peg_FAILED) {
									s7 = peg_parseIdfVal();
									if (s7 !== peg_FAILED) {
										peg_savedPos = s5;
										s6 = peg_c6(s3, s7);
										s5 = s6;
									} else {
										peg_currPos = s5;
										s5 = peg_FAILED;
									}
								} else {
									peg_currPos = s5;
									s5 = peg_FAILED;
								}
							}
							if (s4 !== peg_FAILED) {
								peg_savedPos = s2;
								s3 = peg_c10(s3, s4);
								s2 = s3;
							} else {
								peg_currPos = s2;
								s2 = peg_FAILED;
							}
						} else {
							peg_currPos = s2;
							s2 = peg_FAILED;
						}
						if (s2 === peg_FAILED) {
							s2 = null;
						}
						if (s2 !== peg_FAILED) {
							s3 = peg_currPos;
							s4 = peg_parseCOMMA();
							if (s4 !== peg_FAILED) {
								if (input.substr(peg_currPos, 3) === peg_c11) {
									s5 = peg_c11;
									peg_currPos += 3;
								} else {
									s5 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_c12); }
								}
								if (s5 !== peg_FAILED) {
									s4 = [s4, s5];
									s3 = s4;
								} else {
									peg_currPos = s3;
									s3 = peg_FAILED;
								}
							} else {
								peg_currPos = s3;
								s3 = peg_FAILED;
							}
							if (s3 === peg_FAILED) {
								s3 = null;
							}
							if (s3 !== peg_FAILED) {
								s4 = peg_parseCOMMA();
								if (s4 === peg_FAILED) {
									s4 = null;
								}
								if (s4 !== peg_FAILED) {
									s5 = peg_parseCCB();
									if (s5 !== peg_FAILED) {
										s6 = peg_parseFuncList();
										if (s6 === peg_FAILED) {
											s6 = null;
										}
										if (s6 !== peg_FAILED) {
											peg_savedPos = s0;
											s1 = peg_c13(s2, s3, s6);
											s0 = s1;
										} else {
											peg_currPos = s0;
											s0 = peg_FAILED;
										}
									} else {
										peg_currPos = s0;
										s0 = peg_FAILED;
									}
								} else {
									peg_currPos = s0;
									s0 = peg_FAILED;
								}
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
					if (s0 === peg_FAILED) {
						s0 = peg_currPos;
						s1 = peg_parseIdf();
						if (s1 !== peg_FAILED) {
							s2 = peg_parseFuncList();
							if (s2 === peg_FAILED) {
								s2 = null;
							}
							if (s2 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c14(s1, s2);
								s0 = s1;
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					}
				}
			}

			return s0;
		}

		function peg_parseIdfVal() {
			let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 63) {
				s1 = peg_c16;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c17); }
			}
			if (s1 === peg_FAILED) {
				s1 = null;
			}
			if (s1 !== peg_FAILED) {
				s2 = peg_parseIdf();
				if (s2 !== peg_FAILED) {
					s3 = peg_currPos;
					s4 = peg_parseORB();
					if (s4 !== peg_FAILED) {
						s5 = peg_parse_();
						if (s5 !== peg_FAILED) {
							if (input.charCodeAt(peg_currPos) === 61) {
								s6 = peg_c18;
								peg_currPos++;
							} else {
								s6 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c19); }
							}
							if (s6 !== peg_FAILED) {
								s7 = peg_parse_();
								if (s7 !== peg_FAILED) {
									s8 = peg_parseValue();
									if (s8 !== peg_FAILED) {
										s9 = peg_parseCRB();
										if (s9 !== peg_FAILED) {
											peg_savedPos = s3;
											s4 = peg_c20(s1, s2, s8);
											s3 = s4;
										} else {
											peg_currPos = s3;
											s3 = peg_FAILED;
										}
									} else {
										peg_currPos = s3;
										s3 = peg_FAILED;
									}
								} else {
									peg_currPos = s3;
									s3 = peg_FAILED;
								}
							} else {
								peg_currPos = s3;
								s3 = peg_FAILED;
							}
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
					if (s3 === peg_FAILED) {
						s3 = null;
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parseCOLON();
						if (s4 !== peg_FAILED) {
							s5 = peg_parseFormat();
							if (s5 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c21(s1, s2, s3, s5);
								s0 = s1;
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c15); }
			}

			return s0;
		}

		function peg_parseArrayFormat() {
			let s0, s1, s2;

			s0 = peg_currPos;
			s1 = peg_parseMoreCount();
			if (s1 === peg_FAILED) {
				s1 = null;
			}
			if (s1 !== peg_FAILED) {
				s2 = peg_parseFormat();
				if (s2 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c22(s1, s2);
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseMoreCount() {
			let s0, s1, s2, s3, s4;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 2) === peg_c24) {
				s1 = peg_c24;
				peg_currPos += 2;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c25); }
			}
			if (s1 !== peg_FAILED) {
				s2 = peg_parseSimpleUnsigned();
				if (s2 !== peg_FAILED) {
					if (input.substr(peg_currPos, 2) === peg_c24) {
						s3 = peg_c24;
						peg_currPos += 2;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c25); }
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parse_();
						if (s4 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c26(s2);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.substr(peg_currPos, 3) === peg_c11) {
					s1 = peg_c11;
					peg_currPos += 3;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c12); }
				}
				if (s1 !== peg_FAILED) {
					s2 = peg_parse_();
					if (s2 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c27();
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c23); }
			}

			return s0;
		}

		function peg_parseFuncList() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseFunc();
			if (s1 !== peg_FAILED) {
				s2 = [];
				s3 = peg_parseFunc();
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					s3 = peg_parseFunc();
				}
				if (s2 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c29(s1, s2);
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c28); }
			}

			return s0;
		}

		function peg_parseFunc() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 46) {
					s2 = peg_c31;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c32); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parseIdf();
					if (s3 !== peg_FAILED) {
						s4 = peg_currPos;
						s5 = peg_parseORB();
						if (s5 !== peg_FAILED) {
							s6 = peg_parseValueList();
							if (s6 === peg_FAILED) {
								s6 = null;
							}
							if (s6 !== peg_FAILED) {
								s7 = peg_parseCRB();
								if (s7 !== peg_FAILED) {
									peg_savedPos = s4;
									s5 = peg_c33(s3, s6);
									s4 = s5;
								} else {
									peg_currPos = s4;
									s4 = peg_FAILED;
								}
							} else {
								peg_currPos = s4;
								s4 = peg_FAILED;
							}
						} else {
							peg_currPos = s4;
							s4 = peg_FAILED;
						}
						if (s4 === peg_FAILED) {
							s4 = null;
						}
						if (s4 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c34(s3, s4);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c30); }
			}

			return s0;
		}

		function peg_parseValue() {
			let s0;

			s0 = peg_parseFalse();
			if (s0 === peg_FAILED) {
				s0 = peg_parseNull();
				if (s0 === peg_FAILED) {
					s0 = peg_parseTrue();
					if (s0 === peg_FAILED) {
						s0 = peg_parseObject();
						if (s0 === peg_FAILED) {
							s0 = peg_parseArray();
							if (s0 === peg_FAILED) {
								s0 = peg_parseNumber();
								if (s0 === peg_FAILED) {
									s0 = peg_parseString();
								}
							}
						}
					}
				}
			}

			return s0;
		}

		function peg_parseNull() {
			let s0, s1;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 4) === peg_c35) {
				s1 = peg_c35;
				peg_currPos += 4;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c36); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c37();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseBool() {
			let s0, s1;

			peg_silentFails++;
			s0 = peg_parseTrue();
			if (s0 === peg_FAILED) {
				s0 = peg_parseFalse();
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c38); }
			}

			return s0;
		}

		function peg_parseFalse() {
			let s0, s1;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 5) === peg_c39) {
				s1 = peg_c39;
				peg_currPos += 5;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c40); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c41();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseTrue() {
			let s0, s1;

			s0 = peg_currPos;
			if (input.substr(peg_currPos, 4) === peg_c42) {
				s1 = peg_c42;
				peg_currPos += 4;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c43); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c44();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseObject() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseOCB();
			if (s1 !== peg_FAILED) {
				s2 = peg_currPos;
				s3 = peg_parseKeyVal();
				if (s3 !== peg_FAILED) {
					s4 = [];
					s5 = peg_currPos;
					s6 = peg_parseCOMMA();
					if (s6 !== peg_FAILED) {
						s7 = peg_parseKeyVal();
						if (s7 !== peg_FAILED) {
							peg_savedPos = s5;
							s6 = peg_c46(s3, s7);
							s5 = s6;
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					} else {
						peg_currPos = s5;
						s5 = peg_FAILED;
					}
					while (s5 !== peg_FAILED) {
						s4.push(s5);
						s5 = peg_currPos;
						s6 = peg_parseCOMMA();
						if (s6 !== peg_FAILED) {
							s7 = peg_parseKeyVal();
							if (s7 !== peg_FAILED) {
								peg_savedPos = s5;
								s6 = peg_c46(s3, s7);
								s5 = s6;
							} else {
								peg_currPos = s5;
								s5 = peg_FAILED;
							}
						} else {
							peg_currPos = s5;
							s5 = peg_FAILED;
						}
					}
					if (s4 !== peg_FAILED) {
						peg_savedPos = s2;
						s3 = peg_c10(s3, s4);
						s2 = s3;
					} else {
						peg_currPos = s2;
						s2 = peg_FAILED;
					}
				} else {
					peg_currPos = s2;
					s2 = peg_FAILED;
				}
				if (s2 === peg_FAILED) {
					s2 = null;
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parseCOMMA();
					if (s3 === peg_FAILED) {
						s3 = null;
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parseCCB();
						if (s4 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c47(s2);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c45); }
			}

			return s0;
		}

		function peg_parseKeyVal() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseString();
			if (s1 !== peg_FAILED) {
				s2 = peg_parseCOLON();
				if (s2 !== peg_FAILED) {
					s3 = peg_parseValue();
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c49(s1, s3);
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseKeyChain();
				if (s1 !== peg_FAILED) {
					s2 = peg_parseCOLON();
					if (s2 !== peg_FAILED) {
						s3 = peg_parseValue();
						if (s3 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c49(s1, s3);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c48); }
			}

			return s0;
		}

		function peg_parseKeyChain() {
			let s0, s1, s2, s3, s4, s5;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseIdf();
			if (s1 !== peg_FAILED) {
				s2 = [];
				s3 = peg_currPos;
				if (input.charCodeAt(peg_currPos) === 46) {
					s4 = peg_c31;
					peg_currPos++;
				} else {
					s4 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c32); }
				}
				if (s4 !== peg_FAILED) {
					s5 = peg_parseIdf();
					if (s5 !== peg_FAILED) {
						s4 = [s4, s5];
						s3 = s4;
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
				} else {
					peg_currPos = s3;
					s3 = peg_FAILED;
				}
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					s3 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 46) {
						s4 = peg_c31;
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c32); }
					}
					if (s4 !== peg_FAILED) {
						s5 = peg_parseIdf();
						if (s5 !== peg_FAILED) {
							s4 = [s4, s5];
							s3 = s4;
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
				}
				if (s2 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c51();
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c50); }
			}

			return s0;
		}

		function peg_parseIdf() {
			let s0, s1, s2, s3, s4;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_currPos;
			if (peg_c53.test(input.charAt(peg_currPos))) {
				s2 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c54); }
			}
			if (s2 !== peg_FAILED) {
				s3 = [];
				if (peg_c55.test(input.charAt(peg_currPos))) {
					s4 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s4 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c56); }
				}
				while (s4 !== peg_FAILED) {
					s3.push(s4);
					if (peg_c55.test(input.charAt(peg_currPos))) {
						s4 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c56); }
					}
				}
				if (s3 !== peg_FAILED) {
					s2 = [s2, s3];
					s1 = s2;
				} else {
					peg_currPos = s1;
					s1 = peg_FAILED;
				}
			} else {
				peg_currPos = s1;
				s1 = peg_FAILED;
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c51();
			}
			s0 = s1;
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c52); }
			}

			return s0;
		}

		function peg_parseArray() {
			let s0, s1, s2, s3, s4;

			s0 = peg_currPos;
			s1 = peg_parseOSB();
			if (s1 !== peg_FAILED) {
				s2 = peg_parseValueList();
				if (s2 === peg_FAILED) {
					s2 = null;
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parseCOMMA();
					if (s3 === peg_FAILED) {
						s3 = null;
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parseCSB();
						if (s4 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c57(s2);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseValueList() {
			let s0, s1, s2, s3, s4, s5;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_parseValue();
			if (s1 !== peg_FAILED) {
				s2 = [];
				s3 = peg_currPos;
				s4 = peg_parseCOMMA();
				if (s4 !== peg_FAILED) {
					s5 = peg_parseValue();
					if (s5 !== peg_FAILED) {
						peg_savedPos = s3;
						s4 = peg_c6(s1, s5);
						s3 = s4;
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
				} else {
					peg_currPos = s3;
					s3 = peg_FAILED;
				}
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					s3 = peg_currPos;
					s4 = peg_parseCOMMA();
					if (s4 !== peg_FAILED) {
						s5 = peg_parseValue();
						if (s5 !== peg_FAILED) {
							peg_savedPos = s3;
							s4 = peg_c6(s1, s5);
							s3 = s4;
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
				}
				if (s2 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c29(s1, s2);
					s0 = s1;
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c58); }
			}

			return s0;
		}

		function peg_parseNumber() {
			let s0, s1, s2, s3, s4, s5, s6;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 45) {
				s1 = peg_c60;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c61); }
			}
			if (s1 === peg_FAILED) {
				s1 = null;
			}
			if (s1 !== peg_FAILED) {
				s2 = peg_parseSimpleUnsigned();
				if (s2 !== peg_FAILED) {
					s3 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 46) {
						s4 = peg_c31;
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c32); }
					}
					if (s4 !== peg_FAILED) {
						s5 = [];
						s6 = peg_parseDigit();
						if (s6 !== peg_FAILED) {
							while (s6 !== peg_FAILED) {
								s5.push(s6);
								s6 = peg_parseDigit();
							}
						} else {
							s5 = peg_FAILED;
						}
						if (s5 !== peg_FAILED) {
							s4 = [s4, s5];
							s3 = s4;
						} else {
							peg_currPos = s3;
							s3 = peg_FAILED;
						}
					} else {
						peg_currPos = s3;
						s3 = peg_FAILED;
					}
					if (s3 === peg_FAILED) {
						s3 = null;
					}
					if (s3 !== peg_FAILED) {
						s4 = peg_parseSciNote();
						if (s4 === peg_FAILED) {
							s4 = null;
						}
						if (s4 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c62();
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c59); }
			}

			return s0;
		}

		function peg_parseSciNote() {
			let s0, s1, s2, s3, s4;

			s0 = peg_currPos;
			if (peg_c63.test(input.charAt(peg_currPos))) {
				s1 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c64); }
			}
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 45) {
					s2 = peg_c60;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c61); }
				}
				if (s2 === peg_FAILED) {
					if (input.charCodeAt(peg_currPos) === 43) {
						s2 = peg_c65;
						peg_currPos++;
					} else {
						s2 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c66); }
					}
				}
				if (s2 === peg_FAILED) {
					s2 = null;
				}
				if (s2 !== peg_FAILED) {
					s3 = [];
					s4 = peg_parseDigit();
					if (s4 !== peg_FAILED) {
						while (s4 !== peg_FAILED) {
							s3.push(s4);
							s4 = peg_parseDigit();
						}
					} else {
						s3 = peg_FAILED;
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c51();
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseSimpleUnsigned() {
			let s0, s1, s2, s3, s4;

			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 48) {
				s1 = peg_c67;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c68); }
			}
			if (s1 === peg_FAILED) {
				s1 = peg_currPos;
				if (peg_c69.test(input.charAt(peg_currPos))) {
					s2 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c70); }
				}
				if (s2 !== peg_FAILED) {
					s3 = [];
					s4 = peg_parseDigit();
					while (s4 !== peg_FAILED) {
						s3.push(s4);
						s4 = peg_parseDigit();
					}
					if (s3 !== peg_FAILED) {
						s2 = [s2, s3];
						s1 = s2;
					} else {
						peg_currPos = s1;
						s1 = peg_FAILED;
					}
				} else {
					peg_currPos = s1;
					s1 = peg_FAILED;
				}
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c51();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseDigit() {
			let s0;

			if (peg_c71.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c72); }
			}

			return s0;
		}

		function peg_parseString() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 34) {
				s1 = peg_c74;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c75); }
			}
			if (s1 !== peg_FAILED) {
				s2 = [];
				s3 = peg_parseCharDQ();
				while (s3 !== peg_FAILED) {
					s2.push(s3);
					s3 = peg_parseCharDQ();
				}
				if (s2 !== peg_FAILED) {
					if (input.charCodeAt(peg_currPos) === 34) {
						s3 = peg_c74;
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c75); }
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c76(s2);
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.charCodeAt(peg_currPos) === 39) {
					s1 = peg_c77;
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c78); }
				}
				if (s1 !== peg_FAILED) {
					s2 = [];
					s3 = peg_parseCharSQ();
					while (s3 !== peg_FAILED) {
						s2.push(s3);
						s3 = peg_parseCharSQ();
					}
					if (s2 !== peg_FAILED) {
						if (input.charCodeAt(peg_currPos) === 39) {
							s3 = peg_c77;
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c78); }
						}
						if (s3 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c76(s2);
							s0 = s1;
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.charCodeAt(peg_currPos) === 96) {
						s1 = peg_c79;
						peg_currPos++;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c80); }
					}
					if (s1 !== peg_FAILED) {
						s2 = [];
						s3 = peg_parseCharBQ();
						while (s3 !== peg_FAILED) {
							s2.push(s3);
							s3 = peg_parseCharBQ();
						}
						if (s2 !== peg_FAILED) {
							if (input.charCodeAt(peg_currPos) === 96) {
								s3 = peg_c79;
								peg_currPos++;
							} else {
								s3 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c80); }
							}
							if (s3 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c76(s2);
								s0 = s1;
							} else {
								peg_currPos = s0;
								s0 = peg_FAILED;
							}
						} else {
							peg_currPos = s0;
							s0 = peg_FAILED;
						}
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c73); }
			}

			return s0;
		}

		function peg_parseCharDQ() {
			let s0, s1;

			if (peg_c81.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c82); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c83(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseCharSQ() {
			let s0, s1;

			if (peg_c84.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c85); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c83(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseCharBQ() {
			let s0, s1;

			if (peg_c86.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c87); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c83(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseEscChar() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 2) === peg_c89) {
				s1 = peg_c89;
				peg_currPos += 2;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c90); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c91();
			}
			s0 = s1;
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.substr(peg_currPos, 2) === peg_c92) {
					s1 = peg_c92;
					peg_currPos += 2;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c93); }
				}
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c94();
				}
				s0 = s1;
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.substr(peg_currPos, 2) === peg_c95) {
						s1 = peg_c95;
						peg_currPos += 2;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c96); }
					}
					if (s1 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c97();
					}
					s0 = s1;
					if (s0 === peg_FAILED) {
						s0 = peg_currPos;
						if (input.substr(peg_currPos, 2) === peg_c98) {
							s1 = peg_c98;
							peg_currPos += 2;
						} else {
							s1 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c99); }
						}
						if (s1 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c100();
						}
						s0 = s1;
						if (s0 === peg_FAILED) {
							s0 = peg_currPos;
							if (input.substr(peg_currPos, 2) === peg_c101) {
								s1 = peg_c101;
								peg_currPos += 2;
							} else {
								s1 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c102); }
							}
							if (s1 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c103();
							}
							s0 = s1;
							if (s0 === peg_FAILED) {
								s0 = peg_currPos;
								if (input.substr(peg_currPos, 2) === peg_c104) {
									s1 = peg_c104;
									peg_currPos += 2;
								} else {
									s1 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_c105); }
								}
								if (s1 !== peg_FAILED) {
									peg_savedPos = s0;
									s1 = peg_c106();
								}
								s0 = s1;
								if (s0 === peg_FAILED) {
									s0 = peg_currPos;
									if (input.substr(peg_currPos, 2) === peg_c107) {
										s1 = peg_c107;
										peg_currPos += 2;
									} else {
										s1 = peg_FAILED;
										if (peg_silentFails === 0) { peg_fail(peg_c108); }
									}
									if (s1 !== peg_FAILED) {
										peg_savedPos = s0;
										s1 = peg_c109();
									}
									s0 = s1;
									if (s0 === peg_FAILED) {
										s0 = peg_currPos;
										if (input.substr(peg_currPos, 2) === peg_c110) {
											s1 = peg_c110;
											peg_currPos += 2;
										} else {
											s1 = peg_FAILED;
											if (peg_silentFails === 0) { peg_fail(peg_c111); }
										}
										if (s1 !== peg_FAILED) {
											peg_savedPos = s0;
											s1 = peg_c112();
										}
										s0 = s1;
										if (s0 === peg_FAILED) {
											s0 = peg_currPos;
											if (input.substr(peg_currPos, 2) === peg_c113) {
												s1 = peg_c113;
												peg_currPos += 2;
											} else {
												s1 = peg_FAILED;
												if (peg_silentFails === 0) { peg_fail(peg_c114); }
											}
											if (s1 !== peg_FAILED) {
												peg_savedPos = s0;
												s1 = peg_c115();
											}
											s0 = s1;
											if (s0 === peg_FAILED) {
												s0 = peg_currPos;
												if (input.substr(peg_currPos, 2) === peg_c116) {
													s1 = peg_c116;
													peg_currPos += 2;
												} else {
													s1 = peg_FAILED;
													if (peg_silentFails === 0) { peg_fail(peg_c117); }
												}
												if (s1 !== peg_FAILED) {
													s2 = peg_currPos;
													s3 = peg_currPos;
													s4 = peg_parseHexDig();
													if (s4 !== peg_FAILED) {
														s5 = peg_parseHexDig();
														if (s5 !== peg_FAILED) {
															s6 = peg_parseHexDig();
															if (s6 !== peg_FAILED) {
																s7 = peg_parseHexDig();
																if (s7 !== peg_FAILED) {
																	s4 = [s4, s5, s6, s7];
																	s3 = s4;
																} else {
																	peg_currPos = s3;
																	s3 = peg_FAILED;
																}
															} else {
																peg_currPos = s3;
																s3 = peg_FAILED;
															}
														} else {
															peg_currPos = s3;
															s3 = peg_FAILED;
														}
													} else {
														peg_currPos = s3;
														s3 = peg_FAILED;
													}
													if (s3 !== peg_FAILED) {
														s2 = input.substring(s2, peg_currPos);
													} else {
														s2 = s3;
													}
													if (s2 !== peg_FAILED) {
														peg_savedPos = s0;
														s1 = peg_c118(s2);
														s0 = s1;
													} else {
														peg_currPos = s0;
														s0 = peg_FAILED;
													}
												} else {
													peg_currPos = s0;
													s0 = peg_FAILED;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c88); }
			}

			return s0;
		}

		function peg_parseOSB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 91) {
					s2 = peg_c119;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c120); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCSB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 93) {
					s2 = peg_c121;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c122); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseORB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 40) {
					s2 = peg_c123;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c124); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCRB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 41) {
					s2 = peg_c125;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c126); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseOCB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 123) {
					s2 = peg_c127;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c128); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCCB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 125) {
					s2 = peg_c129;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c130); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCOLON() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 58) {
					s2 = peg_c131;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c132); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parseCOMMA() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 44) {
					s2 = peg_c133;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c134); }
				}
				if (s2 !== peg_FAILED) {
					s3 = peg_parse_();
					if (s3 !== peg_FAILED) {
						s1 = [s1, s2, s3];
						s0 = s1;
					} else {
						peg_currPos = s0;
						s0 = peg_FAILED;
					}
				} else {
					peg_currPos = s0;
					s0 = peg_FAILED;
				}
			} else {
				peg_currPos = s0;
				s0 = peg_FAILED;
			}

			return s0;
		}

		function peg_parse_() {
			let s0, s1;

			peg_silentFails++;
			s0 = [];
			if (peg_c136.test(input.charAt(peg_currPos))) {
				s1 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c137); }
			}
			while (s1 !== peg_FAILED) {
				s0.push(s1);
				if (peg_c136.test(input.charAt(peg_currPos))) {
					s1 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c137); }
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c135); }
			}

			return s0;
		}

		function peg_parseHexDig() {
			let s0, s1;

			peg_silentFails++;
			if (peg_c139.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c140); }
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c138); }
			}

			return s0;
		}


		function type_maker({ ty, fn = null, ls = null }) {
			const ret = { ty: ty };
			if (fn !== null) { ret.fn = fn; }
			if (ls !== null) { ret.ls = ls; }
			return ret;
		}


		peg_result = peg_startRuleFunction();

		if (peg_result !== peg_FAILED && peg_currPos === input.length) {
			return peg_result;
		} else {
			if (peg_result !== peg_FAILED && peg_currPos < input.length) {
				peg_fail(peg_endExpectation());
			}

			throw peg_buildStructuredError(
				peg_maxFailExpected,
				peg_maxFailPos < input.length ? input.charAt(peg_maxFailPos) : null,
				peg_maxFailPos < input.length
					? peg_computeLocation(peg_maxFailPos, peg_maxFailPos + 1)
					: peg_computeLocation(peg_maxFailPos, peg_maxFailPos)
			);
		}
	}

	return {
		SyntaxError: peg_SyntaxError,
		parse: peg_parse
	};
})();
/*************************
 * Types
 *************************/
export const Types = new class {
	#store = {
		'@arr@': { name: 'array' },
		'@obj@': { name: 'object' },
		'@or@': { name: 'multi-type' },

		'any': {
			parse: function (input) { return input; }
		},
		
		'null': {
			parse: function(input) {
				if(input === null) { return null; }
				const {valid, value} = Types.parse('string', input);
				if(!valid) { return; }
				if(value === '' || 'null' === value.toLowerCase()) { return null; }
			}
		},
		
		'num': {
			parse: function(input) {
				return Types.parse('float', input);
			}
		},
		'float': {
			parse: function(input) {
				switch(typeof input) {
					// case "bigint": { return input; }
					case 'number': { return Number.isNaN(input) ? Ret.Invalid() : input }
					case "boolean": { return input ? 1 : 0; }
					case "object": input = String(input);
					case "string":
						input = Number(input);
						return Number.isNaN(input) ? Ret.Invalid() : input;
					case "function":
					case "symbol":
					case "undefined":
					default:
						return;
				}
			}
		},
		'int': {
			parse: function(input) {
				const {valid, value} = Types.parse('float', input);
				if(valid && Number.isInteger(value)) {
					return value;
				}
			}
		},
		'unsigned': {
			parse: function(input) {
				const {valid, value} = Types.parse('float', input);
				if(valid && Number.isInteger(value) && value >= 0) {
					return value;
				}
			}
		},
		
		'bool': {
			parse: function(input) {
				switch(typeof input) {
					case 'boolean': { return input; }
					default: { return Boolean(input); }
				}
			}
		},
		
		'string': {
			parse: function(input) {
				switch (typeof input) {
					case 'string': { return input; }
					case 'object':
						if(input === null) { return 'null'; }
						return JSON.stringify(input);
					case 'bigint':
					case 'number':
					case 'boolean':
						return (new String(input)).valueOf();
					case "undefined": { return Ret.Valid(''); }
					case 'function':
					case 'symbol':
					default: return;
				}
			}
		},
		'hex': {
			name: 'hex-string',
			parse: function(input) {
				const { valid, value } = Types.parse('string', input);
				if(valid && /^[0-9a-f]+$/i.test(value)) {
					return Number(value);
				}
			}
		},
		'email': {
			name: 'email-string',
			parse: function(input) {
				const { valid, value } = Types.parse('string', input);
				if(valid) {
					const node = document?.createElement('input');
					if(node !== null) {
						node.type = 'email';
						node.value = value;
						if(node.checkValidity()) { return value; }
					} else {
						if(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(value)) { return value; }
					}
				}
			}
		},
		'base64': {
			name: 'base64-string',
			parse: function(input) {
				const { valid, value } = Types.parse('string', input);
				if(valid) {
					try {
						return atob(value.replace(/-/g, '+').replace(/_/g, '/'));
					} catch (error) {}
				}
			}
		},
		'json': {
			name: 'json-string',
			parse: function(input) {
				switch(typeof input) {
					case 'bigint':
					case 'boolean':
					case 'number':
					case 'object':
						return input;
					case 'string':
						try {
							return JSON.parse(input);
						} catch (error) {};
						break;
					case 'symbol':
					case 'undefined':
					case 'function':
					default:
						return;
				}
			}
		},
		'timestamp': {
			name: 'timestamp-string',
			parse: function(input) {
				const { valid, value } = Types.parse('string', input);
				if(valid) {
					val = (new Date(value)).valueOf();
					if(val === NaN) {
						val = Date.parse(value);
					}
					if(val !== NaN) {
						return val;
					}
				}
			}
		},
	};
	add({ type, name = null, handler}){
		if(typeof type !== 'string') {
			throw new TypeError('Type must be a string');
		}
		if(name !== null &&  typeof name !== 'string') {
			throw new TypeError('Name must be a string');
		}
		if(typeof handler !== 'function') {
			throw new TypeError('Handler must be a funciton');
		}
		this.#store[type] = { parse : handler };
		if(name !== null) {
			this.#store[type].name = name;
		}
	}
	name(type) {
		if(typeof this.#store[type] === 'undefined') { return null; }
		return this.#store[type].name ?? type;
	}
	parse(type, input) {
		if(typeof this.#store[type] === 'undefined') {
			return Ret.Invalid(`Unknown type: ${JSON.stringify(type)}`);
		}
		const value = this.#store[type].parse(input);
		if(typeof value === 'undefined') {
			return Ret.Invalid(`Expected type: '${this.name(type)}'; Received: ${JSON.stringify(input)}`);
		}
		if(value instanceof Ret) { 
			if(!value.valid) {
				value.error ??= `Expected type: '${this.name(type)}'; Received: ${JSON.stringify(input)}`;
			}
			return value;
		}
		return Ret.Valid(value);
	}
};
/*************************
 * Formatter Functions
 *************************/
export const Funcs = new class {
	#fns = [{
		name: '_toString',
		ty: ['any'],
		fn: function(input) {
			const { valid, value } = Types.parse('string', input);
			if(valid) { return value; }
		}
	}, {
		name: '_allowed',
		ty: ['any'],
		fn: function(input, ...opts) {
			if(opts.includes(input)) {
				return input;
			}
			return Ret.Invalid(`Disallowed value: ${JSON.stringify(input)}`)
		}
	}, {
		name: '_at',
		ty: ['@arr@'],
		fn: function(input, ...pos) {
			for(p of pos) {
				if(typeof p !== 'number') {
					throw new RangeError(`Only numeric arguments allowed; Args=${JSON.stringify(pos)}`);
				}
			}
			const values = pos.map(p => input.at(p));
			return (values.length === 1) ? values[0] : values;
		}
	}, {
		name: '_slice',
		ty: ['@obj@', 'any'],
		fn: function(input, ...keys) {
			const values = [];
			for(const k of keys) {
				if(Object.hasOwn(input, k)) {
					values.push([k, input[k]]);
				}
			}
			switch(keys.length) {
				case 0: return null;
				case 1: return (values.length === 0) ? null : values[0][1];
				default: return Object.fromEntries(values);
			}
		}
	}, {
		name: '_title',
		ty: ['string'],
		fn: function(input) {
			return input.replace(/\w\S*/g, txt => `${txt.charAt(0).toUpperCase()}${txt.substring(1).toLowerCase()}`);
		}
	}, {
		name: '_range',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, min = null, max = null) {
			if(min !== null && typeof min !== 'number') {
				throw new TypeError('Only null or number allowed as arguments');
			}
			if(max !== null && typeof max !== 'number') {
				throw new TypeError('Only null or number allowed as arguments');
			}
			if(
				(min !== null && input < min)
				|| (max !== null && input > max)
			) {
				return Ret.Invalid(`Expected range [${min ?? 'null'}, ${max ?? 'null'}]`);
			}
			return input;
		}
	}, {
		name: '_add',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num = 0) {
			if(typeof num === 'number') {
				return input + num;
			}
			throw new TypeError('Only numeric argument allowed');
		}
	}, {
		name: '_sub',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num = 0) {
			if(typeof num === 'number') {
				return input - num;
			}
			throw new TypeError('Only numeric argument allowed');
		}
	}, {
		name: '_mul',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num = 1) {
			if(typeof num === 'number') {
				return input * num;
			}
			throw new TypeError('Only numeric argument allowed');
		}
	}, {
		name: '_div',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num = 1) {
			if(typeof num === 'number' && num !== 0) {
				return input / num;
			}
			throw new TypeError('Only non-zero numeric argument allowed');
		}
	}, {
		name: '_mod',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num) {
			if(typeof num === 'number' && num !== 0) {
				return input % num;
			}
			throw new TypeError('Only non-zero numeric argument allowed');
		}
	}, {
		name: '_exp',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, num = 1) {
			if(typeof num === 'number') {
				return input ** num;
			}
			throw new TypeError('Only numeric argument allowed');
		}
	}, {
		name: '_round',
		ty: ['float', 'num', 'int', 'unsigned'],
		fn: function(input, size = 2) {
			if(typeof size === 'number') {
				return Number(input.toFixed(size));
			}
			throw new TypeError('Only numeric argument allowed');
		}
	}];
	#ls = [];
	constructor() {
		this.reInit();
	}
	add(handler, name, ...types) {
		if(typeof handler !== 'function') {
			throw new TypeError('Invalid handler');
		}
		if(typeof name !== 'string') {
			throw new TypeError('Invalid name');
		}
		for(const ty of types) {
			if(Types.name(ty) === null) {
				throw new TypeError(`Invalid type: ${JSON.stringify(ty)}`);
			}
		}
		if(name.at() !== '_') {
			name = `_${name}`;
		}
		this.#fns.push({
			name: name,
			ty: types,
			fn: handler
		});
		this.reInit();
	}
	reInit() {
		this.#ls = this.#fns.map(({ name, ty }) => ty.map(t => `${t}.${name}`)).flat(1);
		// console.log('FN LIST:', this.#ls);
	}
	exists(type, fnname) {
		if(this.#ls.includes(`${type}.${fnname}`)) { return 1; }
		if(this.#ls.includes(`any.${fnname}`)) { return 2; }
		return false;
	}
	getFn(type, fnname) {
		const exists = this.exists(type, fnname);
		let ty;
		switch(exists) {
			case false: return null;
			case 1: ty = type; break;
			case 2: ty = 'any'; break;
		}
		for(const item of this.#fns) {
			if(item.name === fnname && item.ty.includes(ty)) {
				return item.fn;
			}
		}
		return null;
	}
	runFn(type, fnname, input, args) {
		if(fnname.at() === '_') {
			const fn = this.getFn(type, fnname);
			if(typeof fn !== 'function') {
				return Ret.Invalid(`Function missing: "${type}.${fnname}";`);
			}
			try {
				const value = fn(input, ...args);
				if(typeof value === 'undefined') {
					return Ret.Invalid(`Function ${type}.${fnname} Error; Failed; Received: ${JSON.stringify(input)}`);
				}
				if(value instanceof Ret) {
					if(!value.valid) {
						value.error = `Function ${type}.${fnname} Error; ${value.error??''}; Received: ${JSON.stringify(input)}`;
					}
					return value;
				}
				return Ret.Valid(value);
			} catch (error) {
				return Ret.Invalid(`Function ${type}.${fnname} Error; ${error.message}; Received: ${JSON.stringify(input)}`);
			}
		} else {
			if(typeof input[fnname] === 'function') {
				try {
					const value = input[fnname](...args);
					return Ret.Valid(value);
				} catch (error) {
					return Ret.Invalid(`Function ${type}.${fnname} Error; ${error.message}; Received: ${JSON.stringify(input)}`);
				}
			} else {
				return Ret.Invalid(`There is no native function '${fnname}' for type '${Object.prototype.toString.call(input)}'`);
			}
		}
	}
}
/*************************
 * DataValidator
 *************************/
export class DataValidator {
	static New(strs, ...exps) {
		function expToStr(exp) {
			switch (typeof exp) {
				case 'object': return JSON.stringify(exp);
				case 'function': return expToStr(exp());
				default: return String(exp);
			}
		}
		let struct = [];
		for(let i = 0, l = strs.length - 1; i < l; i++) {
			struct.push(strs[i]);
			struct.push(expToStr(exps[i]));
		}
		struct.push(strs[strs.length - 1]);
		struct = struct.join('');
		try {
			const dv = new DataValidator(Parser.parse(struct));
			dv.__structureSyntax__ = struct;
			return dv;
		} catch (err) {
			if(err instanceof Parser.SyntaxError) {
				throw new Error(`Parse Error; Line:${err.location.start.line}; Column:${err.location.start.column}; ${err.message}`);
			} else {
				throw new Error(err.message);
			}
		}
	}
	static #arrayListMaker(list) {
		list.idx = -1;
		list.len = list.length - 1;
		list.rpt = 0;
		list.next = function(lastError = false) {
			// console.log('\t\tnext called; idx:', this.idx, '; len:', this.len, '; rpt:', this.rpt, '; fail:', lastError);
			if(this.rpt === 0) {
				this.idx++;
				this.rpt = 'reset';
				if(this.idx > this.len) {
					return 'error';
				}
				return this.next();
			}
			if(this.rpt === 'reset') {
				this.rpt = this[this.idx].rpt ?? 1;
				return this.next(lastError);
			}
			if(this.rpt === 'yes') {
				if(lastError) {
					if(this.idx === this.len) {
						return 'error';
					}
					this.rpt = 0;
					return this.next(lastError);
				} else {
					return this[this.idx];
				}
			}
			this.rpt--;
			return this[this.idx];
		};
	}
	static #checkStruct(struct, depth = 0) {
		if(!isObject(struct)) { return Ret.Invalid('Not an object'); }

		const {ty = null, fn: fns = [], nx = null} = struct;

		// console.log(`${''.padStart(depth * 4, ' ')}CHECKING:`, struct);
		if(typeof ty !== 'string' || Types.name(ty) === null) {
			return Ret.Invalid(`Unknown type: ${JSON.stringify(ty)}`);
		}
		{
			let prefixer = null;
			switch(ty) {
				case '@obj@':
					prefixer = idx => `{${idx}}`;
					break;
				case '@arr@':
					prefixer = idx => `[${idx}]`;
					break;
				case '@or@':
					prefixer = idx => '(multi-type)';
					break;
				default:
					break;
			}
			if(prefixer !== null) {
				const list = struct.ls ?? [];
				for(const [idx, item] of Object.entries(list)) {
					const test = DataValidator.#checkStruct(item, depth + 1);
					if(!test.valid) {
						test.error = `${prefixer(idx)}: ${test.error}`;
						return test;
					}
				}
			}
		}
		for(const f of fns) {
			if(f.fn.at() === '_' && !Funcs.exists(ty, f.fn)) {
				return Ret.Invalid(`Unknown Function: '${ty}.${f.fn}'`);
			}
		}
		if(nx !== null) {
			const nxTest = DataValidator.#checkStruct(nx, depth + 1);
			if(!nxTest.valid) {
				nxTest.error = `${Types.name(ty)}\n=> ${nxTest.error}`;
				return nxTest;
			}
		}
		return Ret.Valid();
	}
	#struct;
	constructor(struct, checkStruct = true) {
		if(!!checkStruct) {
			const test = DataValidator.#checkStruct(struct);
			if(test.error !== null) {
				throw new Error(`StructError: ${test.error}`);
			}
		}
		this.#struct = struct;
	}
	get struct() {
		return this.#struct;
	}
	validate(value) {
		return DataValidator.#validate(value, this.#struct);
	}
	static #validate(input, struct, depth = 0) {
		// const padding = ''.padStart(depth * 4, ' ');
		// console.log(`${padding}VALIDATING: struct = `, struct,'; value = ', input);

		const {ty = null, fn: fns = [], nx = null} = struct;
		switch(ty) {
			case '@arr@': {
				if(!Array.isArray(input)) {
					return Ret.Invalid(`Expected array; Received ${JSON.stringify(input)};`)
				}
				const ret = [];
				const list = struct.ls ?? [];
				DataValidator.#arrayListMaker(list);
				let nxtTy = list.next();
				const entries = Object.entries(input);
				for (let e = 0, eout = entries.length; e < eout; e++) {
					const [idx, item] = entries[e];
					if (nxtTy === 'error') {
						return Ret.Invalid(`[${idx}] Index out of bounds`);
					}
					let test = DataValidator.#validate(item, nxtTy, depth + 1);
					if (!test.valid) {
						if (list.more === 'many' && list.idx !== list.len) {
							nxtTy = list.next(true);
							e--;
							continue;
						} else {
							return Ret.Invalid(`[${idx}]: ${test.error}`);
						}
					}
					// ret[idx] = test.value; // Allows empty slots in array
					ret.push(test.value);
					nxtTy = list.next();
				}
				input = ret;
			} break;
			case '@obj@': {
				if (!isObject(input)) {
					return Ret.Invalid(`Expected object; Received ${JSON.stringify(input)};`)
				}
				const list = struct.ls ?? {};
				for(const [k, {def}] of Object.entries(list)) {
					if(typeof def !== 'undefined' && typeof input[k] === 'undefined') {
						input[k] = def;
					}
				}
				const keys = Object.keys(list);
				{
					const req = keys.filter(k => list[k].rq ?? false);
					const ipk = Object.keys(input)
					const missingKeys = [];
					for (const r of req) {
						if (!ipk.includes(r)) {
							missingKeys.push(`{${r}}`);
						}
					}
					if (missingKeys.length !== 0) {
						return Ret.Invalid(`Missing object key(s): ${missingKeys.join(', ')}; Received ${JSON.stringify(input)};`)
					}
				}
				const keep = struct.kp ?? false;
				const ret = {};
				for (const [k, item] of Object.entries(input)) {
					if (keys.includes(k)) {
						const test = DataValidator.#validate(item, list[k], depth + 1);
						if (!test.valid) {
							return Ret.Invalid(`{${k}}: ${test.error}`);
						}
						ret[k] = test.value;
					} else if (keep) {
						ret[k] = item;
					}
				}
				input = ret;
			} break;
			case '@or@': {
				const list = struct.ls ?? [];
				let test = null;
				for (const item of list) {
					test = DataValidator.#validate(input, item, depth + 1);
					if (test.valid) {
						break;
					}
				}
				if (test === null || !test.valid) {
					return Ret.Invalid(`Expected type(s): (${list.map(item => item.ty ?? 'undefined').join('|')}); Received: ${JSON.stringify(input)};`);
				}
				input = test.value;
			} break;
			default: {
				const test = Types.parse(ty, input);
				if(!test.valid) {
					return Ret.Invalid(`Expected type: ${Types.getName(ty)}; Received: ${JSON.stringify(input)};`);
				}
				input = test.value;
			} break;
		}
		for(const f of fns) {
			let {fn = 'undefined', args = []} = f;
			const test = Funcs.runFn(ty, fn, input, args);
			if(!test.valid) {
				test.error ??= `Cannot convert ${JSON.stringify(input)};`;
				return Ret.Invalid(`Formatter '${Types.name(ty)}.${fn}' error: ${test.error}`);
			}
			// console.log(`\n${padding}Formatter:`, fn, '; args:', args, `;\n${padding}pre-value:`, input, `\n${padding}post-value:`, test.value);
			input = test.value;
		}
		if(nx !== null) {
			const nxTest = DataValidator.#validate(input, nx, depth + 1);
			if(!nxTest.valid) {
				nxTest.error = `${Types.name(ty)}\n=> ${nxTest.error}`;
				return nxTest;
			}
			input = nxTest.value;
		}
		return Ret.Valid(input);
	}
}