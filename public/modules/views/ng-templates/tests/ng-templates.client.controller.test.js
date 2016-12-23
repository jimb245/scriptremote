'use strict'

describe('ng-templates controller tests', function() {

    var $controller;
    var $q;

    // Inject the controller's module
    beforeEach(module('templatesAddMod'));

    // Mock CryptoSvc
    beforeEach(angular.mock.module({
        'CryptoSvc': { 
            'encrypt': function(project, data) {
                 return data;
            },
            'decrypt': function(project, data) {
                 return data;
            },
            'toBase64': function(data) {
                 return data;
            },
            'hmac': function(data) {
                 return data;
            },
            'isEncrypted': function() {
                return false;
            }
        }
    }));
    describe('TmplSvc successful', function() {

        var defaultTmplKeys = ['defaultContentKey', 'defaultReplyKey'];
        var tmplSource = ['default content source', 'default reply source'];
        var tmplKeys = defaultTmplKeys;
        var tmplEncrypted = [false, false];
        var newTmplKey = 'newkey';
        var newSource = 'some new source';
        var fileObj = 'dummyFileObject';

        // Need TmplSvc mock that can return promises.
        // Create initial mock here before injector and
        // the rest is handled with spy's
        beforeEach(function() {
            module(function($provide) {
                $provide.value('TmplSvc', {
                    listTmpl: {}, 
                    userDefaults: {},
                    fileUpload: {},
                    fileDownload: {},
                    deleteTmpl: {},
                    isEncrypted: {}
                });
            })
        });

        beforeEach(inject(function(_$controller_, _$q_) {
            $controller = _$controller_;
            $q = _$q_;
        }));

        beforeEach(inject(function(TmplSvc) {
            spyOn(TmplSvc, 'listTmpl').and.callFake(function() {
                return {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'file_keys': tmplKeys,
                            'encrypted': tmplEncrypted
                        })
                    }
                }
            });
            spyOn(TmplSvc, 'userDefaults').and.callFake(function() {
                return {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'defaults': defaultTmplKeys
                        })
                    },
                    'save': function(data, success, error) {
                        defaultTmplKeys = data.defaults;
                        success({
                            'SR_status':'OK', 
                        })
                    }
                }
            });
            spyOn(TmplSvc, 'fileUpload').and.callFake(function(key, file, encrypted) {
                tmplKeys.push(key);
                tmplEncrypted.push(encrypted);
                tmplSource.push(newSource);
                var deferred = $q.defer();
                var res = {'status': 200};
                deferred.resolve(res);
                return deferred.promise;
            });
            spyOn(TmplSvc, 'fileDownload').and.callFake(function(key) {
                var deferred = $q.defer();
                var idx;
                for (idx = 0; idx < tmplKeys.length; idx++) {
                    if (key == tmplKeys[idx]) {
                        break;
                    }
                }
                var res = {'status': 200, 'data': tmplSource[idx]};
                deferred.resolve(res);
                return deferred.promise;
            });
            spyOn(TmplSvc, 'deleteTmpl').and.callFake(function(key) {
                return {
                    'delete': function(success, error) {
                        var idx;
                        for (idx = 0; idx < tmplKeys.length; idx++) {
                            if (key == tmplKeys[idx]) {
                                break;
                            }
                        }
                        tmplKeys.splice(idx, 1);
                        tmplSource.splice(idx, 1);
                        success({'SR_status':'OK'});
                    }
                }
            });
            spyOn(TmplSvc, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                var deferred = $q.defer();
                var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                deferred.resolve(res);
                return deferred.promise;
            });
        }));

        it('should be able to initialize template list and defaults', inject(function($rootScope) {

            var $scope = {};
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            $rootScope.$apply();

            expect($scope.templates).toEqual([{'name': tmplKeys[0]}, {'name': tmplKeys[1]}]);
            expect($scope.visible).toEqual([false, false]);
            expect($scope.defaultTemplates).toEqual($scope.templates);

        }));

        it('should be able to show and hide template file contents', inject(function($rootScope) {

            var $scope = {};
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            // Show first template
            $scope.show(0);
            $rootScope.$apply();

            expect($scope.templates[0].content).toEqual(tmplSource[0]);
            expect($scope.visible[0]).toEqual(true);

            // Hide first template
            $scope.hide(0);

            expect($scope.templates[0].content).toEqual(tmplSource[0]);
            expect($scope.visible[0]).toEqual(false);
        }));

        it('should be able to upload new template file', inject(function($compile, $rootScope) {

            var $scope = $rootScope.$new();
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            // fileObj is a dummy File - it seems not possible to unit test
            // with the fileModel directive that creates the File object in 
            // actual operation.
            $scope.file = fileObj;
            $scope.key = newTmplKey;
        
            $scope.upload();
            $rootScope.$apply();

            expect($scope.templates).toEqual([{'name': tmplKeys[0]}, {'name': tmplKeys[1]}, {'name': newTmplKey}]);
            expect($scope.visible).toEqual([false, false, false]);

        }));

        it('should alert on duplicate new template name', inject(function(AlertSvc, $rootScope) {

            spyOn(AlertSvc, 'msgAlert');

            var $scope = $rootScope.$new();
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            // Depends on previous test
            $scope.file = fileObj;
            $scope.key = newTmplKey;
        
            $scope.upload();
            $rootScope.$apply();

            expect(AlertSvc.msgAlert).toHaveBeenCalled();
            expect(AlertSvc.msgAlert.calls.first().args[0]).toEqual('warning');

        }));

        it('should be able to save default template selection', inject(function($compile, $rootScope) {

            // Depends on previous test

            var $scope = $rootScope.$new();
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            expect($scope.templates).toEqual([{'name': tmplKeys[0]}, {'name': tmplKeys[1]}, {'name': newTmplKey}]);

            $scope.defaultTemplates =[{'name': tmplKeys[1]}, {'name': tmplKeys[2]}];
            $scope.save();

            expect(defaultTmplKeys).toEqual([tmplKeys[1], tmplKeys[2]]);
            expect($scope.defaultTemplates).toEqual([{'name': tmplKeys[1]}, {'name': tmplKeys[2]}]);
        }));

        it('should be able to delete a template file', inject(function($compile, $rootScope) {

            // Depends on previous test

            var $scope = $rootScope.$new();
            var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

            expect($scope.templates).toEqual([{'name': tmplKeys[0]}, {'name': tmplKeys[1]}, {'name': newTmplKey}]);
            $scope.delete(2);

            expect($scope.templates).toEqual([{'name': tmplKeys[0]}, {'name': tmplKeys[1]}]);
            expect($scope.visible).toEqual([false, false]);

        }));
    });

    describe('TmplSvc unsuccessful', function() {

        var defaultTmplKeys = ['defaultContentKey', 'defaultReplyKey'];
        var tmplSource = ['default content source', 'default reply source'];
        var tmplKeys = defaultTmplKeys;
        var tmplEncrypted = [false, false];
        var newTmplKey = 'newkey';
        var newSource = 'some new source';
        var fileObj = 'dummyFileObject';
        var errMsg = 'some message';

        describe('TmplSvc.listTmpl error', function() {

            // Partial mock of TmplSvc - the rest is handled with spyOn
            beforeEach(function() {
                module(function($provide) {
                    $provide.value('TmplSvc', {
                        listTmpl: {}, 
                        userDefaults: {},
                        fileUpload: {},
                        fileDownload: {},
                        deleteTmpl: {},
                        isEncrypted: {}
                    });
                })
            });

            beforeEach(inject(function(_$controller_, _$q_) {
                $controller = _$controller_;
                $q = _$q_;
            }));

            beforeEach(inject(function(TmplSvc) {
                spyOn(TmplSvc, 'listTmpl').and.callFake(function() {
                    return {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                })
            }));

            it('should alert on initializaton', inject(function(AlertSvc, $rootScope) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }));
        });


        describe('TmplSvc.userDefaults error', function() {

            // Partial mock of TmplSvc - the rest is handled with spyOn
            beforeEach(function() {
                module(function($provide) {
                    $provide.value('TmplSvc', {
                        listTmpl: {}, 
                        userDefaults: {},
                        fileUpload: {},
                        fileDownload: {},
                        deleteTmpl: {},
                        isEncrypted: {}
                    });
                })
            });

            beforeEach(inject(function(_$controller_, _$q_) {
                $controller = _$controller_;
                $q = _$q_;
            }));

            beforeEach(inject(function(TmplSvc) {
                spyOn(TmplSvc, 'listTmpl').and.callFake(function() {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'file_keys': tmplKeys,
                                'encrypted': tmplEncrypted
                            })
                        }
                    }
                });
                spyOn(TmplSvc, 'userDefaults').and.callFake(function() {
                    return {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        },
                        'save': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                })
            }));

            it('should alert on initializaton', inject(function(AlertSvc, $rootScope) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('TmplSvc... error', function() {

            // Partial mock of TmplSvc - the rest is handled with spyOn
            beforeEach(function() {
                module(function($provide) {
                    $provide.value('TmplSvc', {
                        listTmpl: {}, 
                        userDefaults: {},
                        fileUpload: {},
                        fileDownload: {},
                        deleteTmpl: {},
                        isEncrypted: {}
                    });
                })
            });

            beforeEach(inject(function(_$controller_, _$q_) {
                $controller = _$controller_;
                $q = _$q_;
            }));

            beforeEach(inject(function(TmplSvc) {
                spyOn(TmplSvc, 'listTmpl').and.callFake(function() {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'file_keys': tmplKeys,
                                'encrypted': tmplEncrypted
                            })
                        }
                    }
                });
                spyOn(TmplSvc, 'userDefaults').and.callFake(function() {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'defaults': defaultTmplKeys
                            })
                        },
                        'save': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                });
                spyOn(TmplSvc, 'fileUpload').and.callFake(function(key, file) {
                    var deferred = $q.defer();
                    var res = {status: 400, data: {'SR_status': errMsg}};
                    deferred.reject(res);
                    return deferred.promise;
                });
                spyOn(TmplSvc, 'fileDownload').and.callFake(function(key) {
                    var deferred = $q.defer();
                    var res = {status: 400, data: {'SR_status': errMsg}};
                    deferred.reject(res);
                    return deferred.promise;
                });
                spyOn(TmplSvc, 'deleteTmpl').and.callFake(function(key) {
                    return {
                        'delete': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                })
            }));

            it('should alert while showing template source', inject(function(AlertSvc, $rootScope) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

                // Show first template
                $scope.show(0);
                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }));

            it('should alert while uploading new template', inject(function(AlertSvc, $rootScope) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

                $scope.file = fileObj;
                $scope.key = newTmplKey;
            
                $scope.upload();
                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }));

            it('should alert while saving new defaults', inject(function(AlertSvc, $rootScope) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('TemplatesAddCtrl', {$scope: $scope});

                $scope.defaultTemplates =[{'name': tmplKeys[0]}, {'name': tmplKeys[1]}];
                $scope.save();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        })
    })
})
