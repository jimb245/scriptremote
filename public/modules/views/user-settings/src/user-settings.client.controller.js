'use strict';

// This view is for managing user settings for:
//  API credentials
//  encryption
//  email address
//  project sharing
//  sms gateway email
//  

var userSettingsApp = angular.module('userSettingsMod');
var userSettingsCtrl;

userSettingsApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/settings', {
        templateUrl: 'modules/views/user-settings/src/user-settings.client.view.html',
        controller: 'UserSettingsCtrl',
        resolve: {
            authCheck: userSettingsCtrl.authCheck
        }     
    })
}]);

var userSettingsCtrl = userSettingsApp.controller('UserSettingsCtrl', ['$scope', '$window', '$q', 'SettingsSvc', 'AlertSvc', 'AuthSvc', 'CryptoSvc', function(
    $scope, $window, $q, SettingsSvc, AlertSvc, AuthSvc, CryptoSvc) {

    // Get API user id
    $scope.getUserId = function() {
        SettingsSvc.credentials.get(
            function(data) { $scope.credentials = data.credentials;
                            $scope.credentials.token = ''},
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Get new API token
    $scope.genToken = function() {
        SettingsSvc.credentials.save(
            function(data) { $scope.credentials = data.credentials; },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Save a new encryption passphrase
    $scope.submitPassphrase = function() {
        if ($scope.encryption.save) {
            $window.localStorage.setItem("passphrase", $scope.encryption.passphrase);
            $window.sessionStorage.removeItem("passphrase");
            CryptoSvc.init();
        }
        else {
            $window.sessionStorage.setItem("passphrase", $scope.encryption.passphrase);
            $window.localStorage.removeItem("passphrase");
            CryptoSvc.init();
        }
        if ($scope.encryption.passphrase.length > 0) {
            $scope.encryption.placeholder = 'Passphrase is set';
        }
        else {
            $scope.encryption.placeholder = 'No passphrase set';
        }
        $scope.encryption.passphrase = '';
    }

    // Save a new email address
    $scope.submitEmail = function() {
        SettingsSvc.address.save({'address': $scope.address},
            function(data) { 
                $scope.address = data.address; 
                $scope.address.currentpw = "";
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Save a new login password
    $scope.submitPW = function() {
        SettingsSvc.pw.save({'password': $scope.password},
            function(data) { 
                $scope.password.pw = "";
                $scope.password.currentpw = "";
                AlertSvc.msgAlert("info", "The password has been changed");
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Add a new project shared from others
    $scope.submitFromShare = function() {
        if ($scope.fromShare.hasOwnProperty('project') && $scope.fromShare.hasOwnProperty('email')) {
            SettingsSvc.fromShares.save({'share': $scope.fromShare},
                function(data) { 
                    $scope.fromShares = data.shares;
                },
                function(res) { 
                    AuthSvc.alertPostRoute(res);
                }
            )
        }
    }

    // Remove a project shared from others
    $scope.deleteFromShare = function(index) {
        SettingsSvc.fromShares.remove({share: $scope.fromShares[index]}, 
            function(data) { 
                $scope.fromShares = data.shares;
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    // Save a new sms address
    $scope.submitSMS = function() {
        SettingsSvc.other.save({'sms': $scope.other.sms},
            function(data) { 
                $scope.other = data.other; 
            },
            function(res) { AuthSvc.alertPostRoute(res); }
        )
    }

    $scope.init = function() {
        $scope.encryption = {passphrase: '', placeholder: 'No passphrase set'};
        $scope.password = {pw: '', currentpw: ''};
        if (CryptoSvc.isEncrypted()) {
            $scope.encryption.placeholder = 'Passphrase is set';
        }

        SettingsSvc.credentials.get(
            function(data1) { 
                $scope.credentials = data1.credentials;
                $scope.credentials.token = '';
                SettingsSvc.address.get(
                    function(data2) { 
                        $scope.address = data2.address;
                        SettingsSvc.fromShares.get(
                            function(data3) { 
                                $scope.fromShares = data3.shares;
                                SettingsSvc.other.get(
                                    function(data4) { $scope.other = data4.other; },
                                    function(res4) { AuthSvc.alertPostRoute(res4); }
                                )
                            },
                            function(res3) { AuthSvc.alertPostRoute(res3); }
                        )
                    },
                    function(res2) { AuthSvc.alertPostRoute(res2); }
                )
            },
            function(res1) { AuthSvc.alertPostRoute(res1); }
        )
    }

    $scope.init();

}]);

userSettingsCtrl.authCheck = ['AuthSvc', 'AlertSvc', function(AuthSvc, AlertSvc) {
    return AuthSvc.checkAtRoute()
}]

