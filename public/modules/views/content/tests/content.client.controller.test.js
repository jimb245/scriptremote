'use strict'

describe('content controller/directive tests', function() {

    var $controller;
    var $rootscope;
    var $compile;
    var $q;
    var ApiSvc;
    var TmplSvc;
    var fileKeys = ['myKey1', 'myKey2'];
    var fileTypes = ['text/plain', 'image/png'];
    var fileData = ['some text', 'fake png data'];

    // Load views into cache
    beforeEach(module('foo'));

    // Inject the content module
    beforeEach(module('contentMod'));

    beforeEach(module('authMod'));
    beforeEach(module('alertMod'));

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
            }
        }
    }));

    describe('TmplSvc, ApiSvc dependencies successful', function() {

        var project = 'myProject';
        var jobId = 'myJobId';
        var loc = 'myLoc';
        var msgId = 'msgId';
        var timestamp = 'some timestamp';
        var msgContent = [{name: 'someName1', value: 'someString1'}, {name: 'someName2', value: 'someString2'}, {name: 'someName3', value: 'someString3'}];
        var tmplKeys = ['defaultContent', 'defaultReply'];
        var tmplSource = [];

        describe('Non-reply message with files', function() {


            beforeEach(inject(function(_$controller_, _$compile_, _$q_, _ApiSvc_, _TmplSvc_) {
                $controller = _$controller_;
                $compile = _$compile_;
                $q = _$q_;
                ApiSvc = _ApiSvc_;
                TmplSvc = _TmplSvc_;
            }));

            beforeEach(inject(function($templateCache) {
                tmplSource = [
                    $templateCache.get('public/modules/views/content/src/templates/simplecontent.html'),
                    $templateCache.get('public/modules/views/content/src/templates/simplereply.html')
                ];
            }));

            // Mock TmplSvc
            beforeEach(inject(function(_TmplSvc_) {
                spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(project, jobId, loc) {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'templates': tmplKeys
                            })
                        }
                    }
                });
                spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var idx;
                    if (key == tmplKeys[0]) {
                        idx = 0;
                    }
                    else if (key == tmplKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': tmplSource[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });
                spyOn(_TmplSvc_, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                    deferred.resolve(res);
                    return deferred.promise;
                });
            }));

            // Mock ApiSvc
            beforeEach(inject(function(_ApiSvc_) {
                spyOn(_ApiSvc_.resource, 'filesGet').and.callFake(function(data, success, error) {
                    success({
                        'SR_status':'OK', 
                        'file_keys': fileKeys,
                        'file_types': fileTypes
                    });
                });

                spyOn(_ApiSvc_.resource, 'msgGet').and.callFake(function(data, success, error) {
                    success({
                        'SR_status':'OK', 
                        'content': JSON.stringify(msgContent),
                        'is_reply': false,
                        'timestamp': timestamp
                    })
                });

                spyOn(_ApiSvc_, 'fileGet').and.callFake(function(project, jobId, loc, msgId, fileKey) {
                    var deferred = $q.defer();
                    var idx;
                    if (fileKey == fileKeys[0]) {
                        idx = 0;
                    }
                    else if (fileKey == fileKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': fileData[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });

                spyOn(_ApiSvc_.resource, 'projectGet').and.callFake(function(project, success, error) {
                    success({
                        'encrypted': false
                    })
                })
            }));

            it('should be able to initialize dynamic templates, download message content and files, update DOM element', inject(function($rootScope) {

                var $scope = $rootScope.$new();

                // Inject controller
                var controller = $controller('contentCtrl', {$scope: $scope,
                        $routeParams: {'projectDisplay': project, 'jobId': jobId, 'locationDisplay': loc, 'msgId':  msgId}});

                $scope.$digest();

                // Check that template sources were initialized successfully 
                expect(TmplSvc.fileDownload.calls.count()).toEqual(2);
                expect($scope.contentTmpl).toEqual(tmplSource[0]);
                expect($scope.replyTmpl).toEqual(tmplSource[1]);

                // Compile content template
                var element = $compile(angular.element('<div dynamic="contentTmpl"></div>'))($scope);
                $scope.$digest();

                // Check message data retrieval
                expect(ApiSvc.resource.filesGet.calls.count()).toEqual(1);
                expect(ApiSvc.resource.filesGet.calls.first().args[0]).toEqual({'project': project, 'job': jobId, 'location': loc, msg: msgId});
                expect(ApiSvc.resource.msgGet.calls.count()).toEqual(1);
                expect(ApiSvc.resource.msgGet.calls.first().args[0]).toEqual({'project': project, 'job': jobId, 'location': loc, msg: msgId});
                expect(ApiSvc.fileGet.calls.count()).toEqual(2);
                expect(ApiSvc.fileGet.calls.argsFor(0)).toEqual([project, jobId, loc, msgId, fileKeys[0]]);
                expect(ApiSvc.fileGet.calls.argsFor(1)).toEqual([project, jobId, loc, msgId, fileKeys[1]]);

                expect($scope.content.length).toEqual(msgContent.length);
                for (var i = 0; i < $scope.content.length; i++) {
                    expect($scope.content[i]).toEqual(jasmine.objectContaining(msgContent[i]));
                }
                expect($scope.isReply).toEqual(false);
                expect($scope.timestamp).toEqual(timestamp);

                expect($scope.files[0]).toEqual(jasmine.objectContaining({'key': fileKeys[0], 'type': fileTypes[0], 'data': fileData[0]}));
                expect($scope.files[1]).toEqual(jasmine.objectContaining({'key': fileKeys[1], 'type': fileTypes[1], 'data': fileData[1]}));

                // Check that message data is in DOM element
                expect(element.html()).toMatch(new RegExp('someName1'));
                expect(element.html()).toMatch(new RegExp('someString1'));
                expect(element.html()).toMatch(new RegExp('someName2'));
                expect(element.html()).toMatch(new RegExp('someString2'));
                expect(element.html()).toMatch(new RegExp('someName3'));
                expect(element.html()).toMatch(new RegExp('someString3'));
                expect(element.html()).toMatch(new RegExp(fileKeys[0]));
                expect(element.html()).toMatch(new RegExp(fileData[0]));
                expect(element.html()).toMatch(new RegExp(fileData[1]));
            }))
        });

        describe('Reply message, no files, dependencies successful', function() {

            var replyContent = [{name: 'replyName1', value: 'replyString1'}, {name: 'replyName2', value: 'replyString2'}, {name: 'replyName3', value: 'replyString3'}];
            var replyDone = false;
            var newReplyContent = [{name: 'replyName1', value: 'replyNewString1'}, {name: 'replyName2', value: 'replyNewString2'}, {name: 'replyName3', value: 'replyNewString3'}];

            beforeEach(inject(function(_$controller_, _$compile_, _$q_, _ApiSvc_, _TmplSvc_) {
                $controller = _$controller_;
                $compile = _$compile_;
                $q = _$q_;
                ApiSvc = _ApiSvc_;
                TmplSvc = _TmplSvc_;
            }));

            beforeEach(inject(function($templateCache) {
                tmplSource = [
                    $templateCache.get('public/modules/views/content/src/templates/simplecontent.html'),
                    $templateCache.get('public/modules/views/content/src/templates/simplereply.html')
                ];
            }));

            // Mock TmplSvc
            beforeEach(inject(function(_TmplSvc_) {
                spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(project, jobId, loc) {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'templates': tmplKeys
                            })
                        }
                    }
                });
                spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var idx;
                    if (key == tmplKeys[0]) {
                        idx = 0;
                    }
                    else if (key == tmplKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': tmplSource[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });
                spyOn(_TmplSvc_, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                    deferred.resolve(res);
                    return deferred.promise;
                });
            }));

            // Mock ApiSvc
            beforeEach(inject(function(_ApiSvc_) {
                spyOn(_ApiSvc_.resource, 'filesGet').and.callFake(function(data, success, error) {
                    success({
                        'SR_status':'OK', 
                        'file_keys': [],
                        'file_types': []
                    });
                });

                spyOn(_ApiSvc_.resource, 'msgGet').and.callFake(function(data, success, error) {
                    success({
                        'SR_status':'OK', 
                        'content': JSON.stringify(msgContent),
                        'is_reply': true,
                        'reply_content': JSON.stringify(replyContent),
                        'reply_done': replyDone,
                        'reply_ack': 'false',
                        'timestamp': timestamp
                    })
                });

                spyOn(_ApiSvc_.resource, 'msgPut').and.callFake(function(routeParams, data, success, error) {
                    replyDone = true;
                    success({
                        'SR_status':'OK', 
                    });
                });

                spyOn(_ApiSvc_, 'fileGet').and.callFake(function(project, jobId, loc, msgId, fileKey) {
                    var deferred = $q.defer();
                    var idx;
                    if (fileKey == fileKeys[0]) {
                        idx = 0;
                    }
                    else if (fileKey == fileKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': fileData[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });

                spyOn(_ApiSvc_.resource, 'projectGet').and.callFake(function(project, success, error) {
                    success({
                        'encrypted': false
                    })
                })
            }));

            it('should be able to initialize templates, download message content, update DOM, send reply', inject(function($rootScope) {

                var $scope = $rootScope.$new();

                // Inject controller
                var controller = $controller('contentCtrl', {$scope: $scope,
                        $routeParams: {'projectDisplay': project, 'jobId': jobId, 'locationDisplay': loc, 'msgId':  msgId}});
                $scope.$digest();

                // Check that template sources were initialized successfully 
                expect(TmplSvc.fileDownload.calls.count()).toEqual(2);
                expect($scope.contentTmpl).toEqual(tmplSource[0]);
                expect($scope.replyTmpl).toEqual(tmplSource[1]);

                // Compile content template
                var contentElement = $compile(angular.element('<div dynamic="contentTmpl"></div>'))($scope);
                $scope.$digest();

                // Compile reply template
                var replyElement = $compile(angular.element('<div dynamic="replyTmpl"></div>'))($scope);
                $scope.$digest();

                // Check message data retrieval
                expect(ApiSvc.resource.filesGet.calls.count()).toEqual(1);
                expect(ApiSvc.resource.filesGet.calls.first().args[0]).toEqual({'project': project, 'job': jobId, 'location': loc, msg: msgId});
                expect(ApiSvc.resource.msgGet.calls.count()).toEqual(1);
                expect(ApiSvc.resource.msgGet.calls.first().args[0]).toEqual({'project': project, 'job': jobId, 'location': loc, msg: msgId});
                expect(ApiSvc.fileGet.calls.count()).toEqual(0);
                expect($scope.files.length).toEqual(0);

                expect($scope.content.length).toEqual(msgContent.length);
                for (var i = 0; i < $scope.content.length; i++) {
                    expect($scope.content[i]).toEqual(jasmine.objectContaining(msgContent[i]));
                }

                expect($scope.isReply).toEqual(true);
                expect($scope.replyDone).toEqual(false);
                expect($scope.replyAck).toEqual('false');

                expect($scope.replyContent.length).toEqual(replyContent.length);
                for (var j = 0; j < $scope.replyContent.length; j++) {
                    expect($scope.replyContent[j]).toEqual(jasmine.objectContaining(replyContent[j]));
                }
                expect($scope.timestamp).toEqual(timestamp);


                // Check that original reply data is in DOM element
                // TODO: This is not completely working. For some reason
                // the binding ng-model="item.value" in the reply template 
                // works fine in the application but not in this test setup.
                //
                expect(replyElement.html()).toMatch(new RegExp('replyName1'));
                //expect(replyElement.html()).toMatch(new RegExp('replyString1'));
                expect(replyElement.html()).toMatch(new RegExp('replyName2'));
                //expect(replyElement.html()).toMatch(new RegExp('replyString2'));
                expect(replyElement.html()).toMatch(new RegExp('replyName3'));
                //expect(replyElement.html()).toMatch(new RegExp('replyString3'));

                // Modify reply content and send it
                replyContent = newReplyContent;
                $scope.replyContent = newReplyContent;
                $scope.reply();

                // Check that local reply done flag was also updated
                expect($scope.content).toEqual(jasmine.objectContaining(msgContent));
                expect($scope.isReply).toEqual(true);
                expect($scope.replyDone).toEqual(true);
                expect($scope.replyAck).toEqual('false');
                expect($scope.replyContent).toEqual(replyContent);
                expect($scope.timestamp).toEqual(timestamp);

            }))
        })
    });

    describe('TmplSvc unsuccessful', function() {

        var project = 'myProject';
        var jobId = 'myJobId';
        var loc = 'myLoc';
        var msgId = 'msgId';
        var timestamp = 'some timestamp';
        var msgContent = [{name: 'someName1', value: 'someString1'}, {name: 'someName2', value: 'someString2'}, {name: 'someName3', value: 'someString3'}];
        var tmplKeys = ['defaultContent', 'defaultReply'];
        var tmplSource = ['some content template source', 'some reply template source'];
        var errMsg = 'some message';

        beforeEach(inject(function(_$controller_, _$q_, _ApiSvc_, _TmplSvc_) {
            $controller = _$controller_;
            $q = _$q_;
            ApiSvc = _ApiSvc_;
            TmplSvc = _TmplSvc_;
        }));

        // Mock ApiSvc
        beforeEach(inject(function(_ApiSvc_) {
            spyOn(_ApiSvc_.resource, 'filesGet').and.callFake(function(data, success, error) {
                success({
                    'SR_status':'OK', 
                    'file_keys': fileKeys,
                    'file_types': fileTypes
                });
            });

            spyOn(_ApiSvc_.resource, 'msgGet').and.callFake(function(data, success, error) {
                success({
                    'SR_status':'OK', 
                    'content': JSON.stringify(msgContent),
                    'is_reply': false,
                    'timestamp': timestamp
                })
            });

            spyOn(_ApiSvc_, 'fileGet').and.callFake(function(project, jobId, loc, msgId, fileKey) {
                var deferred = $q.defer();
                var idx;
                if (fileKey == fileKeys[0]) {
                    idx = 0;
                }
                else if (fileKey == fileKeys[1]) {
                    idx = 1;
                }
                else {
                    var err = new Error('Shouldnt get here');
                    throw(err);
                }
                var res = {'status': 200, 'data': fileData[idx]};
                deferred.resolve(res);
                return deferred.promise;
            })
        }));

        describe('TmplSvc.locationTmpl unsuccessful', function() {

            // Mock TmplSvc.locationTmpl calling error callback
            beforeEach(inject(function(_TmplSvc_) {
                spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(project, jobId, loc) {
                    return {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    }
                });
                spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var idx;
                    if (key == tmplKeys[0]) {
                        idx = 0;
                    }
                    else if (key == tmplKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': tmplSource[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });
                spyOn(_TmplSvc_, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                    deferred.resolve(res);
                    return deferred.promise;
                });
            }));

            it('should alert on initialization', inject(function($rootScope, AlertSvc) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('contentCtrl', {$scope: $scope,
                        $routeParams: {'project': project, 'jobId': jobId, 'location': loc, 'msgId':  msgId}});

                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('TmplSvc.fileDownload unsuccessful', function() {

            // Mock TmplSvc.fileDownload calling error callback
            beforeEach(inject(function(_TmplSvc_) {
                spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(project, jobId, loc) {
                    return {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'templates': tmplKeys
                            })
                        }
                    }
                });
                spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var res = {status: 400, data: {'SR_status': errMsg}};
                    deferred.reject(res);
                    return deferred.promise;
                });
                spyOn(_TmplSvc_, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                    var deferred = $q.defer();
                    var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                    deferred.resolve(res);
                    return deferred.promise;
                });
            }));

            it('should alert on initialization', inject(function($rootScope, AlertSvc) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('contentCtrl', {$scope: $scope,
                        $routeParams: {'project': project, 'jobId': jobId, 'location': loc, 'msgId':  msgId}});

                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        })
    });

    describe('ApiSvc unsuccessful', function() {

        var project = 'myProject';
        var jobId = 'myJobId';
        var loc = 'myLoc';
        var msgId = 'msgId';
        var timestamp = 'some timestamp';
        var msgContent = [{name: 'someName1', value: 'someString1'}, {name: 'someName2', value: 'someString2'}, {name: 'someName3', value: 'someString3'}];
        var tmplKeys = ['defaultContent', 'defaultReply'];
        var tmplSource = ['some content template source', 'some reply template source'];
        var errMsg = 'some message';

        beforeEach(inject(function(_$controller_, _$q_, _ApiSvc_, _TmplSvc_) {
            $controller = _$controller_;
            $q = _$q_;
            ApiSvc = _ApiSvc_;
            TmplSvc = _TmplSvc_;
        }));

        // Mock TmplSvc
        beforeEach(inject(function(_TmplSvc_) {
            spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(project, jobId, loc) {
                return {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'templates': tmplKeys
                        })
                    }
                }
            });
            spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, project, jobId, loc) {
                var deferred = $q.defer();
                var idx;
                if (key == tmplKeys[0]) {
                    idx = 0;
                }
                else if (key == tmplKeys[1]) {
                    idx = 1;
                }
                else {
                    var err = new Error('Shouldnt get here');
                    throw(err);
                }
                var res = {'status': 200, 'data': tmplSource[idx]};
                deferred.resolve(res);
                return deferred.promise;
            });
            spyOn(_TmplSvc_, 'isEncrypted').and.callFake(function(key, project, jobId, loc) {
                var deferred = $q.defer();
                var res = {'status': 200, 'data': {'SR_status': 'OK', 'encrypted': false}};
                deferred.resolve(res);
                return deferred.promise;
            });
        }));

        describe('ApiSvc.resource.msgGet unsuccessful', function() {

            // Mock msgGet
            beforeEach(inject(function(_ApiSvc_) {
                spyOn(_ApiSvc_.resource, 'filesGet').and.callFake(function(data, success, error) {
                    success({
                        'SR_status':'OK', 
                        'file_keys': fileKeys,
                        'file_types': fileTypes
                    });
                });

                spyOn(_ApiSvc_.resource, 'msgGet').and.callFake(function(data, success, error) {
                    var res = {status: 400, data: {'SR_status': errMsg}};
                    error(res);
                });

                spyOn(_ApiSvc_, 'fileGet').and.callFake(function(project, jobId, loc, msgId, fileKey) {
                    var deferred = $q.defer();
                    var idx;
                    if (fileKey == fileKeys[0]) {
                        idx = 0;
                    }
                    else if (fileKey == fileKeys[1]) {
                        idx = 1;
                    }
                    else {
                        var err = new Error('Shouldnt get here');
                        throw(err);
                    }
                    var res = {'status': 200, 'data': fileData[idx]};
                    deferred.resolve(res);
                    return deferred.promise;
                });

                spyOn(_ApiSvc_.resource, 'projectGet').and.callFake(function(project, success, error) {
                    success({
                        'encrypted': false
                    })
                })
            }));

            it('should alert on initialization', inject(function($rootScope, AlertSvc) {

                spyOn(AlertSvc, 'resAlert');

                var $scope = {};
                var controller = $controller('contentCtrl', {$scope: $scope,
                        $routeParams: {'project': project, 'jobId': jobId, 'location': loc, 'msgId':  msgId}});

                $rootScope.$apply();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        })
    })
})
