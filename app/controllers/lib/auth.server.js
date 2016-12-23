'use strict'

//
// User/session authentication handlers
//

//
// Registration/login pages are not part of the Angular client.
//
var Passport = require('passport');
var	q = require('q');
var	HashAndSalt = require('password-hash-and-salt');
var	Forge = require('node-forge');
var	BasicAuth = require('basic-auth');
var	Nodemailer = require('nodemailer');
var Querystring = require('querystring');

var Config = require('../../../app/models/config.server.model.js');
var	User = require('../../../app/models/user.server.model.js');
//var Middle = require('./middle.server.js');
var	Utils = require('../../../app/utils.js');
var	newToken = Utils.newToken;


var validateEmail = function(email) {
    //var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    //return re.test(email) && Middle.isSanitizedQString(email);
    return true;
}
exports.validateEmail = validateEmail;


var loginHelper =  function(req, res, next) {

    Passport.authenticate('local', {session: false}, function(err, user, info) {
            var data;
            if (err) { 
                return next(err);
            }
            else if (!user) { 
                // Retry the login
                res.status(403);
                data = req.app.locals;
                data.layout = 'layout.server.handlebars';
                data.retry = true;
                data.csrfToken = req.csrfToken();
                return res.render('login', data);
            }
            else if (!user.confirmed) {
                // Email address not confirmed
                data = {email: user.email};
                var qstr = Querystring.stringify(data);
                res.redirect('/requestregconfirm?' + qstr);
            }
            else if (!user.enabled) {
                // Login not enabled
                res.status(403);
                data = req.app.locals;
                data.layout = 'layout.server.handlebars';
                data.disabled = true;
                res.render('ackregconfirm', data)
            }
            else {
                // Managing sessions outside of passport with
                // express-session to have more control.
                req.login(user, {session: false}, function(err) {
                    if (err) {
                        return next(err);
                    }
                    // Initialize session and reload the client.
                    req.session.uid = user.uid;
                    req.session.time = (new Date()).getTime();
                    // Adding random query param to bust cache to force
                    // sending cookie with new csrf token to Angular
                    var token = newToken(6);
                    return res.redirect('/?cb=' + token);
                })
            }
        })(req, res, next)
}


// Authenticate login request. Redirects to Angular client
// for success, to login page for failure, or calls next()
// for server error.
exports.loginHandler = function(req, res, next) {

   // The test mode bypass is because the mocha tests rely
   // on superagent which apparently cant handle session changes
   if (req.session && (process.env.NODE_ENV != 'test')) {
        req.session.uid = null;
        req.session.regenerate( function(err) {
            if (err) {
                next(err);
            }
            else {
                req.session.uid = null;
                loginHelper(req, res, next);
            }
        })
    }
    else {
        loginHelper(req, res, next);
    }
}


// Check for valid login session as handler (request
// does nothing else but this check). Response is sent
// immediately for success or user error, server errors are
// passed to next().
exports.sessionCheckHandler = function(req, res, next) {
    if (req.session && req.session.uid) {
        User.findOne( { 'uid': req.session.uid }, function(err, user) {
            if (err) { 
                next(err);
            }
            else if (!user) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
            }
            else {
                var time = (new Date()).getTime();
                if (time - req.session.time > user.idleTimeout) {
                    req.session.destroy( function(err) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.status(401);
                            res.send( Utils.makeRes(Utils.statusTag, 'Idle session timed out') );
                        }
                    })
                }
                else {
                    req.session.time = time;
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'user', user.email, 'admin', user.admin) );
                }
            }
        })
    }
    else {
        res.status(401);
        res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
    }
}

// Check for valid login session as middleware. Response is 
// sent immediately for user error, otherwise call next().
// User object is saved in res.locals.reqParams['user']
// Enforces admin user for /admin routes.
exports.sessionCheck = function(req, res, next) {

    if (req.session && req.session.uid) {
        User.findOne( { 'uid': req.session.uid }, function(err, user) {
            if (err) { 
                next(err);
            }
            else if (!user) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
            }
            else if (req.originalUrl.match(/admin/) && !user.admin) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not admin user') );
            }
            else {
                if (!res.locals.reqParams) {
                    res.locals.reqParams = {};
                }
                res.locals.reqParams['user'] = user;
                var time = (new Date()).getTime();
                if (time - req.session.time > user.idleTimeout) {
                    req.session.destroy( function(err) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.status(401);
                            res.send( Utils.makeRes(Utils.statusTag, 'Idle session timed out') );
                        }
                    })
                }
                else {
                    req.session.time = time;
                    next();
                }
            }
        })
    }
    else {
        res.status(401);
        res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
    }
}

// Check for valid login session as middleware. Redirect
// to login on failure.
exports.sessionCheckOrLogin = function(req, res, next) {

    if (req.session && req.session.uid) {
        User.findOne( { 'uid': req.session.uid }, function(err, user) {
            if (err) { 
                next(err);
            }
            else if (!user) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
            }
            else if (req.originalUrl.match(/admin/) && !user.admin) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not admin user') );
            }
            else {
                if (!res.locals.reqParams) {
                    res.locals.reqParams = {};
                }
                res.locals.reqParams['user'] = user;
                var time = (new Date()).getTime();
                if (time - req.session.time > user.idleTimeout) {
                    req.session.destroy( function(err) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.status(401);
                            res.send( Utils.makeRes(Utils.statusTag, 'Idle session timed out') );
                        }
                    })
                }
                else {
                    req.session.time = time;
                    next();
                }
            }
        })
    }
    else {
        res.status(401);
        res.redirect('/login');
    }
}

// Check for valid login session as a promise.
// Response is sent immediately for user errors, not 
// for server errors.
exports.sessionCheckPrm = function(req, res) {
    //var promise = new Promise(function(resolve, reject) {
    var deferred = q.defer();
    if (req.session && req.session.uid) {
        User.findOne( { 'uid': req.session.uid }, function(err, user) {
            if (err) { 
                deferred.reject(err);
            }
            else if (!user) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
                var err1 = new Error();
                err1.type = 'user';
                deferred.reject(err1);
            }
            else {
                if (!res.locals.reqParams) {
                    res.locals.reqParams = {};
                }
                res.locals.reqParams['user'] = user;
                var time = (new Date()).getTime();
                if (time - req.session.time > user.idleTimeout) {
                    req.session.destroy( function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        else {
                            res.status(401);
                            res.send( Utils.makeRes(Utils.statusTag, 'Idle session timed out') );
                            var err1 = new Error();
                            err1.type = 'user';
                            deferred.reject(err1);
                        }
                    })
                }
                else {
                    req.session.time = time;
                    deferred.resolve(res);
                }
            }
        })
    }
    else {
        res.status(401);
        res.send( Utils.makeRes(Utils.statusTag, 'Not logged in') );
        var err1 = new Error();
        err1.type = 'user';
        deferred.reject(err1);
    }
    return deferred.promise;
};


// Process returned initial password reset request form
var initResetFormHandler = function(req, res, next) {

    if (!req.body.email) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }

    User.findOne( { email: req.body.email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user) { 
            var data = req.app.locals;
            data.layout = 'layout.server.handlebars';
            data.retry = true;
            data.msg = "User not found - please try again";
            data.csrfToken = req.csrfToken();
            res.render('initreset', data);
        }
        else {
            user.regToken = newToken();
            user.regTime = (new Date()).getTime() + 60000*req.app.locals.tokenLifetime;
            user.save(function(err1, user1) {
                if (err1) {
                    next(err1);
                }
                else {
                    var mailer = req.app.locals.mailer;
                    var mailTransport = Nodemailer.createTransport(mailer.options);
                    // The emailed token is concatenated with base64-encoded 
                    // user email.
                    var buf = Forge.util.encode64(req.body.email);
                    var token = user.regToken + buf;
                    var qstr = Querystring.stringify({'token': token});
                    var options = { 
                        from: mailer.from,
                        to: req.body.email,
                        subject: 'ScriptRemote password reset',
                        html: 'To reset your password please <a href="' + req.app.locals.regEmailProtocol + req.headers.host + '/processresetconfirm?' + qstr + '">CLICK HERE</a>'
                    } 
                    mailTransport.sendMail(options, function(err2, info) {
                        if (err2) {
                            next(err2);
                        }
                        else {
                            res.redirect('/');
                        }
                    })
                }
            })
        }
    })
}
exports.initResetFormHandler = initResetFormHandler;


// Process password reset email confirmation
exports.resetConfirmHandler = function(req, res, next) {

    var newtok = newToken();
    var rawToken = null;
    var email = null;
    var data;
    var qstr;

    if (req.query.token && (req.query.token.length > newtok.length)) {
        rawToken = req.query.token;
    }
    else {
        data = {retry: true, msg: "The information provided did not match user account. Please try again."};
        qstr = Querystring.stringify(data);
        res.redirect('/sendreset?' + qstr);
        return;
    }
    try {
    var token = rawToken.slice(0, newtok.length);
    var encoded = rawToken.slice(newtok.length);
    email = Forge.util.decode64(encoded);
    }
    catch (e) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }

    if (!validateEmail(email)) {
        data = {retry: true, msg: "The information provided did not match user account. Please try again."};
        qstr = Querystring.stringify(data);
        res.redirect('/sendreset?' + qstr);
        return
    }

    var time = (new Date()).getTime();
    User.findOne( { email: email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user || (user.regToken != token) || (time > user.regTime)) { 
            // Try again
            data = {retry: true, msg: "The information provided did not match user account. Please try again."};
            qstr = Querystring.stringify(data);
            res.redirect('/sendreset?' + qstr);
        }
        else { 
            // Allow reset
            user.regToken = '';
            user.save(function(err1, user1) {
                if (err1) {
                    next(err1);
                }
                else {
                    var data = req.app.locals;
                    data.layout = 'layout.server.handlebars';
                    data.email = user1.email;
                    data.csrfToken = req.csrfToken();
                    res.render('reset', data);
                }
           })
        }
    })
}

// Process returned password reset form
exports.resetFormHandler = function(req, res, next) {

    var err;
    if (!req.body.email || !req.body.password) {
        err = new Error('Invalid request');
        return next(err);
    }
    if (!validateEmail(req.body.email)) {
        err = new Error('Invalid request');
        return next(err);
    }

    User.findOne( { email: req.body.email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user) { 
            err = new Error('Invalid request');
            return next(err);
        }
        else {
            exports.hashPassword(req.body.password)
                .then( function(hash) {
                        var deferred = q.defer();
                        user.pwhash = hash;
                        user.save(function(err1, user1) {
                            if (err1) {
                                deferred.reject(err1);
                            }
                            else {
                                deferred.resolve(user1);
                            }
                        });
                        return deferred.promise;
                    }
                )
                .then( function(user1) {
                        var mailer = req.app.locals.mailer;
                        var mailTransport = Nodemailer.createTransport(mailer.options);
                        var options = { 
                            from: mailer.from,
                            to: user1.email,
                            subject: 'ScriptRemote security notice - password changed',
                            html: 'Your ScriptRemote password has been changed.\n If you did not make this change please contact your site administrator.'
                        } 
                        return mailTransport.sendMail(options);
                    }
                )
                .then( function(info) {
                            var data = req.app.locals;
                            data.layout = 'layout.server.handlebars';
                            res.render('ackreset', data);
                        }, 
                        function(err2) {
                            next(err2);
                        }
                )
        }
    })
}


// Logout handler - end the session and
// reload client
exports.logoutHandler = function(req, res, next) {
    req.session.destroy(function(err) {
        if (err) {
            next(err)
        }
        else {
            res.redirect('/');
        }
    });
};


// Check user from basic auth header - token is checked later.
// Returns a promise.  Response is sent immediately for user 
// errors, not for server errors.
exports.basicUserCheckPrm = function(req, res) {

    var deferred = q.defer();
        var authInfo = new BasicAuth(req);
        if (!authInfo) {
            res.status(401);
            res.set('WWW-Authenticate', 'Basic realm="scriptremote"');
            res.send( Utils.makeRes(Utils.statusTag, 'Invalid user id') );
            var err = new Error();
            err.type = 'user';
            deferred.reject(err);
        }
        else {
            var userId = authInfo['name'];
            var token = authInfo['pass'];
            res.locals.reqParams['token'] = token;
            User.findOne( { 'uid': userId }, function(err, user) {
                if (err) { 
                    err.type = 'server';
                    deferred.reject(err);
                }
                else if (!user) {
                    res.status(401);
                    res.set('WWW-Authenticate', 'Basic realm="scriptremote"');
                    res.send( Utils.makeRes(Utils.statusTag, 'Invalid user id') );
                    var err1 = new Error();
                    err1.type = 'user';
                    deferred.reject(err1);
                }
                else {
                    res.locals.reqParams['user'] = user;
                    deferred.resolve(res);
                }
            })
        }
    return deferred.promise;
};


exports.hashPassword = function(password) {
    var deferred = q.defer();
    (new HashAndSalt(password)).hash( function(err, hash) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(hash);
        }
    });
    return deferred.promise;
}

exports.verifyPassword = function(password, user) {
    var deferred = q.defer();
    (new HashAndSalt(password)).verifyAgainst(user.pwhash, function(err, verified) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(verified);
        }
    });
    return deferred.promise;
}

exports.verifyToken = function(token, hash) {
    var deferred = q.defer();
    (new HashAndSalt(token)).verifyAgainst(hash, function(err, verified) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(verified);
        }
    });
    return deferred.promise;
}



