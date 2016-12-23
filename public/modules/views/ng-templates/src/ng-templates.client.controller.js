'use strict';

// This view is for adding/listing/removing dynamic templates

var templatesAddApp = angular.module('templatesAddMod');
var templatesAddCtrl;

templatesAddApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/templates-add', {
    templateUrl: 'modules/views/ng-templates/src/ng-templates.client.view.html',
    controller: 'TemplatesAddCtrl',
    resolve: {
        authCheck: templatesAddCtrl.authCheck
    }     
  })
}]);

var templatesAddCtrl = templatesAddApp.controller('TemplatesAddCtrl', ['$scope', '$routeParams', 'TmplSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $routeParams, TmplSvc, AlertSvc, AuthSvc, CryptoSvc) {

    // Initialize template list and defaults
    $scope.init = function() {
        $scope.visible = [];
        $scope.templates = [];
        $scope.isEncrypted = [];
        $scope.defaultTemplates = [];
        $scope.key = "";
        $scope.file = ""
        TmplSvc.listTmpl().get(
            function(data) {
                if (data.file_keys) {
                    for (var i = 0; i < data.file_keys.length; i++) {
                        $scope.templates.push({'name': data.file_keys[i]});
                        $scope.visible.push(false); 
                        $scope.isEncrypted.push(data.encrypted[i]);
                    }
                    TmplSvc.userDefaults().get(
                        // Defaults are in the order: 'content', 'reply'
                        function(data) {
                            for (var i = 0; i < 2; i++) {
                                $scope.defaultTemplates.push(null);
                            }
                            for (i = 0; i < 2; i++) {
                                for (var j = 0; j < $scope.templates.length; j++) {
                                    if (data.defaults[i] == $scope.templates[j].name) {
                                        $scope.defaultTemplates[i] = $scope.templates[j];
                                     }
                                 }
                             }
                         },
                        function(res) { AuthSvc.alertPostRoute(res); }
                    )
                }
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Show contents of template file
    $scope.show = function(index) {
        if (!$scope.templates[index].content) {
            TmplSvc.fileDownload($scope.templates[index].name)
            .then( 
                function(res) {
                    if (res.status == 200) {
                        var contents = res.data;
                        if ($scope.isEncrypted[index]) {
                            if (!CryptoSvc.isEncrypted()) {
                                AlertSvc.msgAlert("warning", "Template is encrypted but no passphrase is set");
                                return;
                            }
                            contents = CryptoSvc.decrypt(null, res.data, false);
                        }
                        $scope.templates[index].content = contents;
                        $scope.visible[index] = true;
                    }
                    else {
                        AuthSvc.alertPostRoute(res);
                    }
                },
                function(res) { AuthSvc.alertPostRoute(res);}
            )
        }
        else {
            $scope.visible[index] = true;
        }
    }
        
    // Hide contents of template file
    $scope.hide = function(index) {
        $scope.visible[index] = false;
    }
        
    // Upload new template file
    $scope.upload = function() {
        if ($scope.key && $scope.file) {
            for (var j = 0; j < $scope.templates.length; j++) {
                if ($scope.key == $scope.templates[j].name) {
                    AlertSvc.msgAlert("warning", "A template with that name already exists");
                    return;
                }
            }
            var fileSpec;
            var encryptedFile;
            if (CryptoSvc.isEncrypted()) {
                // passphrase set implies file to be encrypted
                var fr = new FileReader();

                fr.onload = function(event) {
                    var cipher = CryptoSvc.encrypt(null, fr.result);
                    fileSpec = new Blob([cipher]);
                    encryptedFile = true;
                    TmplSvc.fileUpload($scope.key, fileSpec, encryptedFile)
                    .then( 
                        $scope.init,
                        function(res) { AuthSvc.alertPostRoute(res);}
                    )
                }

                fr.onerror = function(event) {
                    AlertSvc.msgAlert("warning", "Unable to upload file");
                    return;
                }

                fr.readAsText($scope.file);
            }
            else {
                fileSpec = $scope.file;
                encryptedFile = false;
                TmplSvc.fileUpload($scope.key, fileSpec, encryptedFile)
                .then( 
                    $scope.init,
                    function(res) { AuthSvc.alertPostRoute(res);}
                )
            }
        }
    }

    // Delete template file
    $scope.delete = function(index) {
        TmplSvc.deleteTmpl($scope.templates[index].name).delete(
            $scope.init,
            function(res) { AuthSvc.alertPostRoute(res);}
        )
    }

    //Save new default template selections
    $scope.save = function() {
        var defaultNames = [];
        for (var i = 0; i < $scope.defaultTemplates.length; i++) {
            defaultNames.push($scope.defaultTemplates[i].name);
        }
        TmplSvc.userDefaults().save(
            {'defaults': defaultNames},
            $scope.init,
            function(res) { AuthSvc.alertPostRoute(res);}
        )
    }

    $scope.init();
}]);

// Directive to link template file for upload
var templatesAddDirective = templatesAddApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    }
}]);

templatesAddCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]

