'use strict'

describe('breadcrumb-glyphs directive tests', function() {

    var $compile;
    var $controller;
    var $rootScope;
    var info = 'some info';
    var description = 'some description';
    var hideReg = new RegExp('ng-hide');
    var infoReg = new RegExp(info);

    // Inject the directive module
    beforeEach(module('breadcrumbGlyphsMod'));

    // Load templates into cache
    beforeEach(module('foo'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$controller_) {
        $compile = _$compile_;
        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    // The templates have been loaded into cache but the paths
    // need to be adjusted to match templateUrl's
    beforeEach(inject(function($templateCache) {
        var tmpl1 = $templateCache.get('public/modules/services/breadcrumbglyphs/src/breadcrumbglyphs.html');
        var tmpl2 = $templateCache.get('public/modules/services/breadcrumbglyphs/src/breadcrumbinfo.html');
        $templateCache.put('modules/services/breadcrumbglyphs/src/breadcrumbglyphs.html', tmpl1);
        $templateCache.put('modules/services/breadcrumbglyphs/src/breadcrumbinfo.html', tmpl2);
    }));

    it('should be possible to select info, setup, or delete actions by clicking on the corresponding glyph', function() {

        var scope = $rootScope.$new();

        // Inject controller
        var controller = $controller('breadcrumbGlyphsCtrl', {$scope: scope});

        // Mock the functions for the setup and delete glyphs. Only
        // calls to them are checked here - their effects are checked
        // in view controller tests.
        var bcFct = {configure: function() {}, delete: function() {}};
        spyOn(bcFct, 'configure');
        spyOn(bcFct, 'delete');

        // Compile templates
        scope.bcinfo = {visible: false, static: info, description: description};
        scope.bcfct = {configure: bcFct.configure, delete: bcFct.delete};

        var elementGlyphs = $compile(angular.element('<span breadcrumb-glyphs  bcglyphs="{useinfo: true, useconfig: true, usedelete: true}" bcinfo="bcinfo" bcfct="bcfct"></span>'))(scope);
        scope.$apply();

        var elementInfo = $compile(angular.element('<breadcrumb-info bcinfo="bcinfo"></breadcrumb-info>'))(scope);
        scope.$apply();

        // Check before any glyphs are clicked
        expect(bcFct.configure).not.toHaveBeenCalled();
        expect(bcFct.delete).not.toHaveBeenCalled();
        expect(elementInfo.html()).toMatch(hideReg);

        // Click all
        var glyphs = elementGlyphs.find('span');
        glyphs.triggerHandler('click');
        scope.$digest();

        // Check that setup and delete have been called,
        // and that info is displayed
        expect(bcFct.configure).toHaveBeenCalled();
        expect(bcFct.delete).toHaveBeenCalled();
        expect(elementInfo.html()).not.toMatch(hideReg);
    })
})
