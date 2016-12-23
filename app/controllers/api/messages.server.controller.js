'use strict'

var Mongoose = require('mongoose'),
    q = require('q'),
	Nodemailer = require('nodemailer'),
    Utils = require('../../../app/utils.js'),
	User = require('../../../app/models/user.server.model.js'),
	Project = require('../../../app/models/project.server.model.js'),
	Job = require('../../../app/models/job.server.model.js'),
	Location = require('../../../app/models/location.server.model.js'),
	Template = require('../../../app/models/template.server.model.js'),
	Message = require('../../../app/models/message.server.model.js'),
	Short = require('../../../app/models/short.server.model.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
	Shorten = require('../../../app/controllers/lib/short.server.js'),
    Push = require('../../../app/controllers/lib/push.js'),
    Delete = require('../../../app/controllers/api/delete.server.controller.js');


// Get a new message sequence number - returns promise
var getMsgNum = function(loc, count) {
    var deferred = q.defer();

    // Using an auto-incrmented sequence number to make
    // displayable unique msg numbers for given location.
    var id = Mongoose.Types.ObjectId(loc.Id());
    Location.findByIdAndUpdate(id, {$inc:{msgcnt:1 }}, {new:true}, function(err, loc1) {
        if (err || !loc1) {
            if (count < 10) {
                var p = getMsgNum(loc, count + 1);
                p.then( function(msgnum) {
                            deferred.resolve(msgnum)
                        },
                        function(err) {
                            deferred.reject(null);
                        }
                )
            }
            else {
                deferred.reject(null);
            }
        }
        else {
            deferred.resolve(loc1.msgcnt);
        }
    });
    return deferred.promise;
}


// Update job message size total - returns promise
exports.updateMsgSizeJob = function(job, limit, delta, count) {
    var deferred = q.defer();
    if (!limit || (delta === 0)) {
        deferred.resolve();
    }
    else {
        var id = Mongoose.Types.ObjectId(job.Id());
        Job.findByIdAndUpdate(id, {$inc:{msgSize:delta}}, {new:true}, function(err, job1) {
            if (err || !job1) {
                if (count < 10) {
                    var p = exports.updateMsgSizeJob(job, limit, delta, count + 1);
                    p.then( function() {
                                deferred.resolve()
                            },
                            function(err) {
                                deferred.reject(null);
                            }
                    )
                }
                else {
                    deferred.reject(null);
                }
            }
            else {
                deferred.resolve(job1.msgSize);
            }
        })
    }
    return deferred.promise;
}


var mailTran = function(mailTransport, options, deferred) {
    mailTransport.sendMail(options, function(err1, info) {
        if (err1) {
            deferred.reject(err1);
        }
        else {
            deferred.resolve();
        }
    })
}

// Send notifications via SMS gateways - returns promise
var notify = function(user, project, jobId, locName, msg, req) {
 
    if (project.notifyTo.length === 0) {
        var deferred = q.defer();
        deferred.resolve();
        return deferred.promise;
    }

    var promiseShorts = [];

    // Create the shortened urls
    for (var i = 0; i < project.notifyTo.length; i++) {
        var projectName = encodeURIComponent(project.projectName);
        if (project.notifyTo[i].email != user.email) {
            // Modify project route param for non-owner.
            // var 'user' is always project owner even if project 
            // is shared and job is run by non-owner.
            projectName += '~' + user.email;
        }
        // url of the new message data
        var hostname = req.hostname;
        if (hostname.slice(0,4) == 'www.') {
            hostname = hostname.slice(4);
        }
        var browserUrl = req.protocol + '://' + hostname + ':' + req.app.locals.port + '/#/content/' + projectName + '/' + jobId + '/' + encodeURIComponent(locName) + '/' + msg.msgId;

        var p = Shorten.shorten(browserUrl, msg.Id(), 0);
        promiseShorts.push(p);    
    }

    // Send notifications
    return q.all(promiseShorts)
    .then(function(keys) {
            var promiseTexts = [];

            for (var i = 0; i < project.notifyTo.length; i++) {
                if (!keys[i]) {
                    continue;
                }
                var deferred = q.defer();
                var text = 'New data for ' + project.notifyTo[i].nickname + ' ' + jobId + ' ' + req.protocol + '://www.' + req.hostname + '/short/' + keys[i];
                var mailer = req.app.locals.mailer;
                var mailTransport = Nodemailer.createTransport(mailer.options);
                var options = { 
                    from: mailer.from,
                    to: project.notifyTo[i].sms,
                    subject: 'scriptremote',
                    html: text
                }; 
                mailTran(mailTransport, options, deferred);
                promiseTexts.push(deferred.promise);
            }
            return q.all(promiseTexts);
        },
        function(err2) {
            var deferred = q.defer();
            deferred.reject(err2);
            return deferred.promise;
        }
    )
}


// Create new message in db.
var postMsgHandler = function(req, res, user, project, job, loc, next, content, reply, replycontent, size, timestamp) {

    var sizeLimitJob = req.app.locals.projectLimits.messageSizeJob;
    exports.updateMsgSizeJob(job, sizeLimitJob, size, 0)
    .then(function() {
        return getMsgNum(loc, 0)
    })
    .then(function(msgnum) {
            var msgid = 'Msg' + msgnum;
            var msg = new Message( { msgId: msgid, content: content, reply: reply, replyContent: replycontent, replyDone: false, replyAck: false, timeStamp: timestamp, timeStampInit: (new Date()).getTime(), locDBId: loc.Id(), msgSize: size } );

            msg.save(function(err1, msg1) {
                if (err1) {
                    next(err1);
                }
                else {
                    Delete.msgPrune(req, job.maxMsgs, loc, msg)
                    .then(function(pruneSize) {
                        return exports.updateMsgSizeJob(job, sizeLimitJob, -pruneSize, 0);
                     })
                    .then(function() {
                        notify(user, project, job.jobId, loc.locName, msg1, req);
                    })
                    .then(function() {
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'message', msg1.msgId, 'reply', reply) );
                        },
                        function(err2) {
                            if (process.env.NODE_ENV == 'test') {
                                res.send( Utils.makeRes(Utils.statusTag, 'Notificatons failed') );
                            }
                            else {
                                // Skipping notification - message itself is ok
                                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'message', msg1.msgId, 'reply', reply) );
                            }
                        }
                    )
                }
            })
        },
        function() {
            var err = new Error('Server error in message.server.controller.js/postMsgHandler');
            next(err);
        }
    )
}

// Create new location and message in db.
var postLocMsgHandler = function(req, res, user, project, job, locName, next, content, reply, replycontent, size, timestamp) {

    Template.findOne( { ownerUid: user.Id() }, function(err, tmpl) {
        if (err || !tmpl) {
            next(err);
        }
        else {
            var loc1 = new Location( {locName: locName, templates: tmpl.defaults, timeStamp: timestamp, timeStampInit: (new Date()).getTime(), jobDBId: job.Id(), msgcnt: 0 } ); 

            loc1.save(function(err, loc2) {
                if (err) {
                    next(err);
                }
                else {
                    postMsgHandler(req, res, user, project, job, loc1, next, content, reply, replycontent, size, timestamp);
                }
            })
        }
    })
}

exports.get = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var getType = reqParams['op'];
    var msg;

    if (getType == 'msgs') {
        // Get the messages of a location
        var loc = reqParams['location'];

        Message.find( {locDBId: loc.Id()} ).sort({timeStampInit: 'asc'}).exec( function(err, msgs) {
            if (err) { 
                next(err);
            }
            else {
                var resMsgs = [];
                for (var i = 0; i < msgs.length; i++) {
                    var msg = msgs[i];
                    resMsgs.push( {id: msg.msgId, timestamp: msg.timeStamp} );
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'messages', resMsgs) );
            }
        })
    }
    else if (getType == 'msg') {
        // Get all the message data
        msg = reqParams['msg'];

        if (msg.reply) {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'content', msg.content, 
            'is_reply', msg.reply, 'reply_content', msg.replyContent,
            'reply_done', msg.replyDone, 'reply_ack', msg.replyAck,
            'timestamp', msg.timeStamp, 'short' , msg.shortKey) );
        }
        else {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'content', msg.content, 
                'is_reply', msg.reply, 'timestamp', msg.timeStamp, 'short', msg.shortKey) );
        }
    }
    else if (getType == 'shorts') {
        msg = reqParams['msg'];
        Shorten.keys(msg)
            .then(function(keys) {
                res.send({'keys': keys});
             })
    }
    else if (getType == 'reply') {
        // Get the reply status and data
        msg = reqParams['msg'];
        if (!msg.reply) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not a reply message') );
        }
        else if (msg.replyDone) {
            // Reply is already available
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'reply_content', msg.replyContent) );
            Push.clearLongReply(msg);
        }
        else {
            // Wait for the reply before responding
            Push.longReply(req, res, msg);
        }
    }
    else if (getType == 'reply_ack') {
        // Get the reply acknowlege status
        msg = reqParams['msg'];
        if (!msg.reply) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not a reply message') );
        }
        else {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'reply_ack', msg.reply_ack) );
        }
    }
    else {
        var err = new Error('Fatal error in msgs.server.controller.js');
        throw err;
    }
}

exports.post = function(req, res, next) {

    debugger;
    var reqParams = res.locals.reqParams;
    // Adding new message
    var user = reqParams['user'];
    var project = reqParams['project'];
    var job = reqParams['job'];
    var loc = reqParams['location'];
    var locName = reqParams['location_name'];
    var sizeLimit = req.app.locals.projectLimits.messageSize;
    var sizeLimitJob = req.app.locals.projectLimits.messageSizeJob;
    locName = Middle.sanitizeQString(locName);
    var content = reqParams['content'];
    if (!reqParams['is_reply']) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "is_reply"') );
        return
    }
    var reply = (typeof reqParams['is_reply'] == 'string') && (reqParams['is_reply'].search(/true/i) >= 0);
    var replyContent = reqParams['reply_content'];
    var timestamp = reqParams['timestamp'];
    if (!timestamp) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "timestamp"') );
        return
    }

    if (job.end) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Job already ended') );
        return
    }

    // Validate the content as json
    var size = 0;
    if (content) {
        if (typeof content != 'string') {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Invalid content: ' + content) );
            return
        }
        if (content.length > 0) {
            try {
                var contentObj = JSON.parse(content);
                // Accumulate size in bytes (approximately)
                size += 2*content.length;
            }
            catch(e) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Invalid content: ' + content) );
                return
            }
        }
    }
    // Validate the reply content as json
    if (reply && replyContent) {
        if (typeof replyContent != 'string') {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Invalid content: ' + content) );
            return
        }
        if (replyContent.length > 0) {
            try {
                var replyContentObj = JSON.parse(replyContent);
                // Accumulate size in bytes (approximately)
                size += 2*replyContent.length;
            }
            catch(e) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Invalid reply content: ' + replyContent) );
                return
            }
        }
    }
    if (!sizeLimit && !sizeLimitJob) {
        size = 0;
    }
    else if (sizeLimit && (size > sizeLimit)) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Maximum message size (bytes) exceeded: ' + sizeLimit) );
        return
    }
    else if (sizeLimitJob && (job.msgSize + size > sizeLimitJob)) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Maximum job message size (bytes) exceeded: ' + sizeLimitJob) );
        return
    }

    // If this is the first message at this location for this job
    // create new location then continue in postMsgHandler
    if (!loc) {
        // Check if locations-per-job limit exceeded
        if (req.app.locals.projectLimits.locationsPerJob) {
            var limit = req.app.locals.projectLimits.locationsPerJob;
            Location.find( {'jobDBId': job.Id()}, function(err, locations) {
                if (err) {
                    next(err);
                }
                else if (locations.length >= limit) {
                    res.status(400);
                    res.send( Utils.makeRes(Utils.statusTag, 'Maximum number of locations per job exceeded: ' + limit) );
                    return
                }
                else {
                    postLocMsgHandler(req, res, user, project, job, locName, next, content, reply, replyContent, size, timestamp);
                }
            })
        }
        else {
            postLocMsgHandler(req, res, user, project, job, locName, next, content, reply, replyContent, size, timestamp);
        }
    }
    else {
        postMsgHandler(req, res, user, project, job, loc, next, content, reply, replyContent, size, timestamp);
    }
}


exports.patch = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var patchType = reqParams['op'];

    var job = reqParams['job'];
    var loc = reqParams['location'];
    var msg = reqParams['msg'];
    if (job && job.end) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Job already ended') );
    }
    else if (patchType == 'reply') {
        // Some client is providing a reply for the message
        if (!msg.reply) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not a reply message') );
        }
        else if (msg.replyDone) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Reply already done') );
        }
        else {
            // Validate the reply content
            var replyContent = reqParams['reply_content'];
            if (replyContent.length > 0) {
                try {
                    var requestObj = JSON.parse(replyContent);
                }
                catch(e) {
                    res.status(400);
                    res.send( Utils.makeRes(Utils.statusTag, 'Reply data invalid') );
                    return;
                }
            }
            Message.findOneAndUpdate( { msgId: msg.msgId, locDBId: loc.Id(), replyDone: false }, 
                   { replyDone: true, replyContent: replyContent }, 
                   { new: true }, function(err, msg1) {
                if (err) {
                    next(err);
                }
                else {
                    // Reply has been saved successfully
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                    // Push reply to waiting client
                    Push.pushReply(req, msg1);
                }
            })
        }
    }
    else if (patchType == 'reply_ack') {
        // Job is acknowledging that it received a reply
        if (!msg.reply) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Not a reply message') );
        }
        else if (!msg.replyDone) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'No reply found') );
        }
        else {
            msg.replyAck = true;
            msg.timeStampReply = (new Date()).getTime();
            msg.save(function(err, msg1) {
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
        var err = new Error('Fatal error in msgs.server.controller.js');
        throw err;
    }
}


