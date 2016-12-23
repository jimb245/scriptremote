'use strict'

describe('projects controller decryption tests', function() {

    // Inject the controller's module 
    beforeEach(angular.mock.module('projectsMod'));

    var $controller;
    var $rootscope;
    var errMsg = 'some message';

    // Partial mock of AuthSvc - the rest is handled with spyOn
    beforeEach(function() {
        module(function($provide) {
            $provide.value('AuthSvc', {
                alertPostRoute: {} 
            });
        })
    });

    describe('decryption successful', function() {

        var myProjects = [['MyProject1', true], ['MyProject2', true]];
        var yourProjects = [{project: 'YourProject1', email: 'YourEmail', encrypted: true}, {project: 'YourProject2', email: 'YourEmail', encrypted: true}];
        var allProjects = [
            {display: 'MyProject1', resource: 'MyProject1', decrypted: true},
            {display: 'MyProject2', resource: 'MyProject2', decrypted: true},
            {display: 'YourProject1~YourEmail', resource: 'YourProject1~YourEmail', decrypted: true},
            {display: 'YourProject2~YourEmail', resource: 'YourProject2~YourEmail', decrypted: true}
        ];

        // Mock ApiSvc calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'projects': myProjects
                        });
                    }
                }
            }
        }));
        
        // Mock SettingsSvc calling sucess callback
        beforeEach(angular.mock.module({
            'SettingsSvc': { 
                'fromShares': {
                    'get': function(success, error) {
                        success({
                            'sr_status':'ok', 
                            'shares': yourProjects
                        });
                    }
                }
            }
        }));

        // Mock CryptoSvc
        beforeEach(angular.mock.module({
            'CryptoSvc': { 
                'isEncrypted': function() {
                    return true;
                },
                'decrypt': function(project, data) {
                    return data;
                }
            }
        }));

        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize projects list', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};

            // Inject controller
            var controller = $controller('projectsCtrl', {$scope: $scope});

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();

            // Controller init function should have initialized projects list
            expect($scope.projects).toEqual(allProjects);
        }));

        it('should be able to select a project', inject(function(
                    $rootScope, $location, AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('projectsCtrl', {$scope: $scope});
            var proj = $scope.projects[1];
            $scope.select(proj);
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($location.path()).toEqual('/jobs/' + proj.display + '/' + proj.resource);
        }))
    });

    describe('Decryption unsuccessful', function() {

        var myProjects = [['MyProject1', false], ['MyProject2', false]];
        var yourProjects = [{project: 'YourProject1', email: 'YourEmail', encrypted: true}, {project: 'YourProject2', email: 'YourEmail', encrypted: true}];
        var allProjects = [
            {display: 'MyProject1', resource: 'MyProject1', decrypted: false},
            {display: 'MyProject2', resource: 'MyProject2', decrypted: false},
            {display: 'YourProject1~YourEmail', resource: 'YourProject1~YourEmail', decrypted: false},
            {display: 'YourProject2~YourEmail', resource: 'YourProject2~YourEmail', decrypted: false}
        ];

        // Mock ApiSvc calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'projects': myProjects
                        });
                    }
                }
            }
        }));
        
        // Mock SettingsSvc calling sucess callback
        beforeEach(angular.mock.module({
            'SettingsSvc': { 
                'fromShares': {
                    'get': function(success, error) {
                        success({
                            'sr_status':'ok', 
                            'shares': yourProjects
                        });
                    }
                }
            }
        }));

        // Mock CryptoSvc
        beforeEach(angular.mock.module({
            'CryptoSvc': { 
                'isEncrypted': function() {
                    return true;
                },
                'decrypt': function(project, data) {
                    return null;
                }
            }
        }));

        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize projects list', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('projectsCtrl', {$scope: $scope});

            // Controller init function should have initialized projects list
            expect($scope.projects).toEqual(allProjects);
        });

        it('should be able to select a project', inject(function(
                    $rootScope, $location) {

            var $scope = {};
            var controller = $controller('projectsCtrl', {$scope: $scope});
            var proj = $scope.projects[1];
            $scope.select(proj);
            $rootScope.$apply();

            expect($location.path()).toEqual('/jobs/' + proj.display);
        }))
    })
})
