'use strict'

var mongoose = require('mongoose');

var locationSchema = mongoose.Schema({
    locName: String, // user assigned location name
    description: String,
    templates: Array, // angular dynamic templates for this location
    timeStamp: String, // sender creation time 
    timeStampInit: Number, // server creation time
    jobDBId: String, // database id of job that owns the location
    msgcnt: Number // message sequence number
});

locationSchema.index( {locName: 1, jobDBId: 1}, {unique: true} );
//locationSchema.set('autoIndex', false);

locationSchema.methods.Id = function() {
    return this._id.valueOf();
}

var Location = mongoose.model('Location', locationSchema);

module.exports = Location;
