'use strict';

// Derived from meanjs.org boilerplate

var express = require('express'),
    exphbs = require('express-handlebars'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compress = require('compression'),
	cookieParser = require('cookie-parser'),
	passport = require('passport'),
    mongoose = require('mongoose'),
    bruteMongo = require('express-brute-mongo'),
    streamRotator = require('file-stream-rotator'),
	path = require('path'),
    fs = require('fs'),

	//flash = require('connect-flash'),
	morgan = require('morgan'),
	helmet = require('helmet'),
	//methodOverride = require('method-override'),
	config = require('./config');

var mongoStore = require('connect-mongo/es5')(session);

/**
 * Initialize express app
 */
module.exports = function(dbx) {

    debugger;

	var app = express();

	// Load model files
	config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
    app.locals.appVersion = config.app.version;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.jsFilesLogin = config.getJavaScriptAssetsLogin();
	app.locals.cssFiles = config.getCSSAssets();
	app.locals.cssFilesLogin = config.getCSSAssetsLogin();
    app.locals.port = config.port;
    app.locals.projectLimits = config.limits;
    app.locals.grid = dbx['grid'];
    app.locals.db = dbx['cnx'].db;
    app.locals.credentials = config.credentials;
    app.locals.csurf = {ignoreMethods: ['GET', 'HEAD', 'OPTIONS']};
    app.locals.tokenLifetime = config.tokenLifetime;
    app.locals.regEmailProtocol = 'http://';
    app.locals.secureCookies = false;

    app.locals.mailer = {'from': config.mailer.from, 'options': {'auth': config.mailer.options.auth}};
    if (config.mailer.options.service) {
        app.locals.mailer.options['service'] = config.mailer.options['service'];
    }
    else if (config.mailer.options.host && config.mailer.options.port && config.mailer.options.TLS) {
        app.locals.mailer.options['host'] = config.mailer.options['host'];
        app.locals.mailer.options['port'] = config.mailer.options['port'];
        app.locals.mailer.options['TLS'] = config.mailer.options['TLS'];
    }
    else {
        // Should not get here
        console.log('Invalid mailer options');
        return null;
    }

    // Settings for limiting login attempts
    app.locals.bruteStore = new bruteMongo(function(ready) {
        ready(app.locals.db.collection('bruteforce'));
    });
	if (process.env.NODE_ENV === 'test') {
        // mocha tests exceed default login retry limits
        app.locals.bruteOptions = {freeRetries: 1000};
    }
    else {
        app.locals.bruteOptions = {freeReTries: 2};
    }

	// Should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Showing stack errors
	//app.set('showStackError', true);


    /*
    * Server-side template engine is express-handlebars.
    * Layout app/views/layouts/layout.server is for the server-controlled 
    * pages ('/register', '/login').
    * Layout app/views/layouts/layout.angular is for the remaining
    * Angular-controlled single-page part ('/')
    */
    var viewsPath = path.join(__dirname, '../app/views');
    var engineName = 'handlebars';
    var hbs = exphbs.create({layoutsDir: viewsPath + '/layouts', defaultLayout: 'layout.server.handlebars', extName: engineName});
    app.engine(engineName, hbs.engine);

	// Set views path and view engine
    app.set('view engine', engineName);
	app.set('views', viewsPath);

	// Environment dependent middleware
    var logDirectory;
    var accessLogStream;
	if (process.env.NODE_ENV === 'test') {

	    // Setting the static folder
	    app.use(express.static('public'));

        // Logger setup
        logDirectory = path.join(__dirname, '../log');
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory);
        }
        accessLogStream = streamRotator.getStream({
          date_format: 'YYYYMMDD',
          filename: path.join(logDirectory, 'access-%DATE%.log'),
          frequency: '168h',
          verbose: false
        })
        app.use(morgan('combined', {stream: accessLogStream}))
    }
	else if (process.env.NODE_ENV === 'development') {

	    // Setting the static folder
	    app.use(express.static('public'));

		// Disable handlebars template caching
		app.set('view cache', false);

		// Logger setup
        // var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
		//app.use(morgan('dev'));
	} 
    else if (process.env.NODE_ENV === 'production') {

	    // Setting the static folder
	    app.use(express.static('public', {maxage: '30 days'}));

		// Enable handlebars template caching
		app.set('view cache', true);

        // setup logger
        //var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
        //app.use(morgan('combined', {stream: accessLogStream}))
    } 
    else if (process.env.NODE_ENV === 'secure') {

	    // Setting the static folder
	    app.use(express.static('public', {maxage: '30 days'}));

		// Enable handlebars template caching
		app.set('view cache', true);

        // Logger setup
        logDirectory = path.join(__dirname, '../log');
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory);
        }
        accessLogStream = streamRotator.getStream({
          date_format: 'YYYYMMDD',
          filename: path.join(logDirectory, 'access-%DATE%.log'),
          frequency: '168h',
          verbose: false
        })
        app.use(morgan('combined', {stream: accessLogStream}))
    
        /*
        * This setup assumes an exposed node server listening 
        * only for https and no server-side http redirection
        */
        app.locals.regEmailProtocol = 'https://';
        app.use(function(req, res, next) {
            res.set('Strict-Transport-Security', 'max-age=31536000');
            if (req.secure) {
                next();
            } 
            else {
                // Should not get here
                var err = new Error('Invalid protocol, use https');
                next(err);
            }
        })
    }
    else if (process.env.NODE_ENV === 'cloudfoundry') {

	    // Setting the static folder
	    app.use(express.static('public', {maxage: '30 days'}));

		// Enable handlebars template caching
		app.set('view cache', true);

        /*
        * This setup assumes a proxy listening for http
        * and https with TLS terminating at the proxy
        * so node sees only http.  The original protocol 
        * is passed along in header.
        */
        app.locals.regEmailProtocol = 'https://';
        app.use(function(req, res, next) {
            res.set('Strict-Transport-Security', 'max-age=31536000');
            if (req.get('X-Forwarded-Proto') != 'https') {
                res.redirect('https://' + req.headers.host + req.url);
            }
            else {
                next();
            }
        })
	}

    /*
    * bodyParser.urlencoded is only invoked on the individual
    * route that actually need it
	* app.use(bodyParser.urlencoded({
	*     extended: true
	* }));
    */
	app.use(bodyParser.json());
	//app.use(methodOverride());

	// CookieParser should be placed before session
	app.use(cookieParser());

	// Mongo session storage
    var db = app.locals.db;
    var sessionArgs = {
    	saveUninitialized: false,
		resave: false,
        unset: 'destroy',
        cookie: {},
		secret: config.sessionSecret,
		store: new mongoStore({ db: db, ttl: 14*24*3600 })
	};
    if (process.env.NODE_ENV === 'secure') {
        /*
        * Make session cookie secure.
        * This setup assumes no proxy.
        */
        //app.set('trust proxy', true) // trust first proxy
        sessionArgs.cookie.secure = true
        app.locals.secureCookies = true;
    }
    else if (process.env.NODE_ENV === 'cloudfoundry') {
        /*
        * Make session cookie secure.
        * This setup assumes a proxy.
        */
        app.set('trust proxy', true) // trust first proxy
        sessionArgs.cookie.secure = true
        app.locals.secureCookies = true;
    }
	app.use(session(sessionArgs));

	// Sessions are handled outside passport for more control
	app.use(passport.initialize());
	//app.use(passport.session());

	// connect flash for flash messages
	// app.use(flash());

	// Use helmet to secure Express headers
	app.use(helmet.xframe());
	app.use(helmet.xssFilter());
	app.use(helmet.nosniff());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');

    // Load routing files
	config.getGlobbedFiles('./app/routes/**/*.js').forEach(function(routePath) {
		require(path.resolve(routePath))(app);
	});

    // Load default 404 and 500 routes
    require('../app/routes/default.server.routes.js')(app);

	// Return Express server instance
	return app;
};
