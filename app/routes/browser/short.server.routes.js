'use strict';


//
// Route for expanding shortened url's used in notifications,
// requires login/session authentication.
//
var middleModule = require('../../../app/controllers/lib/middle.server.js'),
    authModule = require('../../../app/controllers/lib/auth.server.js'),
    shortModule = require('../../../app/controllers/lib/short.server.js');


module.exports = function(app) {

    app.get('/short/:link', authModule.sessionCheckOrLogin, shortModule.redirect, middleModule.errHandler);
}
