'use strict';

/*
*  This  view displays the data/files of a message 
*/

angular.module('contentMod')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/content/:projectDisplay/:jobId/:locationDisplay/:msgId/:projectResource?/:locationResource?', {
    templateUrl: 'modules/views/content/src/content.client.view.html',
    controller: 'contentCtrl'
  });
}])

.controller('contentCtrl', ['$scope', '$routeParams', 'ApiSvc', 'TmplSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', '$q', function(
    $scope, $routeParams, ApiSvc, TmplSvc, AlertSvc, AuthSvc, CryptoSvc, $q) {

    $scope.projectDisplay = $routeParams.projectDisplay;
    // For encryption extra routing parameters pass the resource info needed for direct link
    if ($routeParams.projectResource && ($routeParams.projectResource != $scope.projectDisplay)) {
        $scope.projectDecrypt = true;
        $scope.projectResource = $routeParams.projectResource;
        $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
        $scope.projectResourceURI = encodeURIComponent($routeParams.projectResource);

        $scope.locationDisplay = $routeParams.locationDisplay;
        $scope.locationResource = $routeParams.locationResource;
        $scope.locationDisplayURI = encodeURIComponent($routeParams.locationDisplay);
        $scope.locationResourceURI = encodeURIComponent($routeParams.locationResource);
    }
    else {
        $scope.projectDecrypt = false;
        $scope.projectResource = $scope.projectDisplay;
        $scope.projectDisplayURI = encodeURIComponent($routeParams.projectDisplay);
        $scope.projectResourceURI = $scope.projectDisplayURI;

        $scope.locationDisplay = $routeParams.locationDisplay;
        $scope.locationResource = $scope.locationDisplay;
        $scope.locationDisplayURI = encodeURIComponent($routeParams.locationDisplay);
        $scope.locationResourceURI = $scope.locationDisplayURI;
    }
    $scope.jobId = $routeParams.jobId;
    $scope.msg = $routeParams.msgId;

    $scope.error = function(res) {
        AuthSvc.alertPostRoute(res);
        $scope.clicked = false;
    }

    // Download a dynamic template
    $scope.getTemplate = function(project, jobId, location, key) {
        return TmplSvc.fileDownload(key, project, jobId, location);
    }

    $scope.getDefaultTemplate = function(key) {
        return TmplSvc.fileDownloadDefault(key);
    }

    $scope.encryptedTemplate = function(project, jobId, location, key) {
        return TmplSvc.isEncrypted(key, project, jobId, location);
    }

    // Download attached files, if any
    $scope.getFiles = function() {
        var err;
        ApiSvc.resource.filesGet({project: $scope.projectResource, job: $scope.jobId, location: $scope.locationResource, msg: $scope.msg}, 
            function(data) { 
                /* jshint ignore:start */
                /* ... for function defined inside a loop ... */
                for (var i = 0; i < data.file_keys.length; i++) {
                    ApiSvc.fileGet($scope.projectResource, $scope.jobId, $scope.locationResource, $scope.msg, encodeURIComponent(data.file_keys[i])) 
                    .then( (function(idx) {
                            return function(res) {
                                var obj;
                                if (res.status == 200) {
                                    if ($scope.projectDecrypt) {
                                        var key = CryptoSvc.decrypt($scope.projectResource, data.file_keys[idx]);
                                        var fdata = null;
                                        var type = data.file_types[idx];
                                        if (type == 'image/png') {
                                            var binary = CryptoSvc.decrypt($scope.projectResource, res.data, true); 
                                            fdata = CryptoSvc.toBase64(binary);
                                        }
                                        else {
                                            fdata = CryptoSvc.decrypt($scope.projectResource, res.data); 
                                        }
                                        if (key && fdata) {
                                            obj = {"key": key, "type": type, "data": fdata};
                                            $scope.files.push(obj);
                                        }
                                        else {
                                            AlertSvc.msgAlert("warning", "Failed to decrypt file item with current passphrase");
                                        }
                                    }
                                    else {
                                        obj = {"key": data.file_keys[idx], "type": data.file_types[idx], "data": res.data};
                                        $scope.files.push(obj);
                                    }
                                }
                                else {
                                    $scope.error(res)
                                }
                            }

                        }(i)),
                        function(err) {
                            $scope.error(err);
                        }
                    )
                }
                /* jshint ignore:end */
            },
            $scope.error
        )
    }

    // Get all message content data
    $scope.load = function() {
        ApiSvc.resource.msgGet({project: $scope.projectResource, job: $scope.jobId, location: $scope.locationResource, msg: $scope.msg}, 
            function(data) { 
                var content = angular.fromJson(data.content);
                var errCount;
                var entry;
                if ($scope.projectDecrypt) {
                    // Decrypting content
                    var contentNew = []; 
                    errCount = 0;
                    for (var i = 0; i < content.length; i++) {
                        entry = content[i];
                        entry.name = CryptoSvc.decrypt($scope.projectResource, entry.name);
                        entry.value = CryptoSvc.decrypt($scope.projectResource, entry.value);
                        if (entry.name && entry.value) {
                            contentNew.push(entry);
                        }
                        else {
                            errCount += 1;
                        }
                    }
                    if (errCount > 0) {
                        AlertSvc.msgAlert("warning", "Failed to decrypt " + errCount + " content items with current passphrase");
                    }
                    content = contentNew;
                }
                $scope.content = content;

                $scope.isReply = data.is_reply;
                $scope.timestamp = data.timestamp;
                if ($scope.isReply) {
                    var replyContent = angular.fromJson(data.reply_content);
                    if ($scope.projectDecrypt) {
                        var replyNew = []; 
                        var concat = '';
                        errCount = 0;
                        var length = replyContent.length;
                        for (var j = 0; j < replyContent.length -1; j++) {
                            entry = replyContent[j];
                            concat += entry.name + entry.value;
                            entry.name = CryptoSvc.decrypt($scope.projectResource, entry.name);
                            entry.value = CryptoSvc.decrypt($scope.projectResource, entry.value);
                            if (entry.name && entry.value) {
                                replyNew.push(entry);
                            }
                            else {
                                errCount += 1;
                            }
                        }
                        if (errCount > 0) {
                            AlertSvc.msgAlert("warning", "Failed to decrypt " + errCount + " reply items with current passphrase");
                        }
                        if (!data.reply_done) {
                            // Check hmac unless reply is already sent
                            var hmac = CryptoSvc.hmac(concat);
                            entry = replyContent[replyContent.length -1];
                            if (hmac != entry.value) {
                                AlertSvc.msgAlert("warning", "Failed to authenticate message content with current passphrase");
                            }
                            $scope.clicked = false;
                        }
                        replyContent = replyNew;
                    }
                    $scope.replyContent = replyContent;
                    $scope.replyContentSave = angular.copy($scope.replyContent);
                    $scope.replyDone = data.reply_done;
                    $scope.replyAck = data.reply_ack;
                }
                $scope.files = [];
                $scope.getFiles();
            },
            $scope.error
        )
    }

    // Send reply data
    $scope.reply = function() {
        if ($scope.isEncrypted && !$scope.projectDecrypt) {
            // Passphrase not correct for this project
            AlertSvc.msgAlert("warning", "Project is not decrypted");
            return;
        }
        // 'clicked' disables reply button to prevent double clicks
        $scope.clicked = true;
        var replyContent = $scope.replyContent;
        if ($scope.projectDecrypt) {
            var replyNew = []; 
            var errCount = 0;
            var concat = '';
            var entry;
            for (var i = 0; i < $scope.replyContent.length; i++) {
                entry = $scope.replyContent[i];
                entry.name = CryptoSvc.encrypt($scope.projectResource, entry.name);
                entry.value = CryptoSvc.encrypt($scope.projectResource, entry.value);
                if (entry.name && entry.value) {
                    replyNew.push(entry);
                    concat += entry.name + entry.value;
                }
                else {
                    errCount += 1;
                }
            }
            if (errCount > 0) {
                AlertSvc.msgAlert("warning", "Failed to encrypt " + errCount + " reply items with current passphrase");
                $scope.clicked = false;
                return;
            }
            if (replyNew.length > 0) {
                var auth = CryptoSvc.hmac(concat);
                entry = {"name": "hmac", "value": auth};
                replyNew.push(entry);
            }
            replyContent = replyNew;
        }

        ApiSvc.resource.msgPut({project: $scope.projectResource, job: $scope.jobId, location: $scope.locationResource, msg: $scope.msg}, {'reply_content': angular.toJson(replyContent)},
            $scope.reload,
            $scope.error
        )
    }

    $scope.restore = function() {
        $scope.replyContent = angular.copy($scope.replyContentSave);
        AlertSvc.msgAlert("warning", "Reply already sent");
    }

    $scope.reload = function() {
        $scope.replyContentSave = angular.copy($scope.replyContent);
        $scope.load();
    }

    // Get the dynamic templates for current location then load the message data.
    TmplSvc.locationTmpl($scope.projectResource, $scope.jobId, $scope.locationResource).get(
        function(data) { 
            // First check if templates are encrypted
            var promises1 = [];
            for (var i = 0; i < data.templates.length; i++) {
                promises1.push($scope.encryptedTemplate($scope.projectResource, $scope.jobId, $scope.locationResource, data.templates[i]));
            }
            $q.all( promises1 )
            .then( function(resArray1) {
                var encrypted = [];
                var promises2 = [];
                for (var j = 0; j < resArray1.length; j++) {
                    encrypted.push(angular.fromJson(resArray1[j].data).encrypted);
                    if (encrypted[j] && !CryptoSvc.isEncrypted()) { 
                        // If no passphrase get unencrypted global default template
                        if (j === 0) {
                            promises2.push($scope.getDefaultTemplate('simplecontent'));
                        }
                        else {
                            promises2.push($scope.getDefaultTemplate('simplereply'));
                        }
                        AlertSvc.msgAlert("warning", "Template is encrypted but no passphrase is set - using default template");
                    }
                    else {
                        // Get the user's template
                        promises2.push($scope.getTemplate($scope.projectResource, $scope.jobId, $scope.locationResource, data.templates[j]));
                    }
                }
                $q.all(promises2)
                .then( function(resArray2) {
                        // Decrypt the templates if needed
                        if (encrypted[0] && CryptoSvc.isEncrypted()) {
                            $scope.contentTmpl = CryptoSvc.decrypt(null, resArray2[0].data);
                            if ($scope.contentTmpl === null) {
                                AlertSvc.msgAlert("warning", "Failed to decrypt template with current passphrase");
                            }
                        }
                        else {
                            // Either not encrypted or no passphrase set
                            $scope.contentTmpl = resArray2[0].data;
                        }
                        if (encrypted[1] && CryptoSvc.isEncrypted()) {
                            $scope.replyTmpl = CryptoSvc.decrypt(null, resArray2[1].data);
                            if ($scope.replyTmpl === null) {
                                AlertSvc.msgAlert("warning", "Failed to decrypt template with current passphrase");
                            }
                        }
                        else {
                            // Either not encrypted or no passphrase set
                            $scope.replyTmpl = resArray2[1].data;
                        }
                        
                        // Get the message data
                        $scope.load();

                        // Check if project is encrypted
                        ApiSvc.resource.projectGet({project: $scope.projectResource}, 
                            function(data) { 
                                $scope.isEncrypted = data.encrypted;
                            },
                            function(res) { AuthSvc.alertPostRoute(res); }
                        )
                    },
                    function(err) {
                        $scope.error(err);
                    }
                )
                },
                function(err) {
                    $scope.error(err);
                }
            )
        },
        function(res) { AuthSvc.alertPostRoute(res); }
    )
}]);
