# Universal HTTP(S) Request for Catberry [![Build Status](https://travis-ci.org/catberry/catberry-uhr.png?branch=master)](https://travis-ci.org/catberry/catberry-uhr) [![Coverage Status](https://coveralls.io/repos/catberry/catberry-uhr/badge.png?branch=master)](https://coveralls.io/r/catberry/catberry-uhr?branch=master)
[![NPM](https://nodei.co/npm/catberry-uhr.png)](https://nodei.co/npm/catberry-uhr/)

## Description
Catberry's modules run both at server and in browser and it is very useful to 
have universal HTTP(S) request implementation.

It has one interface and different implementations at the server and in a browser.

At the server it uses node's [http.request](http://nodejs.org/api/http.html#http_event_request)
or [https.request](http://nodejs.org/api/https.html#https_https_request_options_callback)
(depend on specified protocol in URL).
In a browser it uses native [XmlHttpRequest](https://developer.mozilla.org/ru/docs/Web/API/XMLHttpRequest).

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
 * @param {Object?} options Request parameters.
 * @param {Object?} options.headers HTTP headers to send.
 * @param {String|Object?} options.data Data to send.
 * @param {Number?} options.timeout Request timeout.
 * @param {Boolean?} options.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.get = function (url, options) { }

/**
 * Does POST request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object?} options Request parameters.
 * @param {Object?} options.headers HTTP headers to send.
 * @param {String|Object?} options.data Data to send.
 * @param {Number?} options.timeout Request timeout.
 * @param {Boolean?} options.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.post = function (url, options) { }

/**
 * Does PUT request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object?} options Request parameters.
 * @param {Object?} options.headers HTTP headers to send.
 * @param {String|Object?} options.data Data to send.
 * @param {Number?} options.timeout Request timeout.
 * @param {Boolean?} options.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.put = function (url, options) { }

/**
 * Does PATCH request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object?} options Request parameters.
 * @param {Object?} options.headers HTTP headers to send.
 * @param {String|Object?} options.data Data to send.
 * @param {Number?} options.timeout Request timeout.
 * @param {Boolean?} options.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.patch = function (url, options) { }

/**
 * Does DELETE request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object?} options Request parameters.
 * @param {Object?} options.headers HTTP headers to send.
 * @param {String|Object?} options.data Data to send.
 * @param {Number?} options.timeout Request timeout.
 * @param {Boolean?} options.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.delete = function (url, options) { }

/**
 * Does request with specified parameters.
 * @param {Object} parameters Request parameters.
 * @param {String} parameters.method HTTP method.
 * @param {String} parameters.url URL for request.
 * @param {Object?} parameters.headers HTTP headers to send.
 * @param {String|Object?} parameters.data Data to send.
 * @param {Number?} parameters.timeout Request timeout.
 * @param {Boolean?} parameters.unsafeHTTPS If true then requests
 * to servers with invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 */
UHRBase.prototype.request = function (parameters) { }
```

## Request options example

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

In case you do `POST`/`PUT`/`PATCH` requests then `data` object will
be passed as `application/x-www-form-urlencoded` via request stream.
If you set header `Content-Type` to `application/json` then object will
be sent as JSON.

If `data` value is not an object then its string representation will be sent
as `text/plain` to server.

Also if you put something to `data` object and use
`application/x-www-form-urlencoded` then this data will be 
automatically [percent-encoded](http://en.wikipedia.org/wiki/Percent-encoding).

## Returns a promise
All UHR requests return a [Promise](https://www.promisejs.org) for request result.
Any error during request will reject the promise.

Request result consist of following:

* Status object with HTTP status `code`, status `text` and response `headers`
* Response `content` as a plain text or an object
(depends on `Content-Type` in response headers)

For example, request result can be an object like this:

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

All header names are always in a lower-case like in node.

## Usage
If you are using [Catberry Framework](https://github.com/catberry/catberry)
it is already included and registered in [Service Locator](https://github.com/catberry/catberry/blob/master/docs/services/service-locator.md).

You can just inject `$uhr` into any module and use like this:

```javascript
function Store($uhr) {
	this._uhr = $uhr;
}

Store.prototype.load = function () {
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

## Contribution
If you have found a bug, please create pull request with [mocha](https://www.npmjs.org/package/mocha) 
unit-test which reproduces it or describe all details in an issue if you can not
implement test. If you want to propose some improvements just create an issue or
a pull request but please do not forget to use `npm test` to be sure that your
code is awesome.

All changes should satisfy this [Code Style Guide](https://github.com/catberry/catberry/blob/4.0.0/docs/code-style-guide.md).

Also your changes should be covered by unit tests using [mocha](https://www.npmjs.org/package/mocha).

Denis Rechkunov <denis.rechkunov@gmail.com>
