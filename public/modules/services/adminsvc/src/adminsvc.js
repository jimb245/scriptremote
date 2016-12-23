'use strict'

// Service to manage users
angular.module('adminSvcMod')

.factory('AdminSvc', ['$resource', function($resource) {

    var service = $resource('admin', {}, {
        'userGet':     {method:'GET', url: 'admin/users/:uid'},
        'userPut':     {method:'PUT', url: 'admin/users/:uid'},
        'userDelete':  {method:'DELETE', url: 'admin/users/:uid'},
        'userCreate':  {method:'POST', url: 'admin/users'},
        'sendMail':    {method:'PUT', url: 'admin/mail'},
        'optionsPut':     {method:'PUT', url: 'admin/options'},
        'optionsGet':     {method:'GET', url: 'admin/options'}
    });

    return service;
}])

