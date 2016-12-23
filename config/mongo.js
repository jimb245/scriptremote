'use strict';

var mongoose = require('mongoose'),
    chalk = require('chalk'),
    gridStream = require('gridfs-stream'),
    q = require('q'),
	config = require('./config');

/**
 * Bootstrap mongodb and gridFS - returns a promise
 */
module.exports = function() {

    var deferred = q.defer();

    //var mgopts = { server: { socketOptions: { keepAlive: 100, connectTimeoutMS: 10000, socketTimeoutMS: 30000 } } };
    var mgopts = { server: { socketOptions: { keepAlive: 100} } };
    if (config.mongoUser && config.mongoPassword) {
        mgopts['user'] = config.mongoUser;
        mgopts['pass'] = config.mongoPassword;
        mgopts['auth'] = {authdb: 'admin'};
    }
    mongoose.connect(config.db, mgopts, function(err) {
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(chalk.red(err));
            deferred.reject(err);
        }
        else {
            var cnx = mongoose.connection;
            cnx.on('error', function(err) {
                //var err = new Error('MongoDB connection error');
                console.log(chalk.red(err));
            });
            gridStream.mongo = mongoose.mongo;
            var grid = gridStream(cnx.db, mongoose.mongo);
            var dbx = {'cnx': cnx, 'grid': grid};
            deferred.resolve(dbx);
        }
    });

    return deferred.promise;
}
