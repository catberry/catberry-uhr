# Universal/Isomorphic HTTP(S) Request for Catberry Framework

[![Build Status](https://travis-ci.org/catberry/catberry-uhr.svg?branch=master)](https://travis-ci.org/catberry/catberry-uhr) [![codecov.io](http://codecov.io/github/catberry/catberry-uhr/coverage.svg?branch=master)](http://codecov.io/github/catberry/catberry-uhr?branch=master)

## Description
Catberry's modules run both at the server and in a browser and it's very important to
have a Universal/Isomorphic HTTP(S) Request implementation.

It has the same interface and different implementations at the server and in a browser.

At the server it uses node's [http.request](http://nodejs.org/api/http.html#http_event_request)
or [https.request](http://nodejs.org/api/https.html#https_https_request_options_callback)
(depends on the specified protocol in URL).
In a browser it uses a native [XmlHttpRequest](https://developer.mozilla.org/ru/docs/Web/API/XMLHttpRequest).

This module has been developed using [HTTP/1.1v2 RFC 2616](http://www.w3.org/Protocols/rfc2616).

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
class UHRBase {
	/**
	 * Does a GET request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	get(url, parameters) {}

	/**
	 * Does a POST request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	post(url, parameters) {}

	/**
	 * Does a PUT request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	put(url, parameters) {}

	/**
	 * Does a PATCH request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	patch(url, parameters) {}

	/**
	 * Does a DELETE request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	delete(url, parameters) {}

	/**
	 * Does a request to the HTTP server.
	 * @param {string} url URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {string?} parameters.method The HTTP method for the request.
	 * @param {string?} parameters.url The URL for the request.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} The promise for a result with the status object and content.
	 */
	request(parameters) {}
}
```

## Request options example

```javascript
{
	method: 'GET',
	timeout: 30000,
	// sets value to XMLHttpRequest.withCredentials, works only in a browser
	withCredentials: false,
	unsafeHTTPS: false, // requires valid certificate by default
	headers: {
		Cookie: 'name=value'
	},
	data: {
		parameter: 'value' // all parameters will be URL encoded
	}
}
```

In case you're doing `POST`/`PUT`/`PATCH` requests, `data` object will
be passed as `application/x-www-form-urlencoded` via request stream.
If you set a `Content-Type` header to `application/json` then object will
be sent as JSON.

If `data` value is not an object then its string representation will be sent
as `text/plain` to the server.

Also, if you put anything to `data` object and use
`application/x-www-form-urlencoded` then this data will be
automatically [percent-encoded](http://en.wikipedia.org/wiki/Percent-encoding).

## Returns a promise
All UHR requests return a [Promise](https://www.promisejs.org) for request result.
Any error during request will reject the promise or it will be rejected by the request timeout.

Request result consists of following:

* The status object with HTTP status `code`, status `text` and response `headers`
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

All header names are always in a lower-case like they are in node.js.

## Usage
If you are using [Catberry Framework](https://github.com/catberry/catberry)
you have to register UHR into [Service Locator](https://github.com/catberry/catberry/blob/develop/docs/index.md#service-locator).

```javascript
const cat = catberry.create();
const uhr = require('catberry-uhr');

uhr.register(cat.locator);
```

Then you can just resolve `uhr` from the locator:

```javascript
class Store {
	constructor(locator) {
		this._uhr = locator.resolve('uhr');
	}
	load() {
		const options = {
			timeout: 3000,
			data: {
				username: 'some'
			},
			headers: {
				Authorization: 'Bearer somecrazytoken'
			}
		};
		return this._uhr.get('http://localhost/api/user', options)
			.then(result => result.content);
	}
}
```

## Contributing

There are a lot of ways to contribute:

* Give it a star
* Join the [Gitter](https://gitter.im/catberry/main) room and leave a feedback or help with answering users' questions
* [Submit a bug or a feature request](https://github.com/catberry/catberry-uhr/issues)
* [Submit a PR](https://github.com/catberry/catberry-uhr/blob/develop/CONTRIBUTING.md)

Denis Rechkunov <denis.rechkunov@gmail.com>
