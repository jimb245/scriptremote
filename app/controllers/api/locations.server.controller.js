'use strict'

var Location = require('../../../app/models/location.server.model.js'),
    Template = require('../../../app/models/template.server.model.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
    Delete = require('./delete.server.controller.js'),
    Utils = require('../../../app/utils.js');

exports.get = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var getType = reqParams['op'];
    var job;
    var loc;

    if (getType == 'locations') {
        // Get the locations of a job
        job = reqParams['job'];

        Location.find( {jobDBId: job.Id()} ).sort({timeStampInit: 'asc'}).exec( function(err, locations) {
            if (err) {
                next(err);
            }
            else {
                var resLocs = [];
                for (var i = 0; i < locations.length; i++) {
                    loc = locations[i];
                    resLocs.push( {name: loc.locName, timestamp: loc.timeStamp} );
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'locations', resLocs) );
            }
        })
    }
    else if (getType == 'location') {
        // Get the params of a location
        job = reqParams['job'];
        loc = reqParams['location'];
        res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'timestamp', loc.timeStamp, 
                'msgcnt', loc.msgcnt, 'description', loc.description) );
    }
    else {
        var err = new Error('Fatal error in locations.server.controller.js');
        throw err;
    }
}

var postHelper = function(req, res, next) {

    // Create a new location
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];
    var project = reqParams['project'];
    var job = reqParams['job'];
    if (job.end) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Job already ended') );
        return
    }
    var name = reqParams['location_name'];
    if (!name) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "location_name"') );
        return
    }
    name = Middle.sanitizeQString(name);
    var timestamp = reqParams['timestamp'];
    if (!timestamp) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing parameter "timestamp"') );
        return
    }

    Location.findOne( {jobDBId: job.Id(), locName: name},  function(err, loc) {
        if (err) {
            next(err);
        }
        else if (loc) {
            var resLocs = [];
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Location already exists') );
            return
        }
        else {
            Template.findOne( { ownerUid: user.Id() }, function(err, tmpl) {
                if (err || !tmpl) {
                    next(err);
                }
                else {
                    var loc1 = new Location( {locName: name, templates: tmpl.defaults, timeStamp: timestamp, jobDBId: job.Id(), msgcnt: 0 } ); 
                    loc1.save(function(err, loc2) {
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
    })
}

exports.post = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var job = reqParams['job'];

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
            }
            else {
                // Create the new location entry in db.
                postHelper(req, res, next);
            }
        })
    }
    else {
        // Create the new location entry in db.
        postHelper(req, res, next);
    }
}

exports.patch = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var location = reqParams['location'];

    // Update description of a location
    if (reqParams['description']) {
        location.description = reqParams['description'];
        location.save(function(err, location1) {
            if (err) {
                next(err);
            }
            else {
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
            }
        })
    }
}

exports.delete = function(req, res, next) {

    var reqParams = res.locals.reqParams;

    var loc = reqParams['location'];
    Delete.locDelete(req, loc)
    .then( function() {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
        },
        function(err) {
            next(err);
        }
    )
}

