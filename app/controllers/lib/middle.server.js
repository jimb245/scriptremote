'use strict'

//
// Additional middleware for '../projects/..' routes.
// Request info is collected in res.locals.reqParams.
//
// The middleware chain is:
//  copy route params
//  authenticate - session-based for browsers, basic header for scripts
//  validate params - from route params look up DB instances
//  parse query/form/multipartform
//  handle route
//  handle server errors
//  
//

var Multiparty = require('multiparty'),
	q = require('q'),
	User = require('../../../app/models/user.server.model.js'),
	Project = require('../../../app/models/project.server.model.js'),
	Job = require('../../../app/models/job.server.model.js'),
	Location = require('../../../app/models/location.server.model.js'),
	Message = require('../../../app/models/message.server.model.js'),
	AuthUtil = require('./auth.server.js'),
	Utils = require('../../../app/utils.js');


// Sanitize a string that could be used in mongo query.
// The injection threat is supposed to be inherently small
// compared to sql to begin with, so not much needs to be done.
var sanitizeQString = function(s) {
    var start = 0;
    var len = s.length;
    if (len > 255) {
        len = 255;
    }
    if (s.charAt(0) == '$') {
        start = 1;
    }
    return s.slice(start, start + len);
}
exports.sanitizeQString = sanitizeQString;

exports.isSanitizedQString = function(s) {
    return (s == sanitizeQString(s))
}

// Copy the request operation and route params.
exports.copyParams = function(req, res, next, access, op, paramNames) {
    if (!res.locals.reqParams) {
        res.locals.reqParams = {};
    }
    res.locals.reqParams['access'] = access;
    res.locals.reqParams['op'] = op;
    if (req.params.base == 'brsapi') {
        res.locals.reqParams['base'] = 'brsapi';
    }
    else if (req.params.base == 'api') {
        res.locals.reqParams['base'] = 'api';
    }

    for (var i = 0; i < paramNames.length; i++) {
        var p = paramNames[i];
        switch(p) {
            case 'project':
                res.locals.reqParams['project_name'] = sanitizeQString(req.params.project);
                break;
            case 'job':
                res.locals.reqParams['job_id'] = sanitizeQString(req.params.job);
                break;
            case 'location':
                res.locals.reqParams['location_name'] = sanitizeQString(req.params.location);
                break;
            case 'msg':
                res.locals.reqParams['msg_id'] = sanitizeQString(req.params.msg);
                break;
            case 'file_key':
                res.locals.reqParams['file_key'] = sanitizeQString(req.params.file_key);
                break;
            case 'name':
                res.locals.reqParams['name'] = sanitizeQString(req.params.name);
                break;
            case 'owner':
                res.locals.reqParams['owner'] = sanitizeQString(req.params.owner);
                break;
            default:
                var err = new Error('Fatal error in middle.js/copyParams');
                return next(err);
        }
    }
    next();
}

// Middleware to validate :location/:msg route params 
// previously saved in res.locals.reqParams and also to add their 
// corresponding model objects
exports.validateParams = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];
    var project = reqParams['project'];
    var jobId = reqParams['job_id'];
    var locName = reqParams['location_name'];
    var msgId = reqParams['msg_id'];

    if (!jobId || !locName) {
        return next();
    }
    else {
        var job = reqParams['job'];
        Location.findOne( { locName: locName, jobDBId: job.Id() }, function(err, loc) {
            if (err) {
               return next(err);
            }
            else if (!loc) {
                if (reqParams['op'] != 'msg') {
                    // The location name can be new only if POSTing a message
                    res.status(404);
                    res.send( Utils.makeRes(Utils.statusTag, 'Invalid location name') );
                }
                else {
                    return next();
                }
            }
            else {
                reqParams['location'] = loc;
                if (!msgId) {
                    return next();
                }
                else {
                    Message.findOne( { msgId: msgId, locDBId: loc.Id() }, function(err, msg) {
                        if (err) {
                           return next(err);
                        }
                        else if (!msg) {
                            res.status(404);
                            res.send( Utils.makeRes(Utils.statusTag, 'Invalid message id') );
                        }
                        else {
                            reqParams['msg'] = msg;
                            reqParams['parentId'] = msg.Id();
                            return next();
                        }
                    })
                }
            }
        })
    }
}

// Validate :job route param and if doing api route also
// check token/job authorization - returns a promise.
// Response is sent immediately for user errors, not 
// for server errors.
var authJobPrm = function(res) {
    var deferred = q.defer();
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];
    var project = reqParams['project'];
    var token = reqParams['token'];
    var jobId = reqParams['job_id'];
    var p = null;

    if (jobId) {
        // Request is for specific job
        Job.findOne( {  jobId: jobId, projectDBId: project.Id() }, function(err, job) {
            if (err) {
                err.type = 'server';
                deferred.reject(err);
            }
            else if (!job) {
                res.status(404);
                res.send( Utils.makeRes(Utils.statusTag, 'Invalid jobid') );
                var err1 = new Error();
                err1.type = 'user';
                deferred.reject(err1);
            }
            else {
                reqParams['job'] = job;
                if (reqParams['base'] == 'api') {

                    // url is 'api - check Basic Auth token vs job or user
                    var promises = [];

                    // Does request token match current job token?
                    p = AuthUtil.verifyToken(token, job.apiToken);
                    promises.push(p);

                    if (reqParams['owned']) {
                        // 'user' is the project owner and requesting user. 
                        // Does request token match the owner's current token from the database?
                        p = AuthUtil.verifyToken(token, user.token);
                        promises.push(p);
                    }
                    else if (reqParams['shareUser']) {
                        // 'shareUser' is the requesting user, not project owner.
                        // Does request token match the requestor's current token from the database?
                        p = AuthUtil.verifyToken(token, reqParams['shareUser'].token);
                        promises.push(p);
                    }
                    q.all(promises)
                    .then(function(verified) {
                            if (verified[0] || verified[1]) {
                                // Matches job token so valid
                                deferred.resolve(res);
                            }
                            else {
                                res.status(401);
                                res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                res.send( Utils.makeRes(Utils.statusTag, 'Invalid user token') );
                                var err1 = new Error();
                                err1.type = 'user';
                                deferred.reject(err1);
                            }
                        },
                        function(err) {
                            deferred.reject(err)
                        }
                    )
                }
                else {
                    // Current url is not 'api' so nothing more to check
                    deferred.resolve(res);
                }
            }
        })

    }
    else {
        // Request is not specific to job
        if (reqParams['base'] == 'api') {
            if (reqParams['owned']) {
                // 'user' is the project owner and requesting user. 
                // Does auth token match the owner's current token from the database?
                p = AuthUtil.verifyToken(token, user.token);
            }
            else if (reqParams['shareUser']) {
                // 'shareUser' is the requesting user, not project owner.
                // Does request token match the requestor's current token from the database?
                p = AuthUtil.verifyToken(token, reqParams['shareUser'].token);
            }
            p.then( 
                function(verified) {
                    if (verified) {
                        deferred.resolve(res);
                    }
                    else {
                        res.status(401);
                        res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                        res.send( Utils.makeRes(Utils.statusTag, 'Invalid user token') );
                        var err1 = new Error();
                        err1.type = 'user';
                        deferred.reject(err1);
                    }
                },
                function(err) {
                    deferred.reject(err)
                }
            )
        }
        else {
            // Current url is not 'api' so nothing more to check
            deferred.resolve(res);
        }
    }
    return deferred.promise;
}


// Check project authorization - returns a promise.
// Response is sent immediately for user errors, not 
// for server errors.
var authProjectPrm = function(res) {

    var deferred = q.defer();
    var reqParams = res.locals.reqParams;
    var user = res.locals.reqParams['user'];
    var err;
    var err1;
    if (reqParams['op'] == 'projects') {
        // Getting projects owned by requesting user
        reqParams['owned'] = true;
        deferred.resolve(res);
    }
    else if (reqParams['op'] == 'projects-share') {
        // Getting projects shared by another user
        var email = reqParams['owner'];
        User.findOne( { 'email': email }, function(err, user1) {
            if (err) { 
                err.type = 'server';
                deferred.reject(err);
            }
            else if (!user1) {
                res.status(404);
                res.send( Utils.makeRes(Utils.statusTag, 'Sharing user not found') );
                err1 = new Error();
                err1.type = 'user';
                deferred.reject(err1);
            }
            else {
                reqParams['shareUser'] = user;
                // reqParams['user'] wlll represent the owner instead of
                // the requestor for following middleware
                reqParams['user'] = user1;
                // and remember that requstor does not own the project
                reqParams['owned'] = false;
                deferred.resolve(res);
            }
        })
    }
    else if (reqParams['op'] == 'project-post') {
        // Creating new project owned by requesting user
        reqParams['owned'] = true;
        deferred.resolve(res);
    }
    else {
        // Request is for existing project
        var projName = reqParams['project_name'];
        Project.findOne( { 'projectName': projName, 'ownerUid': user.uid }, function(err, project) {
            if (err) { 
                err.type = 'server';
                deferred.reject(err);
            }
            else if (project) { 
                // It's an existing project owned by requesting user
                reqParams['project'] = project;
                reqParams['owned'] = true;
                deferred.resolve(res);
            }
            else {
                // Check for a project with different owner
                var sp = projName.split("~");
                if (sp.length != 2) {
                    res.status(404);
                    res.send( Utils.makeRes(Utils.statusTag, 'Invalid project') );
                    err1 = new Error();
                    err1.type = 'user';
                    deferred.reject(err1);
                }
                else {
                    // Look for the owner
                    User.findOne( { 'email': sp[1] }, function(err, user1) {
                        if (err) { 
                            err.type = 'server';
                            deferred.reject(err);
                        }
                        else if (!user1) {
                            res.status(404);
                            res.send( Utils.makeRes(Utils.statusTag, 'Invalid project') );
                            err1 = new Error();
                            err1.type = 'user';
                            deferred.reject(err1);
                        }
                        else {
                            // Look for the project
                            Project.findOne( { 'projectName': sp[0], 'ownerUid': user1.uid }, function(err, project) {
                                if (err) { 
                                    err.type = 'server';
                                    deferred.reject(err);
                                }
                                else if (!project) {
                                    res.status(404);
                                    res.send( Utils.makeRes(Utils.statusTag, 'Invalid project') );
                                    err1 = new Error();
                                    err1.type = 'user';
                                    deferred.reject(err1);
                                }
                                else {
                                    // Check if requesting user has the needed permission
                                    var access = project.chkAuthorizedTo(user.Id());
                                    if (!access) {
                                        if (reqParams['base'] == 'api') {
                                            res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                        }
                                        res.status(401);
                                        res.send( Utils.makeRes(Utils.statusTag, 'Project not authorized for user') );
                                        err1 = new Error();
                                        err1.type = 'user';
                                        deferred.reject(err1);
                                    }
                                    else if ((reqParams['access'] == 'owner')) {
                                        if (reqParams['base'] == 'api') {
                                            res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                        }
                                        res.status(401);
                                        res.send( Utils.makeRes(Utils.statusTag, 'Project not owned by user') );
                                        err1 = new Error();
                                        err1.type = 'user';
                                        deferred.reject(err1);
                                    }
                                    else if ((reqParams['access'] == 'write') && (access != 'write')) {
                                        if (reqParams['base'] == 'api') {
                                            res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                        }
                                        res.status(401);
                                        res.send( Utils.makeRes(Utils.statusTag, 'Project write not authorized for user') );
                                        err1 = new Error();
                                        err1.type = 'user';
                                        deferred.reject(err1);
                                    }
                                    else if ((reqParams['access'] == 'reply') && (access == 'read')) {
                                        if (reqParams['base'] == 'api') {
                                            res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                        }
                                        res.status(401);
                                        res.send( Utils.makeRes(Utils.statusTag, 'Project reply not authorized for user') );
                                        err1 = new Error();
                                        err1.type = 'user';
                                        deferred.reject(err1);
                                    }
                                    else if (reqParams['op'] == 'delete') {
                                        if (reqParams['base'] == 'api') {
                                            res.set('WWW-Authenticate', 'Basic realm="scriptremote/api"');
                                        }
                                        res.status(401);
                                        res.send( Utils.makeRes(Utils.statusTag, 'Delete not authorized for user') );
                                        err1 = new Error();
                                        err1.type = 'user';
                                        deferred.reject(err1);
                                    }
                                    else {
                                        // user has permission
                                        reqParams['project'] = project;
                                        reqParams['shareUser'] = user;
                                        // reqParams['user'] wlll represent the owner instead of
                                        // the requestor for following middleware
                                        reqParams['user'] = user1;
                                        // and remember that requstor does not own the project
                                        reqParams['owned'] = false;
                                        reqParams['access'] = access;
                                        deferred.resolve(res);
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })
    }
    return deferred.promise;
}


// Middleware to check auth for rest project routes. 
// Auth is based on login sessions for /brsapi/projects/.. uri's and
// http Basic for /api/projects/.. uri's. For Basic the credentials
// are the user id and api token. user and project objects are added 
// to res.locals.reqParams. Projects can be shared so auth can
// require checking permissions granted by a different owner.
//
// If a specific job is being addressed by an 'api' uri
// then the token can either match the value stored in the job 
// or the current value in the user record. If not specific to a 
// job then the token must match the current value for the user.
//
exports.authRest = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var token = null;
    var result;
    // Checking requires some db access's in sequence.
    // Response is sent immediately for user errors, responses
    // for server errors are handled at the end of the middleware
    // chain.
    if (reqParams['base'] == 'brsapi') {
        // Using login session
        result = AuthUtil.sessionCheckPrm(req, res)
            .then(authProjectPrm)
            .then(authJobPrm)
            .then( function(res) { return next() },
                function(err) { 
                    if (err.type == 'server') return next(err); else return; 
                }
            )
    }
    else if (reqParams['base'] == 'api') {
        // Using basic auth
        result = AuthUtil.basicUserCheckPrm(req, res)
            .then(authProjectPrm)
            .then(authJobPrm)
            .then( function(res) { return next() },
                function(err) { 
                    if (err.type == 'server') return next(err); else return; 
                }
            )
    }
    else {
        var err = new Error('Fatal error in middle.js/authRest');
        return next(err);
    }
}

// Middleware to check auth for browser access to shared
// dynamic template data.
//
exports.authTmpl = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var token = null;
    // Checking requires some db access's in sequence.
    // Response is sent immediately for user errors, responses
    // for server errors are handled at the end of the middleware
    // chain.
    var result = AuthUtil.sessionCheckPrm(req, res)
        .then(authProjectPrm)
        .then(authJobPrm)
        .then( function(res) { return next() },
            function(err) { 
                if (err.type == 'server') return next(err); else return; 
            }
        )
}

// Middleware to parse request query/form/multi-part-form
// and add to res.locals.reqParams
exports.parse = function(req, res, next) {
    if (req.headers['content-type'] && (req.headers['content-type'].search('multipart/form-data') >= 0)) {
        // Request has multi-part form body
        var form = new Multiparty.Form();
        form.parse(req, function(err, fields, files) {
            if (err) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Invalid multipart form') );
            }
            else if (files.length > 0) {
                // Parsing for file uploads is handled separately
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Form data contains unexpected files') );
            }
            else {
                Object.keys(fields).forEach(function(name) {
                    res.locals.reqParams[name] = fields[name][0];
                });
                next();
            }
        })
    }
    else {
        // Express middleware handles other types - just copy
        var gotData = false;
        Object.keys(req.body).forEach(function(name) {
            if (req.body.hasOwnProperty(name)) {
                var val = req.body[name];
                res.locals.reqParams[name] = val;
                gotData = true;
            }
        });
        if (gotData) {
            // Require json for browser API requests
            if (res.locals.reqParams['base'] == 'brsapi') {
                if (!req.headers['content-type'] || !req.is('json')) {
                    res.status(400);
                    res.send( Utils.makeRes(Utils.statusTag, 'Request content type must be json') );
                    return;
                }
            }
        }
        next();
    }
}

// Middleware for unhandled errors of matched routes.
// These should mainly be from failed db requests
exports.errHandler = function(err, req, res, next) {
    res.status(500);
    res.send(err.message);
}

