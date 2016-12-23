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
var apiCredentials1 = null;
var apiCredentials2 = null;
var project1 = null;
var project2 = null;
var job1 = null;
var job2 = null;
var location1 = null;
var location2 = null;
var message1 = null;
var message2a = null;
var message2b = null;
var message2c = null;
var statusOK = 'OK';
var typeJSON = 'application/json'
var statusOK = 'OK';
var someContent = [{name1: 'Some string', name2: 'Some string'}];
var replyContent = [{name3: 'Some string', name4: 'Some string'}];


/**
 * Testing project sharing
 * Test credentials are defined in config/env/test.js and .env
 */
describe('Project sharing tests', function() {

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
                apiCredentials1 = apicred;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });

	it('get user2 API credentials', function(done) {
        getAPICredentials(agent, credentials.user2.email, credentials.user2.password,
            function(apicred) {
                apiCredentials2 = apicred;
                done();
            },
            function(err) {
                done(err);
            }
        )
    });

	it('create user1 project1 for following', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var description = 'Some description';
        project1 = {
            project_name: credentials.user1.project1,
            share_name: credentials.user1.project1 + '~' + credentials.user1.email,
            timestamp: timestamp,
            project_name_form: 'project_name=' + credentials.user1.project1,
            timestamp_form: 'timestamp=' + timestamp,
            encrypted_form: 'is_encrypted=0',
            description: description,
            description_form: 'description=' + description
        };
		agent.post('/api/projects')
            .auth(apiCredentials1.uid, apiCredentials1.token)
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

	it('create job1 in project1 for following', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var jobName1 = credentials.user1.project1 + '.Job1';
        job1 = {
            job_name: jobName1,
            max_msgs: 10,
            timestamp: timestamp,
            job_name_form: 'job_name=' + jobName1,
            max_msgs_form: 'max_msgs=10',
            timestamp_form: 'timestamp=' + timestamp,
            description: 'Some description',
            jobId: null
        }

		agent.post('/api/projects/' + project1.project_name + '/jobs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
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
            });
    });

	it('create message1 in job1 for following', function(done) {
        location1 = {
            location_name: 'Loc1'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message1 = {
            content: someContent,
            is_reply: 'true',
            reply_content: replyContent,
            timestamp: timestamp,
            content_form: 'content=' + JSON.stringify(someContent),
            reply_content_form: 'reply_content=' + JSON.stringify(replyContent),
            is_reply_form: 'is_reply=true',
            timestamp_form: 'timestamp=' + timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(message1.content_form)
			.send(message1.reply_content_form)
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
            })
    });

	it('create user1 project2 for following', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var description = 'Some description';
        project2 = {
            project_name: credentials.user1.project2,
            share_name: credentials.user1.project2 + '~' + credentials.user1.email,
            timestamp: timestamp,
            project_name_form: 'project_name=' + credentials.user1.project2,
            timestamp_form: 'timestamp=' + timestamp,
            encrypted_form: 'is_encrypted=0',
            description: description,
            description_form: 'description=' + description
        };
		agent.post('/api/projects')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(project2.project_name_form)
			.send(project2.timestamp_form)
			.send(project2.encrypted_form)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPostErr, projectPostRes) {
				if (projectPostErr) {
                    done(projectPostErr);
                    return;
                }
                done();
            });
    });

	it('create job2 in project2 for following', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var jobName2 = credentials.user1.project2 + '.Job2';
        job2 = {
            job_name: jobName2,
            max_msgs: 10,
            timestamp: timestamp,
            job_name_form: 'job_name=' + jobName2,
            max_msgs_form: 'max_msgs=10',
            timestamp_form: 'timestamp=' + timestamp,
            description: 'Some description',
            jobId: null
        }

		agent.post('/api/projects/' + project2.project_name + '/jobs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(job2.job_name_form)
			.send(job2.max_msgs_form)
			.send(job2.timestamp_form)
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(200);
                (jobPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                job2.jobId = jobPostRes.body.job;
                done();
            });
    });

	it('create message2a in job2 for following', function(done) {
        location2 = {
            location_name: 'Loc2'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message2a = {
            content: someContent,
            is_reply: 'true',
            reply_content: replyContent,
            timestamp: timestamp,
            content_form: 'content=' + JSON.stringify(someContent),
            reply_content_form: 'reply_content=' + JSON.stringify(replyContent),
            is_reply_form: 'is_reply=true',
            timestamp_form: 'timestamp=' + timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project2.project_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(message2a.content_form)
			.send(message2a.is_reply_form)
			.send(message2a.timestamp_form)
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message2a.msgId = msgPostRes.body.message;
                done();
            })
    });

	it('create message2b in job2 for following', function(done) {
        location2 = {
            location_name: 'Loc2'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message2b = {
            content: someContent,
            is_reply: 'true',
            reply_content: replyContent,
            timestamp: timestamp,
            content_form: 'content=' + JSON.stringify(someContent),
            reply_content_form: 'reply_content=' + JSON.stringify(replyContent),
            is_reply_form: 'is_reply=true',
            timestamp_form: 'timestamp=' + timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project2.project_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(message2b.content_form)
			.send(message2b.is_reply_form)
			.send(message2b.timestamp_form)
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message2b.msgId = msgPostRes.body.message;
                done();
            })
    });

	it('create message2c in job2 for following', function(done) {
        location2 = {
            location_name: 'Loc2'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message2c = {
            content: someContent,
            is_reply: 'true',
            reply_content: replyContent,
            timestamp: timestamp,
            content_form: 'content=' + JSON.stringify(someContent),
            reply_content_form: 'reply_content=' + JSON.stringify(replyContent),
            is_reply_form: 'is_reply=true',
            timestamp_form: 'timestamp=' + timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project2.project_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(message2c.content_form)
			.send(message2c.is_reply_form)
			.send(message2c.timestamp_form)
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message2c.msgId = msgPostRes.body.message;
                done();
            })
    });


	it('should be possible to add share "read" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            access: 'read',
            action: 'add'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
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

	it('should not be possible for user2 to access project1 parameters', function(done) {
        agent.get('/api/projects/' + project1.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectsGetErr, projectsGetRes) {
                done(projectsGetErr);
            })
     });

	it('should not be possible for user2 to access project1 job list', function(done) {
        agent.get('/api/projects/' + project1.share_name + '/jobs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(jobsGetErr, jobsGetRes) {
                done(jobsGetErr);
            })
     });

	it('should not be possible for user2 to access project1 job1 parameters', function(done) {
        agent.get('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(jobsGetErr, jobsGetRes) {
                done(jobsGetErr);
            })
     });

	it('should not be possible for user2 to delete project1 job1', function(done) {
        agent.del('/api/projects/' + project1.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr, projectDelRes) {
                done(projectDelErr);
            })
     });

	it('should not be possible for user2 to access project1 job1 location list', function(done) {
        agent.get('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId + '/locations')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(locationsGetErr, locationsGetRes) {
                done(locationsGetErr);
            })
     });

	it('should not be possible for user2 to access project1 job1 location1 message list', function(done) {
		agent.get('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(msgsGetErr, msgsGetRes) {
                done(msgsGetErr);
            })
     });

	it('should not be possible for user2 to access project1 job1 location1 message1', function(done) {
		agent.get('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(msgGetErr, msgGetRes) {
                done(msgGetErr);
            })
     });

	it('should not be possible for user2 to reply to message1', function(done) {
        var replyMessage = {
            reply_content: JSON.stringify(replyContent),
        }
        agent.put('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId + '/reply')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
            .send(replyMessage)
            .expect(401)
            .end(function(msgPutErr, msgPutRes) {
                // Check message reply status
                agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId)
                    .auth(apiCredentials1.uid, apiCredentials1.token)
                    .expect(function(msgGetRes) {
                        (msgGetRes.type).should.equal(typeJSON);
                        (msgGetRes.body.SR_status).should.equal(statusOK);
                        (msgGetRes.status).should.equal(200);
                    })
                    .end(function(msgGetErr, msgGetRes) {
                        if (msgGetErr) {
                            done(msgGetErr);
                            return;
                        }
                        var params = msgGetRes.body;
                        (params.reply_done).should.equal(false);

                        done();
                    });
            })
    });

	it('should not be possible for user2 to add message to project1', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var message2b = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
        }
		agent.post('/api/projects/' + project1.share_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
			.send(message2b)
            .expect(401)
            .end(function(msgPostErr, msgPostRes) {
                if (msgPostErr) {
                    done(msgPostErr);
                }
                // Get the list of messages
		        agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials1.uid, apiCredentials1.token)
			        .expect(function(msgGetRes) {
                        (msgGetRes.type).should.equal(typeJSON);
                        (msgGetRes.status).should.equal(200);
                        (msgGetRes.body['SR_status']).should.equal(statusOK)
                    })
                    .end(function(msgsGetErr, msgsGetRes) {
                        if (msgsGetErr) {
                            done(msgsGetErr);
                            return;
                        }
                        var messages = msgsGetRes.body.messages;

                        // Check no new message
                        (messages.length).should.equal(1);

                        done();
                    })
            });
     });

	it('should not be possible for user2 to add job to project1', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var jobName3 = credentials.user1.project1 + '.Job3';
        var job3 = {
            job_name: jobName3,
            max_msgs: 10,
            timestamp: timestamp,
        }
		agent.post('/api/projects/' + project1.share_name + '/jobs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
            .send(job3)
            .expect(401)
			.end(function(jobPostErr, jobPostRes) {
                // Get the list of jobs
                agent.get('/api/projects/' + project1.project_name + '/jobs')
                    .auth(apiCredentials1.uid, apiCredentials1.token)
			        .expect(function(jobGetRes) {
                        (jobGetRes.type).should.equal(typeJSON);
                        (jobGetRes.status).should.equal(200);
                        (jobGetRes.body['SR_status']).should.equal(statusOK)
                    })
                    .end(function(jobsGetErr, jobsGetRes) {
                        if (jobsGetErr) {
                            done(jobsGetErr);
                            return;
                        }
                        var jobs = jobsGetRes.body.jobs;

                        // Check no new job
                        (jobs.length).should.equal(1);

                        done();
                    });
            });
    });

	it('should not be possible for user2 to delete project1', function(done) {
        agent.del('/api/projects/' + project1.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr) {
                done(projectDelErr);
            })
    });

	it('should be possible for user2 to access project2 parameters', function(done) {
        agent.get('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(projectGetRes) {
                (projectGetRes.type).should.equal(typeJSON);
                (projectGetRes.status).should.equal(200);
                (projectGetRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(projectGetErr, projectGetRes) {
                if (projectGetErr) {
                    done(projectGetErr);
                    return;
                }
                var params = projectGetRes.body;

                // Check project params
                (params.timestamp).should.equal(project2.timestamp);
                (params.encrypted).should.equal(false);

                done();
            })
    });

	it('should not be possible for user2 to modify project2 parameters', function(done) {
        agent.put('/api/projects/' + project2.share_name + '/description')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', 'application/json')
            .send({description: 'some description'})
            .expect(401)
            .end(function(projectPutErr) {
                if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            })
    });

	it('should be possible for user2 to access project2 job list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(jobGetRes) {
                (jobGetRes.type).should.equal(typeJSON);
                (jobGetRes.status).should.equal(200);
                (jobGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(jobsGetErr, jobsGetRes) {
                if (jobsGetErr) {
                    done(jobsGetErr);
                    return;
                }
                var jobs = jobsGetRes.body.jobs;
                // Check job list
                (jobs[jobs.length -1].id).should.equal(job2.jobId);

                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(locGetRes) {
                (locGetRes.type).should.equal(typeJSON);
                (locGetRes.status).should.equal(200);
                (locGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(locsGetErr, locsGetRes) {
                if (locsGetErr) {
                    done(locsGetErr);
                    return;
                }
                var locations = locsGetRes.body.locations;

                // Check loc list
                (locations[locations.length -1].name).should.equal(location2.location_name);
                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location2 message list', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body['SR_status']).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgsGetErr, msgsGetRes) {
                if (msgsGetErr) {
                    done(msgsGetErr);
                    return;
                }
                var messages = msgsGetRes.body.messages;

                // Check msg list
                (messages).should.containEql({id: message2a.msgId, timestamp: message2a.timestamp});

                done();
            });
     });

	it('should be possible for user2 to access project2 job2 location2 message2a', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2a.msgId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body.SR_status).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgGetErr, msgGetRes) {
                if (msgGetErr) {
                    done(msgGetErr);
                    return;
                }
                var params = msgGetRes.body;

                // Check message params
                (params.content).should.equal(JSON.stringify(message2a.content));
                (params.is_reply).should.equal(true);
                (params.timestamp).should.equal(message2a.timestamp);

                done();
            });
     });

	it('should not be possible for user2 to reply to message2a', function(done) {
        var replyMessage = {
            reply_content: JSON.stringify(replyContent),
        }
        agent.put('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2a.msgId + '/reply')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
            .send(replyMessage)
			.expect(401)
            .end(function(msgPutErr, msgPutRes) {
                if (msgPutErr) {
                    done(msgPutErr);
                    return;
                }
                done();
            })
    });

	it('should not be possible for user2 to add message to project2 job2', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var message = {
            content: JSON.stringify(someContent),
            is_reply: 'false',
            timestamp: timestamp,
        }
		agent.post('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
			.send(message)
            .expect(401)
            .end(function(msgPostErr, msgPostRes) {
                if (msgPostErr) {
                    done(msgPostErr);
                    return
                }
                done();
            })
    });

	it('should not be possible for user2 to delete job2', function(done) {
        agent.del('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr, projectDelRes) {
                if (projectDelErr) {
                    done(projectDelErr);
                    return;
                }
                done();
            });
    });

	it('should not be possible for user2 to delete project2', function(done) {
        agent.del('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr) {
                done(projectDelErr);
            })
    });


	it('should be possible to remove share "read" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            action: 'remove'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(200, {SR_status: statusOK, shared: false})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            });
    });


	it('should be possible to add share "reply" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            access: 'reply',
            action: 'add'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
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


	it('should be possible for user2 to access project2 parameters', function(done) {
        agent.get('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(projectGetRes) {
                (projectGetRes.type).should.equal(typeJSON);
                (projectGetRes.status).should.equal(200);
                (projectGetRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(projectGetErr, projectGetRes) {
                if (projectGetErr) {
                    done(projectGetErr);
                    return;
                }
                var params = projectGetRes.body;

                // Check project params
                (params.timestamp).should.equal(project2.timestamp);
                (params.encrypted).should.equal(false);

                done();
            })
     });

	it('should not be possible for user2 to modify project2 parameters', function(done) {
        agent.put('/api/projects/' + project2.share_name + '/description')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', 'application/json')
            .send({description: 'some description'})
            .expect(401)
            .end(function(projectPutErr) {
                if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            })
    });

	it('should be possible for user2 to access project2 job list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(jobGetRes) {
                (jobGetRes.type).should.equal(typeJSON);
                (jobGetRes.status).should.equal(200);
                (jobGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(jobsGetErr, jobsGetRes) {
                if (jobsGetErr) {
                    done(jobsGetErr);
                    return;
                }
                var jobs = jobsGetRes.body.jobs;
                // Check job list
                (jobs[jobs.length -1].id).should.equal(job2.jobId);

                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(locGetRes) {
                (locGetRes.type).should.equal(typeJSON);
                (locGetRes.status).should.equal(200);
                (locGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(locsGetErr, locsGetRes) {
                if (locsGetErr) {
                    done(locsGetErr);
                    return;
                }
                var locations = locsGetRes.body.locations;

                // Check loc list
                (locations[locations.length -1].name).should.equal(location2.location_name);
                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location2 message list', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body['SR_status']).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgsGetErr, msgsGetRes) {
                if (msgsGetErr) {
                    done(msgsGetErr);
                    return;
                }
                var messages = msgsGetRes.body.messages;

                // Check msg list
                (messages).should.containEql({id: message2b.msgId, timestamp: message2b.timestamp});

                done();
            });
     });

	it('should be possible for user2 to access project2 job2 location2 message2b', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2b.msgId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body.SR_status).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgGetErr, msgGetRes) {
                if (msgGetErr) {
                    done(msgGetErr);
                    return;
                }
                var params = msgGetRes.body;

                // Check message params
                (params.content).should.equal(JSON.stringify(message2a.content));
                (params.is_reply).should.equal(true);
                (params.timestamp).should.equal(message2b.timestamp);

                done();
            });
     });

	it('should be possible for user2 to reply to message2b', function(done) {
        var replyMessage = {
            reply_content: JSON.stringify(replyContent),
        }
        agent.put('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2b.msgId + '/reply')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
            .send(replyMessage)
			.expect(function(msgPutRes) {
                (msgPutRes.body['SR_status']).should.equal(statusOK);
                (msgPutRes.status).should.equal(200);
            })
            .end(function(msgPutErr, msgPutRes) {
                // Check message reply status
                agent.get('/api/projects/' + project2.project_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2b.msgId)
                    .auth(apiCredentials1.uid, apiCredentials1.token)
                    .expect(function(msgGetRes) {
                        (msgGetRes.type).should.equal(typeJSON);
                        (msgGetRes.body.SR_status).should.equal(statusOK);
                        (msgGetRes.status).should.equal(200);
                    })
                    .end(function(msgGetErr, msgGetRes) {
                        if (msgGetErr) {
                            done(msgGetErr);
                            return;
                        }
                        var params = msgGetRes.body;

                        (params.reply_done).should.equal(true);

                        done();
                    });
            })
    });

	it('should not be possible for user2 to add message to project2', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var message = {
            content: JSON.stringify(someContent),
            is_reply: 'false',
            timestamp: timestamp,
        }
		agent.post('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
			.send(message)
            .expect(401)
            .end(function(msgPostErr, msgPostRes) {
                if (msgPostErr) {
                    done(msgPostErr);
                    return
                }
                done();
            })
    });

	it('should not be possible for user2 to delete job2', function(done) {
        agent.del('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr, projectDelRes) {
                if (projectDelErr) {
                    done(projectDelErr);
                    return;
                }
                done();
            });
    });

	it('should not be possible for user2 to delete project2', function(done) {
        agent.del('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr) {
                done(projectDelErr);
            })
    });


	it('should be possible to remove share "reply" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            action: 'remove'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(200, {SR_status: statusOK, shared: false})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            });
    });


	it('should be possible to add share "write" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            access: 'write',
            action: 'add'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
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

	it('should be possible for user2 to access project2 parameters', function(done) {
        agent.get('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(projectGetRes) {
                (projectGetRes.type).should.equal(typeJSON);
                (projectGetRes.status).should.equal(200);
                (projectGetRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(projectGetErr, projectGetRes) {
                if (projectGetErr) {
                    done(projectGetErr);
                    return;
                }
                var params = projectGetRes.body;

                // Check project params
                (params.timestamp).should.equal(project2.timestamp);
                (params.encrypted).should.equal(false);

                done();
            })
    });

	it('should not be possible for user2 to modify project2 sharing', function(done) {
        var addShare = {
            email: credentials.user2.email,
            access: 'write',
            action: 'remove'
        }
        agent.put('/api/projects/' + project2.share_name + '/share')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(401)
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            });
    });

	it('should be possible for user2 to access project2 job list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(jobGetRes) {
                (jobGetRes.type).should.equal(typeJSON);
                (jobGetRes.status).should.equal(200);
                (jobGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(jobsGetErr, jobsGetRes) {
                if (jobsGetErr) {
                    done(jobsGetErr);
                    return;
                }
                var jobs = jobsGetRes.body.jobs;
                // Check job list
                (jobs[jobs.length -1].id).should.equal(job2.jobId);

                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location list', function(done) {
        agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(locGetRes) {
                (locGetRes.type).should.equal(typeJSON);
                (locGetRes.status).should.equal(200);
                (locGetRes.body['SR_status']).should.equal(statusOK)
            })
            .end(function(locsGetErr, locsGetRes) {
                if (locsGetErr) {
                    done(locsGetErr);
                    return;
                }
                var locations = locsGetRes.body.locations;

                // Check loc list
                (locations[locations.length -1].name).should.equal(location2.location_name);
                done();
            })
     });

	it('should be possible for user2 to access project2 job2 location2 message list', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body['SR_status']).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgsGetErr, msgsGetRes) {
                if (msgsGetErr) {
                    done(msgsGetErr);
                    return;
                }
                var messages = msgsGetRes.body.messages;

                // Check msg list
                (messages).should.containEql({id: message2c.msgId, timestamp: message2c.timestamp});

                done();
            });
     });

	it('should be possible for user2 to access project2 job2 location2 message2c', function(done) {
		agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2c.msgId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.body.SR_status).should.equal(statusOK);
                (msgGetRes.status).should.equal(200);
            })
            .end(function(msgGetErr, msgGetRes) {
                if (msgGetErr) {
                    done(msgGetErr);
                    return;
                }
                var params = msgGetRes.body;

                // Check message params
                (params.content).should.equal(JSON.stringify(message2c.content));
                (params.is_reply).should.equal(true);
                (params.timestamp).should.equal(message2c.timestamp);

                done();
            });
     });

	it('should be possible for user2 to reply to message2c', function(done) {
        var replyMessage = {
            reply_content: JSON.stringify(replyContent),
        }
        agent.put('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2c.msgId + '/reply')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
            .send(replyMessage)
			.expect(function(msgPutRes) {
                (msgPutRes.body['SR_status']).should.equal(statusOK);
                (msgPutRes.status).should.equal(200);
            })
            .end(function(msgPutErr, msgPutRes) {
                // Check message reply status
                agent.get('/api/projects/' + project2.project_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs/' + message2c.msgId)
                    .auth(apiCredentials1.uid, apiCredentials1.token)
                    .expect(function(msgGetRes) {
                        (msgGetRes.type).should.equal(typeJSON);
                        (msgGetRes.body.SR_status).should.equal(statusOK);
                        (msgGetRes.status).should.equal(200);
                    })
                    .end(function(msgGetErr, msgGetRes) {
                        if (msgGetErr) {
                            done(msgGetErr);
                            return;
                        }
                        var params = msgGetRes.body;
                        (params.reply_done).should.equal(true);
                        done();
                    });
            })
    });

	it('should be possible for user2 to add message to project2', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var message = {
            content: JSON.stringify(someContent),
            is_reply: 'false',
            timestamp: timestamp,
        }
		agent.post('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .set('Content-Type', typeJSON)
			.send(message)
            .expect(200)
            .end(function(msgPostErr, msgPostRes) {
                if (msgPostErr) {
                    done(msgPostErr);
                }
                // Get the list of messages
		        agent.get('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId + '/locations/' + location2.location_name + '/msgs')
                    .auth(apiCredentials2.uid, apiCredentials2.token)
			        .expect(function(msgGetRes) {
                        (msgGetRes.type).should.equal(typeJSON);
                        (msgGetRes.status).should.equal(200);
                        (msgGetRes.body['SR_status']).should.equal(statusOK)
                    })
                    .end(function(msgsGetErr, msgsGetRes) {
                        if (msgsGetErr) {
                            done(msgsGetErr);
                            return;
                        }
                        var messages = msgsGetRes.body.messages;

                        // Check for new message
                        (messages.length).should.equal(4);

                        done();
                    })
            });
    });

	it('should be possible for user2 to delete job2', function(done) {
        agent.del('/api/projects/' + project2.share_name + '/jobs/' + job2.jobId)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(function(projectDelRes) {
                (projectDelRes.body.SR_status).should.equal(statusOK);
                (projectDelRes.status).should.equal(200);
            })
            .end(function(projectDelErr, projectDelRes) {
                if (projectDelErr) {
                    done(projectDelErr);
                    return;
                }
                done();
            });
    });

	it('should not be possible for user2 to delete project2', function(done) {
        agent.del('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectDelErr) {
                done(projectDelErr);
            })
    });

	it('remove share "write" permission for user2 to project2', function(done) {
        var addShare = {
            email: credentials.user2.email,
            action: 'remove'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(200, {SR_status: statusOK, shared: false})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                done();
            });
    });

	it('should still not be possible for user2 to access project2 parameters', function(done) {
        agent.get('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectsGetErr, projectsGetRes) {
                done(projectsGetErr);
            })
    });

	it('should not be possible for non-admin user2 to add public share permission to project2', function(done) {
        var addShare = {
            email: 'public',
            access: 'read',
            action: 'add'
        }
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials1.uid, apiCredentials1.token)
            .set('Content-Type', 'application/json')
			.send(addShare)
			.expect(400)
			.end(function(projectPutErr) {
                done(projectPutErr);
            })
    });

	it('should not be possible for user2 to access project2 parameters', function(done) {
        agent.get('/api/projects/' + project2.share_name)
            .auth(apiCredentials2.uid, apiCredentials2.token)
            .expect(401)
            .end(function(projectsGetErr, projectsGetRes) {
                done(projectsGetErr);
            })
     });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })

})
