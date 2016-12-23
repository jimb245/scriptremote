'use strict'

var Mongoose = require('mongoose'),
    q = require('q'),
    Reg = require('../../../app/controllers/browser/registration.server.controller.js'),
    Project = require('../../../app/models/project.server.model.js'),
    Job = require('../../../app/models/job.server.model.js'),
    Location = require('../../../app/models/location.server.model.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
	Delete = require('./delete.server.controller.js'),
    Utils = require('../../../app/utils.js');


// Get a new job sequence number - returns promise
var getJobNum = function(project, count) {
    var deferred = q.defer();

    // Using an auto-incrmented sequence number to make
    // displayable unique job numbers for given project.
    var id = Mongoose.Types.ObjectId(project.Id());
    Project.findByIdAndUpdate(id, {$inc:{jobcnt:1 }}, {new:true}, function(err, project1) {
        if (err || !project1) {
            // Allow retries in case of db update collision
            if (count < 10) {
                var p = getJobNum(project, count + 1);
                p.then( function(jobnum) {
                            deferred.resolve(jobnum)
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
            deferred.resolve(project1.jobcnt);
        }
    });
    return deferred.promise;
}


exports.get= function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var getType = reqParams['op'];
    var job;

    if (getType == 'jobs') {
        // Get the job id's of project
        var project = res.locals.reqParams['project'];
        Job.find( {projectDBId: project.Id()} ).sort({timeStampInit: 'asc'}).exec( function(err, jobs) {
            if (err) {
                next(err);
            }
            else {
                var resJobs = [];
                for (var i = 0; i < jobs.length; i++) {
                    job = jobs[i];
                    resJobs.push( {id: job.jobId, name: job.jobName, timestamp: job.timeStamp} );
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'jobs', resJobs) );
            }
        })
    }
    else if (getType == 'job') {
        // Get the params of a job
        job = reqParams['job'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'job_name', job.jobName, 
            'description', job.description,
            'max_msgs', job.maxMsgs, 'timestamp', job.timeStamp, 
            'end', job.end, 'timestamp_end', job.timeStampEnd) );
    }
    else {
        var err = new Error('Fatal error in jobs.server.controller.js');
        throw err;
    }
}

var postHelper = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var postType = reqParams['op'];
    var user = reqParams['user'];

    var project = reqParams['project'];
    var name = reqParams['job_name'];
    if (!name) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "job_name"') );
        return
    }
    name = Middle.sanitizeQString(name);
    var maxmsgs = reqParams['max_msgs'];
    if (!maxmsgs) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "max_msgs"') );
        return
    }
    if (req.app.locals.projectLimits.messagesPerLocation) {
        if (Number(maxmsgs) > Number(req.app.locals.projectLimits.messagesPerLocation)) {
            maxmsgs = req.app.locals.projectLimits.messagesPerLocation;
        }
    }

    var timestamp = reqParams['timestamp'];
    if (!timestamp) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "timestamp"') );
        return
    }
    var token = user.token;

    // Create a new job in db.
    Reg.getConfig(false, req)
    .then(function(config) {
        if (config.jobsEnabled) {
            getJobNum(project, 0)
            .then(function(jobnum) {
                    var jobid = 'Job' + jobnum;
                    var job = new Job( {jobName: name, apiToken: token, maxMsgs: maxmsgs, timeStamp: timestamp, 
                    timeStampInit: (new Date()).getTime(), jobId: jobid, projectDBId: project.Id(), 
                    description: '', end: false, msgSize: 0} ); 

                    job.save(function(err, job1) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'job', jobid) );
                        }
                    })
                },
                function(err1) {
                    next(err1);
                }
            )
        }
        else {
            res.status(401);
            res.send( Utils.makeRes(Utils.statusTag, 'New job starts are temporarily disabled') );
        }
    },
    function(err2) {
        next(err2);
    })
}

exports.post = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var project = reqParams['project'];

    // Check if jobs-per-project limit exceeded
    if (req.app.locals.projectLimits.jobsPerProject) {
        var limit = req.app.locals.projectLimits.jobsPerProject;
        Job.find( {'projectDBId': project.Id()},  function(err, jobs) {
            if (err) {
                next(err);
            }
            else if (jobs.length >= limit) {
                res.status(400);
                res.send( Utils.makeRes(Utils.statusTag, 'Maximum number of jobs per project exceeded: ' + limit) );
            }
            else {
                // Create the new job entry in db.
                postHelper(req, res, next);
            }
        })
    }
    else {
        // Create the new job entry in db.
        postHelper(req, res, next);
    }
}


exports.patch = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var patchType = reqParams['op'];
    var job = reqParams['job'];

    if (patchType == 'description') {
        // Modifying text description of a job
        if (reqParams['description']) {
            job.description = reqParams['description'];
            job.save(function(err, job1) {
                if (err) {
                    next(err);
                }
                else {
                    res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                }
            })
        }
    }
    else if (patchType == 'end') {
        // Job is finished
        var locname = 'End';
        var timestamp = reqParams['timestamp'];
        if (!timestamp) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "timestamp"') );
            return
        }
        var loc = new Location( {locName: locname, timeStamp: timestamp, timeStampInit: (new Date()).getTime(), jobDBId: job.Id()} ); 
        loc.save(function(err, loc1) {
            if (err) {
                next(err);
            }
            else {
                job.end = true;
                job.timeStampEnd = (new Date()).getTime();
                job.save( function(err, job1) {
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
    else {
        var err = new Error('Fatal error in jobs.server.controller.js');
        throw err;
    }
}


exports.delete = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var job = reqParams['job'];

    Delete.jobDelete(req, job)
    .then( function() {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
        },
        function(err) {
            next(err);
        }
    )
}

