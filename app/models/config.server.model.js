'use strict'

var mongoose = require('mongoose');

var configSchema = mongoose.Schema({
    // 'selfreg' - users register themselves
    // 'adminapprove' - users register themselves, then admin approves
    // 'adminreg' - admin does registration for others
    userRegType: String,
    // browser session timout (hours)
    idleTimeout: Number,
    // admin can disable new jobs
    jobsEnabled: Boolean,
    // admin can disable new registrations
    regEnabled: Boolean

});

configSchema.methods.Id = function() {
    return this._id.valueOf();
};

var Config = mongoose.model('Config', configSchema);
module.exports = Config;
