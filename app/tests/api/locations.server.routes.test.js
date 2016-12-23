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
var job = null;
var location1 = null;
var location2 = null;
var statusOK = 'OK';
var typeJSON = 'application/json'
var statusOK = 'OK';

var locDescription = {
    description: 'Some description'
}
var locDescriptionForm = 'description=Some description';

/**
 * Testing location routes
 * Test credentials are defined in config/env/test.js and .env
 */
describe('Location API tests', function() {

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

	it('create a job for following', function(done) {
        var timestamp1 = ((new Date()).getTime()).toString();
        var jobName1 = credentials.user1.project1 + '.Job1';
        job = {
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
			.send(job.job_name_form)
			.send(job.max_msgs_form)
			.send(job.timestamp_form)
			.expect(function(jobPostRes) {
                (jobPostRes.status).should.equal(200);
                (jobPostRes.body['SR_status']).should.equal(statusOK)
            })
			.end(function(jobPostErr, jobPostRes) {
				if (jobPostErr) {
                    done(jobPostErr);
                    return;
                }
                job.jobId = jobPostRes.body.job;
                done();
            })
    });

	it('should be able to create location using form', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        location1 = {
            location_name: 'Loc1',
            timestamp: timestamp,
            location_name_form: 'location_name=Loc1',
            timestamp_form: 'timestamp=' + timestamp
        }

        // Create location
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
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
                agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
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

	it('should be able to create location using json', function(done) {
        var timestamp = ((new Date()).getTime()+1).toString();
        location2 = {
            name: 'Loc2',
            timestamp: timestamp,
        }
        // Create location
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send({location_name: location2.name, timestamp: location2.timestamp})
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
                agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
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
                        (locations).should.containEql(location2);

                        done();
                    });
            });
    });

	it('should not be able to create location with duplicate name', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var location3 = {
            location_name: location2.name,
            timestamp: timestamp
        }
        // Try to create location
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(location3)
			.expect(400)
			.end(function(locPostErr, locPostRes) {
                done(locPostErr);
            });
    });

	it('should be able to set location parameters using form', function(done) {
        // Set description
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/description')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(locDescriptionForm)
            .expect(200, {SR_status: statusOK})
            .end(function(locPutErr, locPutRes) {
                if (locPutErr) {
                    done(locPutErr);
                    return;
                }
                done();
            });
    });

	it('should be able to set location parameters using json', function(done) {
        // Set description
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.name + '/description')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
            .send(locDescription)
            .expect(200, {SR_status: statusOK})
            .end(function(locPutErr, locPutRes) {
                if (locPutErr) {
                    done(locPutErr);
                    return;
                }
                done();
            });
    });

	it('should be able to get get location parameters', function(done) {
        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name)
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(locGetRes) {
                (locGetRes.type).should.equal(typeJSON);
                (locGetRes.status).should.equal(200);
                (locGetRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(locGetErr, locGetRes) {
                if (locGetErr) {
                    done(locGetErr);
                    return;
                }
                var params = locGetRes.body;

                // Check location params
                (params.description).should.equal(locDescription.description);
                (params.msgcnt).should.equal(0);
                (params.timestamp).should.equal(location1.timestamp);

                done();
            });
    });

	it('should not be able to create location for ended job', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var location4 = {
            location_name: 'Loc4',
            timestamp: timestamp
        }
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/end')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
            .send({timestamp: timestamp})
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
                agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations')
                    .auth(credentials.userId, credentials.token)
                    .set('Content-Type', 'application/json')
                    .send(location4)
                    .expect(401)
                    .end(function(locPostErr, locPostRes) {
                        done(locPostErr);
                    })
            });
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    })
});
