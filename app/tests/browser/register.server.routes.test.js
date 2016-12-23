
'use strict';

var should = require('should'),
	request = require('supertest'),
	Forge = require('node-forge'),
	getAPICredentialsByAdmin = require('../../../app/tests/utils.js').getAPICredentialsByAdmin,
	getUsers = require('../../../app/tests/utils.js').getUsers,
	removeUsers = require('../../../app/tests/utils.js').removeUsers;


/**
 * Globals
 */

var credentials = null;
var statusOK = 'OK';
var csrfForPost = null;
var apiCredentials = null;

/**
 * Testing registration routes
 * Test credentials are defined in config/env/test.js
 */
describe('Registration tests', function() {

    var agent;

    before(function(done) {
        if (!global.myapp) {
            // Start the app
            require('../../../server_mod.js')()
            .then( function(app1) {
                agent = request.agent(app1);
                global.myapp = app1;
                credentials = global.myapp.locals.credentials;
                done();
            })
        }
        else {
            agent = request.agent(global.myapp);
            credentials = global.myapp.locals.credentials;
            done();
        }
    });

	it('should not be able to submit registration form with invalid csrf', function(done) {

		agent.get('/register')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfForm = '_csrf=' + 'dummy';
                var nameForm = 'name=' + credentials.user1.name;
                var companyForm = 'company=' + credentials.user1.company;
                var emailForm = 'email=' + credentials.user1.email;
                var passwordForm = 'password=' + credentials.user1.password;
                var req = agent.post('/processreg')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(nameForm)
                    .send(companyForm)
                    .send(emailForm)
                    .send(passwordForm)
                    .send(csrfForm)
                    .expect(401);
            done();
        });
    });

	it('should be able to submit registration form with valid csrf', function(done) {

		agent.get('/register')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                // Extract csrf token from response and post the reg data
                var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                var csrfMatch = getRes.text.match(csrfReg);
                csrfForPost = csrfMatch[1];
                var csrfForm = '_csrf=' + csrfMatch[1];
                var nameForm = 'name=' + credentials.user2.name;
                var companyForm = 'company=' + credentials.user2.company;
                var emailForm = 'email=' + credentials.user2.email;
                var passwordForm = 'password=' + credentials.user2.password;
                var req = agent.post('/processreg')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(nameForm)
                    .send(companyForm)
                    .send(emailForm)
                    .send(passwordForm)
                    .send(csrfForm)
                    // Expecting a redirection to '/requestregconfirm'
                    // which informs about email confirmation
                    .expect(302)
                req.end(function(postErr, postRes) {
                    if (postErr) {
                        done(postErr);
                        return;
                    }
                    var encodedEmail = encodeURIComponent(credentials.user2.email);
                    postRes.headers['location'].should.equal('/requestregconfirm?email=' + encodedEmail);
                    // Do the redirect
                    agent.get('/requestregconfirm?email=' + encodedEmail)
                        .expect(200)
                        .end(function(redErr, redRes) {
                            if (redErr) {
                                done(redErr);
                                return;
                            }
                            redRes.text.should.match(/An email has been sent/)
                            done();

                    })
            })
        })
    });

	it('should not be able to confirm registration without valid emailed token', function(done) {

        // Checking POST route as in submitting token in form
        var csrfForm = '_csrf=' + csrfForPost;
        var tokenForm = 'token=' + 'dummy';
        agent.post('/processconfirm')
            .expect(404)
            .end(function(resErr, resRes) {
                if (resErr) {
                    done(resErr);
                    return;
                }
                done();
            })
    });

	it('should not be able to confirm registration without valid emailed token', function(done) {

        // Checking GET route as in email link
        agent.get('/processconfirm/dummy')
            .expect(404)
            .end(function(resErr, resRes) {
                if (resErr) {
                    done(resErr);
                    return;
                }
                done();
            })
    });

	it('getting API credentials for following', function(done) {
        getAPICredentialsByAdmin(agent, credentials.admin.email, credentials.admin.password,
            credentials.user2.email,
            function(apicred) {
                apiCredentials = apicred;
                credentials.user2.uid = apiCredentials.uid;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });

	it('should be able to confirm registration with valid emailed token', function(done) {

        // Checking GET route as in email link
        // Construct the same token as sent in email
        var buf = Forge.util.encode64(credentials.user2.email);
        var token = apiCredentials.regToken + buf;
        agent.get('/processregconfirm/' + token)
            .expect(200)
            .end(function(resErr, resRes) {
                if (resErr) {
                    done(resErr);
                    return;
                }
                done();
            })
    });

	it('should now be able to login', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
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
                done();
            })
        })
    });

	it('should not be able to register with already registered email', function(done) {

		agent.get('/register')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                var csrfMatch = getRes.text.match(csrfReg);
                var nameForm = 'name=' + credentials.user2.name;
                var companyForm = 'company=' + credentials.user2.company;
                var emailForm = 'email=' + credentials.user2.email;
                var passwordForm = 'password=' + credentials.user2.password;
                var csrfForm = '_csrf=' + csrfMatch[1];
                var req = agent.post('/processreg')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(nameForm)
                    .send(companyForm)
                    .send(emailForm)
                    .send(passwordForm)
                    .send(csrfForm)
                    // Expecting a redirection to '/register'
                    .expect(302)
                req.end(function(postErr, postRes) {
                    if (postErr) {
                        done(postErr);
                        return;
                    }
                    postRes.headers['location'].should.match(/register/);
                    postRes.text.should.match(/already%2520registered/);
                    // Do the redirect
                    agent.get('/register?email=' + credentials.escapedEmail)
                        .expect(200)
                        .end(function(redErr, redRes) {
                            if (redErr) {
                                done(redErr);
                                return;
                            }
                            done();
                        })
                })
            })
    });

    /*
    * Need to persist the session for superagent in
    * the after block - logout is tested there.
    *
	it('should be able to logout', function(done) {
		agent.get('/logout').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            done();
        })
    });
    */

    /*

	it('should not be able to login unconfirmed user', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            var csrfForm = '_csrf=' + csrfMatch[1];
            var emailForm = 'email=' + credentials.email;
            var passwordForm = 'password=' + credentials.password;
            var req = agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                // Expecting a redirection to '/requestregconfirm'
                .expect(302)
            req.end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                postRes.headers['location'].should.match(/requestregconfirm/);
                // Do the redirect
                agent.get('/requestregconfirm?email=' + credentials.escapedEmail)
                    .expect(200)
                    .end(function(redErr, redRes) {
                        if (redErr) {
                            done(redErr);
                            return;
                        }
                        redRes.text.should.match(/An email has been sent/)
                        done();
                    })
            })
        })
    })

    */

    after(function(done) {
        removeUsers(agent, credentials, done);
    })
})
