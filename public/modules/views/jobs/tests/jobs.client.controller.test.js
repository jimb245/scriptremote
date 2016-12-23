'use strict'

describe('jobs controller tests', function() {

    var $controller;
    var $rootscope;
    var project = 'myProject';
    var jobIds = ['myJobId1', 'myJobId2'];
    var description = 'some description';
    var timestamp = 'some timestamp';
    var errMsg = 'some message';
    var email = 'someone@foo.com';

    // Inject the controller's module
    beforeEach(angular.mock.module('jobsMod'));

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
            'decrypt': function(project, data) {
                 return data;
            }
        }
    }));

    // Partial mock of AuthSvc - the rest is handled with spyOn
    beforeEach(function() {
        module(function($provide) {
            $provide.value('AuthSvc', {
                alertPostRoute: {} 
            });
        })
    });

    describe('ApiSvc successful', function() {

        // Mock ApiSvc called with route param and calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'description': description,
                            'timestamp': timestamp,
                            'owner': email
                        });
                    },
                    'projectDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'jobs': jobIds
                        });
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize jobs list, project info/description', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                            $routeParams: {'projectDisplay': project}});

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($scope.jobs).toEqual(jobIds);

            var info = 'Project: ' + '"' + $scope.projectDisplay + '"' + ' Created: ' + timestamp + ' Owner: ' + email;
            expect($scope.bcinfo.static).toEqual(info);
            expect($scope.bcinfo.description).toEqual(description);
        }));

        it('should be able to select a job', inject(function(
                    $rootScope, $location, AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                            $routeParams: {'projectDisplay': project}});
            $scope.select(jobIds[1]);
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($location.path()).toEqual('/locations/' + project + '/' + jobIds[1]);
        }));

        it('should be able to change location to project settings', inject(function(
                    $rootScope, $location) {

            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                            $routeParams: {'projectDisplay': project}});
            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.configure();
            $rootScope.$apply();

            expect($location.path()).toEqual('/project-settings/' + project);
        }));

        it('should be able to delete project and change location to project list', inject(function(
                    $rootScope, $location, AlertSvc) {

            spyOn(AlertSvc, 'confirm').and.callFake(function(msg) {
                return true;
            });
            
            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                        $routeParams: {'projectDisplay': project}});
            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.delete();
            $rootScope.$apply();

            expect(AlertSvc.confirm).toHaveBeenCalled();
            expect($location.path()).toEqual('/projects');
        }))
    });

    describe('ApiSvc.projectGet unsuccessful', function() {

        // Mock ApiSvc.projectGet calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'projectDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'jobs': jobIds
                        });
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert on initializatin', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                            $routeParams: {'projectDisplay': project}});

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }))
    });

    describe('ApiSvc.jobGet unsuccessful', function() {

        // Mock ApiSvc.jobGet calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'description': description,
                            'timestamp': timestamp
                        })
                    },
                    'projectDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                    'jobGet': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert on initializatin', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                            $routeParams: {'projectDisplay': project}});

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }))
    });

    describe('ApiSvc.projectDelete unsuccessful', function() {

        // Mock ApiSvc.projectDelete calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'projectGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'description': description,
                            'timestamp': timestamp
                        })
                    },
                    'projectDelete': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project});
                        success({
                            'SR_status':'OK', 
                            'jobs': jobIds
                        })
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert on project delete', inject(function(
                    $rootScope, $location, AuthSvc, AlertSvc) {

            spyOn(AuthSvc, 'alertPostRoute');
            spyOn(AlertSvc, 'resAlert');
            spyOn(AlertSvc, 'confirm').and.callFake(function(msg) {
                return true;
            });
            
            var $scope = {};
            var controller = $controller('jobsCtrl', {$scope: $scope,
                                        $routeParams: {'projectDisplay': project}});
            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.delete();
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }));
    })
})
