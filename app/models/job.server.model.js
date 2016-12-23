'use strict'

var mongoose = require('mongoose');

var jobSchema = mongoose.Schema({
    jobId: String, // server-assigned id
    jobName: String, // user-selected name
    description: String,
    maxMsgs: Number, // max messages to retain per locations
    timeStamp: String, // sender creation time 
    timeStampInit: Number, // server creation time
    end: Boolean, // is job ended
    timeStampdEnd: String, // job end time
    projectDBId: String, // database id of project that owns the job
    apiToken: String, // auth token for job
    msgSize: Number // approx total of message sizes (bytes)
});

jobSchema.index( {jobId: 1, projectDBId: 1}, {unique: true} );

jobSchema.methods.Id = function() {
    return this._id.valueOf();
}

var Job = mongoose.model('Job', jobSchema);
module.exports = Job;
