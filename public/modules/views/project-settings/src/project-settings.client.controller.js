'use strict';

// This view is for managing project settings:
//      project sharing

var projectSettingsApp = angular.module('projectSettingsMod');
var projectSettingsCtrl;

projectSettingsApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/project-settings/:projectDisplay/:projectResource?', {
        templateUrl: 'modules/views/project-settings/src/project-settings.client.view.html',
        controller: 'projectSettingsCtrl',
        resolve: {
            authCheck: projectSettingsCtrl.authCheck
        }     
    })
}]);

var projectSettingsCtrl = projectSettingsApp.controller('projectSettingsCtrl', ['$scope', '$routeParams', 'AlertSvc', 'AuthSvc', 'ApiSvc', 'CryptoSvc', function(
    $scope, $routeParams, AlertSvc, AuthSvc, ApiSvc, CryptoSvc) {

    // Add a new authorized user
    $scope.submitShare = function() {
        if ($scope.email) {
            ApiSvc.resource.sharePut({project: $scope.projectResource}, 
                                        {email: $scope.email,
                                        access: $scope.access,
                                        action: 'add'}, 
                function(data) {
                    $scope.email = null;
                    $scope.init()
                },
                function(res) { AuthSvc.alertPostRoute(res); }
            )
        }
    }
    // Remove an authorized user
    $scope.deleteShare = function(index) {
        ApiSvc.resource.sharePut({project: $scope.projectResource}, 
                                    {email: $scope.authUsers[index].email,
                                    action: 'remove'}, 
            function(data) { 
                $scope.email = null;
                $scope.init()
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Change project description
    $scope.submitDescription = function() {
        if ($scope.isEncrypted && !$scope.projectDecrypt) {
            // Passphrase not correct for this project
            $scope.description = "Project is not decrypted";
            return;
        }
        var description = $scope.description;
        if ($scope.projectDecrypt) {
            description = CryptoSvc.encrypt($scope.projectResource, $scope.description);
        }
        ApiSvc.resource.projectDescPut({project: $scope.projectResource},
                                {description: description},
            function(data) { 
                $scope.description = null;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Change project notification
    $scope.submitNotify = function() {
        var nickname = $scope.nickname;
        ApiSvc.resource.notifyPut({project: $scope.projectResource},
                                {nickname: $scope.nickname, 
                                action: $scope.notify},
            function(data) { 
                $scope.nickname = null;
                $scope.notify = 'off';
                $scope.init();
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.init = function() {
        $scope.projectDisplay = $routeParams.projectDisplay;
        if ($routeParams.projectResource) {
            $scope.projectDecrypt = true;
            $scope.projectResource = $routeParams.projectResource;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = encodeURIComponent($routeParams.projectResource);
        }
        else {
            // Not encrypted or failed to decrypt
            $scope.projectDecrypt = false;
            $scope.projectResource = $scope.projectDisplay;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = $scope.projectDisplayURI;
        }
        ApiSvc.resource.projectGet({project: $scope.projectResource}, 
            function(data) { 
                $scope.authUsers = data.authUsers;
                $scope.access = 'write';
                $scope.isEncrypted = data.encrypted;
                $scope.notify = data.notify;
                $scope.nickname = data.nickname;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.init();
}]);

projectSettingsCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]

