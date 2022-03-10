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
	/ OSB list:(head: ArrayFormat tail:(COMMA v:ArrayFormat { return v; } )* COMMA? { return [head, ...tail]; })? CSB fn:FuncList?
		{ return type_maker({ ty: "@arr@", ls:list??[], fn: fn }); }
	/ OCB list:(
		head:IdfVal tail:(COMMA v:IdfVal { return v; })* { return Object.fromEntries([head, ...tail]); }
	)? keep:(COMMA "...")? COMMA? CCB fn:FuncList?
	{
		const ret = type_maker({ ty: "@obj@", ls :list, fn: fn });
		if(keep ?? false) { ret.kp = true; }
		return ret;
	}
	/ ty:Idf fn:FuncList? {
		return type_maker({ ty:ty, fn:fn });
	}

IdfVal "identifier:data-type pair" = opt:"?"? name:Idf def:(ORB _ "=" _ v:Value CRB { return {val:v}; } )? COLON value:Format
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
	= ".." count:SimpleUnsigned ".." _ {return parseFloat(count);}
	/ "..." _ { return 'yes'; }
	
FuncList "function-list" = head:Func tail:Func* { return [head, ...tail ]; }
Func "function" = _ "." func:Idf args:(ORB vl:ValueList? CRB { return vl; } )?
	{
		const ret = {fn: func};
		if(args) { ret.args = args; }
		return ret;
	}

// ----- JSON++ -----
Value = False / Null / True / Object / Array / Number / String

// ----- Null -----
Null = "null" { return null; }

// ----- Bool -----
Bool "bool" = True / False
False = "false" { return false; }
True = "true" { return true; }

// ----- Object -----
Object "object"
	= OCB members:(
		head:KeyVal tail:(COMMA m:KeyVal { return m; })* { return Object.fromEntries([head, ...tail]); }
	)? COMMA? CCB { return members !== null ? members: {}; }
KeyVal "key:val pair"
	= name:String COLON value:Value { return [name, value]; }
	/ name:KeyChain COLON value:Value { return [name, value]; }
KeyChain "key" = Idf ("." Idf)* { return text(); }
Idf "identifier" = ([_a-z$]i [0-9a-z$_]i*) { return text(); }
// ----- Array -----
Array = OSB values:ValueList? COMMA? CSB { return values ?? []; }
ValueList "value-list" = head:Value tail:(COMMA v:Value { return v; })* { return [head, ...tail ]; }
// ----- Number -----
Number "number" = "-"? SimpleUnsigned ("." Digit+)? SciNote? { return parseFloat(text()); }
SciNote = [eE] ("-" / "+")? Digit+ { return text(); }
SimpleUnsigned = ("0" / ([1-9] Digit*)) { return text(); }
Digit = [0-9]

// ----- String -----
String "string"
	= '"' chars:CharDQ* '"' { return chars.join(""); }
	/ "'" chars:CharSQ* "'" { return chars.join(""); }
	/ '`' chars:CharBQ* '`' { return chars.join(""); }
CharDQ
	= [^\0-\x1F\x5C\x22]
	/ esc:EscChar { return esc; }
CharSQ
	= [^\0-\x1F\x5C\x27]
	/ esc:EscChar { return esc; }
CharBQ
	= [^\0-\x1F\x5C\x60]
	/ esc:EscChar { return esc; }
EscChar "Escaped-Char"
	= '\\\\' {return '\\'; }
	/ '\\"' {return '"'; }
	/ "\\'" {return "'"; }
	/ '\\`' {return "`"; }
	/ '\\b' {return "\b"; }
	/ '\\f' {return "\f"; }
	/ '\\n' {return "\n"; }
	/ '\\r' {return "\r"; }
	/ '\\t' {return "\t"; }
	/ "\\u" digits:$(HexDig HexDig HexDig HexDig)
		{ return String.fromCharCode(parseInt(digits, 16)); }

// ----- Other -----
OSB = _ "[" _
CSB = _ "]" _

ORB = _ "(" _
CRB = _ ")" _

OCB = _ "{" _
CCB = _ "}" _

//OAB = _ "<" _
//CAB = _ ">" _

COLON = _ ":" _
COMMA = _ "," _
// OR = _ "|" _
// ARROW = _ "=>" _
// EQ = _ "=" _

_ "whitespace" = [ \t\n\r]*
HexDig "hex-char" = [0-9a-f]i