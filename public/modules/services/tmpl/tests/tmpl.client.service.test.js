'use strict'

describe('tmpl service tests', function() {

    var tmplSvc;
    var httpBackend;
    var $rootScope;
    var pdata;

    var baseUrl = '/templates/';
    var locationUrl = function(project, jobid, location) {
        return baseUrl + 'location' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }
    var listUrl = baseUrl + 'list';
    var listSharedUrl = function(project, jobid, location) {
        return listUrl + '/' + 'share' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }
    var defaultsUrl = baseUrl + 'defaults';
    var defaultsSharedUrl = function(project, jobid, location) {
        return defaultsUrl + '/' + 'share' + '/' + encodeURIComponent(project) + '/' + jobid + '/' + encodeURIComponent(location);
    }

    // Inject the service module
    beforeEach(module('tmplMod'));
    beforeEach(module('ngResource'));

    describe('$resource methods, unshared project', function() {

        var project = 'someProject';
        var jobid = 'someId';
        var location = 'someLoc';
        var tmplNames = ['tmpl1', 'tmpl2', 'tmpl3', 'tmpl4', 'tmpl5'];
        var defaultContent = tmplNames[0];
        var defaultReply = tmplNames[1];
        var contentTmpl = defaultContent;
        var replyTmpl = defaultReply;

        beforeEach(inject(function($httpBackend) {
            httpBackend = $httpBackend;
        }));

        // Mock with $httpBackend
        beforeEach(inject(function() {

            httpBackend.when('GET', defaultsUrl)
                .respond(200, {'defaults': [defaultContent, defaultReply]});

            httpBackend.when('PUT', defaultsUrl, function(data) {
                    pdata = JSON.parse(data);
                    defaultContent = pdata.defaults[0];
                    defaultReply = pdata.defaults[1];
                    return true;
                })
                .respond(200);

            httpBackend.when('GET', listUrl)
                .respond(200, {'file_keys': tmplNames});

            httpBackend.when('GET', locationUrl(project, jobid, location))
                .respond(200, {'templates': [contentTmpl, replyTmpl]});

            httpBackend.when('PUT', locationUrl(project, jobid, location), function(data) {
                    pdata = JSON.parse(data);
                    contentTmpl = pdata.templates[0];
                    replyTmpl = pdata.templates[1];
                    return true;
                })
                .respond(200);
         }));

        // Get service instance
        var tmplSvc;
        beforeEach(inject(function($injector) {
            tmplSvc = $injector.get('TmplSvc');
        }));

        it('should be able get global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).get(
                function(data) {
                    expect(data.defaults).toEqual([defaultContent, defaultReply])
                    done();
                },
                function(res) {
                    expect('userDefaults.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able to set global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).save(
                {'defaults': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect(defaultContent).toEqual(tmplNames[2]);
                    expect(defaultReply).toEqual(tmplNames[3]);
                    done();
                },
                function(res) {
                    expect('userDefaults.save').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able get template list', function(done) {

            tmplSvc.listTmpl(project, jobid, location).get(
                function(data) {
                    expect(data.file_keys).toEqual(tmplNames)
                    done();
                },
                function(res) {
                    expect('listTmpl.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able get location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).get(
                function(data) {
                    expect(data.templates).toEqual([contentTmpl, replyTmpl])
                    done();
                },
                function(res) {
                    expect('locationTmpl.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able to change location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).save(
                {'templates': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect(contentTmpl).toEqual(tmplNames[2]);
                    expect(replyTmpl).toEqual(tmplNames[3]);
                    done();
                },
                function(res) {
                    expect('locationTmpl.save').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        })
    });

    describe('$resource methods, shared project', function() {

        var project = 'someProject~xyz@foo.com';
        var jobid = 'someId';
        var location = 'someLoc';
        var tmplNames = ['tmpl1', 'tmpl2', 'tmpl3', 'tmpl4', 'tmpl5'];
        var defaultContent = tmplNames[0];
        var defaultReply = tmplNames[1];
        var contentTmpl = defaultContent;
        var replyTmpl = defaultReply;

        beforeEach(inject(function($httpBackend) {
            httpBackend = $httpBackend;
        }));

        // Mock with $httpBackend
        beforeEach(inject(function() {

            httpBackend.when('GET', defaultsSharedUrl(project, jobid, location))
                .respond(200, {'defaults': [defaultContent, defaultReply]});

            httpBackend.when('PUT', defaultsSharedUrl(project, jobid, location), function(data) {
                    pdata = JSON.parse(data);
                    defaultContent = pdata.defaults[0];
                    defaultReply = pdata.defaults[1];
                    return true;
                })
                .respond(200);

            httpBackend.when('GET', listSharedUrl(project, jobid, location))
                .respond(200, {'file_keys': tmplNames});

            httpBackend.when('GET', locationUrl(project, jobid, location))
                .respond(200, {'templates': [contentTmpl, replyTmpl]});

            httpBackend.when('PUT', locationUrl(project, jobid, location), function(data) {
                    pdata = JSON.parse(data);
                    contentTmpl = pdata.templates[0];
                    replyTmpl = pdata.templates[1];
                    return true;
                })
                .respond(200);
         }));

        // Get service instance
        var tmplSvc;
        beforeEach(inject(function($injector) {
            tmplSvc = $injector.get('TmplSvc');
        }));

        it('should be able get global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).get(
                function(data) {
                    expect(data.defaults).toEqual([defaultContent, defaultReply])
                    done();
                },
                function(res) {
                    expect('userDefaults.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able to set global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).save(
                {'defaults': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect(defaultContent).toEqual(tmplNames[2]);
                    expect(defaultReply).toEqual(tmplNames[3]);
                    done();
                },
                function(res) {
                    expect('userDefaults.save').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able get template list', function(done) {

            tmplSvc.listTmpl(project, jobid, location).get(
                function(data) {
                    expect(data.file_keys).toEqual(tmplNames)
                    done();
                },
                function(res) {
                    expect('listTmpl.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able get location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).get(
                function(data) {
                    expect(data.templates).toEqual([contentTmpl, replyTmpl])
                    done();
                },
                function(res) {
                    expect('locationTmpl.get').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be able to change location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).save(
                {'templates': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect(contentTmpl).toEqual(tmplNames[2]);
                    expect(replyTmpl).toEqual(tmplNames[3]);
                    done();
                },
                function(res) {
                    expect('locationTmpl.save').toEqual('a success');
                    done();
                }
            );
            httpBackend.flush();
        })
    });

    describe('$resource methods, $http fails', function() {

        var project = 'someProject';
        var jobid = 'someId';
        var location = 'someLoc';
        var tmplNames = ['tmpl1', 'tmpl2', 'tmpl3', 'tmpl4', 'tmpl5'];
        var defaultContent = tmplNames[0];
        var defaultReply = tmplNames[1];
        var contentTmpl = defaultContent;
        var replyTmpl = defaultReply;

        beforeEach(inject(function($httpBackend) {
            httpBackend = $httpBackend;
        }));

        // Mock with $httpBackend
        beforeEach(inject(function() {

            httpBackend.when('GET', defaultsUrl)
                .respond(500, {'SR_status': 'Server error'});

            httpBackend.when('PUT', defaultsUrl, function(data) {
                    return true;
                })
                .respond(500, {'SR_status': 'Server error'});

            httpBackend.when('GET', listUrl)
                .respond(500, {'SR_status': 'Server error'});

            httpBackend.when('GET', locationUrl(project, jobid, location))
                .respond(500, {'SR_status': 'Server error'});

            httpBackend.when('PUT', locationUrl(project, jobid, location), function(data) {
                    return true;
                })
                .respond(500, {'SR_status': 'Server error'});
         }));

        // Get service instance
        var tmplSvc;
        beforeEach(inject(function($injector) {
            tmplSvc = $injector.get('TmplSvc');
        }));

        it('should be not able get global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).get(
                function(data) {
                    expect('userDefaults.get').toEqual('a failure');
                    done();
                },
                function(res) {
                    expect(res.status).toEqual(500);
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should be not able to set global defaults', function(done) {

            tmplSvc.userDefaults(project, jobid, location).save(
                {'defaults': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect('userDefaults.save').toEqual('a failure');
                    done();
                },
                function(res) {
                    expect(res.status).toEqual(500);
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should not be able get template list', function(done) {

            tmplSvc.listTmpl(project, jobid, location).get(
                function(data) {
                    expect('listTmpl.get').toEqual('a failure');
                    done();
                },
                function(res) {
                    expect(res.status).toEqual(500);
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should not be able get location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).get(
                function(data) {
                    expect('locationTmpl.get').toEqual('a failure');
                    done();
                },
                function(res) {
                    expect(res.status).toEqual(500);
                    done();
                }
            );
            httpBackend.flush();
        });

        it('should not be able to change location template settings', function(done) {

            tmplSvc.locationTmpl(project, jobid, location).save(
                {'templates': [tmplNames[2], tmplNames[3]]},
                function(data) {
                    expect('locationTmpl.save').toEqual('a failure');
                    done();
                },
                function(res) {
                    expect(res.status).toEqual(500);
                    done();
                }
            );
            httpBackend.flush();
        })
    });

    describe('$http methods, unshared project', function() {

        var project = 'someProject';
        var jobid = 'someId';
        var location = 'someLoc';
        var files = {'key1': 'file data 1', 'key2': 'file data 2'};
        var someKey = 'key1';
        var rootScope;

        // Need $http mock that can return promises.
        // Create initial mock module here before injector,
        // use spy's to complete.
        // Only testing download/get - for upload/post there isnt an
        // easy way to generate a file object eqivalent to browser input.
        beforeEach(function() {
            module(function($provide) {
                $provide.value('$http', {
                    get: {}
                })
            })
        });

        beforeEach(inject(function($http, $q) {
            spyOn($http, 'get').and.callFake(function(url, config) {
                var deferred = $q.defer();
                var sp = url.split('/');
                var key = sp[3];
                var res = {'status': 200, 'data': files[key]};
                deferred.resolve(res);
                return deferred.promise;
            });
        }));

        beforeEach(inject(function($rootScope) {
            rootScope = $rootScope;
        }));

        // Get service instance
        var tmplSvc;
        beforeEach(inject(function($injector) {
            tmplSvc = $injector.get('TmplSvc');
        }));

        it('should be able to download template file', function(done) {

            tmplSvc.fileDownload(someKey)
            .then(function(res) {
                    expect(res.status == 200);
                    expect(res.data).toEqual(files[someKey]);
                    done();
                },
                function() {
                    expect('fileUpload').toEqual('a success');
                    done();
                }
            )
            rootScope.$digest();
        })
    })
});

