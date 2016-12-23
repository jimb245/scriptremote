
'use strict';

var should = require('should'),
	request = require('supertest'),
    initUsers = require('../../../app/tests/utils.js').initUsers,
    removeUsers = require('../../../app/tests/utils.js').removeUsers,
    getAPICredentials = require('../../../app/tests/utils.js').getAPICredentials;

/**
 * Globals
 */

var credentials = null;
var apiCredentials = null;
var csrfToken = null;
var project1 = null;
var job1 = null;
var location1 = null;
var message1 = null;
var shortKeys = null;
var statusOK = 'OK';

/**
 * Testing server components of SMS notification
 *
 * Test credentials are defined in config/env/test.js
 */
describe('Notification tests', function() {

    var agent;

    before(function(done) {
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

    //
    // notify test requires a working email address so using admin as
    // account to be notified
    //
    it('login as admin', function(done) {
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
            var emailForm = 'email=' + credentials.admin.email;
            var passwordForm = 'password=' + credentials.admin.password;
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

	it('create project for test', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        project1 = {timestamp: timestamp1, project_name: credentials.admin.project1, is_encrypted: false};
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
                done();
            })
    });

	it('enable notifications on project', function(done) {
        var projectNotify = {
            nickname: 'MyProject',
            action: 'on'
        }
        agent.put('/brsapi/projects/' + credentials.admin.project1 + '/notify')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(projectNotify)
			.expect(200)
			.end(function(putErr, putRes) {
				if (putErr) {
                    done(putErr);
                    return;
                }
                done();
            })
    });

	it('create a job for test', function(done) {
        var timestamp2 = ((new Date()).getTime()).toString();
        var jobName1 = credentials.admin.project1 + '.Job1';
        job1 = {
            job_name: jobName1,
            max_msgs: 10,
            timestamp: timestamp2,
            description: 'Some description',
            jobId: null
        }

		agent.post('/brsapi/projects/' + project1.project_name + '/jobs')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(job1)
			.expect(200)
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(200);
                (jobPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                job1.jobId = jobPostRes.body.job;
                done();
            })
    });

    it('create message for test', function(done) {
        debugger;
        location1 = {
            location_name: 'Loc1'
        }
        var timestamp3 = ((new Date()).getTime()).toString();
        message1 = {
            content: JSON.stringify("Some content"),
            is_reply: 'false',
            timestamp: timestamp3,
            msgId: null
        }
        agent.post('/brsapi/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .send(message1)
            .expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
            .end(function(msgPostErr, msgPostRes) {
                if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message1.msgId = msgPostRes.body.message;
                done();
            });
    });

	it('should be able to get shortened url keys from message', function(done) {
        agent.get('/brsapi/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId + '/shorts')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                shortKeys = getRes.body.keys;
                done();
            })
    });

	it('should be able to redirect to message from shortened url', function(done) {
        var shortKey1 = shortKeys[0];
		agent.get('/short/' + shortKey1)
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(302)
            // Apparently this is the best we can do - doesnt seem to be
            // a way to follow redirect into single-page application 
            // with superagent
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                done();

            })
    });

	it('should delete shortened url if message is deleted', function(done) {
        agent.delete('/brsapi/projects/' + project1.project_name)
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                var shortKey1 = shortKeys[0];
                agent.get('/short/' + shortKey1)
                    .set('Content-Type', 'application/json')
                    .set('X-XSRF-TOKEN', csrfToken)
                    .expect(404)
                    .end(function(getErr, getRes) {
                        if (getErr) {
                            done(getErr);
                            return;
                        }
                        done();
                    })
            })
    });

    //
    // For testing notification for shared project use API credentials to create 
    // project owned by user1 to be shared by admin
    //
	it('create user1 project for admin sharing', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        project1 = {
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
            .send(project1.project_name_form)
			.send(project1.timestamp_form)
			.send(project1.encrypted_form)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPostErr, projectPostRes) {
				if (projectPostErr) {
                    done(projectPostErr);
                    return;
                }
                done();
            });
    });

	it('admin should not be able to enable notifications for project', function(done) {
        var projectNotify = {
            nickname: 'MyProject',
            action: 'on'
        }
        var projectName = project1.project_name + '~' + credentials.user1.email;
        agent.put('/brsapi/projects/' + projectName + '/notify')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(projectNotify)
			.expect(401)
			.end(function(putErr, putRes) {
				if (putErr) {
                    done(putErr);
                    return;
                }
                done();
            })
    });

	it('add share "read" permission for admin to project', function(done) {
        var addShare = {
            email: credentials.admin.email,
            access: 'read',
            action: 'add'
        }
        agent.put('/api/projects/' + project1.project_name + '/share')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            });
    });

	it('create a job for sharing', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        var jobName1 = credentials.user1.project1 + '.Job1';
        job1 = {
            job_name: jobName1,
            max_msgs: 10,
            timestamp: timestamp1,
            job_name_form: 'job_name=' + jobName1,
            max_msgs_form: 'max_msgs=10',
            timestamp_form: 'timestamp=' + timestamp1,
            description: 'Some description',
            jobId: null
        }

		agent.post('/api/projects/' + project1.project_name + '/jobs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(job1.job_name_form)
			.send(job1.max_msgs_form)
			.send(job1.timestamp_form)
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(200);
                (jobPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                job1.jobId = jobPostRes.body.job;
                done();
            })
    });

	it('admin should be able to enable notifications for project', function(done) {
        var projectNotify = {
            nickname: 'MyProject',
            action: 'on'
        }
        var projectName = project1.project_name + '~' + credentials.user1.email;
        agent.put('/brsapi/projects/' + projectName + '/notify')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
			.send(projectNotify)
			.expect(200)
			.end(function(putErr, putRes) {
				if (putErr) {
                    done(putErr);
                    return;
                }
                done();
            })
    });

	it('create message for sharing', function(done) {
        location1 = {
            location_name: 'Loc1'
        }
        debugger;
        var timestamp1 = ((new Date()).getTime()).toString();
        var someContent = "Some content";
        message1 = {
            content: JSON.stringify(someContent),
            is_reply: 'false',
            timestamp: timestamp1,
            content_form: 'content=' + JSON.stringify(someContent),
            is_reply_form: 'is_reply=false',
            timestamp_form: 'timestamp=' + timestamp1,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(message1.content_form)
			.send(message1.is_reply_form)
			.send(message1.timestamp_form)
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message1.msgId = msgPostRes.body.message;
                done();
            });
    });

	it('admin should be able to get shortened url keys from message', function(done) {
        var projectName = project1.project_name + '~' + credentials.user1.email;
        agent.get('/brsapi/projects/' + projectName + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId + '/shorts')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(200)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                shortKeys = getRes.body.keys;
                done();
            })
    });

	it('admin should be able to redirect to message from shortened url', function(done) {
        var shortKey1 = shortKeys[0];
		agent.get('/short/' + shortKey1)
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(302)
            // Apparently this is the best we can do - doesnt seem to be
            // a way to follow redirect into single-page application 
            // with superagent
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                done();

            })
    });

    it('logout as admin', function(done) {
        agent.get('/logout')
            .expect(302)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                done();
            })
    });

	it('admin should not be able to get shortened url keys from message', function(done) {
        var projectName = project1.project_name + '~' + credentials.user1.email;
        agent.get('/brsapi/projects/' + projectName + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId + '/shorts')
            .set('Content-Type', 'application/json')
            .set('X-XSRF-TOKEN', csrfToken)
            .expect(401)
            .end(function(getErr, getRes) {
                if (getErr) {
                    done(getErr);
                    return;
                }
                done();
            })
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })

})

