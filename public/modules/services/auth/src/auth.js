'use strict'


// Service to check login status at angular startup
// or during routing.
angular.module('authMod')
.factory('AuthSvc', ['$q', '$location', '$http', 'AlertSvc', function ($q, $location, $http, AlertSvc) {
    var service = {};
    service.data = {email: '', loggedIn: false, admin: false};
 
    // Startup check if logged in
    service.checkAtStart = function () {
        return $http
        .get('/authcheck')
        .then(function (res) {
                if (res.status == 200) {
                    service.data.loggedIn = true;
                    service.data.email = res.data.user;
                    service.data.admin = res.data.admin;
                    return {email: service.data.email, admin: service.data.admin};
                }
                else {
                    service.data.loggedIn = false;
                    service.data.email = '';
                    service.data.admin = false;
                    return null;
                }
            },
            function(res) {
                service.data.loggedIn = false;
                service.data.email = '';
                service.data.admin = false;
                return null;
            })
    }

    // Preroute check if logged in
    service.checkAtRoute = function() {
        var deferred = $q.defer();
        if (service.data.loggedIn) {
            deferred.resolve();
        }
        else {
            service.checkAtStart().then(function(user) {
                if (!user) {
                    $location.path('/#home');
                    AlertSvc.msgAlert('info', 'Please login first');
                    deferred.reject();
                }
                else {
                    deferred.resolve();
                }
            })
        }
        return deferred.promise;
    };

    // Postroute alert and user clear
    service.alertPostRoute = function(res) {
        AlertSvc.resAlert(res, service.reset);
    };

    service.email = function() {
        return service.data.email;
    };
    service.authenticated = function() {
        return service.data.loggedIn;
    };
    service.admin = function() {
        return service.data.admin;
    }
    service.reset = function() {
        service.data.loggedIn = false;
        service.data.email = '';
        service.data.admin = false;
    };
 
    return service;
}])
