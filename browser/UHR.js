'use strict';

const UHRBase = require('../lib/UHRBase');

const NON_SAFE_HEADERS = {
	cookie: true,
	'accept-charset': true
};

class UHR extends UHRBase {

	/**
	 * Creates a new instance of the client-side HTTP(S) request implementation.
	 * @param {ServiceLocator} locator The service locator for resolving dependencies.
	 */
	constructor(locator) {
		super();

		/**
		 * Current instance of window.
		 * @type {Window}
		 */
		this.window = locator.resolve('window');
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
	 */
	_doRequest(parameters) {
		Object.keys(parameters.headers)
			.forEach(name => {
				if (NON_SAFE_HEADERS.hasOwnProperty(name.toLowerCase())) {
					delete parameters.headers[name];
				}
			});

		return new Promise((fulfill, reject) => {
			const xhr = new this.window.XMLHttpRequest();
			var requestError = null;

			xhr.onabort = () => {
				requestError = new Error('Request aborted');
				reject(requestError);
			};
			xhr.ontimeout = () => {
				requestError = new Error('Request timeout');
				reject(requestError);
			};
			xhr.onerror = () => {
				requestError = new Error(xhr.statusText || 'Connection error');
				reject(requestError);
			};
			xhr.onreadystatechange = () => {
				if (xhr.readyState !== 4) {
					return;
				}
				if (requestError) {
					return;
				}
				const status = this._getStatusObject(xhr);
				const content = this.convertResponse(status.headers, xhr.responseText);
				fulfill({
					status,
					content
				});
			};

			const user = parameters.uri.authority.userInfo ?
					parameters.uri.authority.userInfo.user : null;
			const password = parameters.uri.authority.userInfo ?
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
				.forEach(headerName => xhr.setRequestHeader(headerName, parameters.headers[headerName]));

			xhr.send(parameters.data);
		});
	}

	/**
	 * Gets the status object for the specified XHR object.
	 * @param {XmlHttpRequest} xhr XHR object.
	 * @returns {{code: number, text: string, headers: Object}} The status object.
	 */
	_getStatusObject(xhr) {
		const headers = {};

		if (!xhr) {
			return {
				code: 0,
				text: '',
				headers
			};
		}

		xhr
			.getAllResponseHeaders()
			.split('\n')
			.forEach(header => {
				const delimiterIndex = header.indexOf(':');
				if (delimiterIndex <= 0) {
					return;
				}
				const headerName = header
					.substring(0, delimiterIndex)
					.trim()
					.toLowerCase();
				headers[headerName] = header
					.substring(delimiterIndex + 1)
					.trim();
			});

		return {
			// handle IE9 bug: http://goo.gl/idspSr
			code: xhr.status === 1223 ? 204 : xhr.status,
			text: xhr.status === 1223 ? 'No Content' : xhr.statusText,
			headers
		};
	}
}

module.exports = UHR;
