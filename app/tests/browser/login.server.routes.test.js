
'use strict';

var should = require('should'),
	request = require('supertest'),
	Forge = require('node-forge'),
	newToken = require('../../../app/utils.js').newToken,
	initUsers = require('../../../app/tests/utils.js').initUsers,
	removeUsers = require('../../../app/tests/utils.js').removeUsers,
	getAPICredentialsByAdmin = require('../../../app/tests/utils.js').getAPICredentialsByAdmin;

/**
 * Globals
 */

var statusOK = 'OK';
var credentials = null;
var csrfForReset = null;
var apiCredentials = null;


/**
 * Testing login/logout routes
 * Test credentials are defined in config/env/test.js
 */
describe('Login/logout tests', function() {

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
            // app is already running
            agent = request.agent(global.myapp);
            credentials = global.myapp.locals.credentials;
            initUsers(agent, credentials, done);
        }
    });

	it('should not be able to login without valid csrf', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            var csrfForm = '_csrf=' + 'dummy';
            var emailForm = 'email=' + credentials.user1.email;
            var passwordForm = 'password=' + credentials.user1.password;
            var req = agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                .expect(302);
            done();
        })
    });

	it('should be able to login with valid csrf', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
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
                // Do the redirect
                agent.get('/')
                    .expect(200)
                    .end(function(redErr, redRes) {
                        if (redErr) {
                            done(redErr);
                            return;
                        }
                        redRes.text.should.match(/Layout template for the Angular/)
                        done();

                    })
            })
        })
    });

	it('should now have a valid session', function(done) {
		agent.get('/authcheck').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            getRes.body.SR_status.should.match(new RegExp(statusOK));
            var reg = new RegExp(credentials.user1.email);
            getRes.body.user.should.match(reg);
            done();
        })
    });

	it('should be able to logout', function(done) {
		agent.get('/logout')
            // Expecting a redirection to '/' for Angular app
            .expect(302)
            .end(function(getErr, getRes) {
                getRes.headers['location'].should.equal('/');
                // Do the redirect
                agent.get('/')
                    .expect(200)
                    .end(function(redErr, redRes) {
                        if (redErr) {
                            done(redErr);
                            return;
                        }
                        redRes.text.should.match(/Layout template for the Angular/)
                        done();
                    })
            })
    });

	it('should no longer have a valid session', function(done) {
		agent.get('/authcheck').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            done();
        })
    });

	it('should not be able to login unregistered user', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            var csrfForm = '_csrf=' + csrfMatch[1];
            var emailForm = 'email=' + 'foo@bar.com';
            var passwordForm = 'password=' + '123';
            var req = agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                .expect(403)
            req.end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                postRes.text.should.match(/Login failed/)
                done();
            })
        })
    });

	it('should not be able to send password reset email request with invalid csrf', function(done) {
		agent.get('/sendreset')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfForm = '_csrf=' + 'dummy';
                var emailForm = 'email=' + credentials.user1.email;
                var req = agent.post('/processinitreset')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(emailForm)
                    .send(csrfForm)
                    .expect(401);
                done();
            });
    });

	it('should be able to send password reset email request with valid csrf', function(done) {
        debugger;

		agent.get('/sendreset')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                var csrfMatch = getRes.text.match(csrfReg);
                var csrfForm = '_csrf=' + csrfMatch[1];
                // Sending email to admin since it's valid address and
                // user1 address is not. This will set registration
                // token property of admin user, not user1.
                var emailForm = 'email=' + credentials.admin.email;
                agent.post('/processinitreset')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(emailForm)
                    .send(csrfForm)
                    .expect(200)
                    .end(function(postErr, postRes) {
                        done();
                    })
            })
    });

	it('should be able to send password reset email request with valid csrf', function(done) {
        debugger;

		agent.get('/sendreset')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                var csrfMatch = getRes.text.match(csrfReg);
                var csrfForm = '_csrf=' + csrfMatch[1];
                // Sending email to bogus user1 address will fail but 
                // registration token property of user1 will get set
                // for later.
                var emailForm = 'email=' + credentials.user1.email;
                agent.post('/processinitreset')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(emailForm)
                    .send(csrfForm)
                    .expect(200)
                    .end(function(postErr, postRes) {
                        done();
                    })
            })
    });

	it('should not be able to get password reset form without valid emailed token', function(done) {
        debugger;
        // Testing emailed token made with valid email address plus random API token
        var buf = Forge.util.encode64(credentials.user1.email);
        var newtok = newToken();
        var token = newtok + buf;
		agent.get('/processresetconfirm?token=' + token)
            // Expecting a redirect to allow retry
            .expect(302)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                getRes.headers['location'].should.match(/sendreset/);
                done();
            })
    });

	it('should not be able to get password reset form without valid emailed token', function(done) {
        debugger;
        // Testing emailed token that is nonsense
		agent.get('/processresetconfirm?token=' + 'dummy')
            // Expecting a redirect to allow retry
            .expect(302)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                getRes.headers['location'].should.match(/sendreset/);
                done();
            })
    });


	it('getting user1 email token for following', function(done) {
        debugger;
        // This will get emailed token of user1
        getAPICredentialsByAdmin(agent, credentials.admin.email, 
            credentials.admin.password, credentials.user1.email,
            function(apicred) {
                apiCredentials = apicred;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });


	it('should be able to get password reset form with valid email token', function(done) {
        debugger;
        if (apiCredentials) {
            // Construct the same token as was sent in email
            var buf = Forge.util.encode64(credentials.user1.email);
            var token = apiCredentials.regToken + buf;
            // Get the form
            var get1 = agent.get('/processresetconfirm?token=' + token);
                //.expect(200);
            get1.end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                // Save the csrf token for next test
                var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
                var csrfMatch = getRes.text.match(csrfReg);
                csrfForReset = csrfMatch[1];
                done();
            })
        }
        else {
            done();
        }
    });

	it('should be able to submit password reset form with valid csrf', function(done) {
        debugger;
        var csrfForm = '_csrf=' + csrfForReset;
        var emailForm = 'email=' + credentials.user1.email;
        var passwordForm = 'password=' + 'newpass';
        // Sending change notice to bogus user1 email but password
        // will be changed, confirmed by next test
        var req = agent.post('/processreset')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(csrfForm)
            .send(emailForm)
            .send(passwordForm)
            .expect(200)
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                done();
            })
    });

	it('should be able to login with new password', function(done) {
		agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            var csrfForm = '_csrf=' + csrfMatch[1];
            var emailForm = 'email=' + credentials.user1.email;
            var passwordForm = 'password=' + 'newpass';
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
                // Do the redirect
                agent.get('/')
                    .expect(200)
                    .end(function(redErr, redRes) {
                        if (redErr) {
                            done(redErr);
                            return;
                        }
                        redRes.text.should.match(/Layout template for the Angular/)
                        done();

                    })
            })
        })
    });

	it('should be able to logout', function(done) {
		agent.get('/logout')
            // Expecting a redirection to '/' for Angular app
            .expect(302)
            .end(function(getErr, getRes) {
                getRes.headers['location'].should.equal('/');
                // Do the redirect
                agent.get('/')
                    .expect(200)
                    .end(function(redErr, redRes) {
                        if (redErr) {
                            done(redErr);
                            return;
                        }
                        redRes.text.should.match(/Layout template for the Angular/)
                        done();
                    })
            })
    });

	it('should not be able to submit password reset form with invalid csrf', function(done) {
        var csrfForm = '_csrf=' + 'dummy';
        var emailForm = 'email=' + credentials.user1.email;
        var passwordForm = 'password=' + 'newpass';
        var buf = Forge.util.encode64(credentials.user1.email);
        var newtok = newToken();
        var token = newtok + buf;
        var req = agent.post('/processreset')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(csrfForm)
            .send(emailForm)
            .send(passwordForm)
            .send(token)
            .expect(500)
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                done();
            })
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })

});


