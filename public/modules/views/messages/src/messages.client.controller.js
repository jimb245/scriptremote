'use strict';

angular.module('msgsMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/msgs/:projectDisplay/:jobId/:locationDisplay/:projectResource?/:locationResource?', {
    templateUrl: 'modules/views/messages/src/messages.client.view.html',
    controller: 'msgsCtrl'
  });
}])

.controller('msgsCtrl', ['$scope', '$location', '$routeParams', 'ApiSvc',  'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $location, $routeParams, ApiSvc, AlertSvc, AuthSvc, CryptoSvc) {

    $scope.init = function() {
        $scope.projectDisplay = $routeParams.projectDisplay;
        // For encryption extra routing parameters pass the resource info needed for direct link
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

        ApiSvc.resource.locationGet({project: $scope.projectResource, job: $scope.jobId, location: $scope.locationResource},
            function(data) {
                var info = 'Location: ' + '"' + $scope.locationDisplay + '"' + '\nCreated: ' + data.timestamp + '\nmsg-cnt=' + data.msgcnt;
                var description = data.description;
                if ($scope.projectDecrypt) {
                    description = CryptoSvc.decrypt($scope.projectResource, data.description);
                }
                $scope.bcinfo = {visible: false, static: info, description: description};
                $scope.bcfct = {configure: $scope.configure};
                ApiSvc.resource.msgGet({project: $scope.projectResource, job: $scope.jobId, location: $scope.locationResource},
                    function(data) { $scope.msgs = data.messages; },
                    function(res) { AuthSvc.alertPostRoute(res); }
                )
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.select = function(msgId) {
        if ($scope.projectDecrypt) {
            $location.path('/content/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + $scope.locationDisplay + '/' + msgId + '/' + $scope.projectResource + '/' + $scope.locationResource);
        }
        else {
            $location.path('/content/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + $scope.locationDisplay + '/' + msgId);
        }
    }

    $scope.configure = function() {
        if ($scope.projectDecrypt) {
            $location.path('/templates-select/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + $scope.locationDisplay + '/' + $scope.projectResource + '/' + $scope.locationResource);
        }
        else {
            $location.path('/templates-select/' + $scope.projectDisplay + '/' + $scope.jobId + '/' + $scope.locationDisplay);
        }
    }

    $scope.init();

}]);
