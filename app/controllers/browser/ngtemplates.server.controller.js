'use strict'

//
// Handlers for browser client to access Angular dynamic templates
//


var	Nodemailer = require('nodemailer'),
    User = require('../../../app/models/user.server.model.js'),
    MetaFile = require('../../../app/models/metafile.server.model.js'),
    Template = require('../../../app/models/template.server.model.js'),
    GridFSHandler = require('../../../app/controllers/api/files.server.controller.js'),
    Utils = require('../../../app/utils.js');


// Get names of current templates of a location
exports.locationGet = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var loc = reqParams['location'];
    res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'templates', loc.templates) );
}


// Set the templates to use at a location
exports.locationPut = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var loc = reqParams['location'];
    loc.templates = reqParams['templates'];
    loc.save(function(err) {
        if (err) {
            next(err);
        }
        else {
            // Location has been saved successfully
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
        }
    })
}


exports.filesGet = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];
    var name = reqParams['name'];

    if (reqParams['op'] == 'list') {
        // Get names of available templates
        Template.findOne( { ownerUid: user.Id() }, function(err, template) {
            if (err || !template) {
                next(err);
            }
            else {
                reqParams['parentId'] = template.Id();
                GridFSHandler.download(req, res, next);
            }
        })
    }
    else {
        // Get template contents or properties
        var query;
        if ((reqParams['op'] == 'file') || (reqParams['op'] == 'property')) {
            // User-specific template
            query = { ownerUid: user.Id() };
        }
        else {
            // Global default template
            query = { name: 'GLOBAL' };
        }
        Template.findOne( query, function(err, template) {
            if (err || !template) {
                next(err);
            }
            else {
                reqParams['parentId'] = template.Id();
                reqParams['file_key'] = req.params.name;
                GridFSHandler.download(req, res, next);
            }
        })
    }
}

// Upload a new template
exports.filesPost = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];

    Template.findOne( { ownerUid: user.Id() }, function(err, template) {
        if (err || !template) {
            next(err);
        }
        else {
            reqParams['parentId'] = template.Id();
            GridFSHandler.upload(req, res, next);
            // As security check notify the user
            var mailer = req.app.locals.mailer;
            var mailTransport = Nodemailer.createTransport(mailer.options);
            var options = { 
                from: mailer.from,
                to: user.email,
                subject: 'ScriptRemote security notice - templates changed',
                html: 'A new template has been uploaded.\n If you did not make this change please contact your site administrator.'
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



// Get current user default template names
exports.userDefaultsGet = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];

    Template.findOne( { ownerUid: user.Id() }, function(err, template) {
        if (err || !template) {
            next(err);
        }
        else {
            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 
                'defaults', template.defaults) );
        }
    })
}


// Update the user default template names
exports.userDefaultsPut = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];

    Template.findOne( { ownerUid: user.Id() }, function(err, template) {
        if (err || !template) {
            next(err);
        }
        else {
            var defaults = req.body.defaults;
            if (defaults && (defaults.length == 3)) {
                template.defaults = defaults;
                template.save(function(err) {
                    if (err) {
                        next(err);
                    }
                    else {
                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                    }
                })
            }
        }
    })
}


// Delete a template
exports.fileDelete = function(req, res, next) {
    var reqParams = res.locals.reqParams;
    var user = reqParams['user'];

    Template.findOne( { ownerUid: user.Id() }, function(err, template) {
        if (err || !template || !req.params.name) {
            next(err);
        }
        else {
            MetaFile.findOne( {'fileKey': req.params.name, 'parentId': template.Id()}, function(err, mf) {
                if (err) {
                    next(err);
                }
                else if (!mf) {
                    res.status(404);
                    res.send( Utils.makeRes(Utils.statusTag, "Invalid file key") );
                }
                else {
                    GridFSHandler.delete(req, mf)
                    .then( function() {
                            MetaFile.remove( {'fileKey': req.params.name, 'parentId': template.Id()}, 
                                function(err) {
                                    if (err) {
                                        next(err);
                                    }
                                    else {
                                        res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
                                    }
                                }
                            )
                        },
                        function(err) {
                            next(err);
                        }
                    )
                }
            })
        }
    })
}


