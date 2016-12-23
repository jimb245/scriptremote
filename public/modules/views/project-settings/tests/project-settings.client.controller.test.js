'use strict'

describe('project settings controller tests', function() {

    // Inject the controller's module 
    beforeEach(angular.mock.module('projectSettingsMod'));

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
            'decrypt': function(project, data) {
                return data;
            }
        }
    }));

    describe('ApiSvc successful', function() {

        var $controller;
        var $rootscope;
        var users = [{email:'one@foo.com', access:'write'}, {email:'two@foo.com', access:'write'}, {email:'three@foo.com', access:'write'}];
        var someUser = 'some@foo.com';
        var project = 'someproject';
        var timestamp = 'some timestamp';
        var description = 'some description';
        var newDescription = 'some new description';
        var errMsg = 'some message';

        // Mock ApiSvc calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'authUsers': users,
                            'timestamp': timestamp,
                            'description': description
                        });
                    },
                    'sharePut': function(params, data, success, error) {
                        expect(params).toEqual({'project': project});
                        if (data.action == 'add') {
                            users.push({email: data.email, access: data.access});
                            success({
                                'SR_status':'OK', 
                            });
                        }
                        else if (data.action == 'remove') {
                            var newUsers = [];
                            for (var i = 0; i < users.length; i++) {
                                if (users[i].email == data.email) {
                                    continue;
                                }
                                newUsers.push(users[i]);
                            }
                            users = newUsers;
                            var shared = (users.length > 0);
                            success({
                                'SR_status':'OK', 
                                'shared': shared
                            });
                        }
                    },
                    'projectDescPut': function(params, data, success, error) {
                        expect(params).toEqual({'project': project});
                        description = data.description;
                        success({
                            'SR_status':'OK' 
                        });
                    }
                }
            }
        }));

        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize allowed users list', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('projectSettingsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project}});

            expect($scope.authUsers).toEqual(users);
        });

        it('should be able to change project description', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('projectSettingsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project}});

            // Change description
            $scope.description = newDescription;
            $scope.submitDescription();

            expect(description).toEqual(newDescription);
            expect($scope.description).toEqual(null);
        });

        it('should be able to add authorized user', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('projectSettingsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project}});

            // Add user
            $scope.email = someUser;
            $scope.access = 'read';
            $scope.submitShare();

            expect($scope.authUsers).toEqual(users);
            expect($scope.email).toEqual(null);
        });

        it('should be able to remove authorized user', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('projectSettingsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project}});

            // Add user
            $scope.email = someUser;
            $scope.deleteShare(0);

            // Depends on previous test
            expect($scope.authUsers).toEqual(users);
            expect($scope.email).toEqual(null);
        })
    });
    
    describe('ApiSvc unsuccessful', function() {

        var $controller;
        var $rootscope;
        var users = [{email:'one@foo.com', access:'write'}, {email:'two@foo.com', access:'write'}, {email:'three@foo.com', access:'write'}];
        var someUser = 'some@foo.com';
        var project = 'someproject';
        var timestamp = 'some timestamp';
        var description = 'some description';
        var newDescription = 'some new description';
        var errMsg = 'some message';

        // Mock ApiSvc calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'sharePut': function(params, data, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'projectDescPut': function(params, data, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert on error during initializatoin', inject(function(AlertSvc) {

            spyOn(AlertSvc, 'resAlert');
            var $scope = {};
            var controller = $controller('projectSettingsCtrl', {$scope: $scope, AlertSvc: AlertSvc,
                                  $routeParams: {'projectDisplay': project}});

            expect(AlertSvc.resAlert).toHaveBeenCalled();
            expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }));

        it('should alert on error changing project description', inject(function(AlertSvc) {

            spyOn(AlertSvc, 'resAlert');
            var $scope = {};
            var controller = $controller('projectSettingsCtrl', {$scope: $scope, AlertSvc: AlertSvc,
                                  $routeParams: {'projectDisplay': project}});

            $scope.description = newDescription;
            $scope.submitDescription();

            expect(AlertSvc.resAlert).toHaveBeenCalled();
            expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }));

        it('should alert on error adding authorized user', inject(function(AlertSvc) {

            spyOn(AlertSvc, 'resAlert');
            var $scope = {};
            var controller = $controller('projectSettingsCtrl', {$scope: $scope, AlertSvc: AlertSvc,
                                  $routeParams: {'projectDisplay': project}});

            $scope.email = someUser;
            $scope.access = 'read';
            $scope.submitShare();

            expect(AlertSvc.resAlert).toHaveBeenCalled();
            expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }))
    })
})
