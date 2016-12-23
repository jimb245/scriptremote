'use strict'

//
// Handlers to create/expand shortened urls
//
var q = require('q'),
	Forge = require('node-forge'),
	Short = require('../../../app/models/short.server.model.js'),
    Utils = require('../../../app/utils.js');

var ShortByteLength = 4;

// Get url from shortened link and redirect to it
exports.redirect = function(req, res, next) {

    var link = req.params.link;
    if (!link) {
        return next();
    }
    Short.findOne( { key: link } , function(err, short1) {
        if (err) {
           return next(err);
        }
        else if (!short1) {
            return next();
        }
        else {
            res.redirect(short1.url);
        }
    })
}

// Map a url into shortened link entry - returns promise
exports.shorten = function(url, parentId, count) {
    var deferred = q.defer();

    var bytes = Forge.random.getBytesSync(ShortByteLength);
    var key = Forge.util.bytesToHex(bytes);

    Short.findOne( {key: key }, function(err, short1) {
        if (err) { 
            deferred.reject(null);
        }
        else if (short1) {
            if (count < 10) {
                var p = exports.shorten(url, count + 1);
                p.then( function(key) {
                            deferred.resolve(key)
                        },
                        function(err) {
                            deferred.reject(null);
                        }
                )
            }
            else {
                deferred.reject(null);
            }
        }
        else {
            var s = new Short( {key: key, msgDBId: parentId, url: url} );
            s.save(function(err, s1) {
                if (err) {
                    deferred.reject(null);
                }
                else {
                    deferred.resolve(s1.key);
                }
            })
        }
    });

    return deferred.promise;
}

// Get short link keys for a message - returns promise
exports.keys = function(msg) {

    var deferred = q.defer();
    var keys = [];
    Short.find( {msgDBId: msg.Id() }, function(err, shorts) {
        if (err) { 
            deferred.reject(err);
        }
        else {
            for (var i = 0; i < shorts.length; i++) {
                var short1 = shorts[i];
                keys.push(short1.key);
            }
            deferred.resolve(keys);
         }
     })
     return deferred.promise;
}

var remove = function(short, deferred) {
    Short.remove( {_id: short.Id()}, function(err) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    })
}

// Delete short link entries for a message - returns promise
exports.delete = function(msg) {

    var promises = [];
    var deferred = null;
    Short.find( {msgDBId: msg.Id() }, function(err, shorts) {
        if (err) { 
            deferred = q.defer();
            deferred.reject(err);
            promises.push(deferred.promise);
        }
        else {
            for (var i = 0; i < shorts.length; i++) {
                var short1 = shorts[i];
                deferred = q.defer();
                remove(short1, deferred);
                promises.push(deferred.promise);
            }
        }
    });
    return q.all(promises);
}
