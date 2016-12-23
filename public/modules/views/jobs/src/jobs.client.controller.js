'use strict';

angular.module('jobsMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/jobs/:projectDisplay/:projectResource?', {
    templateUrl: 'modules/views/jobs/src/jobs.client.view.html',
    controller: 'jobsCtrl'
  });
}])

.controller('jobsCtrl', ['$scope', '$location', '$routeParams', 'ApiSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
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

        ApiSvc.resource.projectGet({project: $scope.projectResource},
            function(data) {
                var name = '"' + $scope.projectDisplay + '"';
                if ($scope.projectDisplay != $scope.projectResource) {
                    name += ' (Encrypted: "' + $scope.projectResource + '")';
                }
                var info = 'Project: ' + name + ' Created: ' + data.timestamp + ' Owner: ' + data.owner;
                var description = data.description;
                if ($scope.projectDecrypt && (description !== '')) {
                    description = CryptoSvc.decrypt($scope.projectResource, data.description);
                }
                $scope.bcinfo = {visible: false, static: info, description: description};
                $scope.bcfct = {configure: $scope.configure, delete: $scope.delete};
                ApiSvc.resource.jobGet({project: $scope.projectResource},
                    function(data) { 
                        var jobs = data.jobs;
                        if ($scope.projectDecrypt) {
                            jobs = [];
                            var errCount = 0;
                            for (var i = 0; i < data.jobs.length; i++) {
                                var job = data.jobs[i];
                                var plain = CryptoSvc.decrypt($scope.projectResource, job.name);
                                if (!plain) {
                                    errCount += 1;
                                    continue;
                                }
                                job.name = plain;
                                jobs.push(job);
                            }
                            if (errCount > 0) {
                                AlertSvc.msgAlert("warning", "Failed to decrypt " + errCount + " jobs with current passphrase");
                            }
                        }
                        $scope.jobs = jobs;
                    },
                    function(res) { AuthSvc.alertPostRoute(res); }
                )
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.select = function(jobId) {
        if ($scope.projectDecrypt) {
            $location.path('/locations/' + $scope.projectDisplay + '/' + jobId + '/' + $scope.projectResource);
        }
        else {
            $location.path('/locations/' + $scope.projectDisplay + '/' + jobId);
        }
    }

    $scope.configure = function() {
        if ($scope.projectDecrypt) {
            $location.path('/project-settings/' + $scope.projectDisplay + '/' + $scope.projectResource);
        }
        else {
            $location.path('/project-settings/' + $scope.projectDisplay);
        }
    }

    $scope.delete = function($event) {
        if ($event) {
            $event.stopPropagation();
        }
        if (AlertSvc.confirm('Delete project "' + $scope.projectDisplay + '"?')) {
            ApiSvc.resource.projectDelete({project: $scope.projectResource}, 
                function() {
                    $location.path('/projects');
                },
                function(res) { 
                    AuthSvc.alertPostRoute(res); 
                }
            )
        }
    }

    $scope.init()
}]);
