'use strict';

const URI = require('catberry-uri');
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const UHRBase = require('./UHRBase');

const ENCODINGS = {
	GZIP: 'gzip',
	DEFLATE: 'deflate',
	IDENTITY: 'identity'
};

const USER_AGENT = 'Catberry UHR';
const ACCEPT_ENCODING = `${ENCODINGS.GZIP}; q=0.7, ${ENCODINGS.DEFLATE}; q=0.2, ${ENCODINGS.IDENTITY}; q=0.1`;

// This module were developed using HTTP/1.1v2 RFC 2616
// (http://www.w3.org/Protocols/rfc2616/)
class UHR extends UHRBase {

	/**
	 * Does request with specified parameters using protocol implementation.
	 * @param {Object?} parameters The request parameters.
	 * @param {string?} parameters.method The HTTP method for the request.
	 * @param {string?} parameters.url The URL for the request.
	 * @param {URI} parameters.uri The URI object.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise<Object>} Promise for the result with a status object and content.
	 */
	_doRequest(parameters) {
		return new Promise((fulfill, reject) => {
			const pathAndQuery = parameters.uri.clone();
			pathAndQuery.scheme = null;
			pathAndQuery.authority = null;
			pathAndQuery.fragment = null;

			const protocol = parameters.uri.scheme === 'https' ? https : http;
			const requestOptions = {
				method: parameters.method,
				headers: parameters.headers,
				path: pathAndQuery.toString(),
				hostname: parameters.uri.authority.host,
				port: parameters.uri.authority.port || null,
				auth: parameters.uri.authority.userInfo ?
					parameters.uri.authority.userInfo.toString() : null,
				rejectUnauthorized: ('unsafeHTTPS' in parameters) ?
					!parameters.unsafeHTTPS : true
			};

			const authorityWithoutUserInfo = parameters.uri.authority.clone();
			authorityWithoutUserInfo.userInfo = null;
			// RFC 2616 14.23. This header is required
			requestOptions.headers.Host = authorityWithoutUserInfo.toString();

			const request = protocol.request(requestOptions, response =>
				this._processResponse(response)
					.then(fulfill)
					.catch(reject)
			);

			request.setTimeout(parameters.timeout, () => {
				request.abort();
				reject(new Error('Request timeout'));
			});
			request.on('error', error => reject(error));

			if (this._isUpstreamRequest(parameters.method)) {
				request.write(parameters.data);
			}

			request.end();
		});
	}

	/**
	 * Processes the response from the server.
	 * @param {ServerResponse} response The HTTP response.
	 * @returns {Promise<Object>} The promise for the data.
	 * @private
	 */
	_processResponse(response) {
		return new Promise((fulfill, reject) => {
			const headers = response.headers || {};
			const encoding = headers['content-encoding'];
			var responseData = '';
			var responseStream;

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
				.on('data', chunk => {
					responseData += chunk;
				})
				.on('error', error => reject(error))
				.on('end', () => fulfill({
					status: this._getStatusObject(response),
					content: this.convertResponse(headers, responseData)
				}));
		});
	}

	/**
	 * Creates HTTP headers for a request using defaults and current parameters.
	 * @param {Object} parameterHeaders The HTTP headers for UHR.
	 * @protected
	 */
	createHeaders(parameterHeaders) {
		if (!parameterHeaders || typeof (parameterHeaders) !== 'object') {
			parameterHeaders = {};
		}
		const headers = {
			'Accept-Encoding': ACCEPT_ENCODING,
			'User-Agent': USER_AGENT
		};
		Object.keys(parameterHeaders)
			.forEach(headerName => {
				headers[headerName] = parameterHeaders[headerName];
			});

		return super.createHeaders(headers);
	}

	/**
	 * Gets the status object for the HTTP(S) response.
	 * @param {ServerResponse} xhr XHR object.
	 * @returns {{code: number, text: string, headers: Object}} The status object.
	 */
	_getStatusObject(response) {
		return {
			code: response.statusCode,
			text: http.STATUS_CODES[response.statusCode],
			headers: response.headers
		};
	}
}

module.exports = UHR;
