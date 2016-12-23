'use strict'

var mongoose = require('mongoose');

var metaFileSchema = mongoose.Schema({
    gfsId: String, // mongo/gridfs file id
    fileType: String, // content type
    fileSize: Number, // size in bytes
    isEncrypted: Boolean, // for ng templates
    parentId: String, // database id of parent db document
    fileKey: String, // file identifier
    timeStamp: String, 
    timeStampInit: Number // server creation time
});

metaFileSchema.index( {fileKey: 1, parentId: 1}, {unique: true} );


metaFileSchema.methods.Id = function() {
    return this._id.valueOf();
};

var MetaFile = mongoose.model('MetaFile', metaFileSchema);
module.exports = MetaFile;

