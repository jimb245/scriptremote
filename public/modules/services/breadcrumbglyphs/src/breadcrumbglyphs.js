'use strict'

// Directive for including info, config, delete glyphs on breadcrumbs bar

angular.module('breadcrumbGlyphsMod')

.controller('breadcrumbGlyphsCtrl', ['$scope', function($scope) {

    $scope.showHideInfo = function() {
        $scope.bcinfo['visible']  = !$scope.bcinfo['visible'] ;
    }
}])

.directive('breadcrumbGlyphs', function() {
  return {
    controller: 'breadcrumbGlyphsCtrl',
    templateUrl: 'modules/services/breadcrumbglyphs/src/breadcrumbglyphs.html',
    restrict: 'EA',
    scope: {
        bcglyphs: '=',
        bcinfo: '=',
        bcfct: '='
    }
  };
})
.directive('breadcrumbInfo', function() {
  return {
    controller: 'breadcrumbGlyphsCtrl',
    templateUrl: 'modules/services/breadcrumbglyphs/src/breadcrumbinfo.html',
    restrict: 'EA',
    scope: {
        bcinfo: '='
    }
  }
});
