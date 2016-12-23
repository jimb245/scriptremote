'use strict'

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    regDate: { type: Date, default: Date.now}, // registration date
    name: String, // user name
    company: String, // institution
    SMSemail: String, // notification message gateway
    email: String,
    admin: Boolean, // true for the admin user
    pwhash: String, // login credential - salted, hashed password
    confirmed: Boolean, // email address confirmed
    enabled: Boolean, // admin can disable user temporarily
    uid: String, // API credential - user id
    token: String, // API credential - salted, hashed token
    regToken: String, // registration email token
    regTime: Number, // reg token timeout
    idleTimeout: Number, // browser session timout(MS)
    shares: [] // projects shared from others
});

userSchema.methods.Id = function() {
    return this._id.valueOf();
};

var User = mongoose.model('User', userSchema);
module.exports = User;
