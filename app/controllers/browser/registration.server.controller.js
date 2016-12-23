'use strict'

//
// Handlers for browser client to register new users.
//
var q = require('q'),
	fs = require('fs'),
	Forge = require('node-forge'),
	Querystring = require('querystring'),
	Nodemailer = require('nodemailer'),
	User = require('../../../app/models/user.server.model.js'),
	Template = require('../../../app/models/template.server.model.js'),
	MetaFile = require('../../../app/models/metafile.server.model.js'),
	ExternId = require('../../../app/models/externid.server.model.js'),
	Config = require('../../../app/models/config.server.model.js'),
	DeleteHandler = require('../../../app/controllers/api/delete.server.controller.js'),
	Auth = require('../../../app/controllers/lib/auth.server.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
    newToken = require('../../../app/utils.js').newToken;


var defaultTmplPaths = [
    'public/modules/views/content/src/templates/simplecontent.html',
    'public/modules/views/content/src/templates/simplereply.html'];

var defaultTmplNames = [
    'simplecontent', 
    'simplereply'];

// Get or initialize the global config object - returns a promise
exports.getConfig = function(admin, req) {
    var deferred = q.defer();
    Config.findOne( {}, function(err, config) {
        if (err) { 
            deferred.reject(err);
        }
        else if (config) {
            deferred.resolve(config);
        }
        else if (!admin) {
            err = new Error('Fatal error in adduser.js');
            throw err;
        }
        else {
            config = new Config({userRegType: req.body.regType, idleTimeout: 3600000*req.body.timeout, jobsEnabled: true, regEnabled: true, userCount: 1});
            config.save(function(err1, config1) {
                if (err1) {
                    deferred.reject(err1);
                }
                else {
                    deferred.resolve(config1);
                }
            })
        }
    });
    return deferred.promise;
}


//Send a message to admin
var emailAdmin = function(msg, req, next) {
    User.findOne( { admin: true }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user) {
            return;
        }
        else { 
            var mailer = req.app.locals.mailer;
            var mailTransport = Nodemailer.createTransport(mailer.options);
            var options = { 
                from: mailer.from,
                to: user.email,
                subject: 'scriptremote new registration',
                html: msg
                } 
            mailTransport.sendMail(options, function(err1, info) {
                if (err1) {
                    var time = (new Date()).toString();
                    console.log('\n' + time);
                    console.log(mailer.options);
                    console.log(options);
                    console.log(err1);
                    next(err1);
                }
                else {
                    return
                }
            })
        }
    })
}

// Send registration form
exports.sendReg = function(req, res, next) {

    User.count({}, function(err, userCount) {
        if (err) {
            next(err);
        }
        else {
            // First user is automatically the admin
            var admin = !userCount;
            var data = {admin: admin, csrfToken: req.csrfToken(), layout: 'layout.server.handlebars'};
            if (admin) {
                data['regAllowed'] = true;
                if (req.query.retry) {
                    data['retry'] = true;
                    data['msg'] = req.query.msg;
                }
                res.render('register', data);
            }
            else if (req.app.locals.projectLimits.maxUsers && 
                        (userCount >= req.app.locals.projectLimits.maxUsers)) {
                data['regAllowed'] = false;
                data['msg'] = 'Sorry, maximum user count reached. The site administrator has been notified.';
                data['retry'] = true;
                res.render('register', data);
                emailAdmin("Max user count prevented registration", req, next);
            }
            else {
                exports.getConfig(admin, req)
                .then( function(config) {
                            var adminReg = (config.userRegType == 'adminreg');
                            data['regAllowed'] = true;
                            if (adminReg) {
                                data['regAllowed'] = false;
                                data['msg'] = 'Please contact the site administrator for registration';
                                data['retry'] = true;
                            }
                            else if (!config.regEnabled) {
                                data['regAllowed'] = false;
                                data['msg'] = 'Sorry - new registrations are temporarily disabled';
                                data['retry'] = true;
                            }
                            else if (req.query.retry) {
                                data['msg'] = req.query.msg;
                                data['retry'] = true;
                            }
                            res.render('register', data);
                    },
                    function() { next(err) }
                )
            }
        }
    })
}

// Copy Angular default template file into gridfs - returns a promise
var copyTemplate = function(grid, parentId, tmplPath, tmplName) {

    var deferred = q.defer();
    var filename = tmplPath.split('/').pop();
    var writestream = grid.createWriteStream({'filename': filename, 'content_type': 'plain/html'});
    fs.createReadStream(tmplPath).pipe(writestream);
    writestream.on('close', function(file) {
        var mf = new MetaFile( {'gfsId': file._id.valueOf(), 'parentId': parentId, 'fileKey': tmplName, 'fileType': 'plain/html', 'isEncrypted': false, timeStampInit: (new Date()).getTime()} );
        mf.save( function(err, mf1) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve();
            }
        })
    });
    writestream.on('error', function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
}


// Initialize user's Template object and Angular template files -
// returns a promise
exports.initTemplates = function(grid, user) {
    debugger;

    var template;
    if (user) {
        template = new Template({
            name: 'NONE', 
            ownerUid: user.Id(),
            defaults: defaultTmplNames
        });
    }
    else {
        // Making copy of default templates separate 
        // from any user to be used when no user-specific
        // template is possible
        template = new Template({
            name: 'GLOBAL', 
            ownerUid: '',
            defaults: defaultTmplNames
        });
    }
    template.save(function(err, tmpl) {
        if (err) {
            var deferred = q.defer();
            deferred.reject(err);
            return deferred.promise;
        }
        else {
            var promises = [];
            for (var i = 0; i < 2; i++) {
                var p = copyTemplate(grid, tmpl.Id(), defaultTmplPaths[i], defaultTmplNames[i]);
                promises.push(p);
            }
            return q.all(promises);
        }
    })
}

// Initialize user object - returns promise
//  isAdmin - true means registration is being
//              done by administrator
//  regType - specified at startup to control how
//              non-admin users get registered:
//              ('adminreg', 'adminapprove', 'selfreg')
//  timeout - specified at startup to terminate
//              idle browser sessions
//  admin - should be true for first (admin) user only
//  props - registration info
//
exports.initUser = function(isAdmin, regType, timeout, admin, props) {

    var deferred = q.defer();

    if (!isAdmin && !admin && (regType == 'adminreg')) {
        var err = new Error('Invalid request');
        deferred.reject(err);
        return deferred.promise;
    }

    Auth.hashPassword(props.password)
    .then( function(hash) {
            // Email confirmation is required except for manual registration
            // done by administrator. Administrator action to set enabled flag
            // is required except for: 
            //      administrator (first user) registration
            //      manual registration done by administrator
            //      self-reg option.
            var confirm = isAdmin;
            var enable = isAdmin || admin || (regType == 'selfreg');
            var user = new User({ name: props.name, admin: admin,
                        company: props.company, email: props.email, 
                        pwhash: hash, SMSemail: props.sms, token: '', 
                        regToken: '', idleTimeout: timeout, 
                        confirmed: confirm, enabled: enable});
            user.save(function(err1, user1) {
                if (err1) {
                    deferred.reject(err1);
                }
                else {
                    // Using mongo to generate api external user id -
                    // it could be updateable if we really need it to be.
                    var eid = new ExternId();
                    user1.uid = eid.Id();
                    user1.save(function(err2, user2) {
                        if (err2) {
                            deferred.reject(err2);
                        }
                        else {
                            deferred.resolve(user2);
                        }
                    })
                }
            })
        },
        function(err1) {
            deferred.reject(err1);
        }
    );
    return deferred.promise;
}

// Process returned registration form
exports.addUser = function(req, res, next) {

    if (!req.body.email || !req.body.password) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }
    if (!Auth.validateEmail(req.body.email)) {
        var msg = "Email " + req.body.email + " is not a valid address. Please try again.";
        var qstr = Querystring.stringify({retry: true, msg: msg});
        res.redirect('/register?' + qstr);
        return
    }

    User.findOne( { email: req.body.email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (user) { 
            var msg = "Email " + req.body.email + " is already registered. Please try again.";
            var qstr = Querystring.stringify({retry: true, msg: msg});
            res.redirect('/register?' + qstr);
        }
        else {
            // First user created is automatically the admin.
            // Registration method for other users is selected
            // during admin registration and saved in config.
            User.count({}, function(err, userCount) {
                if (err) {
                    next(err);
                }
                else {
                    var admin = !userCount;
                    exports.getConfig(admin, req)
                    .then(function(config) {
                        return exports.initUser(false, config.userRegType, config.idleTimeout, admin, req.body);
                    })
                    .then(function(user) {
                        return exports.initTemplates(req.app.locals.grid, user)
                    })
                    .then(function() {
                        if (admin) {
                            return exports.initTemplates(req.app.locals.grid, null)
                        }
                        else {
                            return q(true);
                        }
                    })
                    .then( function() { next() },
                            function() { next(err) }
                    )
                }
            })
        }
    })
}

// Send confirmation email - if sending fails in production
// mode, delete the user
exports.emailConfirm = function(req, res, next) {

    User.findOne( { email: req.body.email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (user && !user.confirmed) { 
            var mailer = req.app.locals.mailer;
            var mailTransport = Nodemailer.createTransport(mailer.options);
            user.regToken = newToken();
            user.regTime = (new Date()).getTime() + 60000*req.app.locals.tokenLifetime;
            user.save(function(err1, user1) {
                if (err1) {
                    next(err1);
                }
                else {
                    // The emailed token is concatenated with 
                    // base64-encoded user email.
                    var buf = Forge.util.encode64(req.body.email);
                    var token = user.regToken + buf;
                    var options = { 
                        from: mailer.from,
                        to: req.body.email,
                        subject: 'scriptremote user registration',
                        html: 'Thank you for registering.\n To confirm your email address please do either of the following:\n1)<a href="' + req.app.locals.regEmailProtocol + req.headers.host + '/processregconfirm/' + token + '">CLICK HERE</a> \nOR\n2) Submit the following token on the email confirmation page displayed by the website when you try to login: ' + token
                        } 
                    mailTransport.sendMail(options, function(err1, info) {
                        if (err1) {
                            var time = (new Date()).toString();
                            console.log('\n' + time);
                            console.log(mailer.options);
                            console.log(options);
                            console.log(err1);
                            var msg = "Unable to send email to " + req.body.email + ". Please try again.";
                            var qstr = Querystring.stringify({retry: true, msg: msg});
                            if (process.env.NODE_ENV != 'test' && process.env.NODE_ENV != 'development') {
                                DeleteHandler.userDelete(req, user)
                                .then(
                                    function() {    
                                        res.redirect('/register?' + qstr);
                                    },
                                    function() {
                                        next(err);
                                    }
                                )
                            }
                            else {
                                res.send('Unable to send email - confirm user manually');
                            }
                        }
                        else {
                            var qstr1 = Querystring.stringify({email: req.body.email});
                            res.redirect('/requestregconfirm?' + qstr1);
                        }
                    })
                }
            })
        }
    })
}


// Process response to confirmation email
exports.processConfirm = function(req, res, next) {

    var newtok = newToken();
    var rawToken = null;
    var email = null;
    var data;
    var qstr;
    if (req.params.token && (req.params.token.length > newtok.length)) {
        // Clicked on email link
        rawToken = req.params.token;
    }
    else if (req.body.token && (req.body.token.length > newtok.length)) {
        // Pasted token from email into form
        rawToken = req.body.token;
    }
    else {
        // Bad response - try again
        data = {retry: true, email: email};
        qstr = Querystring.stringify(data);
        res.redirect('/requestregconfirm?' + qstr);
        return
    }
    try {
    var token = rawToken.slice(0, newtok.length);
    var encoded = rawToken.slice(newtok.length);
    email = Forge.util.decode64(encoded);
    }
    catch (e) {
        data = {retry: true, email: email};
        qstr = Querystring.stringify(data);
        res.redirect('/requestregconfirm?' + qstr);
        return;
    }
    var time = (new Date()).getTime();
    User.findOne( { email: email }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user || (user.regToken != token) || (time > user.regTime)) { 
            // Try again
            var data = {retry: true, email: email};
            var qstr = Querystring.stringify(data);
            res.redirect('/requestregconfirm?' + qstr);
        }
        else { 
            if (user.confirmed) {
                // Already confirmed
                var data1 = {layout: 'layout.server.handlebars'};
                if (user.enabled) {
                    data1['complete'] = true;
                    res.render('ackregconfirm', data1)
                }
                else {
                    data1['incomplete'] = true;
                    res.render('ackregconfirm', data1)
                }
            }
            else {
                user.confirmed = true;
                user.regToken = '';
                user.save(function(err1, user1) {
                    if (err1) {
                        next(err1);
                    }
                    else {
                        // Success
                        var data2 = {layout: 'layout.server.handlebars'};
                        if (user.enabled) {
                            data2['complete'] = true;
                            res.render('ackregconfirm', data2)
                        }
                        else {
                            data2['incomplete'] = true;
                            res.render('ackregconfirm', data2)
                            emailAdmin("New registration waiting for enable: " + user.email, req, next);
                        }
                    }
                })
            }
        }
    })
}

