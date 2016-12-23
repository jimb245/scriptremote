
'use strict';

var should = require('should'),
	request = require('supertest'),
	Forge = require('node-forge'),
	newToken = require('../../../app/utils.js').newToken,
	initUsers = require('../../../app/tests/utils.js').initUsers,
	removeUsers = require('../../../app/tests/utils.js').removeUsers,
	getAPICredentials = require('../../../app/tests/utils.js').getAPICredentials;

/**
 * Globals
 */

var statusOK = 'OK';
var credentials = null;
var apiCredentials = null;
var csrfToken = null;
var uid = null;
var flags = null;
var project = null;


/**
 * Testing admin routes - some routes are also
 * included in user setup/cleanup code invoked for all 
 * tests (utils.js).
 *
 * Test credentials are defined in config/env/test.js
 */
describe('Admin tests', function() {

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

	it('get user1 API credentials', function(done) {
        getAPICredentials(agent, credentials.user1.email, credentials.user1.password,
            function(apicred) {
                apiCredentials = apicred;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });

	it('establish nonadmin user session for following', function(done) {
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
            getRes.body.admin.should.match(new RegExp('false'));
            done();
        })
    });

	it('should not be able to access admin routes', function(done) {
		agent.get('/admin/users')
            .expect(401)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                // Logout nonadmin user
                agent.get('/logout')
                    // Expecting a redirection to '/' for Angular app
                    .expect(302)
                    .end(function(getErr1, getRes1) {
                        getRes1.headers['location'].should.equal('/');
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

	it('establish admin user session for following', function(done) {
        agent.get('/login').end(function(getErr, getRes) {
            if (getErr) {
                done(getErr);
                return;
            }
            // Extract csrf token from response and post the admin login credentials
            var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
            var csrfMatch = getRes.text.match(csrfReg);
            csrfToken = csrfMatch[1];
            var csrfForm = '_csrf=' + csrfToken;
            var emailForm = 'email=' + credentials.admin.email;
            var passwordForm = 'password=' + credentials.admin.password;
            agent.post('/processlogin')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(emailForm)
                .send(passwordForm)
                .send(csrfForm)
                .end(function(postErr, postRes) {
                    if (postErr) {
                        done(postErr);
                        return;
                    }
                    done();
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
            var reg = new RegExp(credentials.admin.email);
            getRes.body.user.should.match(reg);
            getRes.body.admin.should.match(new RegExp('true'));
            done();
        })
    });

	it('get user1 uid and flags for following', function(done) {
        var get1 = agent.get('/admin/users')
            .expect(200);
        get1.end(function(getErr1, getRes1) {
            if (getErr1) {
                done(getErr1);
                return;
            }
            var users = getRes1.body.users;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email == credentials.user1.email) {
                    uid = users[i].uid;
                    break
                }
            }
            if (uid) {
                // Get user flags
                var get2 = agent.get('/admin/users/' + uid)
                    .expect(200);
                get2.end(function(getErr2, getRes2) {
                    if (getErr2) {
                        done(getErr2);
                        return;
                    }
                    getRes2.body.user.confirmed.should.equal(true);
                    getRes2.body.user.enabled.should.equal(true);
                    done();
                })
            }
        })
    });

	it('should be able to update user flags', function(done) {
        var flags1 = {'confirmed': false, 'enabled': false};
        var req1 = agent.put('/admin/users/' + uid)
            .set('Content-Type', 'application/json')
            .send(flags1)
            .set('X-XSRF-TOKEN', csrfToken);
        req1.end(function(putErr, putRes) {
            if (putErr) {
                done(putErr);
                return;
            }
            // Get updated flags
            var get1 = agent.get('/admin/users/' + uid)
                .expect(200);
            get1.end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                getRes.body.user.confirmed.should.equal(false);
                getRes.body.user.enabled.should.equal(false);
                done();
            })
        })
    });

	it('create project for following', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        project = {
            project_name: credentials.user1.project1,
            timestamp: timestamp1,
            project_name_form: 'project_name=' + credentials.user1.project1,
            timestamp_form: 'timestamp=' + timestamp1,
            encrypted_form: 'is_encrypted=0',
            description: 'Some description'
        };
		agent.post('/api/projects')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(project.project_name_form)
			.send(project.timestamp_form)
			.send(project.encrypted_form)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPostErr, projectPostRes) {
				if (projectPostErr) {
                    done(projectPostErr);
                    return;
                }
                done();
            });
    });

	it('should be able to update global options', function(done) {
        var options = {'jobsEnabled': false, 'regEnabled': false};
        var req1 = agent.put('/admin/options')
            .set('Content-Type', 'application/json')
            .send({'options': options})
            .set('X-XSRF-TOKEN', csrfToken);
        req1.end(function(putErr, putRes) {
            if (putErr) {
                done(putErr);
                return;
            }
            // Get updated options
            var get1 = agent.get('/admin/options')
                .expect(200);
            get1.end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                getRes.body.options.jobsEnabled.should.equal(false);
                getRes.body.options.regEnabled.should.equal(false);
                done();
            })
        })
    });

	it('should not be able to register new user', function(done) {

		agent.get('/register')
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var reg = new RegExp('Sorry - new registrations are temporarily disabled');
                getRes.body.should.match(reg);
                done();
            })
    })

	it('user should not be able to create job', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        var jobName1 = credentials.user1.project1 + '.Job1';
        var job1 = {
            job_name: jobName1,
            max_msgs: 10,
            timestamp: timestamp1,
            job_name_form: 'job_name=' + jobName1,
            max_msgs_form: 'max_msgs=10',
            timestamp_form: 'timestamp=' + timestamp1,
            description: 'Some description',
            jobId: null
        }
		agent.post('/api/projects/' + project.project_name + '/jobs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(job1.job_name_form)
			.send(job1.max_msgs_form)
			.send(job1.timestamp_form)
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                var reg = new RegExp('New job starts are temporarily disabled');
                jobPostRes.body.should.match(reg);
                done();
            })
        });

	it('should be able to restore global options', function(done) {
        var options = {'jobsEnabled': true, 'regEnabled': true};
        var req1 = agent.put('/admin/options')
            .set('Content-Type', 'application/json')
            .send({'options': options})
            .set('X-XSRF-TOKEN', csrfToken);
        req1.end(function(putErr, putRes) {
            if (putErr) {
                done(putErr);
                return;
            }
            // Get updated options
            var get1 = agent.get('/admin/options')
                .expect(200);
            get1.end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                getRes.body.options.jobsEnabled.should.equal(true);
                getRes.body.options.regEnabled.should.equal(true);
                // Logout admin user
                agent.get('/logout')
                    // Expecting a redirection to '/' for Angular app
                    .expect(302)
                    .end(function(getErr1, getRes1) {
                        getRes1.headers['location'].should.equal('/');
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
        })
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })

});


