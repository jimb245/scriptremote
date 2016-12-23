'use strict'

var Forge = require('node-forge');
var User = require('./models/user.server.model.js');

var statusTag = 'SR_status';
exports.statusTag = statusTag;

var tokenBL = 12;
var OK = 'OK';
exports.OK = OK;

var serverErr = 'SERVER ERROR';
exports.serverErr = serverErr;

var makeRes = function() {
    var obj = {};
    for (var i = 0; i < arguments.length; i = i + 2) {
        obj[arguments[i]] = arguments[i + 1];
    }
    return obj;
}
exports.makeRes = makeRes;

var newToken = function(length) {
    if (typeof(length) === 'undefined') {
        length = tokenBL;
    }
    var bytes = Forge.random.getBytesSync(length);
    var token = Forge.util.bytesToHex(bytes);
    return token;
};
newToken.tokenByteLength = tokenBL;
exports.newToken = newToken;

