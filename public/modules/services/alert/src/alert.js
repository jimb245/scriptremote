'use strict'

//
// Service to receive alerts and make them available
// to a display directive
//
angular.module('alertMod')

.factory('AlertSvc', ['$window', '$location', '$rootScope', '$anchorScroll', function ($window, $location, $rootScope, $anchorScroll) {

    var service = {};
    service.alerts = [];

    // Add alert based on a server response
    service.resAlert = function(response, clearUser) {
        var obj = null;
        var duplicate;
        var i;
        try {
            obj = angular.fromJson(response.data);
        }
        catch(e) {
            service.alerts.push({'type': 'danger', 'msg': 'Server error'});
            $location.path('/#home');
            return
        }
        if (obj && obj.hasOwnProperty('SR_status')) {
            var level = 'info';
            if (response.status >= 400) {
                level = 'warning';
            }
            if (response.status >= 500) {
                level = 'danger';
            }
            duplicate = false;
            for (i = 0; i < service.alerts.length; i++) {
                if ((service.alerts[i].type == level) && (service.alerts[i].msg == obj['SR_status'])) {
                    duplicate = true;
                    break;
                }
            }
            if (!duplicate) {
                service.alerts.push({'type': level, 'msg': obj['SR_status']});
            }
            if (obj['SR_status'] == 'Not logged in') {
                if (typeof clearUser != 'undefined') {
                    clearUser();
                }
                $location.path('/#home');
            }
            else {
                $anchorScroll();
            }
        }
        else {
            duplicate = false;
            for (i = 0; i < service.alerts.length; i++) {
                if ((service.alerts[i].type == 'danger') && (service.alerts[i].msg == 'Server error')) {
                    duplicate = true;
                    break;
                }
            }
            if (!duplicate) {
                service.alerts.push({'type': 'danger', 'msg': 'Server error'});
            }
            $location.path('/#home');
        }
    }

    // Add alert with given level and text
    service.msgAlert = function(level, msg) {
        var duplicate = false;
        for (var i = 0; i < service.alerts.length; i++) {
            if ((service.alerts[i].type == level) && (service.alerts[i].msg == msg)) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            service.alerts.push({'type': level, 'msg': msg});
        }
        $anchorScroll();
    }

    service.confirm = function(msg) {
        var r = $window.confirm(msg);
        return r;
    }

    // Called by display directive to clear alert
    service.remove = function(index) {
        service.alerts.splice(index, 1);
    }

    return service;
}])
