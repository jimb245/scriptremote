'use strict'

var q = require('q'),
	User = require('../../../app/models/user.server.model.js'),
	Project = require('../../../app/models/project.server.model.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
	Delete = require('./delete.server.controller.js'),
    Utils = require('../../../app/utils.js');


var userFind = function(auth, deferred) {
    User.findOne( {_id: auth['id']}, function(err, user) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve({email: user.email, access: auth['access']});
        }
    })
}


// Converts array of authorizations to array of emails,
// returns a promise.
var idToEmail = function(auths) {
    var publicUser = 'public';
    var promises = [];
    for (var i = 0; i < auths.length; i++) {
        var deferred = q.defer();
        var auth = auths[i];
        if (auth['id']) {
            userFind(auth, deferred);
        }
        else {
            deferred.resolve({email: publicUser, access: auth['access']});
        }
        promises.push(deferred.promise);
    }
    return q.all(promises);
}

exports.get = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var getType = reqParams['op'];
    var user = reqParams['user'];
    var owned = reqParams['owned'];
    var project;

    if (getType == 'projects') {
        // Get the projects of user
        Project.find( {ownerUid: user.uid} ).sort({timeStampInit: 'asc'}).exec( function(err, projects) {
            if (err) {
                next(err);
            }
            else {
                var resProjects = [];
                for (var i = 0; i < projects.length; i++) {
                    project = projects[i];
                    resProjects.push([project.projectName, project.isEncrypted, project.salt]);
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'projects', resProjects) );
            }
        })
    }
    else if (getType == 'projects-share') {
        // Get projects of another user shared to requesting user
        var owner = user;
        var shareUser = reqParams['shareUser'];
        Project.find( {ownerUid: owner.uid} ).sort({timeStampInit: 'asc'}).exec( function(err, projects) {
            if (err) {
                next(err);
            }
            else {
                var resProjects = [];
                for (var i = 0; i < projects.length; i++) {
                    project = projects[i];
                    var access = project.chkAuthorizedTo(shareUser.Id());
                    if (access) {
                        resProjects.push([project.projectName, project.isEncrypted, project.salt]);
                    }
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'projects', resProjects) );
            }
        })
    }
    else if (getType == 'project') {
        // Get the parameters of a project
        project = res.locals.reqParams['project'];
        var notify = 'off';
        var nickname = '';
        var chkNotify = project.chkNotifyTo(user.email);
        if (chkNotify) {
            notify = 'on';
            nickname = chkNotify.nickname;
        }
        idToEmail(project.authorizedTo)
        .then ( function(authArray) {
                    if (owned) {
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'owner', user.email, 'authUsers', authArray, 'notify', notify, 'nickname', nickname, 'timestamp', project.timeStamp, 'description', project.description, 'encrypted', project.isEncrypted, 'salt', project.salt) );
                    }
                    else {
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'owner', user.email, 'notify', notify, 'nickname', nickname, 'timestamp', project.timeStamp, 'description', project.description, 'encrypted', project.isEncrypted, 'salt', project.salt) );
                    }
                },
                function(err) {
                    next(err);
                }
        )
    }
    else {
        var err = new Error('Fatal error in projects.server.controller.js');
        throw err;
    }
}

var postHelper = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var postType = reqParams['op'];
    var user = reqParams['user'];

    // Creating a project
    var name = reqParams['project_name'];
    if (!name) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "project_name"') );
        return
    }
    name = Middle.sanitizeQString(name);
    if (!reqParams.hasOwnProperty('is_encrypted')) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "is_encrypted"') );
        return
    }
    var isEncrypted = (typeof reqParams['is_encrypted'] == 'string') && (reqParams['is_encrypted'].search(/true/i) >= 0);
    var salt = '';
    if (isEncrypted && reqParams.hasOwnProperty('salt') && (typeof reqParams['salt'] == 'string')) {
        salt = reqParams['salt']
    }
    var timestamp = reqParams['timestamp'];
    if (!timestamp) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "timestamp"') );
        return
    }

    // Check that project name is unused for the user - uniqueness is also
    // enforced in the mongoose schema
    Project.findOne( {'projectName': name, 'ownerUid': user.uid}, function(err, project) {
        if (err) {
            next(err);
        }
        else if (project) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Project name in use') );
        }
        else {
            // Create the new project entry in db.
            var proj = new Project( {projectName: name, description: '', timeStamp: timestamp, timeStampInit: (new Date()).getTime(), ownerUid: user.uid, authorizedTo: [], jobcnt: 0, isEncrypted: isEncrypted, salt: salt} ); 
            proj.save(function(err, project) {
                if (err) {
                    next(err);
                }
                else {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                }
            })
        }
    })
}

exports.post = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];

    debugger;

    // Check if projects-per-user limit exceeded
    if (req.app.locals.projectLimits.projectsPerUser) {
        var limit = req.app.locals.projectLimits.projectsPerUser;
        Project.find( {'ownerUid': user.uid}, function(err, projects) {
            if (err) {
                next(err);
            }
            else if (projects.length >= limit) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Maximum number of projects exceeded: ' + limit) );
            }
            else {
                // Create the new project entry in db.
                postHelper(req, res, next);
            }
        })
    }
    else {
        // Create the new project entry in db.
        postHelper(req, res, next);
    }
}

exports.patch = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var patchType = reqParams['op'];
    var user = reqParams['user'];
    var project = reqParams['project'];
    var publicUser = 'public';
    var action;

    if (patchType == 'share') {
        // Modifying authorized users of a project
        if (!reqParams['owned']) {
            res.status(401);
            res.send( Utils.makeRes(Utils.statusTag, 'Action not authorized for user') );
            return;
        }
        action = reqParams['action'];
        var isPublic = (reqParams['email'] == publicUser);
        if (isPublic && (action == 'add') &&  !user.admin) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Public access requires admin user') );
            return
        }
        User.findOne( {'email': reqParams['email']}, function(err, user1) {
            if (err) {
                next(err);
            }
            else if (!user1 && !isPublic) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Not a registered user') );
            }
            else if (user1 && user1.Id().equals(user.Id())) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Cannot share to self') );
            }
            else {
                var id = null;
                if (user1) {
                    id = user1.Id();
                }
                if (action == 'add') {
                    var access = reqParams['access'];
                    var oldAccess = project.chkAuthorizedTo(id);
                    if (oldAccess) {
                        res.status(400);
                        res.send( Utils.makeRes(Utils.statusTag, 'Project is already shared to user') );
                    }
                    else if ((access != 'read') && (access != 'reply') && (access != 'write')) {
                        res.status(400);
                        res.send( Utils.makeRes(Utils.statusTag, 'Unknown access type') );
                    }
                    else {
                        project.authorizedTo.push({id: id, 'access': access});
                        project.save(function(err, project1) {
                            if (err) {
                                next(err);
                            }
                            else {
                                res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                            }
                        })
                    }
                }
                else if (action == 'remove') {
                    var keeps = [];
                    for (var i = 0; i < project.authorizedTo.length; i++) {
                        if (project.authorizedTo[i]['id'] && id) {
                            if (project.authorizedTo[i]['id'].toString() == user1.Id().toString()) {
                                continue;
                            }
                        }
                        else if (!project.authorizedTo[i]['id'] && !id) {
                            continue;
                        }
                        else {
                            keeps.push(project.authorizedTo[i]);
                        }
                    }
                    project.authorizedTo = keeps;
                    var shared = keeps.length > 0;
                    project.save(function(err, project1) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'shared', shared) );
                        }
                    })
                }
                else {
                    res.status(400);
                    res.send( Utils.makeRes(Utils.statusTag, 'Action not "add" or "remove"') );
                }
            }
        })
    }
    else if (patchType == 'notify') {
        // Modifying notification list of project
        var notifyUser = user;
        if (!reqParams['owned']) {
            notifyUser = reqParams['shareUser'];
        }
        action = reqParams['action'];
        if (action == 'on') {
            var nickname = reqParams['nickname'];
            var notify = project.chkNotifyTo(notifyUser.email);
            if (notify) {
                for (var i = 0; i < project.notifyTo.length; i++) {
                    if (project.notifyTo[i].email == notifyUser.email) {
                        project.notifyTo[i].nickname = nickname;
                        break;
                    }
                }
                project.save(function(err, project1) {
                    if (err) {
                        next(err);
                    }
                    else {
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                    }
                })
            }
            else {
                project.notifyTo.push({email: notifyUser.email, sms: notifyUser.SMSemail, nickname: nickname});
                project.save(function(err, project1) {
                    if (err) {
                        next(err);
                    }
                    else {
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK ) );
                    }
                })
            }
        }
        else if (action == 'off') {
            var keeps = [];
            for (var j = 0; j < project.notifyTo.length; j++) {
                if (project.notifyTo[j].email != notifyUser.email) {
                    keeps.push(project.notifyTo[j]);
                }
            }
            project.notifyTo = keeps;
            project.save(function(err, project1) {
                if (err) {
                    next(err);
                }
                else {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK ) );
                }
            })
        }
        else {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Action not "add" or "remove"') );
        }
    }
    else if (patchType == 'description') {
        // Modifying text description of a project
        if (reqParams['description']) {
            project.description = reqParams['description'];
            project.save(function(err, project1) {
                if (err) {
                    next(err);
                }
                else {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                }
            })
        }
    }
    else {
        var err = new Error('Fatal error in projects.server.controller.js');
        throw err;
    }
}

exports.delete = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var project = reqParams['project'];

    Delete.projectDelete(req, project)
    .then( function() {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
        },
        function(err) {
            next(err);
        }
    )
}

