'use strict'

var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    projectName: String, // user-selected name
    description: String,
    ownerUid: String, // user that created project
    authorizedTo: [], // other authorized users
    notifyTo: [], // users to notify of new messages
    isEncrypted: Boolean,
    salt: String, // aes key generation salt
    timeStamp: String, // sender creation time 
    timeStampInit: Number, // server creation time
    jobcnt: Number // job sequence number
});

projectSchema.index( {projectName: 1, ownerUid: 1}, {unique: true} );
//projectSchema.set('autoIndex', false);

projectSchema.methods.Id = function() {
    return this._id.valueOf();
}

projectSchema.methods.chkAuthorizedTo = function(id) {
    var access = null;
    var publicAccess = null;
    for (var i = 0; i < this.authorizedTo.length; i++) {
        var auth = this.authorizedTo[i];
        if (!auth['id']) {
            publicAccess = auth['access'];
        }
        else if (auth['id'].equals(id)) {
            access = auth['access'];
            break;
        }
    }
    if (access && publicAccess) {
        if ((access == 'write') || (publicAccess == 'write')) {
            return 'write';
        }
        else if ((access == 'reply') || (publicAccess == 'reply')) {
            return 'reply';
        }
        else {
            return 'read';
        }
    }
    else if (access) {
        return access;
    }
    else if (publicAccess) {
        return publicAccess;
    }
    return null;
}

projectSchema.methods.chkNotifyTo = function(email) {
    var notify = false;
    for (var i = 0; i < this.notifyTo.length; i++) {
        if (this.notifyTo[i].email == email) {
            return this.notifyTo[i];
        }
    }
    return null;
}

var Project = mongoose.model('Project', projectSchema);
module.exports = Project;

