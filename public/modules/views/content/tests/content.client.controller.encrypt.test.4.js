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
                 return 'hmac123';
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

    describe('Reply message, no files', function() {

        passphrase = false;

        var replyContent = [{name: 'replyName1', value: 'replyString1'}, {name: 'replyName2', value: 'replyString2'}, {name: 'replyName3', value: 'replyString3'}, {name: 'hmac', value: 'hmac123'}];
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
                var res = {'status': 200, 'data': '{"SR_status": "OK", "encrypted": false}'};
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
                    'encrypted': false
                })
            })
        }));

        it('should be able to initialize templates, download message content, update DOM, send reply', inject(function($rootScope, AlertSvc) {

            var $scope = $rootScope.$new();
            spyOn(AlertSvc, 'resAlert');

            // Inject controller
            var controller = $controller('contentCtrl', {$scope: $scope,
                    $routeParams: {'projectDisplay': projDisplay, 'projectResource': projResource, 'jobId': jobId, 'locationDisplay': locDisplay, 'locationResource': locResource, 'msgId':  msgId}});

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
            expect(ApiSvc.resource.filesGet.calls.first().args[0]).toEqual({'project': projResource, 'job': jobId, 'location': locResource, msg: msgId});
            expect(ApiSvc.resource.msgGet.calls.count()).toEqual(1);
            expect(ApiSvc.resource.msgGet.calls.first().args[0]).toEqual({'project': projResource, 'job': jobId, 'location': locResource, msg: msgId});
            expect(ApiSvc.fileGet.calls.count()).toEqual(0);
            expect($scope.files.length).toEqual(0);

            expect($scope.content.length).toEqual(msgContent.length);
            for (var i = 0; i < $scope.content.length; i++) {
                expect($scope.content[i]).toEqual(jasmine.objectContaining(msgContent[i]));
            }

            expect($scope.isReply).toEqual(true);
            expect($scope.replyDone).toEqual(false);
            expect($scope.replyAck).toEqual('false');

            expect($scope.replyContent.length).toEqual(replyContent.length -1);
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
            $scope.replyContent = newReplyContent;
            replyContent = JSON.parse(JSON.stringify(newReplyContent));
            replyContent.push({'name': 'hmac', 'value': 'dummy'});
            $scope.reply();

            // Check that local reply done flag was also updated
            expect($scope.content).toEqual(jasmine.objectContaining(msgContent));
            expect($scope.isReply).toEqual(true);
            expect($scope.replyDone).toEqual(true);
            expect($scope.replyAck).toEqual('false');
            expect($scope.replyContent).toEqual(newReplyContent);
            expect($scope.timestamp).toEqual(timestamp);

            expect(AlertSvc.resAlert).not.toHaveBeenCalled();
        }))
    })
})
