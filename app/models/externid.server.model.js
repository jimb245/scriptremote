'use strict'

var mongoose = require('mongoose');

var eidSchema = mongoose.Schema({
    parentId: String // parent user of this id
});

eidSchema.methods.Id = function() {
    return this._id.valueOf();
};

var ExternId = mongoose.model('ExternId', eidSchema);
module.exports = ExternId;
