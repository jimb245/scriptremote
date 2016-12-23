'use strict';

// This view is for admin tasks

var adminApp = angular.module('adminMod');
var adminCtrl;

adminApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/admin', {
        templateUrl: 'modules/views/admin/src/admin.client.view.html',
        controller: 'adminCtrl',
        resolve: {
            authCheck: adminCtrl.authCheck
        }     
    })
}]);

var adminCtrl = adminApp.controller('adminCtrl', ['$scope', 'AdminSvc', 'AlertSvc', 'AuthSvc', function(
    $scope, AdminSvc, AlertSvc, AuthSvc) {

    // Get list of users
    $scope.getUsers = function() {
        AdminSvc.userGet(
            function(data) { 
                $scope.users = data.users 
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Get properties of a user
    $scope.getUser = function(user) {
        AdminSvc.userGet({'uid': user.uid},
            function(data) { $scope.user = data.user; },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Update user flags
    $scope.updateUser = function() {
        var params = {'confirmed': $scope.user.confirmed, 'enabled': $scope.user.enabled };
        if ($scope.pw.length > 0) {
            params['password'] = $scope.pw;
        }
        AdminSvc.userPut({'uid': $scope.user.uid}, params,
            function(data) { 
                $scope.user = {}
                $scope.pw = '';
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Register new user
    $scope.regUser = function() {
        if ($scope.newUser.email.length === 0) {
            AlertSvc.msgAlert('warning', 'Missing required email');
            return;
        }
        if ($scope.newUser.pw.length === 0) {
            AlertSvc.msgAlert('warning', 'Missing required password');
            return;
        }
        var params = {'name': $scope.newUser.name, 'company': $scope.newUser.company, 'email': $scope.newUser.email, 'password': $scope.newUser.pw };
        AdminSvc.userCreate( params,
            function(data) { 
                $scope.newUser = {};
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Delete user
    $scope.deleteUser = function(user) {
        if (AlertSvc.confirm('Delete user "' + $scope.deleteUid + '"?')) {
            AdminSvc.userDelete({'uid': $scope.deleteUid},
                function(data) { $scope.deleteUid = ''; },
                function(res) { $scope.deleteUid = '';
                                AuthSvc.alertPostRoute(res); }
            )
        }
    }

    // Email all users
    $scope.sendMail = function() {
        AdminSvc.sendMail({'msg': $scope.msg},
            function(data) { $scope.msg = ''; },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Update other option flags
    $scope.updateOptions = function() {
        AdminSvc.optionsPut({'options': $scope.options},
            function(data) { $scope.options = data.options; },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Get other option flags
    $scope.getOptions = function() {
        AdminSvc.optionsGet(
            function(data) { $scope.options = data.options; },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.init = function() {
        $scope.user = {};
        $scope.pw = '';
        $scope.newUser = {};
        $scope.getUsers();
        $scope.getOptions();
    }

    $scope.init();
}]);

adminCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]

