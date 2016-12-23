'use strict'

//
// DELETE handler for projects and users
//

var q = require('q');
var Mongoose = require('mongoose');
var Project = require('../../../app/models/project.server.model.js');
var User = require('../../../app/models/user.server.model.js');
var Template = require('../../../app/models/template.server.model.js');
var Metafile = require('../../../app/models/metafile.server.model.js');
var Job = require('../../../app/models/job.server.model.js');
var Location = require('../../../app/models/location.server.model.js');
var Message = require('../../../app/models/message.server.model.js');
var	Short = require('../../../app/models/short.server.model.js');
var	ShortHandler = require('../../../app/controllers/lib/short.server.js');
var Metafile = require('../../../app/models/metafile.server.model.js');
var FileHandler = require('./files.server.controller.js');
var statusTag = require('../../../app/utils.js').statusTag;
var OK = require('../../../app/utils.js').OK;
var serverErr = require('../../../app/utils.js').serverErr;
var makeRes = require('../../../app/utils.js').makeRes;

// Delete a message and its files - returns a promise
var msgDelete = function(req, msg) {

    var deferred = q.defer();
    // Look up files etc. belonging to the message
    Metafile.find( {'parentId': msg.Id()}, function(err, mfs) {
        if (err) {
            deferred.reject(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < mfs.length; i++) {
                promises.push(FileHandler.delete(req, mfs[i]));
            }
            var p = ShortHandler.delete(msg);
            promises.push(p);

            q.all(promises)
            .then( function() {
                    Message.remove( {_id: msg.Id()}, function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        else {
                            deferred.resolve();
                        }
                    })
                },
                function(err) {
                    deferred.reject(err);
                }
            )
        }
    })
    return deferred.promise;
}

// Prune a message to stay within maxMsgs limit.
// msg is a new message. Returns a promise with
// the pruned size.
exports.msgPrune = function(req, maxMsgs, loc, msg) {

    var deferred = q.defer();
    var msgnum = msg.msgId.substring(3);
    if (msgnum > maxMsgs) {
        // Message 'msgId' property is sequential
        var oldnum = msgnum - maxMsgs;
        var oldId = 'Msg' + oldnum;
        Message.findOne({locDBId: loc.Id(), 'msgId': oldId}, function(err, oldMsg) {
            if (err) {
                deferred.reject(err);
            }
            else if (!oldMsg) {
                deferred.resolve(0)
            }
            else {
                var size = oldMsg.msgSize;
                msgDelete(req, oldMsg)
                .then( function() {
                        deferred.resolve(size);
                    },
                    function(err) {
                        deferred.reject(err);
                    }
                )
            }
        })
    }
    else {
        deferred.resolve(0);
    }
    return deferred.promise;
}

// Delete a location and its messages - returns a promise
exports.locDelete = function(req, loc) {

    var deferred = q.defer();
    Message.find( { locDBId: loc.Id() }, function(err, msgs) {
        if (err) {
            deferred.reject(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < msgs.length; i++) {
                var msg = msgs[i];
                promises.push(msgDelete(req, msg));
            }
            q.all(promises)
            .then( function() {
                    Location.remove( {_id: loc.Id() }, function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        else {
                            deferred.resolve();
                        }
                     })
                },
                function(err) {
                    deferred.reject(err);
                }
            )
        }
    });
    return deferred.promise;
}

// Delete a job and its locations - returns a promise
exports.jobDelete = function(req, job) {

    var deferred = q.defer();
    Location.find( { jobDBId: job.Id() }, function(err, locations) {
        if (err) {
            deferred.reject(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < locations.length; i++) {
                var loc = locations[i];
                promises.push(exports.locDelete(req, loc));
            }
            q.all(promises)
            .then( function() {
                    Job.remove( {_id: job.Id() }, function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        else {
                            deferred.resolve();
                        }
                    })
                },
                function(err) {
                    deferred.reject(err);
                }
            )
        }
    });
    return deferred.promise;
}


// Delete a project and its jobs - returns a promise
exports.projectDelete = function(req, project) {

    var deferred = q.defer();
    Job.find( { projectDBId: project.Id() }, function(err, jobs) {
        if (err) {
            deferred.reject(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < jobs.length; i++) {
                var job = jobs[i];
                promises.push(exports.jobDelete(req, job));
            }
            q.all(promises)
            .then( function() {
                    Project.remove( { _id: project.Id() }, function(err) {
                        if (err) {
                            deferred.reject(err);
                        }
                        else {
                            deferred.resolve();
                        }
                    })
                },
                function(err) {
                    deferred.reject(err);
                }
            )
        }
    });
    return deferred.promise;
}

// Deletes all the projects of a user - returns a promise
var userProjectsDelete = function(req, user) {

    var deferred = q.defer();
    Project.find( { ownerUid: user.uid }, function(err, projects) {
        if (err) {
            deferred.reject(err);
        }
        else {
            var promises = [];
            for (var i = 0; i < projects.length; i++) {
                var project = projects[i];
                promises.push(exports.projectDelete(req, project));
            }
            q.all(promises)
            .then( function() {
                        deferred.resolve();
                    },
                    function(err) {
                        deferred.reject(err);
                    }
            )
        }
    });
    return deferred.promise;
}

var metaRemove = function(id, deferred) {
    Metafile.remove( {'_id': id}, function(err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    })
}

// Deletes all the templates of a user - returns a promise
var userTemplatesDelete = function(req, user) {

    debugger;
    var deferred = q.defer();
    Template.findOne( { ownerUid: user.Id() }, function(err, template) {
        if (err || !template) {
            deferred.reject(err);
        }
        else {
            Metafile.find( {'parentId': template.Id()}, function(err, mfs) {
                var promises = [];
                var mf;
                for (var i = 0; i < mfs.length; i++) {
                    mf = mfs[i];
                    promises.push(FileHandler.delete(req, mf));
                }
                for (i = 0; i < mfs.length; i++) {
                    mf = mfs[i];
                    var def = q.defer();
                    metaRemove(mf.Id(), def);
                    promises.push(def.promise);
                }
                return q.all(promises)
            })
        }
    })
}


// Deletes a user -returns a promise
exports.userDelete = function(req, user) {

    var deferred = q.defer();
    var promises = [];
    promises.push(userProjectsDelete(req, user));
    promises.push(userTemplatesDelete(req, user));
    return q.all(promises)
        .then(function() {
                Template.remove( { ownerUid: user.Id() }, function(err) {
                    if (err) {
                        deferred.reject(err);
                    }
                    else {
                        User.remove( {"_id": user.Id() }, function(err) {
                            if (err) {
                                deferred.reject(err);
                            }
                            else {
                                deferred.resolve(null);
                            }
                        })
                    }
                });
                return deferred.promise;
            },
            function(err) {
                deferred.reject(err);
            }
        )
}



