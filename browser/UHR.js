/*
 * catberry
 *
 * Copyright (c) 2014 Denis Rechkunov and project contributors.
 *
 * catberry's license follows:
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * This license applies to all parts of catberry that are not externally
 * maintained libraries.
 */

'use strict';

module.exports = UHR;

var UHRBase = require('../lib/UHRBase'),
	Promise = require('promise'),
	URI = require('catberry-uri').URI,
	util = require('util');

// if browser still does not have promises then add it.
if (!('Promise' in window)) {
	window.Promise = Promise;
}

util.inherits(UHR, UHRBase);

var NON_SAFE_HEADERS = {
	cookie: true,
	'accept-charset': true
};

var ERROR_CONNECTION = 'Connection error',
	ERROR_TIMEOUT = 'Request timeout',
	ERROR_ABORTED = 'Request aborted';

/**
 * Creates new instance of client-side HTTP(S) request implementation.
 * @param {Window} $window Current window object.
 * @constructor
 */
function UHR($window) {
	UHRBase.call(this);
	this.window = $window;
}

/**
 * Current instance of window.
 * @type {Window}
 */
UHR.prototype.window = null;

/**
 * Does request with specified parameters using protocol implementation.
 * @param {Object} parameters Request parameters.
 * @param {String} parameters.method HTTP method.
 * @param {String} parameters.url URL for request.
 * @param {URI} parameters.uri URI object.
 * @param {Object} parameters.headers HTTP headers to send.
 * @param {String|Object} parameters.data Data to send.
 * @param {Number} parameters.timeout Request timeout.
 * @param {Boolean} parameters.unsafeHTTPS If true then requests to servers with
 * invalid HTTPS certificates are allowed.
 * @returns {Promise<Object>} Promise for result with status object and content.
 * @protected
 */
UHR.prototype._doRequest = function (parameters) {
	var self = this;

	Object.keys(parameters.headers)
		.forEach(function (name) {
			if (NON_SAFE_HEADERS.hasOwnProperty(name.toLowerCase())) {
				delete parameters.headers[name];
			}
		});

	return new Promise(function (fulfill, reject) {
		var requestError = null,
			xhr = new self.window.XMLHttpRequest();

		xhr.onabort = function () {
			requestError = new Error(ERROR_ABORTED);
			reject(requestError);
		};
		xhr.ontimeout = function () {
			requestError = new Error(ERROR_TIMEOUT);
			reject(requestError);
		};
		xhr.onerror = function () {
			requestError = new Error(xhr.statusText || ERROR_CONNECTION);
			reject(requestError);
		};
		xhr.onreadystatechange = function () {
			if (xhr.readyState !== 4) {
				return;
			}
			if (requestError) {
				return;
			}
			var statusObject = getStatusObject(xhr),
				content = self.convertResponse(
					statusObject.headers,
					xhr.responseText
				);
			fulfill({status: statusObject, content: content});
		};

		var user = parameters.uri.authority.userInfo ?
				parameters.uri.authority.userInfo.user : null,
			password = parameters.uri.authority.userInfo ?
				parameters.uri.authority.userInfo.password : null;
		xhr.open(
			parameters.method, parameters.uri.toString(), true,
			user || undefined, password || undefined
		);
		xhr.timeout = parameters.timeout;

		if (parameters.withCredentials) {
			xhr.withCredentials = true;
		}

		Object.keys(parameters.headers)
			.forEach(function (headerName) {
				xhr.setRequestHeader(
					headerName, parameters.headers[headerName]
				);
			});

		xhr.send(parameters.data);
	});
};

/**
 * Gets state object for specified jQuery XHR object.
 * @param {Object?} xhr XHR object.
 * @returns {{code: number, text: string, headers: Object}} Status object.
 */
function getStatusObject(xhr) {
	var headers = {};

	if (!xhr) {
		return {
			code: 0,
			text: '',
			headers: headers
		};
	}

	xhr
		.getAllResponseHeaders()
		.split('\n')
		.forEach(function (header) {
			var delimiterIndex = header.indexOf(':');
			if (delimiterIndex <= 0) {
				return;
			}
			var headerName = header
				.substring(0, delimiterIndex)
				.trim()
				.toLowerCase();
			headers[headerName] = header
				.substring(delimiterIndex + 1)
				.trim();
		});

	return {
		// handle IE9 bug:
		// http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
		code: xhr.status === 1223 ? 204: xhr.status,
		text: xhr.statusText,
		headers: headers
	};
}