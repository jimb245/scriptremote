'use strict'

/**
 * Application startup module
 */

require('dotenv').config();

var fs = require('fs'),
	http = require('http'),
	https = require('https'),
    init = require('./config/init')(),
	config = require('./config/config'),
	mongo = require('./config/mongo');

/**
 * Export startup function - it returns a promise
 *
 * Usage with server.js:
 *  require('./server_mod')();
 *
 * Usage in mocha test files:
 *  require('.../server_mod')
 *  .then( function(app) { ... } ...)
 */
module.exports = function() {


    // Bootstrap db connection
    return mongo()

    .then( function(dbx) {

        // Init the express application
        var app = require('./config/express')(dbx);

        // Bootstrap passport config
        require('./config/passport-init')();

        // Expose app
        //exports = module.exports = app;

        var server;
        if (process.env.NODE_ENV === 'secure') {

            // Load SSL key and certificate
            var privateKey = fs.readFileSync('./config/sslcerts/privkey.pem', 'utf8');
            var certificate = fs.readFileSync('./config/sslcerts/fullchain.pem', 'utf8');

            // Create HTTPS Server
            server = https.createServer({
                key: privateKey,
                cert: certificate
            }, app);
        }
        else {
            // Create HTTP Server
            server = http.createServer(app);
        }

        app.locals.server = server;
        server.listen(app.locals.port, function(){
            console.log( 'Express started on port: ' +
            config.port + '; press Ctrl-C to terminate.' );

        });
        return app;
    });
};

