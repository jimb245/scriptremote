'use strict'

//
// Parent object for dynamic angular template files
//
var mongoose = require('mongoose');

var templateSchema = mongoose.Schema({
    name: String, // template group name - currently unused
    defaults: Array, // default templates
    ownerUid: String, // user that owns it
});

templateSchema.index( {ownerUid: 1}, {unique: true} );

templateSchema.methods.Id = function() {
    return this._id.valueOf();
}

var Template = mongoose.model('Template', templateSchema);
module.exports = Template;
