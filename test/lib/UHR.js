'use strict';

const assert = require('assert');
const zlib = require('zlib');
const querystring = require('querystring');
const http = require('http');
const UHR = require('../../lib/UHR');

const testCases = require('./test-cases.json');

const PORT = 8081;

/* eslint prefer-arrow-callback:0 */
/* eslint max-nested-callbacks:0 */
/* eslint require-jsdoc:0 */
describe('UHR', function() {
	var server, requestHanler, uhr;
	beforeEach(function() {
		uhr = new UHR();
		server = http.createServer((request, response) => requestHanler(request, response));
		server.listen(PORT);
	});
	afterEach(function(done) {
		server.close(done);
	});

	describe('#request', function() {
		testCases.request.forEach(testCase => {
			it(testCase.name, function(done) {
				const uhr = new UHR();
				uhr.request(testCase.parameters)
					.then(() => {
						if (testCase.errorMessage) {
							assert.fail(`Expect "${testCase.errorMessage}" error`);
						}
					})
					.catch(error => {
						if (testCase.errorMessage) {
							assert.strictEqual(error.message, testCase.errorMessage);
						} else {
							throw error;
						}
					})
					.then(done)
					.catch(done);
			});
		});

		it('should return error if request.socket destroyed by server', function(done) {
			requestHanler = request => request.socket.destroy(new Error());

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
				.then(() => assert.fail('Should be an error'))
				.catch(reason => assert.strictEqual(reason.code, 'ECONNRESET'))
				.then(done)
				.catch(done);
		});

		it('should return error if response.socket destroyed by server', function(done) {
			requestHanler = (request, response) => response.socket.destroy(new Error());

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
				.then(() => assert.fail('Should be an error'))
				.catch(reason => assert.strictEqual(reason.code, 'ECONNRESET'))
				.then(done)
				.catch(done);
		});

		it('should end request if timeout', function(done) {
			requestHanler = (request, response) => {
				setTimeout(() => {
					response.end();
				}, 100);
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET',
				timeout: 50
			})
			.then(() => assert.fail('Should be an error'))
			.catch(reason => assert.strictEqual(reason.message, 'Request timeout'))
			.then(done)
			.catch(done);
		});

		it('should send HTTP request with specified URL', function(done) {
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				response.end();
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => assert.strictEqual(result.status.code, 200))
			.then(done)
			.catch(done);
		});

		it('should send correct headers', function(done) {
			requestHanler = (request, response) => {
				assert.strictEqual(request.headers.host, `localhost:${PORT}`);
				assert.strictEqual(typeof (request.headers.accept), 'string');
				assert.strictEqual(typeof (request.headers['accept-charset']), 'string');
				assert.strictEqual(typeof (request.headers['user-agent']), 'string');
				response.end();
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => assert.strictEqual(result.status.code, 200))
			.then(done)
			.catch(done);
		});

		it('should send correct headers when header to null', function(done) {
			requestHanler = (request, response) => {
				assert.strictEqual(request.headers.host, `localhost:${PORT}`);
				assert.strictEqual(typeof (request.headers.accept), 'string');
				assert.strictEqual(typeof (request.headers['accept-charset']), 'undefined');
				assert.strictEqual(typeof (request.headers['user-agent']), 'string');
				response.end();
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET',
				headers: {
					'Accept-Charset': null
				}
			})
			.then(result => assert.strictEqual(result.status.code, 200))
			.then(done)
			.catch(done);
		});

		it('should parse URL encoded response', function(done) {
			const obj = {
				test: 'hello world',
				test2: 100500,
				boolean: true
			};
			requestHanler = (request, response) => {
				response.setHeader('Content-Type', 'application/x-www-form-urlencoded');
				response.end(querystring.stringify(obj));
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content.test, obj.test);
				assert.strictEqual(Number(result.content.test2), obj.test2);
				assert.strictEqual(Boolean(result.content.boolean), obj.boolean);
			})
			.then(done)
			.catch(done);
		});

		it('should parse JSON response', function(done) {
			const obj = {
				test: 'hello world',
				test2: 100500,
				boolean: true
			};
			requestHanler = (request, response) => {
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify(obj));
			};

			const uhr = new UHR();
			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.deepEqual(result.content, obj);
			})
			.then(done)
			.catch(done);
		});

		it('should return plain text response', function(done) {
			requestHanler = (request, response) => {
				response.setHeader('Content-Type', 'text/plain');
				response.end('test');
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, 'test');
			})
			.then(done)
			.catch(done);
		});

		it('should decode gzip response', function(done) {
			requestHanler = (request, response) => {
				response.setHeader('Content-Type', 'text/plain');
				response.setHeader('Content-Encoding', 'gzip');
				const gzip = zlib.createGzip();
				gzip.pipe(response);
				gzip.end('test gzip');
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, 'test gzip');
			})
			.then(done)
			.catch(done);
		});

		it('should decode deflate response', function(done) {
			requestHanler = (request, response) => {
				response.setHeader('Content-Type', 'text/plain');
				response.setHeader('Content-Encoding', 'deflate');
				const deflate = zlib.createDeflate();
				deflate.pipe(response);
				deflate.end('test inflate');
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'GET'
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, 'test inflate');
			})
			.then(done)
			.catch(done);
		});

		it('should send data as query string after query', function(done) {
			const query = {
				param: 'test3',
				param2: 'test4'
			};
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, `/page?some=value&${querystring.stringify(query)}`);

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					assert.strictEqual(data.length, 0);
					response.end();
				});
			};

			uhr.request({
				url: `http://localhost:${PORT}/page?some=value`,
				method: 'GET',
				data: query
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, '');
			})
			.then(done)
			.catch(done);
		});

		it('should send query string after path', function(done) {
			const query = {
				param: 'test',
				param2: 'test2'
			};
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, `/page?${querystring.stringify(query)}`);

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					assert.strictEqual(data.length, 0);
					response.end();
				});
			};

			uhr.delete(`http://localhost:${PORT}/page`, {
				data: query
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, '');
			})
			.then(done)
			.catch(done);
		});

		it('should send empty entity', function(done) {
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(request.headers['content-type'], 'text/plain; charset=UTF-8');

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					assert.strictEqual(data.length, 0);
					response.end();
				});
			};

			uhr.post(`http://localhost:${PORT}/page`)
				.then(result => {
					assert.strictEqual(result.status.code, 200);
					assert.strictEqual(result.content, '');
				})
				.then(done)
				.catch(done);
		});

		it('should patch entity', function(done) {
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(request.headers['content-type'], 'application/json; charset=UTF-8');

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					const entity = JSON.parse(data);
					assert.strictEqual(entity.field, 'value');
					response.end();
				});
			};

			uhr.patch(`http://localhost:${PORT}/page`, {
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				},
				data: {
					field: 'value'
				}
			})
				.then(result => {
					assert.strictEqual(result.status.code, 200);
					assert.strictEqual(result.content, '');
				})
				.then(done)
				.catch(done);
		});

		it('should send entity as URL encoded', function(done) {
			const entity = {
				field: 'test',
				field2: 'true',
				field3: '100500'
			};
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(
					request.headers['content-type'], 'application/x-www-form-urlencoded; charset=UTF-8'
				);

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					const receivedEntity = querystring.parse(data);
					assert.strictEqual(receivedEntity.field, entity.field);
					assert.strictEqual(receivedEntity.field2, entity.field2);
					assert.strictEqual(receivedEntity.field3, entity.field3);
					response.end();
				});
			};

			uhr.put(`http://localhost:${PORT}/page`, {
				data: entity
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, '');
			})
			.then(done)
			.catch(done);
		});

		it('should send entity as JSON', function(done) {
			const entity = {
				field: 'test2',
				field2: false,
				field3: 42
			};
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(request.headers['content-type'], 'application/json');

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					const receivedEntity = JSON.parse(data);
					assert.deepEqual(receivedEntity, entity);
					response.end();
				});
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				data: entity
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, '');
			})
			.then(done)
			.catch(done);
		});

		it('should send entity as plain text', function(done) {
			const entity = 'test entity text';
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(
					request.headers['content-type'], 'text/plain; charset=UTF-8'
				);

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					assert.deepEqual(data, entity);
					response.end();
				});
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'POST',
				data: entity
			})
			.then(result => {
				assert.strictEqual(result.status.code, 200);
				assert.strictEqual(result.content, '');
			})
			.then(done)
			.catch(done);
		});

		it('should receive entity when error status', function(done) {
			const entity = 'test entity text';
			requestHanler = (request, response) => {
				assert.strictEqual(request.url, '/page');
				assert.strictEqual(
					request.headers['content-type'], 'text/plain; charset=UTF-8'
				);

				var data = '';
				request.setEncoding('utf8');
				request.on('data', chunk => {
					data += chunk;
				});
				request.on('end', () => {
					assert.deepEqual(data, entity);
					response.writeHead(400, {
						'content-type': 'text/plain; charset=UTF-8'
					});
					response.end(data);
				});
			};

			uhr.request({
				url: `http://localhost:${PORT}/page`,
				method: 'POST',
				data: entity
			})
			.then(result => {
				assert.strictEqual(result.status.code, 400);
				assert.strictEqual(result.content, entity);
			})
			.then(done)
			.catch(done);
		});
	});
});
