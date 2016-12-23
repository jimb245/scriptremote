'use strict';

//
// Routes for browser client to manage dynamic Angular templates
// The corresponding components are included in the Angular app.
//

var middleModule = require('../../../app/controllers/lib/middle.server.js'),
    authModule = require('../../../app/controllers/lib/auth.server.js'),
    ngtemplatesController = require('../../../app/controllers/browser/ngtemplates.server.controller.js');


module.exports = function(app) {

    // Returns names of current Angular dynamic templates for a location
    // in the order: content, reply.
    // { 'templates': [...] }
    app.get('/templates/location/:project/:job/:location',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', '', ['project', 'job', 'location'])
        },
        middleModule.authTmpl, middleModule.validateParams, middleModule.parse, ngtemplatesController.locationGet, middleModule.errHandler);

    // Sets the names of dynamic templates for a location.
    // Request data: 
    //  templates (array of strings: [content, reply])
    app.put('/templates/location/:project/:job/:location',
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'write', '', ['project', 'job', 'location'])
        },
        middleModule.authTmpl, middleModule.validateParams, middleModule.parse, ngtemplatesController.locationPut, middleModule.errHandler);

    // Download dynamic template file contents
    app.get('/templates/files/:name/contents', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'file', ['name'])
        },
        authModule.sessionCheck, ngtemplatesController.filesGet, middleModule.errHandler);

    // Download dynamic template file contents for shared project+job+location
    app.get('/templates/files/share/:project/:job/:location/:name/contents', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'file', ['name', 'project', 'job', 'location'])
        },
        middleModule.authTmpl, ngtemplatesController.filesGet, middleModule.errHandler);

    // Download global default dynamic template file contents
    app.get('/templates/files/global/:name/contents', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'global', ['name'])
        },
        authModule.sessionCheck, ngtemplatesController.filesGet, middleModule.errHandler);

    // Get dynamic template file properties
    app.get('/templates/files/:name', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'property', ['name'])
        },
        authModule.sessionCheck, ngtemplatesController.filesGet, middleModule.errHandler);

    // Get dynamic template file properties for shared project+job+location
    app.get('/templates/files/share/:project/:job/:location/:name', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'property', ['name', 'project', 'job', 'location'])
        },
        middleModule.authTmpl, ngtemplatesController.filesGet, middleModule.errHandler);


    // Get names of available dynamic templates for a user
    // { 'templates': [...] }
    app.get('/templates/list', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'list', [])
        },
        authModule.sessionCheck, ngtemplatesController.filesGet, middleModule.errHandler);

    // Get names of available dynamic templates for shared project+job+location
    // { 'templates': [...] }
    app.get('/templates/list/share/:project/:job/:location', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', 'list', ['project', 'job', 'location'])
        },
        middleModule.authTmpl, ngtemplatesController.filesGet, middleModule.errHandler);

    // Get names of user's default dynamic templates
    // in the order: content, reply
    // { 'templates': [...] }
    app.get('/templates/defaults', authModule.sessionCheck, ngtemplatesController.userDefaultsGet, middleModule.errHandler);


    // Get names of user's default dynamic templates for shared project+job+location
    // in the order: content, reply.
    // { 'defaults': [...] }
    app.get('/templates/defaults/share/:project/:job/:location', 
        function(req, res, next) {
            middleModule.copyParams(req, res, next, 'read', '', ['project', 'job', 'location'])
        },
        middleModule.authTmpl, ngtemplatesController.userDefaultsGet, middleModule.errHandler);

    // Sets user's default dynamic template settings
    // Request data: 
    //  defaults (array of strings: [content, reply])
    app.put('/templates/defaults', authModule.sessionCheck, ngtemplatesController.userDefaultsPut, middleModule.errHandler);

    // Upload a new dynamic template file to add to available list
    // Form data:
    //  file (string)
    //  key (string)
    app.post('/templates/files', authModule.sessionCheck, ngtemplatesController.filesPost, middleModule.errHandler);

    // Delete a template file currently in available list
    app.delete('/templates/files/:name', authModule.sessionCheck, ngtemplatesController.fileDelete, middleModule.errHandler);

}

