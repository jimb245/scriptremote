'use strict';

// This view is for managing job settings:
//      description

var jobSettingsApp = angular.module('jobSettingsMod');
var jobSettingsCtrl;

jobSettingsApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/job-settings/:projectDisplay/:jobId/:projectResource?', {
        templateUrl: 'modules/views/job-settings/src/job-settings.client.view.html',
        controller: 'jobSettingsCtrl',
        resolve: {
            authCheck: jobSettingsCtrl.authCheck
        }     
    })
}]);

var jobSettingsCtrl = jobSettingsApp.controller('jobSettingsCtrl', ['$scope', '$routeParams', 'AlertSvc', 
        'AuthSvc', 'ApiSvc', 'CryptoSvc', function( $scope, $routeParams, AlertSvc, AuthSvc, ApiSvc, CryptoSvc) {

    $scope.init = function() {
        $scope.projectDisplay = $routeParams.projectDisplay;
        if ($routeParams.projectResource && ($routeParams.projectResource != $scope.projectDisplay)) {
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
        $scope.jobId = $routeParams.jobId;

        ApiSvc.resource.projectGet({project: $scope.projectResource}, 
            function(data) { 
                $scope.isEncrypted = data.encrypted;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Change job description
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
        ApiSvc.resource.jobDescPut({project: $scope.projectResource, job: $scope.jobId},
                                {description: description},
            function(data) { 
                $scope.description = null;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.init();
}]);

jobSettingsCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]

