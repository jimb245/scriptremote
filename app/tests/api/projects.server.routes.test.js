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
var projectShare = null;
var statusOK = 'OK';
var typeJSON = 'application/json';


/**
 * Testing project routes
 * Test credentials are defined in config/env/test.js and .env
 */
describe('Project API tests', function() {

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

	it('should not be able to create project without valid credentials', function(done) {
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
            .auth(apiCredentials.uid, 'dummy')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(project1.project_name_form)
			.send(project1.timestamp_form)
			.send(project1.encrypted_form)
			.expect(401)
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

                        // Check no projects
                        (projects.length).should.equal(0);

                        done();
                    });
            });
    });

	it('should be able to create project using form', function(done) {
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
                        (projects).should.containEql([project1.project_name, false, '']);

                        done();
                    });
            });
    });

	it('should be able to create project using json', function(done) {
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
                        (projectGetRes.body.SR_status).should.equal(statusOK)
                    })
                    .end(function(projectsGetErr, projectsGetRes) {
                        if (projectsGetErr) {
                            done(projectsGetErr);
                            return;
                        }
                        var projects = projectsGetRes.body.projects;

                        // Check project is in list
                        (projects).should.containEql([project2.project_name, false, '']);

                        done();
                    });
            });
    });

	it('should not able to create project with duplicate name', function(done) {
        // Create project
		agent.post('/api/projects')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(project2)
			.expect(400)
			.end(function(projectPostErr, projectPostRes) {
                done(projectPostErr);
            })
    });

	it('should be able to set project parameters using form', function(done) {
        // Add sharing user
        projectShare = {
            email: credentials.user2.email,
            access: 'write',
            action: 'add'
        }
        agent.put('/api/projects/' + project1.project_name + '/share')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/x-www-form-urlencoded')
			.send('email=' + projectShare.email)
			.send('access=' + projectShare.access)
            .send('action=' + projectShare.action)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                // Set description
                agent.put('/api/projects/' + project1.project_name + '/description')
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send('description=' + project1.description)
                    .expect(200, {SR_status: statusOK})
                    .end(function(projectPutErr, projectPutRes) {
                        if (projectPutErr) {
                            done(projectPutErr);
                            return;
                        }
                        done();
                    });
            });
    });

	it('should be able to set project parameters using json', function(done) {
        // Add sharing user
        agent.put('/api/projects/' + project2.project_name + '/share')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', 'application/json')
			.send(projectShare)
			.expect(200, {SR_status: statusOK})
			.end(function(projectPutErr, projectPutRes) {
				if (projectPutErr) {
                    done(projectPutErr);
                    return;
                }
                // Set description
                agent.put('/api/projects/' + project2.project_name + '/description')
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .set('Content-Type', 'application/json')
                    .send({description: project2.description})
                    .expect(200, {SR_status: statusOK})
                    .end(function(projectPutErr, projectPutRes) {
                        if (projectPutErr) {
                            done(projectPutErr);
                            return;
                        }
                        done();
                    });
            });
    });

	it('should be able to get project parameters', function(done) {
        agent.get('/api/projects/' + project1.project_name)
            .auth(apiCredentials.uid, apiCredentials.token)
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
                (params.authUsers[0]).should.eql({email: projectShare.email, access: projectShare.access});
                (params.timestamp).should.equal(project1.timestamp);
                (params.description).should.equal(project1.description);

                done();
            });
    });

	it('should be able to delete project', function(done) {
        debugger;
        agent.del('/api/projects/' + project1.project_name)
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(projectDelRes) {
                (projectDelRes.status).should.equal(200);
                (projectDelRes.body.SR_status).should.equal(statusOK)
            })
            .end(function(projectDelErr, projectDelRes) {
                if (projectDelErr) {
                    done(projectDelErr);
                    return;
                }
                agent.del('/api/projects/' + project2.project_name)
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .expect(function(projectDelRes) {
                        (projectDelRes.status).should.equal(200);
                        (projectDelRes.body.SR_status).should.equal(statusOK)
                    })
                    .end(function(projectDelErr, projectDelRes) {
                        if (projectDelErr) {
                            done(projectDelErr);
                            return;
                        }
                        done();
                    });
            });
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    });
});
