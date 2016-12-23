'use strict'

/*
 * Template to insert list of dismissible alerts into DOM.
 * The alert data lives in AlertSvc.
 * Usage: <alert></alert>
 *
 * Derived from:
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 0.12.1 - 2015-02-20
 * License: MIT
 */
angular.module('ui.bootstrap.alert')

.controller('AlertController', ['$scope', 'AlertSvc', function ($scope, AlertSvc) {
    $scope.closeable = true;
    $scope.close = function(index) {
        AlertSvc.remove(index);
    }
    $scope.alerts = AlertSvc.alerts;
}])

.directive('alert', ['AlertSvc', function (AlertSvc) {
    return {
        restrict:'EA',
        controller:'AlertController',
        templateUrl:'template/alert/alert.html',
        transclude:true,
        replace:true,
    };
}])

.directive('dismissOnTimeout', ['$timeout', function($timeout) {
    return {
        require: 'alert',
        link: function(scope, element, attrs, alertCtrl) {
            $timeout(function(){
            alertCtrl.close();
            }, parseInt(attrs.dismissOnTimeout, 10));
        }
    };
}]);

angular.module("template/alert/alert.html").run(["$templateCache", function($templateCache) {
  $templateCache.put("template/alert/alert.html",
    "  <div ng-repeat=\"item in alerts\">\n" +
         
    "    <div class=\"alert\" ng-class=\"['alert-' + (item.type || 'warning'), closeable ? 'alert-dismissable' : null]\" role=\"alert\">\n" +
    "      <button ng-show=\"closeable\" type=\"button\" class=\"close\" ng-click=\"close($index)\">\n" +
    "        <span aria-hidden=\"true\">&times;</span>\n" +
    "        <span class=\"sr-only\">Close</span>\n" +
    "      </button>\n" +
    "      {{item.msg}}\n" +
    "    </div>\n" +
    "  </div>\n" +
    "");
}]);
