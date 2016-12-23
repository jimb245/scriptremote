'use strict'

//
// Handlers for browser client to do admin tasks
//

var q = require('q'),
	Nodemailer = require('nodemailer'),
    User = require('../../../app/models/user.server.model.js'),
    Reg = require('../../../app/controllers/browser/registration.server.controller.js'),
    Delete = require('../../../app/controllers/api/delete.server.controller.js'),
    Utils = require('../../../app/utils.js');


exports.get = function(req, res, next) {
    if (req.params.uid) {
        User.findOne( { 'uid': req.params.uid }, function(err, user) {
            if (err) { 
                next(err);
            }
            else if (!user) {
                res.status(401);
                res.send( Utils.makeRes(Utils.statusTag, 'User not found') );
            }
            else {
                var data = {'name': user.name, 'regDate': user.regDate, 'company': user.company,
                'email': user.email, 'admin': user.admin, 'confirmed': user.confirmed, 
                'enabled': user.enabled, 'uid': user.uid, 'regToken': user.regToken,
                'shares': user.shares};
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'user', data));
            }
        })
    }
    else {
        User.find( {} ).sort({regDate: 'asc'}).exec( function(err, users) {
            if (err) {
                next(err);
            }
            else {
                var resUsers = [];
                for (var i = 0; i < users.length; i++) {
                    resUsers.push( {'uid': users[i].uid, 'email': users[i].email} );
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'users', resUsers) );
            }
        })
    }
}


exports.post = function(req, res, next) {

    var name = req.body.name;
    var company = req.body.company;
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }
    User.findOne( { email: email }, function(err, user) {
        if (err) { 
            return next(err);
        }
        else if (user) { 
            res.status(400);
            var msg = "Email " + email + " is already registered.";
            res.send( Utils.makeRes(Utils.statusTag, msg, 'uid', user.uid) );
            return
        }

        var newUser = null;
        Reg.getConfig(false, req)
        .then(function(config) {
            return Reg.initUser(true, 'adminReg', config.idleTimeout, false, {'name': name, 
                'company': company, 'email': email, 'password': password})
        })
        .then(function(user) {
            newUser = user;
            return Reg.initTemplates(req.app.locals.grid, user)
        })
        .then( function() {
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'uid', newUser.uid) );
               },
               function(err) { 
                next(err) 
            }
        )
    })
}


exports.put = function(req, res, next) {

    if (!req.params.uid) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }
    User.findOne( { 'uid': req.params.uid }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user) {
            res.status(401);
            res.send( Utils.makeRes(Utils.statusTag, 'User not found') );
        }
        else if (user.admin) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not allowed for admin user') );
        }
        else {
            if (req.body.hasOwnProperty('enabled')) {
                user.enabled = req.body.enabled;
            }
            if (req.body.hasOwnProperty('confirmed')) {
                user.confirmed = req.body.confirmed;
            }
            user.save( function(err, user1) {
                if (err) {
                    next(err);
                }
                else {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK ) );
                }
            })
        }
    })
}

exports.delete = function(req, res, next) {

    if (!req.params.uid) {
        res.status(400);
        var err = new Error('Invalid request');
        return next(err);
    }
    User.findOne( { 'uid': req.params.uid }, function(err, user) {
        if (err) { 
            next(err);
        }
        else if (!user) {
            res.status(401);
            res.send( Utils.makeRes(Utils.statusTag, 'User not found') );
        }
        else if (user.admin) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not allowed for admin user') );
        }
        else {
            Delete.userDelete(req, user)
            .then( function() {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                   },
                   function(err) { next(err) }
            )
        }
    })
}

exports.mail = function(req, res, next) {

    User.find({}, function(err, users) {
        if (err) {
            next(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < users.length; i++) {
                var mailer = req.app.locals.mailer;
                var mailTransport = Nodemailer.createTransport(mailer.options);
                var options = { 
                    from: mailer.from,
                    to: users[i].email,
                    subject: 'scriptremote admin message',
                    html: req.body.msg
                    } 
                var p = mailTransport.sendMail(options);
                promises.push(p);
            }
            q.all(promises)
            .then(function() {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK));
                },
                function(err) {
                    var time = (new Date()).toString();
                    console.log('\n' + time);
                    console.log(mailer.options);
                    console.log(options);
                    console.log(err);
                    next(err);                
                }
            )
        }
    })
}

exports.options = function(req, res, next) {
    if (req.method === 'PUT') {
        Reg.getConfig(false, req)
        .then(function(config) {
                if (req.body.hasOwnProperty('options')) {
                    config.jobsEnabled = req.body.options.jobsEnabled;
                    config.regEnabled = req.body.options.regEnabled;
                    config.save( function(err, config1) {
                        if (err) {
                            next(err);
                        }
                        else {
                            var options = {'jobsEnabled': config1.jobsEnabled, 'regEnabled': config1.regEnabled};
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'options', options) );
                        }
                    })
                }
             },
            function(err) {
                next(err);                
            }
        )
    }
    else {
        Reg.getConfig(false, req)
        .then(function(config) {
                var options = {'jobsEnabled': config.jobsEnabled, 'regEnabled': config.regEnabled};
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'options', options) );
             },
            function(err) {
                next(err);                
            }
        )
    }
}
