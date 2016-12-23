'use strict'

describe('auth service tests', function() {

    var authSvc;
    var someEmail = 'xyz@foo.com';

    // Inject the service module
    beforeEach(module('authMod'));

    // Need mocks that can return promises.
    // Create initial mocks module here before injector
    // and then use spy's to complete them.
    beforeEach(function() {
        module(function($provide) {
            $provide.value('$http', {
                get: {}
            });
            $provide.value('AlertSvc', {
                msgAlert: {}
            })
        })
    });

    beforeEach(inject(function(AlertSvc, $q) {
        spyOn(AlertSvc, 'msgAlert').and.callFake(function() {
            var deferred = $q.defer();
            deferred.resolve({email: someEmail, admin: false});
            return deferred.promise;
        });
    }));

    describe('User is authenticated', function() {

        beforeEach(inject(function($http, $q) {
            spyOn($http, 'get').and.callFake(function(url) {
                var deferred = $q.defer();
                var res = {'status': 200, 'data': {user: someEmail, admin: false}};
                deferred.resolve(res);
                return deferred.promise;
            });
        }));

        // Get service instance
        beforeEach(inject(function($injector) {
            authSvc = $injector.get('AuthSvc');
        }));


        it('should confirm user is authenticated at startup', inject(function($location, $rootScope, AlertSvc) {

            authSvc.checkAtStart()
            .then(function(user) {
                    expect(user.email).toEqual(someEmail);
                    expect(authSvc.email()).toEqual(someEmail);
                    expect(authSvc.authenticated()).toEqual(true);
                    expect(authSvc.admin()).toEqual(false);
                    expect(AlertSvc.msgAlert.calls.count()).toEqual(0);
                },
                function() {
                    expect('promise result').toEqual('resolved');
                }
            );
            $rootScope.$digest();
        }));

        it('should confirm user is authenticated at view change', inject(function($location, $rootScope, AlertSvc) {

            // Depends on previous test
            authSvc.checkAtRoute()
            .then(function(user) {
                    expect(user).not.toBeDefined();
                    expect(authSvc.email()).toEqual(someEmail);
                    expect(authSvc.authenticated()).toEqual(true);
                    expect(authSvc.admin()).toEqual(false);
                    expect(AlertSvc.msgAlert.calls.count()).toEqual(0);
                },
                function() {
                    expect('promise result').toEqual('resolved');
                }
            );
            $rootScope.$digest();
        }))
    });

    describe('User not authenticated', function() {

        beforeEach(inject(function($http, $q) {
            spyOn($http, 'get').and.callFake(function(url) {
                var deferred = $q.defer();
                var res = {'status': 401, 'SR_status': 'Not logged in'};
                deferred.resolve(res);
                return deferred.promise;
            });
        }));

        // Get service instance
        beforeEach(inject(function($injector) {
            authSvc = $injector.get('AuthSvc');
        }));

        it('should confirm user is not authenticated at startup', inject(function($location, $rootScope, AlertSvc) {

            authSvc.checkAtStart()
            .then(function(user) {
                    expect(user).toBeNull();
                },
                function() {
                    // checkAtStart always resolves
                    expect('promise result').toEqual('resolved');
                }
            );
            $rootScope.$digest();
        }));

        it('should confirm user is not authenticated at view change', inject(function($location, $rootScope, AlertSvc) {

            authSvc.checkAtRoute()
            .then(function() {
                    expect('promise result').toEqual('rejected');
                },
                function() {
                    expect(AlertSvc.msgAlert.calls.count()).toEqual(1);
                    expect($location.path()).toEqual('/#home');
                }
            );
            $rootScope.$digest();
        }))
    });

    describe('$http rejects', function() {

        beforeEach(inject(function($http, $q) {
            spyOn($http, 'get').and.callFake(function(url) {
                var deferred = $q.defer();
                var res = {'status': 500, 'SR_status': 'Server error'};
                deferred.reject(res);
                return deferred.promise;
            });
        }));

        // Get service instance
        beforeEach(inject(function($injector) {
            authSvc = $injector.get('AuthSvc');
        }));

        it('should confirm user is not authenticated at startup', inject(function($location, $rootScope, AlertSvc) {

            authSvc.checkAtStart()
            .then(function(user) {
                    expect(user).toBeNull();
                },
                function() {
                    // checkAtStart always resolves
                    expect('promise result').toEqual('resolved');
                }
            );
            $rootScope.$digest();
        }));

        it('should confirm user is not authenticated at view change', inject(function($location, $rootScope, AlertSvc) {

            authSvc.checkAtRoute()
            .then(function() {
                    expect('promise result').toEqual('rejected');
                },
                function() {
                    expect(AlertSvc.msgAlert.calls.count()).toEqual(1);
                    expect($location.path()).toEqual('/#home');
                }
            );
            $rootScope.$digest();
        }))
    })
});
