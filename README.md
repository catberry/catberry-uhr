#Universal HTTP(S) request for catberry[![Build Status](https://travis-ci.org/pragmadash/catberry-uhr.png?branch=master)](https://travis-ci.org/pragmadash/catberry-uhr)
[![NPM](https://nodei.co/npm/catberry-uhr.png)](https://nodei.co/npm/catberry-uhr/)

##Description
Catberry's modules run both at server and browser and it is very useful to have universal http(s) request implementation.

It has one interface and different implementations on server and browser.

At server it uses node's "http.request" or "https.request" (depend on specified protocol in URL).
At browser it uses jQuery AJAX implementation.

This module was developed using [HTTP/1.1v2 RFC 2616](http://www.w3.org/Protocols/rfc2616).

It supports:

 * gzip and deflate request/response content encodings
 * application/json and application/x-www-form-urlencoded request/response content types
 * Request timeout
 * Auto stringify/parse request/response data
 * HTTP/HTTPS
 * Any additional HTTP headers you set

This service has following methods.

```javascript
/**
 * Does GET request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @param {Function<Error, Object, string>?} callback Callback on finish
 * with error, status object and data.
 */
UHRBase.prototype.get = function (url, options, callback) { }

/**
 * Does POST request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Request options.
 * @param {Function<Error, Object, string>?} callback Callback on finish
 * with error, status object and data.
 */
UHRBase.prototype.post = function (url, options, callback) { }

/**
 * Does PUT request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @param {Function<Error, Object, string>?} callback Callback on finish
 * with error, status object and data.
 */
UHRBase.prototype.put = function (url, options, callback) { }

/**
 * Does DELETE request to HTTP server.
 * @param {string} url URL to request.
 * @param {Object} options Object with options.
 * @param {Function<Error, Object, string>?} callback Callback on finish
 * with error, status object and data.
 */
UHRBase.prototype.delete = function (url, options, callback) { }

/**
 * Does request with specified parameters.
 * @param {Object} parameters Request parameters.
 * @param {Function<Error, Object, string>?} callback Callback on finish
 * with error, status object and data.
 */
UHRBase.prototype.request = function (parameters, callback) { }
```

Options support:

```javascript
{
	timeout: 30000,
	headers: {
		Cookie: 'name=value'
	},
	data: {
		parameter: 'value'
	}
}
```

In case you do GET/DELETE request "data" will be passed as query string otherwise it will be passed as JSON via request stream.

In callback you always receive:

* Error (if it has happened)
* Status object with HTTP status code, status text and response headers
* Response body as plain text

Status object looks like this:

```javascript
{
	code: 200,
	text: OK,
	headers: {
		'Cache-Control': 'no-cache',
        'Content-Length': '1',
        'Content-Type': 'text/html; charset=utf-8',
        'Date': 'Tue, 08 Apr 2014 05:16:19 GMT'
	}
}
```

##Usage
To use this module you must register its components into catberry's [Service Locator](https://github.com/pragmadash/catberry-locator) like this:

In server.js

```javascript
var uhr = require('catberry-uhr'),
	catberry = require('catberry'),
	config = require('./config-server'),
	app = connect();
	cat = catberry.create(config);

// register UHR components
uhr.registerOnServer(cat.locator);

app.use(cat.getMiddleware());
...
```

In client.js

```javascript
var uhr = require('catberry-uhr'),
	catberry = require('catberry'),
	config = require('./config-client'),
	cat = catberry.create(config);

// register localization components in locator
uhr.registerOnClient(cat.locator);

```

And then you can just inject $localizationProvider into you module and use like this:

```javascript
function Module($uhr) {
	this._uhr = $uhr;
}

Module.prototype.render(placeholderName, args, callback) {
	var options = {
		timeout: 3000,
		data: {
			username: 'some
		},
		headers: {
			Cookie: args.$$.$cookies.toString()
		}
	};
	this._uhr.get('http://localhost/api/user', options,
    		function (error, status, data) {
    			if (error) {
    				callback(error);
    				return;
    			}
    			callback(null, data);
    		});
	...
}
```

##Contribution
If you have found a bug, please create pull request with mocha unit-test which reproduces it or describe all details in issue if you can not implement test.
If you want to propose some improvements just create issue or pull request but please do not forget to use **npm test** to be sure that you code is awesome.

All changes should satisfy this [Code Style Guide](https://github.com/pragmadash/catberry/blob/master/docs/code-style.md).

Also your changes should be covered by unit tests using [mocha](https://www.npmjs.org/package/mocha).

Denis Rechkunov <denis.rechkunov@gmail.com>
