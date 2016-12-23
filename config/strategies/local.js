'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
    Auth = require('../../app/controllers/lib/auth.server.js'),
    Middle = require('../../app/controllers/lib/middle.server.js'),
    User = require('../../app/models/user.server.model.js');

var localCallback = function(email, password, done) {
        if (!Auth.validateEmail(email)) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        else if (!Middle.isSanitizedQString(email)) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        User.findOne( { email: email }, function(err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            // Password is hashed, salted
            Auth.verifyPassword(password, user)
            .then( function(verified) {
                    if (!verified) {
                        done(null, false, { message: 'Incorrect password.' });
                    }
                    else {
                        done(null, user);
                    }
                },
                function(err) {
                    done(null, false, { message: 'Incorrect password.' });
                }
            )
        })
    };

module.exports = function() {
    // Use local strategy
    passport.use(new LocalStrategy({
            usernameField: 'email', passwordField: 'password'}, 
            localCallback
    ))
};

