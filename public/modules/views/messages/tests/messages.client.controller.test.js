'use strict'

describe('messages controller tests', function() {

    var $controller;
    var $rootscope;
    var project = 'myProject';
    var jobId = 'myJobId';
    var loc = 'myLoc';
    var msgIds = ['myMsg1', 'myMsg2'];
    var timestamp = 'some timestamp';
    var description = 'some description';
    var msgCnt = 1;

    // Inject the controller's module
    beforeEach(angular.mock.module('msgsMod'));

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
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

        // Mock ApiSvc called with route params and calling success callback
        beforeEach(angular.mock.module({
            'ApiSvc': { 
                'resource': {
                    'locationGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId, 'location': loc});
                        success({
                            'SR_status':'OK', 
                            'timestamp': timestamp,
                            'msgcnt': msgCnt,
                            'description': description
                        });
                    },
                    'msgGet': function(params, success, error) {
                        expect(params).toEqual({'project': project, 'job': jobId, 'location': loc});
                        success({
                            'SR_status':'OK', 
                            'messages': msgIds
                        });
                    }
                }
            }
        }));
        
        beforeEach(angular.mock.inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize messages list, location info', inject(function(AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('msgsCtrl', {$scope: $scope,
                        $routeParams: {'projectDisplay': project, 'jobId': jobId, 'locationDisplay': loc}});

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($scope.msgs).toEqual(msgIds);

            var info = 'Location: ' + '"' + $scope.locationDisplay + '"' + '\nCreated: ' + timestamp + '\nmsg-cnt=' + msgCnt;
            expect($scope.bcinfo.static).toEqual(info);
            expect($scope.bcinfo.description).toEqual(description);
        }));

        it('should be able to select a message', inject(function(
                    $rootScope, $location, AuthSvc) {

            spyOn(AuthSvc, 'alertPostRoute');

            var $scope = {};
            var controller = $controller('msgsCtrl', {$scope: $scope,
                        $routeParams: {'projectDisplay': project, 'jobId': jobId, 'locationDisplay': loc}});
            $scope.select(msgIds[1]);
            $rootScope.$apply();

            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();
            expect($location.path()).toEqual('/content/' + project + '/' + jobId + '/' + loc + '/' + msgIds[1]);
        }));

        it('should be able to change location to template settings', inject(function(
                    $rootScope, $location) {

            var $scope = {};
            var controller = $controller('msgsCtrl', {$scope: $scope,
                        $routeParams: {'projectDisplay': project, 'jobId': jobId, 'locationDisplay': loc}});

            // Simulates clicking glyph on breadcrumbs bar
            $scope.bcfct.configure();
            $rootScope.$apply();

            expect($location.path()).toEqual('/templates-select/' + project + '/' + jobId + '/' + loc);
        }));

    })
})
