'use strict'
var mongoose = require('mongoose');

var shortSchema = mongoose.Schema({
    key: String, // shortened url path
    url: String, // original url
    msgDBId: String // database id of message that owns the link
});

shortSchema.index( {key: 1}, {unique: true} );

shortSchema.methods.Id = function() {
    return this._id.valueOf();
};

var Short = mongoose.model('Short', shortSchema);
module.exports = Short;
