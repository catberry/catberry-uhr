'use strict';

const catberryUri = require('catberry-uri');
const Query = catberryUri.Query;
const URI = catberryUri.URI;

const DEFAULT_TIMEOUT = 30000;
const HTTP_PROTOCOL_REGEXP = /^(http)s?$/i;

// This module were developed using HTTP/1.1v2 RFC 2616
// (http://www.w3.org/Protocols/rfc2616/)
class UHRBase {

	static get METHODS() {
		return {
			GET: 'GET',
			HEAD: 'HEAD',
			POST: 'POST',
			PUT: 'PUT',
			PATCH: 'PATCH',
			DELETE: 'DELETE',
			OPTIONS: 'OPTIONS',
			TRACE: 'TRACE',
			CONNECT: 'CONNECT'
		};
	}

	static get TYPES() {
		return {
			URL_ENCODED: 'application/x-www-form-urlencoded',
			JSON: 'application/json',
			PLAIN_TEXT: 'text/plain',
			HTML: 'text/html'
		};
	}

	static get CHARSET() {
		return 'UTF-8';
	}

	static get DEFAULT_GENERAL_HEADERS() {
		return {
			Accept: `${UHRBase.TYPES.JSON}; q=0.7, ${UHRBase.TYPES.HTML}; q=0.2, ${UHRBase.TYPES.PLAIN_TEXT}; q=0.1`,
			'Accept-Charset': `${UHRBase.CHARSET}; q=1`
		};
	}

	static get CHARSET_PARAMETER() {
		return `; charset=${UHRBase.CHARSET}`;
	}

	static get URL_ENCODED_ENTITY_CONTENT_TYPE() {
		return UHRBase.TYPES.URL_ENCODED + UHRBase.CHARSET_PARAMETER;
	}

	static get JSON_ENTITY_CONTENT_TYPE() {
		return UHRBase.TYPES.JSON + UHRBase.CHARSET_PARAMETER;
	}

	static get PLAIN_TEXT_ENTITY_CONTENT_TYPE() {
		return UHRBase.TYPES.PLAIN_TEXT + UHRBase.CHARSET_PARAMETER;
	}

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
	get(url, parameters) {
		return this.request(this._normalizeOptions(UHRBase.METHODS.GET, url, parameters));
	}

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
	post(url, parameters) {
		return this.request(this._normalizeOptions(UHRBase.METHODS.POST, url, parameters));
	}

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
	put(url, parameters) {
		return this.request(this._normalizeOptions(UHRBase.METHODS.PUT, url, parameters));
	}

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
	patch(url, parameters) {
		return this.request(this._normalizeOptions(UHRBase.METHODS.PATCH, url, parameters));
	}

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
	delete(url, parameters) {
		return this.request(this._normalizeOptions(UHRBase.METHODS.DELETE, url, parameters));
	}

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
	request(parameters) {
		return this._validateRequest(parameters)
			.then(validated => this._doRequest(validated));
	}

	/**
	 * Validates UHR parameters.
	 * @param {Object?} parameters The request parameters.
	 * @param {string?} parameters.method The HTTP method for the request.
	 * @param {string?} parameters.url The URL for the request.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @returns {Promise} Promise for the finished work.
	 * @private
	 */
	/* eslint complexity: 0 */
	_validateRequest(parameters) {
		if (!parameters || typeof (parameters) !== 'object') {
			return Promise.reject(new Error('Request parameters argument should be an object'));
		}

		const validated = Object.create(parameters);

		if (typeof (parameters.url) !== 'string') {
			return Promise.reject(new Error('"parameters.url" is a required parameter'));
		}

		validated.uri = new URI(validated.url);
		if (!validated.uri.scheme) {
			return Promise.reject(new Error('"parameters.url" should contain a protocol (scheme)'));
		}
		if (!HTTP_PROTOCOL_REGEXP.test(validated.uri.scheme)) {
			return Promise.reject(new Error(`"${validated.uri.scheme}" protocol (scheme) is unsupported`));
		}
		if (!validated.uri.authority || !validated.uri.authority.host) {
			return Promise.reject(new Error('"parameters.url" should contain a host'));
		}
		if (typeof (validated.method) !== 'string' ||
			!(validated.method in UHRBase.METHODS)) {
			return Promise.reject(new Error('HTTP method is a required parameter'));
		}

		validated.timeout = validated.timeout || DEFAULT_TIMEOUT;
		if (typeof (validated.timeout) !== 'number') {
			return Promise.reject(new Error('Timeout should be a number'));
		}

		validated.headers = this.createHeaders(validated.headers);

		if (!this._isUpstreamRequest(parameters.method) &&
			validated.data && typeof (validated.data) === 'object') {

			const dataKeys = Object.keys(validated.data);

			if (dataKeys.length > 0 && !validated.uri.query) {
				validated.uri.query = new Query('');
			}

			dataKeys.forEach(key => {
				validated.uri.query.values[key] = validated.data[key];
			});
			validated.data = null;
		} else {
			const dataAndHeaders = this._getDataToSend(validated.headers, validated.data);
			validated.headers = dataAndHeaders.headers;
			validated.data = dataAndHeaders.data;
		}

		return Promise.resolve(validated);
	}

	/**
	 * Gets data for sending via the HTTP request using "Content Type" HTTP header.
	 * @param {Object} headers The HTTP headers.
	 * @param {Object|string} data The data to send.
	 * @returns {{headers: Object, data: Object|string}} The data and headers to send.
	 * @private
	 */
	_getDataToSend(headers, data) {
		const found = this._findContentType(headers);
		const contentTypeHeader = found.name;
		const contentType = found.type;

		if (!data || typeof (data) !== 'object') {
			data = data ? String(data) : '';
			if (!contentType) {
				headers[contentTypeHeader] = UHRBase.PLAIN_TEXT_ENTITY_CONTENT_TYPE;
			}
			return {
				headers,
				data
			};
		}

		if (contentType === UHRBase.TYPES.JSON) {
			return {
				headers,
				data: JSON.stringify(data)
			};
		}

		// otherwise object will be sent with
		// application/x-www-form-urlencoded
		headers[contentTypeHeader] = UHRBase.URL_ENCODED_ENTITY_CONTENT_TYPE;

		const query = new Query();
		query.values = data;
		return {
			headers,
			data: query.toString()
				.replace(/\+/g, '%2B')
				.replace(/%20/g, '+')
		};
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

		const headers = {};

		Object.keys(UHRBase.DEFAULT_GENERAL_HEADERS)
			.forEach(headerName => {
				headers[headerName] = UHRBase.DEFAULT_GENERAL_HEADERS[headerName];
			});

		Object.keys(parameterHeaders)
			.forEach(headerName => {
				if (parameterHeaders[headerName] === null ||
					parameterHeaders[headerName] === undefined) {
					delete headers[headerName];
					return;
				}
				headers[headerName] = parameterHeaders[headerName];
			});

		return headers;
	}

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
	 * @protected
	 * @abstract
	 */
	_doRequest(parameters) { }

	/**
	 * Converts response data according to the content type.
	 * @param {Object} headers The HTTP headers.
	 * @param {string} responseData The data from response.
	 * @returns {string|Object} The converted data.
	 */
	convertResponse(headers, responseData) {
		if (typeof (responseData) !== 'string') {
			responseData = '';
		}
		const found = this._findContentType(headers);
		const contentType = found.type || UHRBase.TYPES.PLAIN_TEXT;

		switch (contentType) {
			case UHRBase.TYPES.JSON:
				try {
					return JSON.parse(responseData) || {};
				} catch (e) {
					return {};
				}
			case UHRBase.TYPES.URL_ENCODED:
				try {
					const query = new Query(responseData.replace('+', '%20'));
					return query.values || {};
				} catch (e) {
					return {};
				}
			default:
				return responseData;
		}
	}

	/**
	 * Determines if the current query needs using upstream.
	 * @param {string} method The HTTP method.
	 * @returns {boolean} true if current HTTP method needs upstream usage.
	 * @protected
	 */
	_isUpstreamRequest(method) {
		return (
			method === UHRBase.METHODS.POST ||
			method === UHRBase.METHODS.PUT ||
			method === UHRBase.METHODS.PATCH
			);
	}

	/**
	 * Normalizes parameters passed to a request function.
	 * @param {string} method The HTTP method.
	 * @param {string} url The URL to request.
	 * @param {Object?} parameters The request parameters.
	 * @param {Object?} parameters.headers The HTTP headers to send.
	 * @param {(string|Object)?} parameters.data The data to send.
	 * @param {number?} parameters.timeout The request timeout.
	 * @param {boolean?} parameters.unsafeHTTPS If true then requests to servers with
	 * invalid HTTPS certificates are allowed.
	 * @return {Object} The normalized parameters object with URL and method
	 */
	_normalizeOptions(method, url, parameters) {
		parameters = parameters || {};
		const normalParameters = Object.create(parameters);
		normalParameters.method = method;
		normalParameters.url = url;
		return normalParameters;
	}

	/**
	 * Finds the content type header in the headers object.
	 * @param {Object} headers The HTTP headers.
	 * @returns {{name: string, type: string}} The name of the header and the content type.
	 */
	_findContentType(headers) {
		var contentTypeString = '';
		var contentTypeHeader = 'Content-Type';

		Object.keys(headers)
			.forEach(key => {
				if (key.toLowerCase() !== 'content-type') {
					return;
				}
				contentTypeHeader = key;
				contentTypeString = headers[key];
			});

		const typeAndParameters = contentTypeString.split(';');
		const contentType = typeAndParameters[0].toLowerCase();
		return {
			name: contentTypeHeader,
			type: contentType
		};
	}
}

module.exports = UHRBase;
