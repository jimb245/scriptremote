'use strict'

describe('alertview directive tests', function() {

    var $compile;
    var $controller;
    var $rootScope;
    var someMsg1 = 'some message 1';
    var someMsg2 = 'some message 2';
    var someMsg3 = 'some message 3';
    var someAlert1 = {'type': 'info', 'msg': someMsg1};
    var someAlert2 = {'type': 'warning', 'msg': someMsg2};
    var someAlert3 = {'type': 'danger', 'msg': someMsg3};
    var someReg1 = new RegExp(someMsg1);
    var someReg2 = new RegExp(someMsg2);
    var someReg3 = new RegExp(someMsg3);

    // Inject the directive module
    beforeEach(module('template/alert/alert.html'));
    beforeEach(module('ui.bootstrap.alert'));

    // Mock AlertSvc with some queued alerts
    beforeEach(module({
        'AlertSvc': {
            'remove': function(index) {
                this.alerts.splice(index, 1);
            },
            'alerts': [someAlert1, someAlert2, someAlert3]
        }
    }));
            
    beforeEach(inject(function(_$compile_, _$rootScope_, _$controller_) {
        $compile = _$compile_;
        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    it('should be able to display alerts queued by AlertSvc', function() {

        var scope = $rootScope.$new();

        // Inject controller
        var controller = $controller('AlertController', {$scope: scope});

        // Compile template
        var element = $compile(angular.element('<div><alert></alert></div>'))(scope);

        scope.$digest();

        // Check messages are in DOM element
        expect(element.html()).toMatch(someReg1);
        expect(element.html()).toMatch(someReg2);
        expect(element.html()).toMatch(someReg3);
    });

    it('should be able to clear alerts', function() {

        var scope = $rootScope.$new();

        // Inject controller
        var controller = $controller('AlertController', {$scope: scope});

        // Compile template
        var element = $compile(angular.element('<div><alert></alert></div>'))(scope);

        scope.$digest();

        expect(element.html()).toMatch(someReg1);
        expect(element.html()).toMatch(someReg2);
        expect(element.html()).toMatch(someReg3);

        // Click all alert dismiss buttons
        var button = element.find('button');
        button.triggerHandler('click');
        scope.$digest();

        expect(element.html()).not.toMatch(someReg1);
        expect(element.html()).not.toMatch(someReg2);
        expect(element.html()).not.toMatch(someReg3);
    })
})
