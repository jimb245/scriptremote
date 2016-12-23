'use strict'

describe('projects controller tests', function() {

    // Inject the controller's module 
    beforeEach(angular.mock.module('projectsMod'));

    var $controller;
    var $rootscope;
    var myProjects = [['MyProject1', true], ['MyProject2', true]];
    var yourProjects = [{project: 'YourProject1', email: 'YourEmail', encrypted: true}, {project: 'YourProject2', email: 'YourEmail', encrypted: true}];
    var allProjects = [
        {display: 'MyProject1', resource: 'MyProject1', decrypted: false},
        {display: 'MyProject2', resource: 'MyProject2', decrypted: false},
        {display: 'YourProject1~YourEmail', resource: 'YourProject1~YourEmail', decrypted: false},
        {display: 'YourProject2~YourEmail', resource: 'YourProject2~YourEmail', decrypted: false}
    ];
    var errMsg = 'some message';

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
            'isEncrypted': function() {
                return false;
            },
            'decrypt': function(project, data) {
                return data;
            }
        }
    }));

    // Partial mock of AuthSvc - the rest if handled with spyOn
    beforeEach(function() {
        module(function($provide) {
            $provide.value('AuthSvc', {
                alertPostRoute: {} 
            });
        })
    });

    describe('ApiSvc successful', function() {

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
        
        describe('SettingsSvc successful', function() {

            // Mock SettingsSvc calling sucess callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': yourProjects
                            });
                        }
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

                // Controller init function should have initialized projects list

                expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
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
                expect($location.path()).toEqual('/jobs/' + proj.display);
            }))
        });

        describe('SettingsSvc unsuccessful', function() {

            // Mock SettingsSvc calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'fromShares': {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during initialization', inject(function(AuthSvc) {

                spyOn(AuthSvc, 'alertPostRoute');
                var $scope = {};
                var controller = $controller('projectsCtrl', {$scope: $scope, AuthSvc: AuthSvc});

                expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
                expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }));

        })
    });

    describe('ApiSvc unsuccessful', function() {

        // Mock ApiSvc calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    }
                }
            }
        }));
        
        describe('SettingsSvc successful', function() {

            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'projects': yourProjects
                            });
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during initialization', inject(function(AuthSvc) {

                spyOn(AuthSvc, 'alertPostRoute');
                var $scope = {};
                var controller = $controller('projectsCtrl', {$scope: $scope, AuthSvc: AuthSvc});
                expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
                expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        })
    })
})
