'use strict'

//
// Handlers to upload/download/delete data files associated with messages
// or angular template files.
//

var q = require('q'),
	Multiparty = require('multiparty'),
	MetaFile = require('../../../app/models/metafile.server.model.js'),
	Template = require('../../../app/models/template.server.model.js'),
	Middle = require('../../../app/controllers/lib/middle.server.js'),
	Message = require('../../../app/controllers/api/messages.server.controller.js'),
    Utils = require('../../../app/utils.js');


var upload2 = function(req, res, next, fields, fileType, fileSize, gfsFile) {
    // Create MetaFile object to associate Grid file and parent object
    var reqParams = res.locals.reqParams;
    var parentId = reqParams['parentId'];
    var job = reqParams['job'];
    var msg = reqParams['msg'];
    var grid = req.app.locals.grid;
    var sizeLimit = req.app.locals.projectLimits.messageSize;
    var sizeLimitJob = req.app.locals.projectLimits.messageSizeJob;

    if ( !fields['file_key'] ) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing file key') );
        grid.remove( { _id: gfsFile._id }, function(err) {
            if (err) {
                next(err);
            }
        })
    }
    else if ( !Middle.isSanitizedQString(fields['file_key']) ) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Invalid file key') );
        grid.remove( { _id: gfsFile._id }, function(err) {
            if (err) {
                next(err);
            }
        })
    }
    else if ( !fields['encrypted'] ) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Missing field "encrypted"') );
        grid.remove( { _id: gfsFile._id }, function(err) {
            if (err) {
                next(err);
            }
        })
    }
    else if ( sizeLimit && (fileSize + msg.msgSize > sizeLimit)) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Maximum message size (bytes) exceeded: ' + sizeLimit) );
        grid.remove( { _id: gfsFile._id }, function(err) {
            if (err) {
                next(err);
            }
        })
    }
    else if ( sizeLimitJob && (fileSize + msg.msgSize > sizeLimitJob)) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Maximum job message size (bytes) exceeded: ' + sizeLimitJob) );
        grid.remove( { _id: gfsFile._id }, function(err) {
            if (err) {
                next(err);
            }
        })
    }
    else {
        var fkey = fields['file_key'];
        if ( Middle.sanitizeQString(fkey) != fkey) {
            res.status(400);
            res.send( Utils.makeRes(Utils.statusTag, 'Invalid file key') );
            grid.remove( { _id: gfsFile._id }, function(err) {
                if (err) {
                    next(err);
                }
            })
            return
        }

        var isEncrypted = fields['encrypted'];
        var mf = new MetaFile( {'gfsId': gfsFile._id.valueOf(), 'parentId': parentId, 'fileKey': fkey, 'fileType': fileType, 'fileSize': fileSize, 'isEncrypted': isEncrypted, timeStampInit: (new Date()).getTime()} );
        mf.save( function(err, mf1) {
            if (err) {
                next(err);
            }
            else if (sizeLimitJob) {
                Message.updateMsgSizeJob(job, sizeLimitJob, fileSize, 0)
                .then(function(size) {
                    msg.msgSize += fileSize;
                    msg.save(function(err1, msg1) {
                        if (err1) {
                            next(err1);
                        }
                        else {
                            res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'size', size) );
                        }
                    })
                    },
                    function() {
                        var err = new Error('Server error in message.server.controller.js/postMsgHandler');
                        next(err);
                    }
                )
            }
            else {
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK) );
            }

        })
    }
}

exports.upload = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var grid = req.app.locals.grid;
    var job = reqParams['job'];
    if (job && job.end) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Job already ended') );
    }

    // Parse the request and save the file then continue in upload2

    else if (req.headers['content-type'].search('multipart/form-data') < 0) {
        res.status(400);
        res.send( Utils.makeRes(Utils.statusTag, 'Expected multipart form data') );
    }
    else {
        var form = new Multiparty.Form();
        var fields = {};
        var formClose = false;
        var streamClose = false;
        var gfsFile = null;
        var fileType = null;
        var error = false;

        form.on('field', function(name, value) {
            fields[name] = value;
        });

        form.on('part', function(part) {
            if (error) {
                part.resume();
            }
            else if (part.filename !== null) {
                if (gfsFile) {
                    error = true;
                    grid.remove( { _id: gfsFile._id }, function(err) {
                        if (err) {
                            next(err);
                        }
                        else {
                            res.status(400);
                            res.send( Utils.makeRes(Utils.statusTag, 'Expected only one file') );
                        }
                    })
                }
                else {
                    // Create write stream and pipe the file to mongo/gridfs
                    fileType = part.headers['content-type'];
                    var writestream = grid.createWriteStream({'filename': part.filename, 'content_type': fileType });

                    writestream.on('close', function(file) {
                        if (!file) {
                            error = true;
                            res.status(500);
                            res.send( Utils.makeRes(Utils.statusTag, 'Error writing file to db'));
                        }
                        else {
                            gfsFile = file;
                            streamClose = true;
                            // Try to ensure parsing is done by waiting for formClose
                            if (formClose) {
                                upload2(req, res, next, fields, fileType, form.bytesReceived, gfsFile);
                            }
                        }
                    });

                    writestream.on('error', function(err) {
                        error = true;
                        next(err);
                    });

                    part.pipe(writestream);
                }
            }
            else {
                part.resume();
            }
        });

        form.on('close', function() {
            formClose = true;
            // Try to ensure parsing is done by waiting for streamClose
            if (streamClose && !error) {
                upload2(req, res, next, fields, fileType, form.bytesReceived, gfsFile);
            }
        });

        form.on('error', function(err) {
            next(err);
        });

        form.parse(req);
    }
}


exports.download = function(req, res, next) {

    var reqParams = res.locals.reqParams;
    var grid = req.app.locals.grid;
    var fileOp = reqParams['op'];
    var parentId = reqParams['parentId'];
    var mf;
    var key;

    if (fileOp == 'list') {
        // get list of files with the specified parent
        MetaFile.find( {'parentId': parentId} ).sort({timeStampInit: 'asc'}).exec( function(err, mfs) {
            if (err) {
                next(err);
            }
            else {
                var resFiles = [];
                var fileTypes = [];
                var encrypted = [];
                for (var i = 0; i < mfs.length; i++) {
                    mf = mfs[i];
                    resFiles.push(mf.fileKey);
                    fileTypes.push(mf.fileType);
                    encrypted.push(mf.isEncrypted);
                }
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'file_keys', resFiles, 'file_types', fileTypes, 'encrypted', encrypted) );
            }
        })
    }
    else if (fileOp == 'property') {
        debugger;
        // get properties from the metafile object
        key = reqParams['file_key'];
        MetaFile.findOne( {'fileKey': key, 'parentId': parentId}, function(err, mf) {
            if (err) {
                next(err);
            }
            else if (!mf) {
                res.status(404);
                res.send( Utils.makeRes(Utils.statusTag, "Invalid file key") );
            }
            else {
                res.send( Utils.makeRes(Utils.statusTag, Utils.OK, 'encrypted', mf.isEncrypted) );
            }
        })
    }
    else if ((fileOp == 'file') || (fileOp == 'global')) {
        debugger;
        // download a file - first get its gridfs id
        key = reqParams['file_key'];
        MetaFile.findOne( {'fileKey': key, 'parentId': parentId}, function(err, mf) {
            if (err) {
                next(err);
            }
            else if (!mf) {
                res.status(404);
                res.send( Utils.makeRes(Utils.statusTag, "Invalid file key") );
            }
            else {
                res.type(mf.fileType);

                // Create read stream and pipe file to response
                var readstream = grid.createReadStream( { _id: mf.gfsId } );

                readstream.on('close', function() {
                    res.end();
                });

                readstream.on('error', function(file) {
                    res.send( Utils.makeRes(Utils.statusTag, 'Error reading file from db') );
                });

                readstream.pipe(res);
            }
        })
    }
    else {
        var err = new Error('Fatal error in fileHandler.js');
        throw err;
    }
}

exports.delete = function(req, mf) {
    var deferred = q.defer();
    var grid = req.app.locals.grid;
    grid.remove( {'_id': mf.gfsId}, function(err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            MetaFile.remove( {'_id': mf.Id()}, function(err1) {
                if (err1) {
                    deferred.reject(err1);
                }
                else {
                    deferred.resolve();
                }
            })
        }
    });
    return deferred.promise;
}

