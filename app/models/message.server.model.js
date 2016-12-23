'use strict'

var mongoose = require('mongoose');

var msgSchema = mongoose.Schema({
    msgId: String, // server-assigned id
    content: String,
    reply: Boolean, // is reply content included
    replyContent: String,
    replyDone: Boolean, // is reply received from web client
    replyAck: Boolean, // is reply acknowledged to script client
    timeStamp: String, // sender creation time 
    timeStampInit: Number, // server creation time
    timeStampReply: Number,
    locDBId: String, // database id of location that owns the message
    msgSize: Number // approx. size in bytes including attached files, or zero
});

msgSchema.index( {msgId: 1, locDBId: 1}, {unique: true} );

msgSchema.methods.Id = function() {
    return this._id.valueOf();
}

var Message = mongoose.model('Message', msgSchema);
module.exports = Message;
