'use strict'

describe('user settings controller tests', function() {

    var description = 'some description';
    var timestamp = 'some timestamp';
    var uid = 'some uid';

    // Inject the controller's module 
    beforeEach(angular.mock.module('userSettingsMod'));

    var $controller;
    var $rootscope;

    describe('SettingsSvc successful', function() {

        var email = 'me@foo.com';
        var newEmail = 'newme@foo.com';
        var token = 'some token';
        var newToken = 'some new token';
        var pw = '';
        var currentPW = 'current pw';
        var newPW = 'some new password';
        var project = 'some project';
        var otherProject = 'some other project';
        var someUserEmail = 'someone@foo.com';
        var otherUserEmail = 'other@foo.com';
        var fromShares = [{'email': someUserEmail, 'project': project}];
        var other = {'sms': ''};

        // Mock SettingsSvc, CryptoSvc
        beforeEach(angular.mock.module({
            'SettingsSvc': { 
                'credentials': {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'credentials': {'uid': uid, 'token': ''}
                        })
                    },
                    'save': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'credentials': {'uid': uid, 'token': newToken}
                        })
                    }
                },
                'address': {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'address': {'email': email}
                        })
                    },
                    'save': function(data, success, error) {
                        email = data.address.email;
                        success({
                            'SR_status':'OK', 
                            'address': {'email': email, 'currentpw': ''}
                        })
                    }
                },
                'pw': {
                    'save': function(data, success, error) {
                        pw = data.password.pw;
                        success({
                            'SR_status':'OK', 
                        })
                    }
                },
                'fromShares': {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'shares': fromShares
                        })
                    },
                    'save': function(data, success, error) {
                        fromShares.push(data.share);
                        success({
                            'SR_status':'OK', 
                            'shares': fromShares
                        })
                    },
                    'remove': function(data, success, error) {
                        fromShares.splice(0, 1);
                        success({
                            'SR_status':'OK', 
                            'shares': fromShares
                        })
                    }
                },
                'other': {
                    'get': function(success, error) {
                        success({
                            'SR_status':'OK', 
                            'other': other
                        })
                    },
                    'save': function(data, success, error) {
                        other = data;
                        success({
                            'SR_status':'OK', 
                            'other': other
                        })
                    }
                }
            },
            'CryptoSvc': { 
                'init': function() {
                        return;
                    },
                'isEncrypted': function() {
                        return false;
                    }
            }
        }));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        it('should be able to initialize settings', inject(function($rootScope) {

            var $scope = $rootScope.$new();

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            // API credentials
            expect($scope.credentials).toEqual({'uid': uid, 'token': ''});

            // login email
            expect($scope.address).toEqual({'email': email});

            // projects shared from others
            expect($scope.fromShares).toEqual(fromShares);

            // SMS gateway
            expect($scope.other).toEqual(other);
        }));

        it('should be able to generate new token', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            $scope.genToken();

            expect($scope.credentials.token).toEqual(newToken);
        });

        it('should be able save new email address', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            expect($scope.address).toEqual({'email': email});

            // Change the address
            $scope.address = {'email': newEmail, 'currentpw': currentPW};
            $scope.submitEmail();

            expect(email).toEqual(newEmail);
            expect($scope.address).toEqual({'email': newEmail, 'currentpw': ''});
        });

        it('should be able save new password', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            expect(pw).toEqual('');

            // Change the password
            $scope.password = {'pw': newPW};
            $scope.submitPW();

            expect(pw).toEqual(newPW);
            expect($scope.password).toEqual({'pw': '', 'currentpw': ''});
        });

        it('should be able to add project shared from others', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            expect($scope.fromShares).toEqual([{'email': someUserEmail, 'project': project}]);

            // Add project
            $scope.fromShare = {'email': otherUserEmail, 'project': otherProject};
            $scope.submitFromShare();

            expect($scope.fromShares).toEqual([{'email': someUserEmail, 'project': project},
                                                {'email': otherUserEmail, 'project': otherProject}]);
        });

        it('should be able to remove project shared from others', function() {

            var $scope = {};

            // Inject controller
            var controller = $controller('UserSettingsCtrl', {$scope: $scope});

            // Depends on the previous test
            expect($scope.fromShares).toEqual([{'email': someUserEmail, 'project': project},
                                                {'email': otherUserEmail, 'project': otherProject}]);

            // Remove project
            $scope.fromShare = {'email': someUserEmail, 'project': project};
            $scope.deleteFromShare();

            expect($scope.fromShares).toEqual([{'email': otherUserEmail, 'project': otherProject}]);
        });
    });

    describe('SettingsSvc unsuccessful', function() {

        var email = 'me@foo.com';
        var newEmail = 'newme@foo.com';
        var token = 'some token';
        var newToken = 'some new token';
        var pw = '';
        var newPW = 'some new password';
        var project = 'some project';
        var otherProject = 'some other project';
        var someUserEmail = 'someone@foo.com';
        var otherUserEmail = 'other@foo.com';
        var fromShares = [{'email': someUserEmail, 'project': project}];
        var other = {'sms': ''};
        var errMsg = 'some message';

        // Mock CryptoSvc
        beforeEach(angular.mock.module({
            'CryptoSvc': { 
                'init': function() {
                        return;
                    },
                'isEncrypted': function() {
                        return false;
                    }
            }
        }));

        describe('credentials.get unsuccessful', function() {

            // Mock SettingsSvc.credentials.get calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during initialization', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('address.get unsuccessful', function() {

            // Mock SettingsSvc.address.get calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during initialization', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('fromShares.get unsuccessful', function() {

            // Mock SettingsSvc.fromShares.get calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during initialization', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('fromShares.save unsuccessful', function() {

            // Mock SettingsSvc.fromShares.save calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        },
                        'save': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error adding a project', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                // Add project
                $scope.fromShare = {'email': otherUserEmail, 'project': otherProject};
                $scope.submitFromShare();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('fromShares.remove unsuccessful', function() {

            // Mock SettingsSvc.fromShares.remove calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        },
                        'remove': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error removing a project', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                // Remove project
                $scope.deleteFromShare(0);

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('pw.save unsuccessful', function() {

            // Mock SettingsSvc.pw.save calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        }
                    },
                    'pw': {
                        'save': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during password save', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                // Submit new password
                $scope.password = newPW;
                $scope.submitPW();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        });

        describe('addr3ss.save unsuccessful', function() {

            // Mock SettingsSvc.address.save calling error callback
            beforeEach(angular.mock.module({
                'SettingsSvc': { 
                    'credentials': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'credentials': {'uid': uid, 'token': token}
                            })
                        }
                    },
                    'address': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'address': {'email': email}
                            })
                        },
                        'save': function(data, success, error) {
                            var res = {status: 400, data: {'SR_status': errMsg}};
                            error(res);
                        }
                    },
                    'fromShares': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'shares': fromShares
                            })
                        }
                    },
                    'other': {
                        'get': function(success, error) {
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        },
                        'save': function(data, success, error) {
                            other = data;
                            success({
                                'SR_status':'OK', 
                                'other': other
                            })
                        }
                    }
                }
            }));

            beforeEach(angular.mock.inject(function(_$controller_) {
                $controller = _$controller_;
            }));

            it('should alert on error during email save', inject(function(AlertSvc) {

                spyOn(AlertSvc, 'resAlert');
                var $scope = {};

                // Inject controller
                var controller = $controller('UserSettingsCtrl', {$scope: $scope});

                // Save new email
                $scope.email = newEmail;
                $scope.submitEmail();

                expect(AlertSvc.resAlert).toHaveBeenCalled();
                expect(AlertSvc.resAlert.calls.first().args[0].data.SR_status).toEqual(errMsg);
            }))
        })
    })
});






