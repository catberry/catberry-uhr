#Universal HTTP(S) Request for Catberry 2 [![Build Status](https://travis-ci.org/catberry/catberry-uhr.png?branch=master)](https://travis-ci.org/catberry/catberry-uhr) [![Coverage Status](https://coveralls.io/repos/catberry/catberry-uhr/badge.png?branch=master)](https://coveralls.io/r/catberry/catberry-uhr?branch=master)
[![NPM](https://nodei.co/npm/catberry-uhr.png)](https://nodei.co/npm/catberry-uhr/)

##Description
Catberry's modules run both at server and in browser and it is very useful to 
have universal HTTP(S) request implementation.

It has one interface and different implementations at server and in browser.

At server it uses node's [http.request](http://nodejs.org/api/http.html#http_event_request) 
or [https.request](http://nodejs.org/api/https.html#https_https_request_options_callback)
(depend on specified protocol in URL).
At browser it uses native [XmlHttpRequest](https://developer.mozilla.org/ru/docs/Web/API/XMLHttpRequest).

This module was developed using [HTTP/1.1v2 RFC 2616](http://www.w3.org/Protocols/rfc2616).

It supports:

 * `gzip` and `deflate` request/response content encodings
 * `application/json` and `application/x-www-form-urlencoded` 
 request/response content types
 * Request timeout
 * Auto stringify/parse request/response data
 * HTTP/HTTPS
 * Any additional HTTP headers you set

UHR has following methods:

```javascript
/**
 * Does GET request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.get = function (url, options) { };

/**
 * Does POST request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.post = function (url, options) { };

/**
 * Does PUT request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.put = function (url, options) { };

/**
 * Does PATCH request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.patch = function (url, options) { };

/**
 * Does DELETE request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.delete = function (url, options) { };

/**
 * Does request with specified parameters.
 * @param {Object} parameters Request parameters.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.request = function (parameters) { };
```

##Request options example

```javascript
{
	method: 'GET',
	timeout: 30000,
	unsafeHTTPS: false, // require valid certificate by default
	headers: {
		Cookie: 'name=value'
	},
	data: {
		parameter: 'value' // all parameters will be URL encoded
	}
}
```

In case you do `POST`/`PUT`/`PATCH` request `data` will be passed as 
JSON via request stream otherwise it will be passed as query string.
Also if you put something to `data` field and use 
`application/x-www-form-urlencoded` then this data will be 
automatically [encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

##Returns promise
Any UHR request returns [Promise](https://www.promisejs.org) for request result.
Any error during request will reject promise.

Request result consist of following:

* Status object with HTTP status `code`, status `text` and response `headers`
* Response `content` as plain text or object 
(depends on `Content-Type` in response headers)

For example request result can be such object:

```javascript
{
	status: {
		code: 200,
		text: 'OK',
		headers: {
			'cache-control': 'no-cache',
			'content-length': '1',
			'content-type': 'text/html; charset=utf-8',
			'date': 'Tue, 08 Apr 2014 05:16:19 GMT'
		}
   },
   content: 'some content from server'
}
```

All header names are always in lower case like in node.

##Usage
If you are using [Catberry Framework](https://github.com/catberry/catberry)
it is already included and registered in [Service Locator](https://github.com/catberry/catberry/blob/master/docs/services/service-locator.md).

You can just inject `$uhr` into your module and use like this:

```javascript
function Module($uhr) {
	this._uhr = $uhr;
}

Module.prototype.render = function (placeholderName) {
	var options = {
			timeout: 3000,
			data: {
				username: 'some'
			},
			headers: {
				Authorization: 'Bearer somecrazytoken'
			}
		};
	return this._uhr.get('http://localhost/api/user', options)
		.then(function(result) {
			return result.content;
		});
};
```

##Contribution
If you have found a bug, please create pull request with [mocha](https://www.npmjs.org/package/mocha) 
unit-test which reproduces it or describe all details in issue if you can not 
implement test. If you want to propose some improvements just create issue or 
pull request but please do not forget to use `npm test` to be sure that your 
code is awesome.

All changes should satisfy this [Code Style Guide](https://github.com/catberry/catberry/blob/master/docs/code-style-guide.md).

Also your changes should be covered by unit tests using [mocha](https://www.npmjs.org/package/mocha).

Denis Rechkunov <denis.rechkunov@gmail.com>
