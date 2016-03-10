'use strict';

const UHR = require('./lib/UHR');

module.exports = {

	/**
	 * Registers UHR in the service locator.
	 * @param {ServiceLocator} locator Catberry's service locator.
	 */
	register: locator => {
		locator.register('uhr', UHR, true);
	},
	UHR
};
