'use strict';

//
// Routes for browser client to manage user settings.
//
var csrf = require('csurf'),
    middleModule = require('../../../app/controllers/lib/middle.server.js'),
    authModule = require('../../../app/controllers/lib/auth.server.js'),
    settingsController = require('../../../app/controllers/browser/settings.server.controller.js');

module.exports = function(app) {

    // Add csrf token for routes handled by Angular
    var csrfProtect = csrf(app.locals.csurf);
    app.use('/settings-xhr', csrfProtect, function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {'secure': app.locals.secureCookies});
        next();
    });

    // Get current user settings
    app.get('/settings-xhr/:group', authModule.sessionCheck, settingsController.get, middleModule.errHandler);

    // Add user settings
    app.post('/settings-xhr/:group', authModule.sessionCheck, settingsController.post, middleModule.errHandler);

    // Update user settings
    app.put('/settings-xhr/:group', authModule.sessionCheck, settingsController.put, middleModule.errHandler);

}
