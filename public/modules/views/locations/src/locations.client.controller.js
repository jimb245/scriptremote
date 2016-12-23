'use strict';

angular.module('locationsMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/locations/:projectDisplay/:jobId/:projectResource?', {
    templateUrl: 'modules/views/locations/src/locations.client.view.html',
    controller: 'locationsCtrl'
  });
}])

.controller('locationsCtrl', ['$scope', '$location', '$routeParams', 'ApiSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $location, $routeParams, ApiSvc, AlertSvc, AuthSvc, CryptoSvc) {

    $scope.init = function() {
        $scope.projectDisplay = $routeParams.projectDisplay;
        // For encryption extra routing parameters pass the resource info needed for direct link
        if ($routeParams.projectResource && ($routeParams.projectResource != $scope.projectDisplay)) {
            $scope.projectDecrypt = true;
            $scope.projectResource = $routeParams.projectResource;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = encodeURIComponent($routeParams.projectResource);
        }
        else {
            $scope.projectDecrypt = false;
            $scope.projectResource = $scope.projectDisplay;
            $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
            $scope.projectResourceURI = $scope.projectDisplayURI;
        }
        $scope.jobId = $routeParams.jobId;
        $scope.locsCrypto = {};

        ApiSvc.resource.jobGet({project: $scope.projectResource, job: $scope.jobId},
            function(data) {
                var info = 'Job: ' + '"' + $scope.jobId + '"' + '\nCreated: ' + data.timestamp;
                if (data.ended) {
                    info += '\nEnded: ' + data.timeStampEnd;
                }
                info += '\nmax-msgs=' + data.max_msgs + '\ntoken=' + data.token;
                var description = data.description;
                if ($scope.projectDecrypt && (description !=='')) {
                    description = CryptoSvc.decrypt($scope.projectResource, data.description);
                }
                $scope.bcinfo = {visible: false, static: info, description: description};
                $scope.bcfct = {configure: $scope.configure, delete: $scope.delete};
                ApiSvc.resource.locationGet({project: $scope.projectResource, job: $scope.jobId}, 
                    function(data) { 
                        var locs = data.locations;
                        if ($scope.projectDecrypt) {
                            locs = [];
                            var errCount = 0;
                            for (var i = 0; i < data.locations.length; i++) {
                                var plain = data.locations[i].name;
                                if (data.locations[i].name != 'End') {
                                    plain = CryptoSvc.decrypt($scope.projectResource, data.locations[i].name);
                                    if (!plain) {
                                        errCount += 1;
                                        continue;
                                    }
                                }
                                $scope.locsCrypto[plain] = data.locations[i].name;
                                var loc = data.locations[i];
                                loc.name = plain;
                                locs.push(loc);
                            }
                            if (errCount > 0) {
                                AlertSvc.msgAlert("warning", "Failed to decrypt " + errCount + " locations with current passphrase");
                            }
                        }
                        $scope.locations = locs;
                    },
                    function(res) { AuthSvc.alertPostRoute(res); }
                )
            },
            function(res) { 
                AuthSvc.alertPostRoute(res); 
            }
        )
    }

    $scope.select = function(locDisplay) {
        if ($scope.projectDecrypt) {
            var locResource = $scope.locsCrypto[locDisplay];
            $location.path('/msgs/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + locDisplay + '/' + $scope.projectResource + '/' + locResource);
        }
        else {
            $location.path('/msgs/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + locDisplay);
        }

    }
    $scope.configure = function() {
        if ($scope.projectDecrypt) {
            $location.path('/job-settings/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + $scope.projectResource);
        }
        else {
            $location.path('/job-settings/' + $scope.projectDisplay + '/' + $scope.jobId);
        }
    }

    $scope.delete = function() {
        if (AlertSvc.confirm('Delete job "' + $scope.jobId + '"?')) {
            ApiSvc.resource.jobDelete({project: $scope.projectResource, job: $scope.jobId}, 
                function() {
                    if ($scope.projectDecrypt) {
                        $location.path('/jobs/' + $scope.projectDisplay + '/' + $scope.projectResource);
                    }
                    else {
                        $location.path('/jobs/' + $scope.projectDisplay);
                    }
                },
                function(res) { 
                    AuthSvc.alertPostRoute(res); 
                }
            )
        }
    }

    $scope.init();
}]);
