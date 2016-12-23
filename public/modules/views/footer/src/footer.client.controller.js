'use strict';

angular.module('footerMod')

.controller('footerCtrl', ['$scope', '$window', function($scope, $window) {

   $scope.version = $window.appVersion;

}]);

