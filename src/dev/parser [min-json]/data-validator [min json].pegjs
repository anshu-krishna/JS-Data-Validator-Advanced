Format = _ head:Type tail:(Arrow v:Type { return v;})*
	{
		let chain = [head, ...tail];
		while(chain.length > 1) {
			const last = chain.pop();
			chain[chain.length - 1].nxt = last;
		}
		return chain[0];
	}
	/ _ Type

Type = ORB head:Format tail:(Or v:Format { return v; })* CRB rf:FuncList?
		{
			const opts = [head, ...tail];
			if(opts.length === 1) {
				const rfList = [...opts[0]?.rf ?? [], ...(rf ?? [])];
				if(rfList.length > 0) {
					opts[0].rf = frList;
				}
				return opts[0];
			}
			const ret = {ty: "@or@", opts: opts};
			if(rf) { ret.rf = rf; }
			return ret;
		}
	/ OSB list:(head: ArrayFormat tail:(Comma v:ArrayFormat { return v; } )* Comma? { return [head, ...tail]; })? CSB rf:FuncList?
		{
			const ret = {ty: "@arr@", list:list ?? []};
			if(rf) { ret.rf = rf; }
			return ret;
		}
	/ OCB list:(head:IdfVal tail:(Comma v:IdfVal { return v; })* keep:(Comma "...")? Comma?
			{ return {list: Object.fromEntries([head, ...tail]), keep: keep !== null}; }
	)? CCB rf:FuncList?
	{
		list ??= {};
		const ret = {ty: "@obj@", list:list?.list ?? []};
		if(list?.keep) {
			ret.keep_extra = true
		}
		if(rf) { ret.rf = rf; }
		return ret;
	}
	/ ty:Idf rf:FuncList? {
		const ret = {ty: ty};
		if(rf) { ret.rf = rf; }
		return ret;
	}

IdfVal "identifier:data-type pair"
	= opt:"?"? name:Idf Colon value:Format
		{
			value.opt = opt !== null;
			return [name, value] ;
		}
ArrayFormat = more:MoreCount? format:Format
	{
		if(more !== null) {
			format.more = more;
		} return format;
	}

MoreCount "repeat-count"
	= ".." count:PrimiInt ".." _ {return parseFloat(count);}
	/ "..." _ { return 'many'; }
	
FuncList "function-list" = head:Func tail:Func* { return [head, ...tail ]; }
Func "function" = _ "." func:Idf args:(ORB vl:ValueList? CRB { return vl; } )?
	{
		const ret = {fn: func};
		if(args) { ret.args = args; }
		return ret;
	}

// ----- JSON++ -----
ValueList "value-list" = head:Value tail:(Comma v:Value { return v; })* { return [head, ...tail ]; }
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
		head:KeyVal tail:(Comma m:KeyVal { return m; })* { return Object.fromEntries([head, ...tail]); }
	)? Comma? CCB { return members !== null ? members: {}; }
KeyVal "key:val pair"
	= name:String Colon value:Value { return [name, value]; }
	/ name:KeyChain Colon value:Value { return [name, value]; }
KeyChain "key" = Idf ("." Idf)* { return text(); }
Idf "identifier" = ([_a-z$]i [0-9a-z$_]i*) { return text(); }
// ----- Array -----
Array = OSB values:ValueList? Comma? CSB { return values ?? []; }

// ----- Number -----
Number "number" = "-"? PrimiInt ("." Digit+)? SciNote? { return parseFloat(text()); }
SciNote = [eE] ("-" / "+")? Digit+ { return text(); }
PrimiInt = ("0" / ([1-9] Digit*)) { return text(); }
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

Colon = _ ":" _
Comma = _ "," _
Or = _ "|" _
Arrow = _ "=>" _

_ "whitespace" = [ \t\n\r]*
HexDig = [0-9a-f]i