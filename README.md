# Advanced JS Data Validator
A JS module for data validation of complexly-structured-data.

----
### ***Readme and examples are under construction. Please check later.***
----
## Installation:

```javascript

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