'use strict';

angular.module('homeMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'modules/views/home/src/home.client.view.html',
    controller: 'homeCtrl'
  });
}])

.controller('homeCtrl', [function() {

}]);
