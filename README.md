# Advanced JS Data Validator
A JS module for data validation of complexly-structured-data.

----
### ***Readme and examples are under construction. Please check later.***
----
## Installation:

```javascript
<script type="module">
import { DataValidator } from 'https://cdn.jsdelivr.net/gh/anshu-krishna/JS-Data-Validator-Advanced@1.0/src/data-validator-min.js';

// Your code goes here
</script>
```

----

## Features:
* Supported types:
	* `any` :  Any value
	---
	* `bool` : Boolean value
	---
	* `null` : Null value
	---
	* `num` : Alias to float
	* `float` : Real-number value
	* `int` : Integer value
	* `unsigned` : Integer value >= 0 
	* `hex` : String containing a hex value
	---
	* `string` : String value
	* `base64` : String containing base64url encoded value
	* `email` : String containing an email address
	* `json` : String containing JSON value
	* `timestamp` : String containing a timestamp.\
					eg: '2021-01-31', '01-Jan-2021', 'January 1, 2021 05:00:10 AM GMT+05:30', etc.
	* `url` : String containing a URL

* Multiple alternative data types can be set for a data item. eg: `'int|float|null'`, `'email|null'`, etc.

* Data-Type/Structure can be transformed to another Data-Type/Structure(s) ***recursively***.

----
## Basic Example:
```javascript
import { DataValidator as DV } from './data-validator.js';

const dv = (() => {
	try {
		return DV.New`
		string.split('.') => [
			base64 => json => {
				alg: string.allowed('HS256', 'HS512'),
				typ: string.allowed('JWT'),
			},
			base64 => json => {
				?exp: unsigned,
				?iat: unsigned,
				?nbf: unsigned,
				?name: ([..2..string,].join(' ')|string),
				...
			},
			base64
		]`;
	} catch (error) {
		console.error(error);
		return null;
	}
})();

if(dv !== null) {
	{
		/*
		JWT HEAD = { "alg": "HS256", "typ": "JWT" }
		JWT PAYLOAD = { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
		*/
		const {valid, value, error} = dv.validate(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`);
		
		console.log('Result:\n\tValid:', valid, '\n\tValue:', value, '\n\tError:', error);
	}
	{
		/*
		JWT HEAD = { "alg": "HS256", "typ": "JWT" }
		JWT PAYLOAD = { "sub": "1234567890", "name": ["John","Doe"], "iat": 1516239022, "nbf": 1516239021, "exp": 1516239122 }
		*/
		const {valid, value, error} = dv.validate(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6WyJKb2huIiwiRG9lIl0sImlhdCI6MTUxNjIzOTAyMiwibmJmIjoxNTE2MjM5MDIxLCJleHAiOjE1MTYyMzkxMjJ9.obXwAnyGDz8UlzMjmo2gUVjyVj8tfkaoJanBSPErzz8`);
		
		console.log('Result:\n\tValid:', valid, '\n\tValue:', value, '\n\tError:', error);
	}
}
```
Output:
```
Result:
	Valid: true 
	Value: [{
			"alg": "HS256",
			"typ": "JWT"
		}, {
			"sub": "1234567890",
			"name": "John Doe",
			"iat": 1516239022
		},
		"IùJÇ\u0004IHÇ(]Oð¤Ç~:N²%_Úu\u000b,Ã"
	]
	Error: null

Result:
	Valid: true 
	Value: [{
			"alg": "HS256",
			"typ": "JWT"
		}, {
			"sub": "1234567890",
			"name": "John Doe",
			"iat": 1516239022,
			"nbf": 1516239021,
			"exp": 1516239122
		},
		"¡µð\u0002|\u000f?\u00143# QXòV?-~F¨%©ÁHñ+Ï?"
	]
	Error: null
```