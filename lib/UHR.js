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

var URI = require('catberry-uri'),
	util = require('util'),
	http = require('http'),
	https = require('https'),
	zlib = require('zlib'),
	UHRBase = require('./UHRBase');

// if V8 still does not have promises then add it.
if (!('Promise' in global)) {
	global.Promise = require('promise');
}

util.inherits(UHR, UHRBase);

var ENCODINGS = {
	GZIP: 'gzip',
	DEFLATE: 'deflate',
	IDENTITY: 'identity'
};

var ERROR_REQUEST_TIMEOUT = 'Request timeout',
	USER_AGENT = 'Catberry UHR',
	ACCEPT_ENCODING = ENCODINGS.GZIP + '; q=0.7, ' +
		ENCODINGS.DEFLATE + '; q=0.2, ' +
		ENCODINGS.IDENTITY + '; q=0.1';

// This module were developed using HTTP/1.1v2 RFC 2616
// (http://www.w3.org/Protocols/rfc2616/)
/**
 * Creates new instance of server-side HTTP(S) request implementation.
 * @constructor
 */
function UHR() {
	UHRBase.call(this);
}

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
	return new Promise(function (fulfill, reject) {
		var pathAndQuery = parameters.uri.clone();
		pathAndQuery.scheme = null;
		pathAndQuery.authority = null;
		pathAndQuery.fragment = null;

		var protocol = parameters.uri.scheme === 'https' ? https : http,
			requestOptions = {
				method: parameters.method,
				headers: parameters.headers,
				path: pathAndQuery.toString(),
				hostname: parameters.uri.authority.host,
				port: parameters.uri.authority.port || null,
				auth: parameters.uri.authority.userInfo ?
					parameters.uri.authority.userInfo.toString() : null,
				rejectUnauthorized: ('unsafeHTTPS' in parameters) ?
					!Boolean(parameters.unsafeHTTPS)
					: true
			};

		var authorityWithoutUserInfo = parameters.uri.authority.clone();
		authorityWithoutUserInfo.userInfo = null;
		// RFC 2616 14.23. This header is required
		requestOptions.headers.Host = authorityWithoutUserInfo.toString();

		var request = protocol.request(requestOptions, function (response) {
			self._processResponse(response).then(fulfill, reject);
		});

		request.setTimeout(parameters.timeout, function () {
			request.abort();
			reject(new Error(ERROR_REQUEST_TIMEOUT));
		});
		request.on('error', function (error) {
			reject(error);
		});

		if (self._isUpstreamRequest(parameters.method)) {
			request.write(parameters.data);
		}

		request.end();
	});
};

/**
 * Processes response from server.
 * @param {ServerResponse} response HTTP response.
 * @returns {Promise<Object>} Promise for data.
 * @private
 */
UHR.prototype._processResponse = function (response) {
	var self = this;

	return new Promise(function (fulfill, reject) {
		var headers = response.headers || {},
			encoding = headers['content-encoding'],
			responseData = '',
			responseStream;

		switch (encoding) {
			case ENCODINGS.GZIP:
				responseStream = response.pipe(zlib.createGunzip());
				break;
			case ENCODINGS.DEFLATE:
				responseStream = response.pipe(zlib.createInflate());
				break;
			default :
				responseStream = response;
		}

		responseStream.setEncoding('utf8');
		responseStream
			.on('data', function (chunk) {
				responseData += chunk;
			})
			.on('error', function (error) {
				reject(error);
			})
			.on('end', function () {
				fulfill({
					status: getStatusObject(response),
					content: self.convertResponse(headers, responseData)
				});
			});
	});
};

/**
 * Creates HTTP headers for request using defaults and current parameters.
 * @param {Object} parameterHeaders HTTP headers of UHR.
 * @protected
 */
UHR.prototype._createHeaders = function (parameterHeaders) {
	var headers = {
		'Accept-Encoding': ACCEPT_ENCODING,
		'User-Agent': USER_AGENT
	};
	Object.keys(parameterHeaders)
		.forEach(function (headerName) {
			headers[headerName] = parameterHeaders[headerName];
		});

	return UHRBase.prototype._createHeaders(headers);
};

/**
 * Gets status object from HTTP(S) response.
 * @param {ServerResponse} response HTTP(S) response.
 * @returns {{code: number, text: string, headers: Object}} Status object.
 */
function getStatusObject(response) {
	return {
		code: response.statusCode,
		text: http.STATUS_CODES[response.statusCode],
		headers: response.headers
	};
}