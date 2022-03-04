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
			peg_c10 = "...",
			peg_c11 = peg_literalExpectation("...", false),
			peg_c12 = function (head, tail, keep) { return { items: Object.fromEntries([head, ...tail]), keep: keep !== null }; },
			peg_c13 = function (list, fn) {
				list ??= {};
				const ret = type_maker({ ty: "@obj@", ls: list.items ?? [], fn: fn });
				if (list.keep ?? false) { ret.kp = true; }
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
			peg_c47 = function (head, tail) { return Object.fromEntries([head, ...tail]); },
			peg_c48 = function (members) { return members !== null ? members : {}; },
			peg_c49 = peg_otherExpectation("key:val pair"),
			peg_c50 = function (name, value) { return [name, value]; },
			peg_c51 = peg_otherExpectation("key"),
			peg_c52 = function () { return text(); },
			peg_c53 = peg_otherExpectation("identifier"),
			peg_c54 = /^[_a-z$]/i,
			peg_c55 = peg_classExpectation(["_", ["a", "z"], "$"], false, true),
			peg_c56 = /^[0-9a-z$_]/i,
			peg_c57 = peg_classExpectation([["0", "9"], ["a", "z"], "$", "_"], false, true),
			peg_c58 = function (values) { return values ?? []; },
			peg_c59 = peg_otherExpectation("value-list"),
			peg_c60 = peg_otherExpectation("number"),
			peg_c61 = "-",
			peg_c62 = peg_literalExpectation("-", false),
			peg_c63 = function () { return parseFloat(text()); },
			peg_c64 = /^[eE]/,
			peg_c65 = peg_classExpectation(["e", "E"], false, false),
			peg_c66 = "+",
			peg_c67 = peg_literalExpectation("+", false),
			peg_c68 = "0",
			peg_c69 = peg_literalExpectation("0", false),
			peg_c70 = /^[1-9]/,
			peg_c71 = peg_classExpectation([["1", "9"]], false, false),
			peg_c72 = /^[0-9]/,
			peg_c73 = peg_classExpectation([["0", "9"]], false, false),
			peg_c74 = peg_otherExpectation("string"),
			peg_c75 = "\"",
			peg_c76 = peg_literalExpectation("\"", false),
			peg_c77 = function (chars) { return chars.join(""); },
			peg_c78 = "'",
			peg_c79 = peg_literalExpectation("'", false),
			peg_c80 = "`",
			peg_c81 = peg_literalExpectation("`", false),
			peg_c82 = /^[^\0-\x1F\\"]/,
			peg_c83 = peg_classExpectation([["\0", "\x1F"], "\\", "\""], true, false),
			peg_c84 = function (esc) { return esc; },
			peg_c85 = /^[^\0-\x1F\\']/,
			peg_c86 = peg_classExpectation([["\0", "\x1F"], "\\", "'"], true, false),
			peg_c87 = /^[^\0-\x1F\\`]/,
			peg_c88 = peg_classExpectation([["\0", "\x1F"], "\\", "`"], true, false),
			peg_c89 = peg_otherExpectation("Escaped-Char"),
			peg_c90 = "\\\\",
			peg_c91 = peg_literalExpectation("\\\\", false),
			peg_c92 = function () { return '\\'; },
			peg_c93 = "\\\"",
			peg_c94 = peg_literalExpectation("\\\"", false),
			peg_c95 = function () { return '"'; },
			peg_c96 = "\\'",
			peg_c97 = peg_literalExpectation("\\'", false),
			peg_c98 = function () { return "'"; },
			peg_c99 = "\\`",
			peg_c100 = peg_literalExpectation("\\`", false),
			peg_c101 = function () { return "`"; },
			peg_c102 = "\\b",
			peg_c103 = peg_literalExpectation("\\b", false),
			peg_c104 = function () { return "\b"; },
			peg_c105 = "\\f",
			peg_c106 = peg_literalExpectation("\\f", false),
			peg_c107 = function () { return "\f"; },
			peg_c108 = "\\n",
			peg_c109 = peg_literalExpectation("\\n", false),
			peg_c110 = function () { return "\n"; },
			peg_c111 = "\\r",
			peg_c112 = peg_literalExpectation("\\r", false),
			peg_c113 = function () { return "\r"; },
			peg_c114 = "\\t",
			peg_c115 = peg_literalExpectation("\\t", false),
			peg_c116 = function () { return "\t"; },
			peg_c117 = "\\u",
			peg_c118 = peg_literalExpectation("\\u", false),
			peg_c119 = function (digits) { return String.fromCharCode(parseInt(digits, 16)); },
			peg_c120 = "[",
			peg_c121 = peg_literalExpectation("[", false),
			peg_c122 = "]",
			peg_c123 = peg_literalExpectation("]", false),
			peg_c124 = "(",
			peg_c125 = peg_literalExpectation("(", false),
			peg_c126 = ")",
			peg_c127 = peg_literalExpectation(")", false),
			peg_c128 = "{",
			peg_c129 = peg_literalExpectation("{", false),
			peg_c130 = "}",
			peg_c131 = peg_literalExpectation("}", false),
			peg_c132 = ":",
			peg_c133 = peg_literalExpectation(":", false),
			peg_c134 = ",",
			peg_c135 = peg_literalExpectation(",", false),
			peg_c136 = peg_otherExpectation("whitespace"),
			peg_c137 = /^[ \t\n\r]/,
			peg_c138 = peg_classExpectation([" ", "\t", "\n", "\r"], false, false),
			peg_c139 = peg_otherExpectation("hex-char"),
			peg_c140 = /^[0-9a-f]/i,
			peg_c141 = peg_classExpectation([["0", "9"], ["a", "f"]], false, true),

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
								s5 = peg_currPos;
								s6 = peg_parseCOMMA();
								if (s6 !== peg_FAILED) {
									if (input.substr(peg_currPos, 3) === peg_c10) {
										s7 = peg_c10;
										peg_currPos += 3;
									} else {
										s7 = peg_FAILED;
										if (peg_silentFails === 0) { peg_fail(peg_c11); }
									}
									if (s7 !== peg_FAILED) {
										s6 = [s6, s7];
										s5 = s6;
									} else {
										peg_currPos = s5;
										s5 = peg_FAILED;
									}
								} else {
									peg_currPos = s5;
									s5 = peg_FAILED;
								}
								if (s5 === peg_FAILED) {
									s5 = null;
								}
								if (s5 !== peg_FAILED) {
									s6 = peg_parseCOMMA();
									if (s6 === peg_FAILED) {
										s6 = null;
									}
									if (s6 !== peg_FAILED) {
										peg_savedPos = s2;
										s3 = peg_c12(s3, s4, s5);
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
						} else {
							peg_currPos = s2;
							s2 = peg_FAILED;
						}
						if (s2 === peg_FAILED) {
							s2 = null;
						}
						if (s2 !== peg_FAILED) {
							s3 = peg_parseCCB();
							if (s3 !== peg_FAILED) {
								s4 = peg_parseFuncList();
								if (s4 === peg_FAILED) {
									s4 = null;
								}
								if (s4 !== peg_FAILED) {
									peg_savedPos = s0;
									s1 = peg_c13(s2, s4);
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
				if (input.substr(peg_currPos, 3) === peg_c10) {
					s1 = peg_c10;
					peg_currPos += 3;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c11); }
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
						s3 = peg_c47(s3, s4);
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
							s1 = peg_c48(s2);
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
						s1 = peg_c50(s1, s3);
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
							s1 = peg_c50(s1, s3);
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
				if (peg_silentFails === 0) { peg_fail(peg_c49); }
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
					s1 = peg_c52();
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
				if (peg_silentFails === 0) { peg_fail(peg_c51); }
			}

			return s0;
		}

		function peg_parseIdf() {
			let s0, s1, s2, s3, s4;

			peg_silentFails++;
			s0 = peg_currPos;
			s1 = peg_currPos;
			if (peg_c54.test(input.charAt(peg_currPos))) {
				s2 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s2 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c55); }
			}
			if (s2 !== peg_FAILED) {
				s3 = [];
				if (peg_c56.test(input.charAt(peg_currPos))) {
					s4 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s4 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c57); }
				}
				while (s4 !== peg_FAILED) {
					s3.push(s4);
					if (peg_c56.test(input.charAt(peg_currPos))) {
						s4 = input.charAt(peg_currPos);
						peg_currPos++;
					} else {
						s4 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c57); }
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
				s1 = peg_c52();
			}
			s0 = s1;
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c53); }
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
							s1 = peg_c58(s2);
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
				if (peg_silentFails === 0) { peg_fail(peg_c59); }
			}

			return s0;
		}

		function peg_parseNumber() {
			let s0, s1, s2, s3, s4, s5, s6;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 45) {
				s1 = peg_c61;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c62); }
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
							s1 = peg_c63();
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
				if (peg_silentFails === 0) { peg_fail(peg_c60); }
			}

			return s0;
		}

		function peg_parseSciNote() {
			let s0, s1, s2, s3, s4;

			s0 = peg_currPos;
			if (peg_c64.test(input.charAt(peg_currPos))) {
				s1 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c65); }
			}
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 45) {
					s2 = peg_c61;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c62); }
				}
				if (s2 === peg_FAILED) {
					if (input.charCodeAt(peg_currPos) === 43) {
						s2 = peg_c66;
						peg_currPos++;
					} else {
						s2 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c67); }
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
						s1 = peg_c52();
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
				s1 = peg_c68;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c69); }
			}
			if (s1 === peg_FAILED) {
				s1 = peg_currPos;
				if (peg_c70.test(input.charAt(peg_currPos))) {
					s2 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c71); }
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
				s1 = peg_c52();
			}
			s0 = s1;

			return s0;
		}

		function peg_parseDigit() {
			let s0;

			if (peg_c72.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c73); }
			}

			return s0;
		}

		function peg_parseString() {
			let s0, s1, s2, s3;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.charCodeAt(peg_currPos) === 34) {
				s1 = peg_c75;
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c76); }
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
						s3 = peg_c75;
						peg_currPos++;
					} else {
						s3 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c76); }
					}
					if (s3 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c77(s2);
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
					s1 = peg_c78;
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c79); }
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
							s3 = peg_c78;
							peg_currPos++;
						} else {
							s3 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c79); }
						}
						if (s3 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c77(s2);
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
						s1 = peg_c80;
						peg_currPos++;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c81); }
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
								s3 = peg_c80;
								peg_currPos++;
							} else {
								s3 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c81); }
							}
							if (s3 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c77(s2);
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
				if (peg_silentFails === 0) { peg_fail(peg_c74); }
			}

			return s0;
		}

		function peg_parseCharDQ() {
			let s0, s1;

			if (peg_c82.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c83); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c84(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseCharSQ() {
			let s0, s1;

			if (peg_c85.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c86); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c84(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseCharBQ() {
			let s0, s1;

			if (peg_c87.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c88); }
			}
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				s1 = peg_parseEscChar();
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c84(s1);
				}
				s0 = s1;
			}

			return s0;
		}

		function peg_parseEscChar() {
			let s0, s1, s2, s3, s4, s5, s6, s7;

			peg_silentFails++;
			s0 = peg_currPos;
			if (input.substr(peg_currPos, 2) === peg_c90) {
				s1 = peg_c90;
				peg_currPos += 2;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c91); }
			}
			if (s1 !== peg_FAILED) {
				peg_savedPos = s0;
				s1 = peg_c92();
			}
			s0 = s1;
			if (s0 === peg_FAILED) {
				s0 = peg_currPos;
				if (input.substr(peg_currPos, 2) === peg_c93) {
					s1 = peg_c93;
					peg_currPos += 2;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c94); }
				}
				if (s1 !== peg_FAILED) {
					peg_savedPos = s0;
					s1 = peg_c95();
				}
				s0 = s1;
				if (s0 === peg_FAILED) {
					s0 = peg_currPos;
					if (input.substr(peg_currPos, 2) === peg_c96) {
						s1 = peg_c96;
						peg_currPos += 2;
					} else {
						s1 = peg_FAILED;
						if (peg_silentFails === 0) { peg_fail(peg_c97); }
					}
					if (s1 !== peg_FAILED) {
						peg_savedPos = s0;
						s1 = peg_c98();
					}
					s0 = s1;
					if (s0 === peg_FAILED) {
						s0 = peg_currPos;
						if (input.substr(peg_currPos, 2) === peg_c99) {
							s1 = peg_c99;
							peg_currPos += 2;
						} else {
							s1 = peg_FAILED;
							if (peg_silentFails === 0) { peg_fail(peg_c100); }
						}
						if (s1 !== peg_FAILED) {
							peg_savedPos = s0;
							s1 = peg_c101();
						}
						s0 = s1;
						if (s0 === peg_FAILED) {
							s0 = peg_currPos;
							if (input.substr(peg_currPos, 2) === peg_c102) {
								s1 = peg_c102;
								peg_currPos += 2;
							} else {
								s1 = peg_FAILED;
								if (peg_silentFails === 0) { peg_fail(peg_c103); }
							}
							if (s1 !== peg_FAILED) {
								peg_savedPos = s0;
								s1 = peg_c104();
							}
							s0 = s1;
							if (s0 === peg_FAILED) {
								s0 = peg_currPos;
								if (input.substr(peg_currPos, 2) === peg_c105) {
									s1 = peg_c105;
									peg_currPos += 2;
								} else {
									s1 = peg_FAILED;
									if (peg_silentFails === 0) { peg_fail(peg_c106); }
								}
								if (s1 !== peg_FAILED) {
									peg_savedPos = s0;
									s1 = peg_c107();
								}
								s0 = s1;
								if (s0 === peg_FAILED) {
									s0 = peg_currPos;
									if (input.substr(peg_currPos, 2) === peg_c108) {
										s1 = peg_c108;
										peg_currPos += 2;
									} else {
										s1 = peg_FAILED;
										if (peg_silentFails === 0) { peg_fail(peg_c109); }
									}
									if (s1 !== peg_FAILED) {
										peg_savedPos = s0;
										s1 = peg_c110();
									}
									s0 = s1;
									if (s0 === peg_FAILED) {
										s0 = peg_currPos;
										if (input.substr(peg_currPos, 2) === peg_c111) {
											s1 = peg_c111;
											peg_currPos += 2;
										} else {
											s1 = peg_FAILED;
											if (peg_silentFails === 0) { peg_fail(peg_c112); }
										}
										if (s1 !== peg_FAILED) {
											peg_savedPos = s0;
											s1 = peg_c113();
										}
										s0 = s1;
										if (s0 === peg_FAILED) {
											s0 = peg_currPos;
											if (input.substr(peg_currPos, 2) === peg_c114) {
												s1 = peg_c114;
												peg_currPos += 2;
											} else {
												s1 = peg_FAILED;
												if (peg_silentFails === 0) { peg_fail(peg_c115); }
											}
											if (s1 !== peg_FAILED) {
												peg_savedPos = s0;
												s1 = peg_c116();
											}
											s0 = s1;
											if (s0 === peg_FAILED) {
												s0 = peg_currPos;
												if (input.substr(peg_currPos, 2) === peg_c117) {
													s1 = peg_c117;
													peg_currPos += 2;
												} else {
													s1 = peg_FAILED;
													if (peg_silentFails === 0) { peg_fail(peg_c118); }
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
														s1 = peg_c119(s2);
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
				if (peg_silentFails === 0) { peg_fail(peg_c89); }
			}

			return s0;
		}

		function peg_parseOSB() {
			let s0, s1, s2, s3;

			s0 = peg_currPos;
			s1 = peg_parse_();
			if (s1 !== peg_FAILED) {
				if (input.charCodeAt(peg_currPos) === 91) {
					s2 = peg_c120;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c121); }
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
					s2 = peg_c122;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c123); }
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
					s2 = peg_c124;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c125); }
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
					s2 = peg_c126;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c127); }
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
					s2 = peg_c128;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c129); }
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
					s2 = peg_c130;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c131); }
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
					s2 = peg_c132;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c133); }
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
					s2 = peg_c134;
					peg_currPos++;
				} else {
					s2 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c135); }
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
			if (peg_c137.test(input.charAt(peg_currPos))) {
				s1 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c138); }
			}
			while (s1 !== peg_FAILED) {
				s0.push(s1);
				if (peg_c137.test(input.charAt(peg_currPos))) {
					s1 = input.charAt(peg_currPos);
					peg_currPos++;
				} else {
					s1 = peg_FAILED;
					if (peg_silentFails === 0) { peg_fail(peg_c138); }
				}
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c136); }
			}

			return s0;
		}

		function peg_parseHexDig() {
			let s0, s1;

			peg_silentFails++;
			if (peg_c140.test(input.charAt(peg_currPos))) {
				s0 = input.charAt(peg_currPos);
				peg_currPos++;
			} else {
				s0 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c141); }
			}
			peg_silentFails--;
			if (s0 === peg_FAILED) {
				s1 = peg_FAILED;
				if (peg_silentFails === 0) { peg_fail(peg_c139); }
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