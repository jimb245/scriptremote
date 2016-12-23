'use strict';

//
// Routes for user registration from browser client
// Registration pages are not part of the Angular app.
//


var csrf = require('csurf');
var bodyParser = require('body-parser');
var middleModule = require('../../../app/controllers/lib/middle.server.js');
var regController = require('../../../app/controllers/browser/registration.server.controller.js');


module.exports = function(app) {

    var csrfProtect = csrf(app.locals.csurf);
    // Render registration form
    app.get('/register', csrfProtect, regController.sendReg, middleModule.errHandler);

    // Process returned registration form
    app.use('/processreg', bodyParser.urlencoded({extended: true, limit:'50mb'}));
    app.post('/processreg', csrfProtect, regController.addUser, regController.emailConfirm, middleModule.errHandler);

    // Render registration confirmation request form
    app.get('/requestregconfirm', csrfProtect, function(req, res) {
        var data = app.locals;
        data.layout = 'layout.server.handlebars';
        data.retry = req.query.retry;
        data.email = req.query.email;
        data.csrfToken = req.csrfToken();
        res.render('requestregconfirm', data);
    });

    // Resend registration confirmation email
    app.use('/sendregconfirm', bodyParser.urlencoded({extended: true, limit:'50mb'}));
    app.post('/sendregconfirm', regController.emailConfirm, middleModule.errHandler);

    // Process confirmation (get is for clicking link in email, post is for pasting
    // the token into form).
    app.use('/processregconfirm', bodyParser.urlencoded({extended: true, limit:'50mb'}));
    app.get('/processregconfirm/:token', regController.processConfirm, middleModule.errHandler);
    app.post('/processregconfirm', csrfProtect, regController.processConfirm, middleModule.errHandler);

}
