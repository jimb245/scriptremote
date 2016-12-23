'use strict'

// Service to access user settings
angular.module('settingsMod')

.factory('SettingsSvc', ['$resource', function($resource) {

    var service = {};

    service.credentials= $resource('settings-xhr/:group', {}, {
        get: {method: 'GET', params: {group:'apiCredentials'}},
        save: {method: 'POST', params: {group:'apiCredentials'}}
    });
    service.address= $resource('settings-xhr/:group', {}, {
        get: {method: 'GET', params: {group:'address'}},
        save: {method: 'POST', params: {group:'address'}}
    });
    service.pw = $resource('settings-xhr/:group', {}, {
        save: {method: 'POST', params: {group:'password'}}
    });
    service.fromShares= $resource('settings-xhr/:group', {}, {
        get: {method: 'GET', params: {group:'fromShares'}},
        save: {method: 'POST', params: {group:'fromShares'}},
        remove: {method: 'PUT', params: {group:'fromShares'}}
    });
    service.other= $resource('settings-xhr/:group', {}, {
        get: {method: 'GET', params: {group:'other'}},
        save: {method: 'POST', params: {group:'other'}}
    });

    return service;
}])

