'use strict';

/*
* This view displays the data/files of a message
*/

angular.module('contentMod')

.directive('dynamic', function($compile) {
    // Directive to compile a dynamic template
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, elem, attrs) {
          scope.$watch(attrs.dynamic, function(html) {
            elem.html(html);
            $compile(elem.contents())(scope);
          });
        }
    }
});


