'use strict';

angular.module('headerMod')

.controller('headerCtrl', ['$scope', 'AuthSvc', function($scope, AuthSvc) {

    $scope.currentUser = AuthSvc.data;
    AuthSvc.checkAtStart();
}]);

