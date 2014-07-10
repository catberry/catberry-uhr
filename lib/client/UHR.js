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

var UHRBase = require('../UHRBase'),
	url = require('url'),
	util = require('util');

util.inherits(UHR, UHRBase);

var NON_SAFE_HEADERS = {
	cookie: true,
	'accept-charset': true
};

var ERROR_CONNECTION = 'Connection error';

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
 * @param {Function} callback Callback on finish.
 * @return {Object} Request object with abort method.
 * @protected
 */
UHR.prototype._doRequest = function (parameters, callback) {
	try {
		var self = this,
			xhrParameters = Object.create(parameters),
			urlInfo = url.parse(parameters.url);
		xhrParameters.headers = this._createHeaders(parameters.headers);

		Object.keys(xhrParameters.headers)
			.forEach(function (name) {
				if (NON_SAFE_HEADERS.hasOwnProperty(name.toLowerCase())) {
					delete xhrParameters.headers[name];
				}
			});

		if (xhrParameters.data.length > 0 && (
			xhrParameters.method === UHRBase.METHODS.GET ||
			xhrParameters.method === UHRBase.METHODS.DELETE)) {
			xhrParameters.url +=
				(!urlInfo.search || urlInfo.search.length === 0 ? '?' : '&') +
				xhrParameters.data;
		}

		var loginAndPass = String(urlInfo.auth || '').split(':'),
			xhr = new window.XMLHttpRequest();

		var requestError = null,
			errorHandler = function () {
				requestError = new Error(xhr.statusText || ERROR_CONNECTION);
			},
			loadEndHandler = function () {
				xhr.removeEventListener('loadend', loadEndHandler, false);
				xhr.removeEventListener('error', errorHandler, false);
				var statusObject = getStatusObject(xhr),
					content = self.convertResponse(
						statusObject.headers['content-type'],
						xhr.responseText);
				callback(requestError, statusObject, content);
			};

		xhr.addEventListener('loadend', loadEndHandler, false);
		xhr.addEventListener('error', errorHandler, false);
		xhr.open(xhrParameters.method, xhrParameters.url, true,
			loginAndPass[0],
			loginAndPass[1]);
		xhr.timeout = xhrParameters.timeout;
		Object.keys(xhrParameters.headers)
			.forEach(function (headerName) {
				xhr.setRequestHeader(headerName,
					xhrParameters.headers[headerName]);
			});
		xhr.send(xhrParameters.data);
		return {
			abort: xhr.abort
		};
	} catch (e) {
		callback(e, getStatusObject(), '');
	}
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
		code: xhr.status,
		text: xhr.statusText,
		headers: headers
	};
}