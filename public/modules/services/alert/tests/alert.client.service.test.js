'use strict'

describe('alert service tests', function() {

    var alertSvc;
    var errMsg = 'some error msg';
    var okMsg = 'OK';
    var res;

    // Inject the service module
    beforeEach(module('alertMod'));

    // Partial mock of AuthSvc - the rest if handled with spyOn
    beforeEach(function() {
        module(function($provide) {
            $provide.value('AuthSvc', {
                reset: {} 
            });
        })
    });

    // Get serice instance
    beforeEach(inject(function($injector) {
        alertSvc = $injector.get('AlertSvc');
    }));

    it('should detect invalid response from server', inject(function($location) {

        expect(alertSvc.alerts.length).toEqual(0);
        $location.path('/#projects');

        // no res.data
        var res = {status: 400};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'danger', 'msg': 'Server error'}]);

        // Redirects to home
        expect($location.path()).toEqual('/#home');
    }));

    it('should be able to add alerts from response data', inject(function($location) {

        expect(alertSvc.alerts.length).toEqual(0);
        $location.path('/#projects');

        res = {status: 200, data: {'SR_status': okMsg}};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'info', 'msg': okMsg}]);

        res = {status: 400, data: {'SR_status': errMsg}};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'info', 'msg': okMsg}, {'type': 'warning', 'msg': errMsg}]);

        res = {status: 500, data: {'SR_status': errMsg}};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'info', 'msg': okMsg}, {'type': 'warning', 'msg': errMsg}, {'type': 'danger', 'msg': errMsg}]);

        // No location change
        expect($location.path()).toEqual('/#projects');
    }));

    it('should redirect to home for "Not logged in" status', inject(function($location) {

        inject(function($injector) {
            alertSvc = $injector.get('AlertSvc');
        });

        $location.path('/#projects');

        res = {status: 401, data: {'SR_status': 'Not logged in'}};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'warning', 'msg': 'Not logged in'}]);
        expect($location.path()).toEqual('/#home');
    }));

    it('should reset user and redirect to home for "Not logged in" status', inject(function($location, AuthSvc) {

        spyOn(AuthSvc, 'reset');

        inject(function($injector) {
            alertSvc = $injector.get('AlertSvc');
        });

        $location.path('/#projects');

        res = {status: 401, data: {'SR_status': 'Not logged in'}};
        alertSvc.resAlert(res, AuthSvc.reset);

        expect(AuthSvc.reset).toHaveBeenCalled();
        expect(alertSvc.alerts).toEqual([{'type': 'warning', 'msg': 'Not logged in'}]);
        expect($location.path()).toEqual('/#home');
    }));

    it('should be able to remove alerts', function() {

        inject(function($injector) {
            alertSvc = $injector.get('AlertSvc');
        });


        res = {status: 400, data: {'SR_status': errMsg}};
        alertSvc.resAlert(res);

        res = {status: 500, data: {'SR_status': errMsg}};
        alertSvc.resAlert(res);

        expect(alertSvc.alerts).toEqual([{'type': 'warning', 'msg': errMsg}, {'type': 'danger', 'msg': errMsg}]);
        alertSvc.remove(1);
        expect(alertSvc.alerts).toEqual([{'type': 'warning', 'msg': errMsg}]);

        alertSvc.remove(0);
        expect(alertSvc.alerts.length).toEqual(0);
    })
});

