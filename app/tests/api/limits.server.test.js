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
var project1 = null;
var project2 = null;
var job1 = null;
var job2 = null;
var location1 = null;
var location2 = null;
var message1 = null;
var message2 = null;
var statusOK = 'OK';
var typeJSON = 'application/json';
var someContent = {name1: 'Some string', name2: 'Some string'};
var someLongerContent = {name1: 'Some longer string', name2: 'Some longer string'};


/**
 * Testing project limits
 * Test credentials are defined in config/env/test.js and .env
 * Run this test solo and set following environment variables:
 *
 * PROJECTS_PER_USER 1
 * JOBS_PER_PROJECT 1
 * LOCATIONS_PER_JOB 1
 * MESSAGES_PER_LOCATION 1
 * MESSAGE_SIZE 45
 */
describe('Project limit tests', function() {

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

    if (process.env['PROJECTS_PER_USER'] &&
        process.env['JOBS_PER_PROJECT'] &&
        process.env['LOCATIONS_PER_JOB'] &&
        process.env['MESSAGES_PER_LOCATION'] &&
        process.env['MESSAGE_SIZE'])
    {
    

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

	it('should be able to create first project', function(done) {
        // Create project
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
                // Get the list of projects
                agent.get('/api/projects')
                    .auth(apiCredentials.uid, apiCredentials.token)
			        .expect(function(projectGetRes) {
                        (projectGetRes.type).should.equal(typeJSON);
                        (projectGetRes.status).should.equal(200);
                        (projectGetRes.body['SR_status']).should.equal(statusOK)
                    })
                    .end(function(projectsGetErr, projectsGetRes) {
                        if (projectsGetErr) {
                            done(projectsGetErr);
                            return;
                        }
                        var projects = projectsGetRes.body.projects;

                        // Check project is in list
                        (projects).should.containEql([project1.project_name, false]);

                        done();
                    });
            });
    });

	it('should not be able to create second project', function(done) {
        // Create project
        var timestamp2 = ((new Date()).getTime() + 1).toString();
        project2 = {
            project_name: credentials.user1.project2,
            timestamp: timestamp2,
            is_encrypted: false,
            description: 'Some description'
        };
		agent.post('/api/projects')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(project2)
			.expect(function(projectPostRes) {
                (projectPostRes.status).should.equal(400);
                (projectPostRes.body['SR_status']).should.equal('Maximum number of projects exceeded: 1')
            })
			.end(function(projectPostErr, projectPostRes) {
				if (projectPostErr) {
                    done(projectPostErr);
                    return;
                }
                done();
            });
    });

	it('should be able to create first job', function(done) {
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

        // Create job
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
                // Get the list of jobs
                agent.get('/api/projects/' + project1.project_name + '/jobs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check job is in list
                        (jobs[jobs.length -1].id).should.equal(job1.jobId);

                        done();
                    });
            });
    });

	it('should not be able to create second job', function(done) {
        var timestamp2 = ((new Date()).getTime() + 1).toString();
        var jobName2 = credentials.user1.project1 + '.Job2';
        job2 = {
            job_name: jobName2,
            max_msgs: 10,
            timestamp: timestamp2,
            description: 'Some description',
            jobId: null
        }
        // Create job
		agent.post('/api/projects/' + project1.project_name + '/jobs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send({job_name: job2.job_name, max_msgs: job2.max_msgs, timestamp: job2.timestamp})
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(400);
                (jobPostRes.body['SR_status']).should.equal('Maximum number of jobs per project exceeded: 1')
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                done();
            });
    });

	it('should be able to create first location', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        location1 = {
            location_name: 'Loc1',
            timestamp: timestamp,
            location_name_form: 'location_name=Loc1',
            timestamp_form: 'timestamp=' + timestamp
        }

        // Create location
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send(location1.location_name_form)
			.send(location1.timestamp_form)
			.expect(function(locPostRes) {
                (locPostRes.status).should.equal(200);
                (locPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(locPostErr, locPostRes) {
				if (locPostErr) {
                    done(locPostErr);
                    return;
                }
                // Get the list of locations
                agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check loc is in list
                        (locations[locations.length -1].name).should.equal(location1.location_name);

                        done();
                    });
            });
    });

	it('should not be able to create second location', function(done) {
        var timestamp = ((new Date()).getTime()+1).toString();
        location2 = {
            name: 'Loc2',
            timestamp: timestamp,
        }
        // Create location
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send({location_name: location2.name, timestamp: location2.timestamp})
			.expect(function(locPostRes) {
                (locPostRes.status).should.equal(400);
                (locPostRes.body['SR_status']).should.equal('Maximum number of locations per job exceeded: 1')
            })
			.end(function(locPostErr1, locPostRes) {
				if (locPostErr1) {
                    done(locPostErr1);
                    return;
                }
                done();
            });
    });

	it('should be able to create first message', function(done) {
        location1 = {
            location_name: 'Loc1'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message1 = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
            content_form: 'content=' + JSON.stringify(someContent),
            is_reply_form: 'is_reply=false',
            timestamp_form: 'timestamp=' + timestamp,
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

                // Get the list of messages
		        agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg is in list
                        (messages[messages.length -1].id).should.equal(message1.msgId);

                        done();
                    });
            });
    });

	it('should prune first message when creating second message', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        message2 = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: JSON.stringify(message2.content), 
                    is_reply: message2.is_reply, 
                    timestamp: message2.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message2.msgId = msgPostRes.body.message;

                // Get the list of messages
		        agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg list
                        (messages.length).should.equal(1);
                        (messages[messages.length -1].id).should.equal(message2.msgId);
                        done();
                    })
            })
    });

	it('should not be able to add longer message', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var message3 = {
            content: someLongerContent,
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: JSON.stringify(message3.content), 
                    is_reply: message3.is_reply, 
                    timestamp: message3.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal('Maximum message size exceeded: 45');
                (msgPostRes.status).should.equal(400);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }

                // Get the list of messages
		        agent.get('/api/projects/' + project1.project_name + '/jobs/' + job1.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg list
                        (messages.length).should.equal(1);
                        done();
                    })
            })
    });

    }

    after(function(done) {
        removeUsers(agent, credentials, done);
    });
});
