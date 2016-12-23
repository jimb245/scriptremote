'use strict';

// This view is for managing location settings:
//      dynamic templates
//      description

angular.module('templatesSelectMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/templates-select/:projectDisplay/:jobId/:locationDisplay/:projectResource?/:locationResource?', {
    templateUrl: 'modules/views/location-settings/src/location-settings.client.view.html',
    controller: 'templatesSelectCtrl'
  });
}])

.controller('templatesSelectCtrl', ['$scope', '$routeParams', 'TmplSvc', 'ApiSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $routeParams, TmplSvc, ApiSvc, AlertSvc, AuthSvc, CryptoSvc) {

    $scope.project = $routeParams.project;
    $scope.jobId = $routeParams.jobId;
    $scope.location = $routeParams.location;

    // Initialize the template list and current choices for location
    $scope.init = function() {
        $scope.projectDisplay = $routeParams.projectDisplay;
        if ($routeParams.projectResource && ($routeParams.projectResource != $scope.projectDisplay)) {
            $scope.projectDecrypt = true;
            $scope.projectResource = $routeParams.projectResource;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = encodeURIComponent($routeParams.projectResource);

            $scope.locationDisplay = $routeParams.locationDisplay;
            $scope.locationResource = $routeParams.locationResource;
            $scope.locationDisplayURI = encodeURIComponent($routeParams.locationDisplay);
            $scope.locationResourceURI = encodeURIComponent($routeParams.locationResource);
        }
        else {
            $scope.projectDecrypt = false;
            $scope.projectResource = $scope.projectDisplay;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = $scope.projectDisplayURI;

            $scope.locationDisplay = $routeParams.locationDisplay;
            $scope.locationResource = $scope.locationDisplay;
            $scope.locationDisplayURI = encodeURIComponent($routeParams.locationDisplay);
            $scope.locationResourceURI = $scope.locationDisplayURI;
        }
        $scope.jobId = $routeParams.jobId;

        $scope.templates = [];
        $scope.locationTemplates = [];
        TmplSvc.listTmpl($scope.projectResource, $scope.jobId, $scope.locationResource).get(
            function(data) {
                if (data.file_keys) {
                    for (var i = 0; i < data.file_keys.length; i++) {
                        $scope.templates.push({'name': data.file_keys[i]});
                    }
                    TmplSvc.locationTmpl($scope.projectResource, $scope.jobId, $scope.locationResource).get(
                        function(data1) {
                            for (var i = 0; i < 2; i++) {
                                $scope.locationTemplates.push(null);
                            }
                            for (i = 0; i < 2; i++) {
                                for (var j = 0; j < $scope.templates.length; j++) {
                                    if (data1.templates[i] == $scope.templates[j].name) {
                                        $scope.locationTemplates[i] = $scope.templates[j];
                                     }
                                }
                            }
                            ApiSvc.resource.projectGet({project: $scope.projectResource}, 
                                function(data2) { 
                                    $scope.isEncrypted = data2.encrypted;
                                },
                                function(res) { AuthSvc.alertPostRoute(res); }
                            )
                        },
                        function(res) { AuthSvc.alertPostRoute(res); }
                    )
                }
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Change location description
    $scope.submitDescription = function() {
        if ($scope.isEncrypted && !$scope.projectDecrypt) {
            // Passphrase not correct for this project
            return;
        }
        var description = $scope.description;
        if ($scope.projectDecrypt) {
            description = CryptoSvc.encrypt($scope.projectResource, $scope.description);
        }
        ApiSvc.resource.locationDescPut({project: $scope.projectResource, job: $scope.jobId, 
                location: $scope.locationResource}, {description: description},
            function(data) { 
                $scope.description = null;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    //Save new template selections
    $scope.save = function() {
        var tmplNames = [];
        for (var i = 0; i < $scope.locationTemplates.length; i++) {
            tmplNames.push($scope.locationTemplates[i].name);
        }
        TmplSvc.locationTmpl($scope.projectResource, $scope.jobId, $scope.locationResource).save( {templates: tmplNames},
            $scope.init,
            function(res) { AuthSvc.alertPostRoute(res);}
        )
    }

    $scope.init();

}]);

