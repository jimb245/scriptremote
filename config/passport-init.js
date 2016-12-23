'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	User = require('../app/models/user.server.model.js'),
	path = require('path'),
	config = require('./config');


/**
 * Module init function.
 */
module.exports = function() {
	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(id, done) {
		User.findOne({
			_id: id
		}, '-salt -password', function(err, user) {
			done(err, user);
		});
	});

	// Initialize strategies
	config.getGlobbedFiles('./config/strategies/*.js').forEach(function(strategy) {
		require(path.resolve(strategy))();
	});

};
