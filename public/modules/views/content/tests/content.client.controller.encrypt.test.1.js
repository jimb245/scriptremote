'use strict'


describe('content controller/directive decryption tests', function() {

    var $controller;
    var $rootscope;
    var $compile;
    var $q;
    var ApiSvc;
    var TmplSvc;
    var passphrase;

    // Load views into cache
    beforeEach(module('foo'));

    // Inject the content module
    beforeEach(module('contentMod'));

    beforeEach(module('authMod'));
    beforeEach(module('alertMod'));

    // Mock CryptoSvc with noop's for simplicity
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
                return passphrase;
            }
        }
    }));


    //
    // projDisplay != projResource signifies encrypted project to controller
    //
    var projDisplay = 'projectDisplay';
    var projResource = 'projectResource';
    var jobId = 'myJobId';
    var locDisplay = 'locDisplay';
    var locResource = 'locResource';
    var msgId = 'msgId';
    var timestamp = 'some timestamp';
    var msgContent = [{name: 'someName1', value: 'someString1'}, {name: 'someName2', value: 'someString2'}, {name: 'someName3', value: 'someString3'}];
    var tmplKeys = ['somecontent', 'somereply'];
    var defaultTmplKeys = ['simplecontent', 'simplereply'];
    var encryptedKeys = [false, false];
    var tmplSource = [];
    var fileKeys = ['myKey1', 'myKey2'];
    var fileTypes = ['text/plain', 'image/png'];
    var fileData = ['some text', 'fake png data'];
    var isEncryptedData;

    describe('Non-reply message with files, templates not encrypted', function() {

        passphrase = true;
        isEncryptedData = JSON.stringify({"SR_status": "OK", "encrypted": false});

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
            spyOn(_TmplSvc_, 'locationTmpl').and.callFake(function(projResource, jobId, locResource) {
                return {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'templates': tmplKeys
                        })
                    }
                }
            });
            spyOn(_TmplSvc_, 'fileDownload').and.callFake(function(key, projResource, jobId, locResource) {
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
                var res = {'status': 200, 'data': isEncryptedData};
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

            spyOn(_ApiSvc_, 'fileGet').and.callFake(function(projResource, jobId, locResource, msgId, fileKey) {
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

            spyOn(_ApiSvc_.resource, 'projectGet').and.callFake(function(projResource, success, error) {
                success({
                    'encrypted': true
                })
            })
        }));


        it('should be able to initialize dynamic templates, download message content and files, update DOM element', inject(function($rootScope, AuthSvc, AlertSvc) {

            var $scope = $rootScope.$new();
            spyOn(AlertSvc, 'resAlert');
            spyOn(AuthSvc, 'alertPostRoute');

            // Inject controller
            var controller = $controller('contentCtrl', {$scope: $scope,
                    $routeParams: {'projectDisplay': projDisplay, 'projectResource': projResource, 'jobId': jobId, 'locationDisplay': locDisplay, 'locationResource': locResource, 'msgId':  msgId}});

            $scope.$digest();

            expect(AlertSvc.resAlert).not.toHaveBeenCalled();
            expect(AuthSvc.alertPostRoute).not.toHaveBeenCalled();

            // Check that template sources were initialized successfully 
            expect(TmplSvc.fileDownload.calls.count()).toEqual(2);
            expect(TmplSvc.isEncrypted.calls.count()).toEqual(2);
            expect($scope.contentTmpl).toEqual(tmplSource[0]);
            expect($scope.replyTmpl).toEqual(tmplSource[1]);

            // Compile content template
            var element = $compile(angular.element('<div dynamic="contentTmpl"></div>'))($scope);
            $scope.$digest();

            // Check message data retrieval
            expect(ApiSvc.resource.filesGet.calls.count()).toEqual(1);
            expect(ApiSvc.resource.filesGet.calls.first().args[0]).toEqual({'project': projResource, 'job': jobId, 'location': locResource, msg: msgId});
            expect(ApiSvc.resource.msgGet.calls.count()).toEqual(1);
            expect(ApiSvc.resource.msgGet.calls.first().args[0]).toEqual({'project': projResource, 'job': jobId, 'location': locResource, msg: msgId});
            expect(ApiSvc.fileGet.calls.count()).toEqual(2);
            expect(ApiSvc.fileGet.calls.argsFor(0)).toEqual([projResource, jobId, locResource, msgId, fileKeys[0]]);
            expect(ApiSvc.fileGet.calls.argsFor(1)).toEqual([projResource, jobId, locResource, msgId, fileKeys[1]]);

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
    })
})
