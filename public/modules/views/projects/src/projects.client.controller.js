'use strict';

var projectsApp = angular.module('projectsMod')
var projectsCtrl;

projectsApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/projects', {
        templateUrl: 'modules/views/projects/src/projects.client.view.html',
        controller: 'projectsCtrl',
        resolve: {
            authCheck: projectsCtrl.authCheck
        }     
  });
}]);

var projectsCtrl = projectsApp.controller('projectsCtrl', ['$scope', '$location', 'SettingsSvc', 'ApiSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $location, SettingsSvc, ApiSvc, AlertSvc, AuthSvc, CryptoSvc) {

    $scope.init = function() {
        var separator = '~';
        $scope.projectsCrypto = {};
        $scope.projects = [];
        ApiSvc.resource.projectGet( 
            function(data1) { 
                $scope.projects = [];
                for (var i = 0; i < data1.projects.length; i++) {
                    var project = data1.projects[i];
                    var projName = project[0];
                    var projEncrypted = project[1];
                    if (projEncrypted && CryptoSvc.isEncrypted()) {
                        var salt = project[2];
                        if (salt && (salt.length > 0)) {
                            // salt is empty for projects encrypted in openssl format
                            CryptoSvc.computeAESKey(projName, salt);
                        }
                        var plain = CryptoSvc.decrypt(projName, projName);
                        if (!plain) {
                            // Not able to decrypt this project
                            $scope.projects.push({display: projName, resource: projName, decrypted: false});
                        }
                        else {
                            $scope.projects.push({display: plain, resource: projName, decrypted: true});
                        }
                    }
                    else {
                        // Project not encrypted or no passphrase given
                        $scope.projects.push({display: projName, resource: projName, decrypted: false});
                    }
                }
                SettingsSvc.fromShares.get(
                    function(data2) { 
                        if (data2.hasOwnProperty('shares')) {
                            for (var i = 0; i < data2.shares.length; i++) {
                                var share = data2.shares[i];
                                var projectPlus = share.project + separator + share.email;
                                if (share.encrypted && CryptoSvc.isEncrypted()) {
                                    if (share.salt && (share.salt.length > 0)) {
                                        // salt is empty for projects encrypted in openssl format
                                        CryptoSvc.computeAESKey(projectPlus, share.salt);
                                    }
                                    var plain = CryptoSvc.decrypt(projectPlus, share.project);
                                    if (!plain) {
                                        // Not able to decrypt this project
                                        $scope.projects.push({display: projectPlus, resource: projectPlus, decrypted: false});
                                    }
                                    else {
                                        var plainPlus = plain + separator + share.email;
                                        $scope.projects.push({display: plainPlus, resource: projectPlus, decrypted: true});
                                        $scope.projectsCrypto[plainPlus] = projectPlus;
                                    }
                                }
                                else {
                                    // Project not encrypted or no passphrase given
                                    $scope.projects.push({display: projectPlus, resource: projectPlus, decrypted: false});
                                }
                            }
                        }
                    },
                    function(res) { AuthSvc.alertPostRoute(res); }
                )
            },
            function(res) { 
                AuthSvc.alertPostRoute(res);
            }
        )
    }

    $scope.select = function(project) {
        if (project.decrypted) {
            $location.path('/jobs/' + project.display + '/' + project.resource);
        }
        else {
            $location.path('/jobs/' + project.display);
        }
    }

    $scope.init();
}]);

projectsCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]
