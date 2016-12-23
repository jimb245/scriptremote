'use strict'


// Service to access server's rest api for project data.
angular.module('apiMod')

.factory('ApiSvc', ['$resource', '$http', function($resource, $http) {

    var service = {};

    service.resource = $resource('brsapi/projects', {}, {
        'projectGet':   {method:'GET', url: 'brsapi/projects/:project'},
        'jobGet':       {method:'GET', url: 'brsapi/projects/:project/jobs/:job'},
        'locationGet':  {method:'GET', url: 'brsapi/projects/:project/jobs/:job/locations/:location'},
        'msgGet':      {method:'GET', url: 'brsapi/projects/:project/jobs/:job/locations/:location/msgs/:msg'},
        'filesGet':     {method:'GET', url: 'brsapi/projects/:project/jobs/:job/locations/:location/msgs/:msg/files'},
        'locationPut':  {method:'PUT', url: 'brsapi/projects/:project/jobs/:job/locations/:location/templates'},
        'projectDescPut':  {method:'PUT', url: 'brsapi/projects/:project/description'},
        'jobDescPut':  {method:'PUT', url: 'brsapi/projects/:project/jobs/:job/description'},
        'locationDescPut':  {method:'PUT', url: 'brsapi/projects/:project/jobs/:job/locations/:location/description'},
        'msgPut':      {method:'PUT', url: 'brsapi/projects/:project/jobs/:job/locations/:location/msgs/:msg/reply'},
        'sharePut':     {method:'PUT', url: 'brsapi/projects/:project/share'},
        'notifyPut':     {method:'PUT', url: 'brsapi/projects/:project/notify'},
        'projectDelete':   {method:'DELETE', url: 'brsapi/projects/:project'},
        'jobDelete':       {method:'DELETE', url: 'brsapi/projects/:project/jobs/:job'}
});

    service.fileGet = function(project, job, location, msg, key) {
        // Using $http because $resource doesnt handle streamed files.
        var req = {
            method: 'GET',
            url: 'brsapi/projects/' + encodeURIComponent(project) + '/jobs/' + job + '/locations/' + encodeURIComponent(location) + '/msgs/' + msg + '/files/' + key
        };
        return $http(req);
    }

    return service;
}])

