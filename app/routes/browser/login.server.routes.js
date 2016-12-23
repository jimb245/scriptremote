'use strict';

//
// Routes for browser client to login, check session, logout,
// reset password. These views are not part of the Angular app.
//

var csrf = require('csurf'),
    expressBrute = require('express-brute'),
    bodyParser = require('body-parser'),
    middleModule = require('../../../app/controllers/lib/middle.server.js'),
    authModule = require('../../../app/controllers/lib/auth.server.js');

module.exports = function(app) {

    debugger;
    var csrfProtect = csrf(app.locals.csurf);
    var bruteforce = new expressBrute(app.locals.bruteStore, app.locals.bruteOptions);

    // Render login form
    app.get('/login', [csrfProtect, function(req, res) {
        var data = app.locals;
        data.layout = 'layout.server.handlebars';
        data.csrfToken = req.csrfToken();
        res.render('login', data);
    }]);

    // Process returned login form
    app.use('/processlogin', [bodyParser.urlencoded({extended: true, limit:'50mb'})]);
    app.post('/processlogin', function(req, res, next) {
        debugger;
        next();
    }, bruteforce.prevent, csrfProtect, authModule.loginHandler, middleModule.errHandler);

    // Process logout
    app.get('/logout', [authModule.logoutHandler, middleModule.errHandler]);

    // Check for valid session
    app.get('/authcheck', [authModule.sessionCheckHandler, middleModule.errHandler]);

    // Password reset step 1:
    // Render initial password reset request form to get user's login email
    app.get('/sendreset', csrfProtect, function(req, res) {
        var data = app.locals;
        data.layout = 'layout.server.handlebars';
        data.csrfToken = req.csrfToken();
        res.render('initreset', data);
    });

    // Password reset step 2:
    // Process returned initial password reset form to send reset email
    app.use('/processinitreset', bodyParser.urlencoded({extended: true, limit:'50mb'}));
    app.post('/processinitreset', csrfProtect, authModule.initResetFormHandler, middleModule.errHandler);

    // Password reset step 3:
    // Process password reset email confirmation - renders new password form
    app.get('/processresetconfirm', csrfProtect, authModule.resetConfirmHandler, middleModule.errHandler);

    // Password reset step 4:
    // Process new password form
    app.use('/processreset', bodyParser.urlencoded({extended: true, limit:'50mb'}));
    app.post('/processreset', csrfProtect, authModule.resetFormHandler, middleModule.errHandler);

}
