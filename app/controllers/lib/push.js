'use strict'

//
// Interface to long-polling package - for handling reply requests from
// script clients that need to wait for action by browser client
//
var DelayedResponse = require('http-delayed-response');

var Waiting = {};

// Clean up old request
var clearLongReply = function(msg) {
    var w = Waiting[msg.Id()];
    if (w) {
        delete Waiting[msg.Id()];
    }
};
exports.clearLongReply = clearLongReply;

// Save a reply request
exports.longReply = function(req, res, msg) {
    clearLongReply(msg);
    // Using tcp keep-alive but not the keep-alive
    // option of this package (.start) - because it sends
    // space chars that would have to be discarded
    // by the script client. Also need to override node's
    // default 2 minute response timeout.
    res.setTimeout(0);
    var dr = new DelayedResponse(req, res);
    Waiting[msg.Id()] = [dr, dr.json().wait(), false];
};
    
// Push a reply response
exports.pushReply = function(req, msg) {
    var w = Waiting[msg.Id()];
    if (w) {
        if (!w[2]) {
            w[2] = true;
            Waiting[msg.Id()] = w;
            var data = { 'SR_status' : 'OK', 'reply_content' : msg.replyContent };
            var wait = w[1];
            wait(null, data);
        }
    }
};


