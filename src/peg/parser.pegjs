{
	function type_maker({ty, fn = null, ls = null}) {
		const ret = { ty: ty };
		if(fn !== null) { ret.fn = fn; }
		if(ls !== null) { ret.ls = ls; }
		return ret;
	}
}

Format = _ head:Type tail:(_ "=>" _ v:Type { return v;})*
	{
		let chain = [head, ...tail];
		while(chain.length > 1) {
			const last = chain.pop();
			chain[chain.length - 1].nx = last;
		}
		return chain[0];
	}
	/ _ Type

Type = ORB head:Format tail:(_ "|" _ v:Format { return v; })* CRB fn:FuncList?
		{
			const ls = [head, ...tail];
			if(ls.length === 1) {
				let fnList = [...ls[0]?.fn ?? [], ...(fn ?? [])];
				if(fnList.length === 0) { fnList = null; }
				return type_maker({ ...ls[0], fn: fnList });
			}
			return type_maker({ ty: "@or@", ls: ls, fn: fn });
		}
	/ OSB list:(head: ArrayFormat tail:(
    		COMMA v:ArrayFormat { return v; }
		)* COMMA? { return [head, ...tail]; })? CSB fn:FuncList?
		{ return type_maker({ ty: "@arr@", ls:list??[], fn: fn }); }
	/ OCB list:(
		head:IdfVal tail:(COMMA v:IdfVal { return v; })*
        	{ return Object.fromEntries([head, ...tail]); }
	)? keep:(COMMA "...")? COMMA? CCB fn:FuncList?
	{
		const ret = type_maker({ ty: "@obj@", ls :list, fn: fn });
		if(keep ?? false) { ret.kp = true; }
		return ret;
	}
	/ ty:Idf fn:FuncList? {
		return type_maker({ ty:ty, fn:fn });
	}

IdfVal "identifier:data-type pair" = opt:"?"? name:(Idf / String) def:(
		ORB _ "=" _ v:Value CRB { return {val:v}; }
    )? COLON value:Format
	{
		if(opt === null) { value.rq = true; }
		if(def !== null) { value.def = def.val; }
		return [name, value] ;
	}
ArrayFormat = repeat:MoreCount? format:Format
	{
		if(repeat) { format.rpt = repeat; }
		return format;
	}

MoreCount "repeat-count"
	= ".." count:Number ".." _ {return Math.floor(Math.abs(count))}
	/ "..." _ { return 'yes'; }
	
FuncList "function-list" = head:Func tail:Func* { return [head, ...tail ]; }
Func "function" = _ "." func:Idf args:(ORB vl:ValueList? COMMA? CRB { return vl; } )?
	{
		const ret = {fn: func};
		if(args) { ret.args = args; }
		return ret;
	}

// ----- JSON++ -----
Value
	= _ val:( Null / Undefined / True / False / Number / String ) _ { return val; }
	/ Object
    / Array

// ----- Object -----
Object "object"
	= OCB members:(
		head:KeyVal tail:(COMMA m:KeyVal { return m; })*
        	{ return Object.fromEntries([head, ...tail]); }
	)? COMMA? CCB { return members !== null ? members: {}; }
KeyVal "key:val pair" = name:( String / KeyChain ) COLON value:Value { return [name, value]; }
KeyChain "key" = $(Idf ("." Idf)*)
Idf "identifier" = $([_a-z$]i [0-9a-z$_]i*)

// ----- Array -----
Array = OSB values:ValueList? COMMA? CSB { return values ?? []; }
ValueList "value-list" = head:Value tail:(COMMA v:Value { return v; })* { return [head, ...tail ]; }

// ----- None -----
Null "null" = "null" { return null; }
Undefined "undefined" = "undefined" { return undefined; }

// ----- Bool -----
Bool "bool" = True / False
False = "false" { return false; }
True = "true" { return true; }

// ----- Number -----
Number "number"
	= neg:"-"? "0x" digits:$(HexDigit+) { return parseInt(`${neg ?? ''}${digits}`, 16); }
	/ neg:"-"? "0o" digits:$([0-7]+) { return parseInt(`${neg ?? ''}${digits}`, 8); }
	/ neg:"-"? "0b" digits:$([0-1]+) { return parseInt(`${neg ?? ''}${digits}`, 2); }
	/ "-"? Digit+ ("." Digit+)? ([eE] ("-" / "+")? Digit+)? { return parseFloat(text()); }

// ----- String -----
String "string"
	= '"' chars:(
		[^\0-\x1F\x5C\x22] // Printable except '\' and '"'
		/ SpecialChar
	)* '"' { return chars.join(""); }
	/ "'" chars:(
		[^\0-\x1F\x5C\x27] // Printable except '\' and "'"
		/ SpecialChar
	)* "'" { return chars.join(""); }
	/ '`' chars:(
		[^\0-\x1F\x5C\x60] // Printable except '\' and '`'
		/ SpecialChar
	)* '`' { return chars.join(""); }
SpecialChar
	= '\\\\' { return '\\'; }
	/ '\\"' { return '"'; }
	/ "\\'" { return "'"; }
	/ '\\`' { return '`'; }
	/ '\\b' { return '\b'; }
	/ '\\f' { return '\f'; }
	/ '\\n' { return '\n'; }
	/ '\\r' { return '\r'; }
	/ '\\t' { return '\t'; }
	/ "\\0" digits:$([0-7][0-7]?[0-7]?) { return String.fromCharCode(parseInt(digits, 8)); }
	/ "\\x" digits:$(HexDigit HexDigit) { return String.fromCharCode(parseInt(digits, 16)); }
	/ "\\u" digits:$(HexDigit HexDigit HexDigit HexDigit)
		{ return String.fromCharCode(parseInt(digits, 16)); }
	/ [\x0A] // Allowed line-feed in string literal
	/ [\x09] // Allowed tab in string literal

// ----- Other -----
_ "whitespace" = ([ \t\n\r] / Comment)*
Comment "Comment"
	= '/*' (
		[^\x2A] // Not *
		/ '*'![\x2F] // '*' Neg-Look-Ahead for '/'
	)* '*/' //{ return text().slice(2, -2).trim(); }
	/ '//' [^\x0A]* [\x0A]? //{ return text().slice(2).trim(); }

HexDigit "Hex-Char" = [0-9a-f]i
Digit = [0-9]

COMMA = _ "," _
COLON = _ ":" _

OSB = _ "[" _
CSB = _ "]" _

OCB = _ "{" _
CCB = _ "}" _

ORB = _ "(" _
CRB = _ ")" _