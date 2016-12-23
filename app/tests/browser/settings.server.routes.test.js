
'use strict';

var should = require('should'),
	request = require('supertest'),
    initUsers = require('../../../app/tests/utils.js').initUsers,
    removeUsers = require('../../../app/tests/utils.js').removeUsers,
    getAPICredentialsByAdmin = require('../../../app/tests/utils.js').getAPICredentialsByAdmin;

/**
 * Globals
 */

var credentials = null;
var apiCredentials = null;
var csrfToken = null;

/**
 * Testing settings routes
 * Test credentials are defined in config/env/test.js
 */
describe('User settings tests', function() {

    var agent;

    before(function(done) {
        debugger;
        if (!global.myapp) {
            // Start the app
            require('../../../server_mod.js')()
            .then( function(app1) {
                agent = request.agent(app1);
                global.myapp = app1;
                credentials = global.myapp.locals.credentials;
                initUsers(agent, credentials, done);
            })
        }
        else {
            agent = request.agent(global.myapp);
            credentials = global.myapp.locals.credentials;
            initUsers(agent, credentials, done);
        }
    });

	it('get user1 API credentials as admin', function(done) {
        getAPICredentialsByAdmin(agent, credentials.admin.email, credentials.admin.password,
            credentials.user1.email,
            function(apicred) {
                apiCredentials = apicred;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });

    it('login as user1', function(done) {
        agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            csrfToken = csrfMatch[1];
            var csrfForm = '_csrf=' + csrfMatch[1];
            var emailForm = 'email=' + credentials.user1.email;
            var passwordForm = 'password=' + credentials.user1.password;
            var req = agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                // Expecting a redirection to '/' for Angular app
                .expect(302)
            req.end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                postRes.headers['location'].substring(0,5).should.equal('/?cb=');
                done();
            })
        })
    });

	it('should be able to get API user id', function(done) {
		agent.get('/settings-xhr/apiCredentials')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                (getRes.body.credentials.uid).should.equal(apiCredentials.uid);
                (getRes.body.credentials.token).should.equal('');
                done();
            })
    });

	it('should be able to generate API token', function(done) {
        var csrfForm = '_csrf=' + csrfToken;
		agent.post('/settings-xhr/apiCredentials')
            .send(csrfForm)
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                (getRes.body.credentials.uid).should.equal(apiCredentials.uid);
                (getRes.body.credentials.token.length).should.equal(24);
                done();
            })
    });

	it('should be able to get email address', function(done) {
		agent.get('/settings-xhr/address')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfReg = new RegExp('XSRF-TOKEN=(.*);');
                var cookies = getRes.headers['set-cookie'];
                var csrfMatch = cookies[0].match(csrfReg);
                csrfToken = csrfMatch[1];
                (getRes.body.address.email).should.equal(credentials.user1.email);
                done();
            })
    });

	it('should be able to set email address', function(done) {
        var newAddress = 'new@foo.com';
        // Change address
		agent.post('/settings-xhr/address')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({address: {email: newAddress, currentpw: credentials.user1.password}})
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                // Confirm change
                (postRes.status).should.equal(200);
                agent.get('/settings-xhr/address')
                    .end(function(getErr, getRes) {
                        if (getErr) {
                            done(getErr);
                            return;
                        }
                        (getRes.status).should.equal(200);
                        (getRes.body.address.email).should.equal(newAddress);
                        // Change back to original
                        agent.post('/settings-xhr/address')
                            .set('Content-Type', 'application/json')
                            .set('X-XSRF-TOKEN', csrfToken)
                            .send({address: {email: credentials.user1.email, currentpw: credentials.user1.password}})
                            .end(function(postErr2, postRes2) {
                                if (postErr2) {
                                    done(postErr2);
                                    return;
                                }
                                (postRes2.status).should.equal(200);
                                done();
                            })
                    })
            })
    });

	it('should be able to set mew password', function(done) {
        var newpw = 'xxxyyyzzz';
        // Change password
		agent.post('/settings-xhr/password')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({password: {pw: newpw, currentpw: credentials.user1.password}})
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                // Confirm change
                (postRes.status).should.equal(200);
                agent.get('/logout')
                    .end(function(getErr, getRes) {
                        if (getErr) {
                            done(getErr);
                            return;
                        }
                        agent.get('/login').end(function(getErr1, getRes1) {
                            if (getErr1) {
                                done(getErr1);
                                return;
                            }
                            // Extract csrf token from response and post the login credentials
                            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                            var csrfMatch = getRes1.text.match(csrfReg);
                            csrfToken = csrfMatch[1];
                            var csrfForm = '_csrf=' + csrfToken;
                            var emailForm = 'email=' + credentials.user1.email;
                            var passwordForm = 'password=' + newpw;
                            var req = agent.post('/processlogin')
                                .set('Content-Type', 'application/x-www-form-urlencoded')
                                .send(emailForm)
                                .send(passwordForm)
                                .send(csrfForm)
                                .expect(302)
                            req.end(function(postErr2, postRes2) {
                                if (postErr2) {
                                    done(postErr2);
                                    return;
                                }
                                // Change back
                                agent.post('/settings-xhr/password')
                                    .set('Content-Type', 'application/json')
                                    .set('X-XSRF-TOKEN', csrfToken)
                                    .send({password: {pw: credentials.user1.password, currentpw: newpw}})
                                    .end(function(postErr3, postRes3) {
                                        if (postErr3) {
                                            done(postErr3);
                                            return;
                                        }
                                        done();
                                    })
                            })
                        })

                    })
            })
    });

	it('should not be able to set email address to one already in use', function(done) {
        var newAddress = credentials.user2.email;
        // Change address
		agent.post('/settings-xhr/address')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({address: {email: newAddress, currentpw: credentials.user1.password}})
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                (postRes.status).should.equal(400);
                done();
            })
    });

	it('create user1 projects for share test', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        var project1 = {timestamp: timestamp1, project_name: credentials.user1.project1, is_encrypted: false};
		agent.post('/brsapi/projects')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(project1)
			.expect(200)
			.end(function(postErr1, postRes1) {
				if (postErr1) {
                    done(postErr1);
                    return;
                }
                var timestamp2 = ((new Date()).getTime()).toString();
                var project2 = {timestamp: timestamp2, project_name: credentials.user1.project2, is_encrypted: false};
                agent.post('/brsapi/projects')
                    .set('Content-Type', 'application/json')
                    .set('X-XSRF-TOKEN', csrfToken)
                    .send(project2)
                    .expect(200)
                    .end(function(postErr2, postRes2) {
                        if (postErr2) {
                            done(postErr2);
                            return;
                        }
                        done();
                    })
            })
    });

	it('add project share permission', function(done) {
        var projectShare = {
            email: credentials.user2.email,
            action: 'add',
            access: 'read'
        }
        agent.put('/brsapi/projects/' + credentials.user1.project1 + '/share')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(projectShare)
			.expect(200)
			.end(function(putErr, putRes) {
				if (putErr) {
                    done(putErr);
                    return;
                }
                done();
            })
    });

	it('logout user1', function(done) {
		agent.get('/logout')
            // Expecting a redirection to '/' for Angular app
            .expect(302)
            .end(function(getErr, getRes) {
                getRes.headers['location'].should.equal('/');
				if (getErr) {
                    done(getErr);
                    return;
                }
                done();
            })
    });

    it('login as user2', function(done) {
        agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            csrfToken = csrfMatch[1];
            var csrfForm = '_csrf=' + csrfMatch[1];
            var emailForm = 'email=' + credentials.user2.email;
            var passwordForm = 'password=' + credentials.user2.password;
            var req = agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                // Expecting a redirection to '/' for Angular app
                .expect(302)
            req.end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                postRes.headers['location'].substring(0,5).should.equal('/?cb=');
                done();
            })
        })
    });

	it('should be able to add fromshare for permitted project', function(done) {
		agent.post('/settings-xhr/fromShares')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({share: {email: credentials.user1.email, project: credentials.user1.project1}})
            .expect(200)
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                var share = postRes.body.shares[0];
                (share.email).should.equal(credentials.user1.email);
                (share.project).should.equal(credentials.user1.project1);
                done();
            })
    });

	it('should be able to query fromshares', function(done) {
		agent.get('/settings-xhr/fromShares')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                (getRes.body.shares.length).should.equal(1);
                var share = getRes.body.shares[0];
                (share.email).should.equal(credentials.user1.email);
                (share.project).should.equal(credentials.user1.project1);
                done();
            })
    });

	it('should not be able to add fromshare for unpermitted project', function(done) {
		agent.post('/settings-xhr/fromShares')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({share: {email: credentials.user1.email, project: credentials.user1.project2}})
            .expect(401)
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                done();
            })
    });

	it('should be able to remove fromshare for permitted project', function(done) {
		agent.put('/settings-xhr/fromShares')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send({share: {email: credentials.user1.email, project: credentials.user1.project1}})
            .expect(200)
            .end(function(putErr, putRes) {
                if (putErr) {
                    done(putErr);
                    return;
                }
                (putRes.body.shares.length).should.equal(0);
                done();
            })
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })
})

