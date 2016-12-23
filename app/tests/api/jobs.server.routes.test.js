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
var project = null;
var job1 = null;
var job2 = null;
var statusOK = 'OK';
var typeJSON = 'application/json'


/**
 * Testing job routes
 * Test credentials are defined in config/env/test.js and .env
 */
describe('Job API tests', function() {

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

	it('should be able to create job using form', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        var jobName1 = credentials.user1.project1 + '.Job1';
        job1 = {
            job_name: jobName1,
            max_msgs: 3,
            timestamp: timestamp1,
            job_name_form: 'job_name=' + jobName1,
            max_msgs_form: 'max_msgs=3',
            timestamp_form: 'timestamp=' + timestamp1,
            description: 'Some description',
            jobId: null
        }

        // Create job
		agent.post('/api/projects/' + project.project_name + '/jobs')
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
                agent.get('/api/projects/' + project.project_name + '/jobs')
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

	it('should be able to create job using json', function(done) {
        var timestamp2 = ((new Date()).getTime() + 1).toString();
        var jobName2 = credentials.user1.project1 + '.Job2';
        job2 = {
            job_name: jobName2,
            max_msgs: 3,
            timestamp: timestamp2,
            description: 'Some description',
            jobId: null
        }
        // Create job
		agent.post('/api/projects/' + project.project_name + '/jobs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send({job_name: job2.job_name, max_msgs: job2.max_msgs, timestamp: job2.timestamp})
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
                // Get the list of jobs
                agent.get('/api/projects/' + project.project_name + '/jobs')
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
                        (jobs[jobs.length -1].id).should.equal(job2.jobId);

                        done();
                    });
            });
    });

	it('should be able to create job with duplicate name', function(done) {
        var timestamp3 = ((new Date()).getTime()+2).toString();
        var job3 = {
            job_name: job2.job_name,
            max_msgs: 3,
            timestamp: timestamp3,
            jobId: null
        }
        // Create job
		agent.post('/api/projects/' + project.project_name + '/jobs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(job3)
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(200);
                (jobPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                job3.jobId = jobPostRes.body.job;
                // Get the list of jobs
                agent.get('/api/projects/' + project.project_name + '/jobs')
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
                        (jobs[jobs.length -1].id).should.equal(job3.jobId);

                        done();
                    });
            });
    });

	it('should be able to set job parameters using form', function(done) {
        // Set description
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job1.jobId + '/description')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('description=' + job1.description)
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
                done();
            });
    });

	it('should be able to set job parameters using json', function(done) {
        // Set description
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job2.jobId + '/description')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
            .send({description: job2.description})
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
                done();
            })
    });

	it('should be able to get job parameters', function(done) {
        agent.get('/api/projects/' + project.project_name + '/jobs/' + job1.jobId)
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(jobGetRes) {
                (jobGetRes.type).should.equal(typeJSON);
                (jobGetRes.status).should.equal(200);
                (jobGetRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(jobGetErr, jobGetRes) {
                if (jobGetErr) {
                    done(jobGetErr);
                    return;
                }
                var params = jobGetRes.body;

                // Check job params
                (params.job_name).should.equal(job1.job_name);
                (params.description).should.equal(job1.description);
                (params.max_msgs).should.equal(job1.max_msgs);
                (params.timestamp).should.equal(job1.timestamp);
                (params.end).should.equal(false);

                done();
            });
    });

	it('should be able to end job using form', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job1.jobId + '/end')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('timestamp=' + timestamp1)
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
                done();
            });
    });

	it('should be able to end job using json', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job2.jobId + '/end')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
            .send({timestamp: timestamp1})
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
                done();
            });
    });

	it('should be able to delete job', function(done) {
        agent.del('/api/projects/' + project.project_name + '/jobs/' + job1.jobId)
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(jobDelRes) {
                (jobDelRes.status).should.equal(200);
                (jobDelRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(jobDelErr, jobDelRes) {
                if (jobDelErr) {
                    done(jobDelErr);
                    return;
                }
                agent.del('/api/projects/' + project.project_name + '/jobs/' + job2.jobId)
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .expect(function(jobDelRes) {
                        (jobDelRes.status).should.equal(200);
                        (jobDelRes.body.SR_status).should.equal(statusOK)
                    })
                    .end(function(jobDelErr, jobDelRes) {
                        if (jobDelErr) {
                            done(jobDelErr);
                            return;
                        }
                        done();
                    });
            });
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })
});
