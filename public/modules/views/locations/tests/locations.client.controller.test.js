'use strict'

describe('locations controller tests', function() {

    var $controller;
    var $rootscope;
    var project = 'myProject';
    var jobId = ['myJobId'];
    var locations = ['myLoc1', 'myLoc2'];
    var timestamp = 'some timestamp';
    var maxMsgs = '10';
    var description = 'some description';
    var token = 'some token';
    var errMsg = 'some message';

    // Inject the controller's module
    beforeEach(angular.mock.module('locationsMod'));

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
            'decrypt': function(project, data) {
                 return data;
            }
        }
    }));

    describe('ApiSvc successful', function() {

        // Partial mock of AuthSvc - the rest is handled with spyOn
        beforeEach(function() {
            module(function($provide) {
                $provide.value('AuthSvc', {
                    alertPostRoute: {} 
                });
            })
        });

        // Mock ApiSvc called with route params and calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'timestamp': timestamp,
                            'ended': false,
                            'max_msgs': maxMsgs,
                            'token': token,
                            'description': description
                        });
                    },
                    'locationGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'locations': locations
                        });
                    },
                    'jobDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize locations list, job info', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');
            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});

            expect($scope.locations).toEqual(locations);

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            var info = 'Job: ' + '"' + $scope.jobId + '"' + '\nCreated: ' + timestamp;
            info += '\nmax-msgs=' + maxMsgs + '\ntoken=' + token;
            expect($scope.bcinfo.static).toEqual(info);
            expect($scope.bcinfo.description).toEqual(description);
        }));

        it('should be able to select a location', inject(function(
                    $rootScope, $location, AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');
            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});
            $scope.select(locations[1]);
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($location.path()).toEqual('/msgs/' + project + '/' + jobId + '/' + locations[1]);
        }));

        it('should be able to change location to job settings', inject(function(
                    $rootScope, $location) {

            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});
            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.configure();
            $rootScope.$apply();

            expect($location.path()).toEqual('/job-settings/' + project + '/' + jobId);
        }));

        it('should be able to delete job and change location to jobs list', inject(function(
                    $rootScope, $location, AlertSvc) {

            spyOn(AlertSvc, 'confirm').and.callFake(function(msg) {
                return true;
            });

            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});
            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.delete();
            $rootScope.$apply();

            expect(AlertSvc.confirm).toHaveBeenCalled();
            expect($location.path()).toEqual('/jobs/' + project);
        }));
    });

    describe('ApiSvc.resource.jobGet unsuccessful', function() {

        // Partial mock of AuthSvc - the rest if handled with spyOn
        beforeEach(function() {
            module(function($provide) {
                $provide.value('AuthSvc', {
                    alertPostRoute: {} 
                });
            })
        });

        // Mock jobGet calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'jobGet': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'locationGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'locations': locations
                        });
                    },
                    'jobDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert during initialization', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }));

    });

    describe('ApiSvc.resource.locationGet unsuccessful', function() {

        // Partial mock of AuthSvc - the rest if handled with spyOn
        beforeEach(function() {
            module(function($provide) {
                $provide.value('AuthSvc', {
                    alertPostRoute: {} 
                });
            })
        });

        // Mock locationGet calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'timestamp': timestamp,
                            'ended': false,
                            'max_msgs': maxMsgs,
                            'token': token,
                            'description': description
                        })
                    },
                    'locationGet': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                    'jobDelete': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                        });
                    },
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert during initialization', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }));

    });

    describe('ApiSvc.resource.jobDelete unsuccessful', function() {

        // Partial mock of AuthSvc - the rest if handled with spyOn
        beforeEach(function() {
            module(function($provide) {
                $provide.value('AuthSvc', {
                    alertPostRoute: {} 
                });
            })
        });

        // Mock jobDelete calling error callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'jobGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'timestamp': timestamp,
                            'ended': false,
                            'max_msgs': maxMsgs,
                            'token': token,
                            'description': description
                        })
                    },
                    'locationGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId});
                        success({
                            'SR_status':'OK', 
                            'locations': locations
                        });
                    },
                    'jobDelete': function(params, success, error) {
                        var res = {status: 400, data: {'SR_status': errMsg}};
                        error(res);
                    },
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should alert during job delete', inject(function(
                    $rootScope, $location, AlertSvc, AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');
            spyOn(AlertSvc, 'resAlert');
            spyOn(AlertSvc, 'confirm').and.callFake(function(msg) {
                return true;
            });

            var $scope = {};
            var controller = $controller('locationsCtrl', {$scope: $scope,
                                  $routeParams: {'projectDisplay': project, 'jobId': jobId}});

            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.delete();
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute.calls.first().args[0].data.SR_status).toEqual(errMsg);
        }))
    })
})
