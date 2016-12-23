'use strict';

var csrf = require('csurf');

module.exports = function(app) {

    var csrfProtect = csrf(app.locals.csurf);

    // Root route loads the Angular-controlled page
    app.get('/', csrfProtect, function(req, res) {
        var locals = app.locals;
        locals.layout = 'layout.angular.handlebars';
        res.cookie('XSRF-TOKEN', req.csrfToken(), {'secure': app.locals.secureCookies});
        res.render('angular', locals);
    });
}
