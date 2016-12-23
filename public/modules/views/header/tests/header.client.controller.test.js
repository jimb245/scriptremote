'use strict'

describe('header controller/view tests', function() {

    var $controller;
    var $compile;
    var $rootScope;
    var $q;

    var someUserEmail = 'someone@foo.com';
    var someReg = new RegExp(someUserEmail);
    var viewHtml;

    // Load views into cache
    beforeEach(module('foo'));

    // Inject the controller's module
    beforeEach(module('headerMod'));

    describe('User authenticated', function() {

        // Mock of AuthSvc
        beforeEach(function() {
            module(function($provide) {
                $provide.service('AuthSvc', function () {
                    var service = {};
                    service.data = {email: '', loggedIn: false, admin: false};
                    service.checkAtStart = function () { 
                        service.data = {email: someUserEmail, loggedIn: true, admin: false} 
                    }
                    return service;
                })
            })
        });

        beforeEach(inject(function(_$rootScope_, _$controller_, _$compile_, _$q_) {
            $rootScope = _$rootScope_;
            $rootScope.isOn = false;
            $controller = _$controller_;
            $compile = _$compile_;
            $q = _$q_;
        }));

        beforeEach(inject(function($templateCache) {
            viewHtml = $templateCache.get('public/modules/views/header/src/header.client.view.html');
        }));

        it('should be able to set current user on startup', inject(function(AuthSvc) {

            var $scope = $rootScope.$new();
            var controller = $controller('headerCtrl', {$scope: $scope, AuthSvc: AuthSvc});
            $rootScope.$apply();

            // Compile the view
            var preElement = angular.element('<div>' + viewHtml + '</div>');
            var element = $compile(preElement)($scope);

            $rootScope.$apply();

            expect(element.find('p').html()).toMatch(someReg);
            expect(element.html()).toMatch('Logout');
            expect(element.html()).toMatch('href="/logout"');

        }))
    });

    describe('User not authenticated', function() {

        // Mock of AuthSvc
        beforeEach(function() {
            module(function($provide) {
                $provide.service('AuthSvc', function () {
                    var service = {};
                    service.data = {email: '', loggedIn: false, admin: false};
                    service.checkAtStart = function () { 
                    }
                    return service;
                })
            })
        });

        beforeEach(inject(function(_$rootScope_, _$controller_, _$compile_, _$q_) {
            $rootScope = _$rootScope_;
            $rootScope.isOn = false;
            $controller = _$controller_;
            $compile = _$compile_;
            $q = _$q_;
        }));

        beforeEach(inject(function($templateCache) {
            viewHtml = $templateCache.get('public/modules/views/header/src/header.client.view.html');
        }));

        it('should prompt for login on startup', inject(function(AuthSvc) {

            var $scope = $rootScope.$new();
            var controller = $controller('headerCtrl', {$scope: $scope, AuthSvc: AuthSvc});

            // Compile the view
            var preElement = angular.element('<div>' + viewHtml + '</div>');
            var element = $compile(preElement)($scope);

            $rootScope.$apply();

            expect(element.html()).toMatch('Login');
            expect(element.html()).toMatch('href="/login"');
        }))
    });
})
