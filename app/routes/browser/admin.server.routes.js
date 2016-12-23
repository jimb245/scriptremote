'use strict';


//
// Routes for browser client to do admin tasks
//
var csrf = require('csurf'),
    middleModule = require('../../../app/controllers/lib/middle.server.js'),
    authModule = require('../../../app/controllers/lib/auth.server.js'),
    adminController = require('../../../app/controllers/browser/admin.server.controller.js');


module.exports = function(app) {

    var csrfProtect = csrf(app.locals.csurf);

    // Add csrf token for routes handled by Angular
    app.use('/admin', csrfProtect);
    app.use('/admin', function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {'secure': app.locals.secureCookies});
        next();
    });

    // Get current users
    // Returns uid's and emails:
    // { 'users': [ {'uid': (string), 'email': (email)}, ...] }
    app.get('/admin/users', authModule.sessionCheck, adminController.get, middleModule.errHandler);

    // Get user properties
    // Returns:
    // { 'user': {'name': (string), 'regDate': (date), 'company': (string), 
    //      'email': (email), 'admin': (boolean),
    //      'confirmed': (boolean), 'enabled': (boolean), 'uid': (string),
    //      'shares': (array) }}
    app.get('/admin/users/:uid', authModule.sessionCheck, adminController.get, middleModule.errHandler);

    // Update user properties -
    // Request data:
    //  confirmed (boolean) - is email address confirmed
    //  enabled (boolean) - is login enabled
    //  
    app.put('/admin/users/:uid', authModule.sessionCheck, adminController.put, middleModule.errHandler);

    // Delete user
    app.delete('/admin/users/:uid', authModule.sessionCheck, adminController.delete, middleModule.errHandler);

    // Register new user -
    // Request data:
    //  name (string)
    //  company (string)
    //  email (string) - required
    //  password (string) - required
    // Returns new uid if successful:
    // { 'uid': (string) }
    app.post('/admin/users', authModule.sessionCheck, adminController.post, middleModule.errHandler);

    // Email all users
    // Request data:
    //  msg (text)
    //  
    app.put('/admin/mail', authModule.sessionCheck, adminController.mail, middleModule.errHandler);

    // Get current options
    // { 'options': {'jobsEnabled': (boolean), 'regEnabled': (boolean)}}
    app.get('/admin/options', authModule.sessionCheck, adminController.options, middleModule.errHandler);

    // Update options
    // Request data:
    //  jobsEnabled (boolean)
    //  regEnabled (boolean)
    // Returns saved values:
    // { 'options': {'jobsEnabled': (boolean), 'regEnabled': (boolean)}}
    //  
    app.put('/admin/options', authModule.sessionCheck, adminController.options, middleModule.errHandler);
}
