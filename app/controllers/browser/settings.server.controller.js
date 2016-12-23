'use strict'

//
// Handlers for browser client to access user settings.
//

var	Nodemailer = require('nodemailer'),
    User = require('../../../app/models/user.server.model.js'),
    Project = require('../../../app/models/project.server.model.js'),
    Auth = require('../../../app/controllers/lib/auth.server.js'),
    Utils = require('../../../app/utils.js'),
    newToken = Utils.newToken;


exports.get = function(req, res, next) {

    var user;
    if (req.params.group == 'apiCredentials') {
        user = res.locals.reqParams['user'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'credentials', {'uid': user.uid, 'token': '' }));
    }
    else if (req.params.group == 'address') {
        user = res.locals.reqParams['user'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'address', {'email': user.email}));
    }
    else if (req.params.group == 'fromShares') {
        user = res.locals.reqParams['user'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'shares', user.shares));
    }
    else if (req.params.group == 'other') {
        user = res.locals.reqParams['user'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'other', {'sms': user.SMSemail}));
    }
    else {
        var err = new Error('Fatal error in settings.server.controller.js/settingsGetHandler');
        next(err);
    }
}


exports.post = function(req, res, next) {

    var user;
    if (req.params.group == 'address') {
        user = res.locals.reqParams['user'];
        User.findOne( { email: req.body.address.email }, function(err, oldUser) {
            if (err) { 
                next(err)
            }
            else if (oldUser && (oldUser != user)) { 
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Email previously registered by another user') );
            }
            else {
                // Confirm the current password
                Auth.verifyPassword(req.body.address.currentpw, user)
                .then( function(verified) {
                    if (verified) {
                        var oldEmail = user.email;
                        user.email = req.body.address.email;
                        user.save(function(err, user1) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'address', {'email': user1.email} ));
                                // As security check notify the user
                                var mailer = req.app.locals.mailer;
                                var mailTransport = Nodemailer.createTransport(mailer.options);
                                var options = { 
                                    from: mailer.from,
                                    to: oldEmail,
                                    subject: 'ScriptRemote security notice - email changed',
                                    html: 'Your ScriptRemote email has been changed to ' + user.email + '.\n If you did not make this change please contact your site administrator.'
                                    } 
                                mailTransport.sendMail(options, function(err1, info) {
                                    if (err1) {
                                        var time = (new Date()).toString();
                                        console.log('\n' + time);
                                        console.log(mailer.options);
                                        console.log(options);
                                        console.log(err1);
                                        return;
                                    }
                                    else {
                                        return;
                                    }
                                })
                            }
                        })
                    }
                    else {
                        res.status(401);
                        res.send( Utils.makeRes(Utils.statusTag, 'Incorrect current password') );
                    }
                },
                function(err) {
                    next(err);
                })
            }
        })
    }
    else if (req.params.group == 'password') {
        user = res.locals.reqParams['user'];
        // Confirm the current password
        Auth.verifyPassword(req.body.password.currentpw, user)
        .then( function(verified) {
            if (verified) {
                Auth.hashPassword(req.body.password.pw)
                .then(
                    function(hash) {
                        user.pwhash = hash;
                        user.save(function(err, user1) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                res.send( Utils.makeRes(Utils.statusTag, Utils.OK ));
                                // As security check notify the user
                                var mailer = req.app.locals.mailer;
                                var mailTransport = Nodemailer.createTransport(mailer.options);
                                var options = { 
                                    from: mailer.from,
                                    to: user.email,
                                    subject: 'ScriptRemote security notice - password changed',
                                    html: 'Your ScriptRemote password has been changed.\n If you did not make this change please contact your site administrator.'
                                    } 
                                mailTransport.sendMail(options, function(err1, info) {
                                    if (err1) {
                                        var time = (new Date()).toString();
                                        console.log('\n' + time);
                                        console.log(mailer.options);
                                        console.log(options);
                                        console.log(err1);
                                        return;
                                    }
                                    else {
                                        return;
                                    }
                                })                    }
                            })
                    },
                    function(err) {
                        return next(err);
                    }
                )
            }
            else {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'Incorrect current password') );
            }
        },
        function(err) {
            next(err);
        })
    }
    else if (req.params.group == 'apiCredentials') {
        user = res.locals.reqParams['user'];
        var token = newToken();
        Auth.hashPassword(token)
        .then(
            function(hash) {
                user.token = hash;
                user.save(function(err, user1) {
                    if (err) {
                        return next(err);
                    }
                    else {
                        res.setHeader('Cache-Control', 'no-store');
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'credentials', {'uid': user.uid, 'token': token }));
                        // As security check notify the user
                        var mailer = req.app.locals.mailer;
                        var mailTransport = Nodemailer.createTransport(mailer.options);
                        var options = { 
                            from: mailer.from,
                            to: user.email,
                            subject: 'ScriptRemote security notice - new API token',
                            html: 'A new API token was created for your account.\n If you did not make this change please contact your site administrator.'
                            } 
                        mailTransport.sendMail(options, function(err1, info) {
                            if (err1) {
                                var time = (new Date()).toString();
                                console.log('\n' + time);
                                console.log(mailer.options);
                                console.log(options);
                                console.log(err1);
                                return;
                            }
                            else {
                                return;
                            }
                        })
                    }
                })
            },
            function(err) {
                return next(err);
            }
        )
    }
    else if (req.params.group == 'fromShares') {
        user = res.locals.reqParams['user'];
        var share = req.body.share;
        User.findOne( { email: share.email }, function(err, owner) {
            if (err) { 
                next(err)
            }
            else if (!owner) { 
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Not a registered user') );
            }
            else if (owner.Id().equals(user.Id())) { 
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Cannot share from self') );
            }
            else {
                Project.findOne( { ownerUid: owner.uid, projectName: share.project }, function(err, project) {
                    if (err) { 
                        next(err);
                    }
                    else if (!project) {
                        res.status(400);
                        res.send( Utils.makeRes(Utils.statusTag, 'Unknown project') );
                    }
                    else if (!project.chkAuthorizedTo(user.Id())) {
                        res.status(401);
                        res.send( Utils.makeRes(Utils.statusTag, 'No permission for project') );
                    }
                    else {
                        share.encrypted = project.isEncrypted;
                        share.salt = project.salt;
                        user.shares.push(share);
                        user.save(function(err, user1) {
                            if (err) {
                                return next(err);
                            }
                            else {
                                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'shares', user1.shares) );
                            }
                        })
                    }
                })
            }
        })
    }
    else if (req.params.group == 'other') {
        user = res.locals.reqParams['user'];
        user.SMSemail = req.body.sms;
        user.save(function(err, user1) {
            if (err) {
                return next(err);
            }
            else {
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'other', {'sms': user1.SMSemail} ));
            }
        })
    }
    else {
        var err = new Error('Fatal error in settings.server.controller.js/settingsPostHandler');
        next(err);
    }
};


exports.put = function(req, res, next) {

    if (req.params.group == 'fromShares') {
        var user = res.locals.reqParams['user'];
        var share = req.body.share;
        User.findOne( { email: share.email }, function(err, owner) {
            if (err) { 
                next(err)
            }
            else if (!owner) { 
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Not a registered user') );
            }
            else {
                var index = -1;
                for (var i = 0; i < user.shares.length; i++) {
                    var share1 = user.shares[i];
                    if ((share1['email'] == share['email']) && (share1['project'] == (share['project'])))
                    {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    user.shares.splice(index, 1);
                    user.save(function(err, user1) {
                        if (err) {
                            return next(err);
                        }
                        else {
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'shares', user1.shares) );
                        }
                    })
                }
            }
        })
    }
    else {
        var err = new Error('Fatal error in settings.server.controller.js/settingsPutHandler');
        next(err);
    }
}

