'use strict';


var should = require('should'),
	request = require('supertest'),
    fs = require('fs'),
    child_process = require('child_process'),
    q = require('q'),
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
var message1 = null;
var message2 = null;
var message3 = null;
var message4 = null;
var message5 = null;
var message6 = null;
var message7 = null;
var statusOK = 'OK';
var typeJSON = 'application/json';
var typeTEXT = 'text/plain';
var typePNG = 'image/png';
var typeSVG = 'image/svg+xml';
var longPollWait = 5000;
var textFile = ['textKey', 'app/tests/api/data.txt'];
var pngFile = ['pngKey', 'app/tests/api/data.png'];
var svgFile = ['svgKey', 'app/tests/api/data.svg'];

var someContent = [{name1: 'Some string', name2: 'Some string'}];
var replyContent = [{name3: 'Some string', name4: 'Some string'}];
var newReplyContent = [{name5: 'Some string', name6: 'Some string'}];
var textFileContent = {textkey: textFile};




/**
 * Testing message routes
 * Test credentials are defined in config/env/test.js and .env
 * Mocha test timeout must be > longPollWait
 */
describe('Message API tests', function() {

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

	it('get user1 API credentials', function(done) {
        debugger;
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
            max_msgs: 4,
            timestamp: timestamp1,
            job_name_form: 'job_name=' + jobName1,
            max_msgs_form: 'max_msgs=4',
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

	it('should be able to create message at new location using form', function(done) {
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
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
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
		        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
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

	it('should be able to create message at new location using json', function(done) {
        location2 = {
            location_name: 'Loc2'
        }
        var timestamp = ((new Date()).getTime()).toString();
        message2 = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs')
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
		        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg is in list
                        (messages[messages.length -1].id).should.equal(message2.msgId);

                        done();
                    });
            });
    });

	it('should be able to create message at existing location', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        message3 = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: JSON.stringify(message3.content), 
                    is_reply: message3.is_reply, 
                    timestamp: message3.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message3.msgId = msgPostRes.body.message;

                // Get the list of messages
		        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg is in list
                        (messages[messages.length -1].id).should.equal(message3.msgId);

                        done();
                    });
            });
    });

	it('should not be able to create message with invalid content', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        message4 = {
            content: '{ abc ]',
            is_reply: 'false',
            timestamp: timestamp
        }
        // Message content not valid json
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: message4.content, is_reply: message4.is_reply, timestamp: message4.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.status).should.equal(400);
            })
			.end(function(msgPostErr, msgPostRes) {
                done(msgPostErr);
            });
    });

	it('should be able to get message data', function(done) {
        // Retrieve message
		agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message1.msgId)
            .auth(apiCredentials.uid, apiCredentials.token)
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
                (params.content).should.equal(JSON.stringify(message1.content));
                (params.is_reply).should.equal(false);
                (params.timestamp).should.equal(message1.timestamp);

                done();
            });
    });

	it('should be able to get message data', function(done) {
        // Retrieve message
		agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message2.msgId)
            .auth(apiCredentials.uid, apiCredentials.token)
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
                (params.content).should.equal(JSON.stringify(message2.content));
                (params.is_reply).should.equal(false);
                (params.timestamp).should.equal(message2.timestamp);

                done();
            });
    });

	it('should be able to create reply request message', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        message5 = {
            content: someContent,
            is_reply: 'true',
            reply_content: replyContent,
            timestamp: timestamp,
            msgId: null
        }
        // Create reply request message
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: JSON.stringify(message5.content), 
                    is_reply: message5.is_reply, 
                    reply_content: JSON.stringify(message5.reply_content), 
                    timestamp: message5.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message5.msgId = msgPostRes.body.message;

                // Get the list of messages
		        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
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

                        // Check msg is in list
                        (messages[messages.length -1].id).should.equal(message5.msgId);

                        done();
                    });
            });
    });

	it('should be able to get unanswered reply request message data', function(done) {
        // Retrieve new reply request - normally done by browser client
		agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message5.msgId)
            .auth(apiCredentials.uid, apiCredentials.token)
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
                (params.content).should.equal(JSON.stringify(message5.content));
                (params.is_reply).should.equal(true);
                (params.timestamp).should.equal(message5.timestamp);
                (params.reply_done).should.equal(false);
                (params.reply_ack).should.equal(false);
                (params.reply_content).should.equal(JSON.stringify(message5.reply_content));

                done();
            });
    });

	it('should be able to put reply to unanswered message', function() {
        // Testing long-polling wait for updated reply content,
        // using reply request created above.
        //
        // Normally the long-polling GET for reply is done by script client 
        // after creating reply request and before browser client sends update.
        // Here using promises to simulate the interaction.
        //
        message6 = {
            reply_content: JSON.stringify(newReplyContent),
        }
        var deferred1 = q.defer();
		agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message5.msgId + '/reply')
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.status).should.equal(200);
                var params = JSON.parse(msgGetRes.text);
                (params['SR_status']).should.equal(statusOK);
            })
            .end(function(msgGetErr, msgGetRes) {
                if (msgGetErr) {
                    deferred1.reject(msgGetErr);
                    return;
                }
                // Check reply content
                var params = JSON.parse(msgGetRes.text);
                (params['reply_content']).should.equal(JSON.stringify(newReplyContent));
                deferred1.resolve(msgGetRes);
            });

        // Put new reply content after delay
        var deferred2 = q.defer();
        setTimeout(function() {
            agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message5.msgId + '/reply')
                .auth(apiCredentials.uid, apiCredentials.token)
                .set('Content-Type', typeJSON)
                .send(message6)
                .expect(function(msgPutRes) {
                    (msgPutRes.body.SR_status).should.equal(statusOK);
                    (msgPutRes.status).should.equal(200);
                })
                .end(function(msgPutErr, msgPutRes) {
                    if (msgPutErr) {
                        deferred2.reject(msgPutErr);
                        return;
                    }
                    deferred2.resolve(msgPutRes);
                });

        }, longPollWait);

        return q.all([deferred1.promise, deferred2.promise]);
    });

	it('should not be able to put reply to previously answered message', function(done) {

		agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message5.msgId + '/reply')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send(message6)
            .expect(function(msgPutRes) {
                (msgPutRes.status).should.equal(400);
            })
            .end(function(msgPutErr, msgPutRes) {
                done(msgPutErr);
            });
    });


	it('should be able to get previously answered reply', function(done) {
        // The long-polling GET should return immediatedly in this case
		agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs/' + message5.msgId + '/reply')
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(msgGetRes) {
                (msgGetRes.type).should.equal(typeJSON);
                (msgGetRes.status).should.equal(200);
                var params = JSON.parse(msgGetRes.text);
                (params['SR_status']).should.equal(statusOK);
            })
            .end(function(msgGetErr, msgGetRes) {
                if (msgGetErr) {
                    done(msgGetErr);
                    return;
                }
                // Check reply content
                var params = JSON.parse(msgGetRes.text);
                (params['reply_content']).should.equal(JSON.stringify(newReplyContent));
                done();
            });
    });

	it('should be able to upload files to attach to a message', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        message7 = {
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({is_reply: message7.is_reply, timestamp: message7.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                message7.msgId = msgPostRes.body.message;

                // Upload text file 
                agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files')
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .field('file_key', textFile[0])
                    .field('encrypted', 'false')
                    .attach(textFile[0], textFile[1])
                    .expect(function(filePostRes) {
                        (filePostRes.body['SR_status']).should.equal(statusOK);
                        (filePostRes.status).should.equal(200);
                    })
                    .end(function(filePostErr, filePostRes) {
                        if (filePostErr) {
                            done(filePostErr);
                            return;
                        }
                        // Upload png file 
                        agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files')
                            .auth(apiCredentials.uid, apiCredentials.token)
                            .field('file_key', pngFile[0])
                            .field('encrypted', 'false')
                            .attach(pngFile[0], pngFile[1])
                            .expect(function(filePostRes) {
                                (filePostRes.body['SR_status']).should.equal(statusOK);
                                (filePostRes.status).should.equal(200);
                            })
                            .end(function(filePostErr, filePostRes) {
                                if (filePostErr) {
                                    done(filePostErr);
                                    return;
                                }
                                // Upload svg file 
                                agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files')
                                    .auth(apiCredentials.uid, apiCredentials.token)
                                    .field('file_key', svgFile[0])
                                    .field('encrypted', 'false')
                                    .attach(svgFile[0], svgFile[1])
                                    .expect(function(filePostRes) {
                                        (filePostRes.body['SR_status']).should.equal(statusOK);
                                        (filePostRes.status).should.equal(200);
                                    })
                                    .end(function(filePostErr, filePostRes) {
                                        if (filePostErr) {
                                            done(filePostErr);
                                            return;
                                        }
                                        done();
                                    });
                            });
                    });
            });
    });

	it('should be able to download plain text files attached to a message', function(done) {
        // Using message created in previous test
        //
        // Download text file and compare with original
       var text = fs.readFileSync(textFile[1], {encoding: 'utf8'});
        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files/' + textFile[0])
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(fileGetRes) {
                (fileGetRes.type).should.equal(typeTEXT);
                (fileGetRes.text).should.equal(text);
                (fileGetRes.status).should.equal(200);
            })
            .end(function(fileGetErr, fileGetRes) {
                if (fileGetErr) {
                    done(fileGetErr);
                    return;
                }
                done();
            });
    });

	it('should be able to download svg image files attached to a message', function(done) {
        // Using message created in previous test
        //
        // Download svg file and compare with original 
        var svg = fs.readFileSync(svgFile[1], {encoding: 'utf8'});
        var tempStream = fs.createWriteStream('temp.svg');
        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files/' + svgFile[0])
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(fileGetRes) {
                (fileGetRes.type).should.equal(typeSVG);
                (fileGetRes.status).should.equal(200);
            })
            .pipe(tempStream);
            // The filesystem needs a delay here or the
            // file read may fail.
            setTimeout(function() {
                fs.readFile('./temp.svg', {encoding: 'utf8'},
                    function(err, temp) {
                        if (err) {
                            done(err);
                            return;
                        }
                        if (temp != svg) {
                            err = new Error('SVG downloaded file does not match original');
                            done(err);
                            return;
                        }
                        done();
                    }
                );
            }, 1000);

    });

	it('should be able to download binary png files attached to a message', function(done) {
        // Using message created in previous test
        //
        // Download png file and compare with original 
        var png = fs.readFileSync(pngFile[1], {encoding: 'utf8'});
        var tempStream = fs.createWriteStream('temp.png');
        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs/' + message7.msgId + '/files/' + pngFile[0])
            .auth(apiCredentials.uid, apiCredentials.token)
            .expect(function(fileGetRes) {
                (fileGetRes.type).should.equal(typePNG);
                (fileGetRes.status).should.equal(200);
            })
            .pipe(tempStream);
            // The filesystem needs a delay here or the
            // file read may fail.
            setTimeout(function() {
                fs.readFile('./temp.png', {encoding: 'utf8'},
                    function(err, temp) {
                        if (err) {
                            done(err);
                            return;
                        }
                        if (temp != png) {
                            err = new Error('SVG downloaded file does not match original');
                            done(err);
                            return;
                        }
                        done();
                    }
                );
            }, 1000);

    });

	it('should prune messages to keep at most 4', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var messagex = {
            content: someContent,
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        // Create message
		agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
			.send({content: JSON.stringify(messagex.content), 
                    is_reply: messagex.is_reply, 
                    timestamp: messagex.timestamp})
			.expect(function(msgPostRes) {
                (msgPostRes.body['SR_status']).should.equal(statusOK);
                (msgPostRes.status).should.equal(200);
            })
			.end(function(msgPostErr, msgPostRes) {
				if (msgPostErr) {
                    done(msgPostErr);
                    return;
                }
                // Create message
                agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .set('Content-Type', typeJSON)
                    .send({content: JSON.stringify(messagex.content), 
                            is_reply: messagex.is_reply, 
                            timestamp: messagex.timestamp})
                    .expect(function(msgPostRes) {
                        (msgPostRes.body['SR_status']).should.equal(statusOK);
                        (msgPostRes.status).should.equal(200);
                    })
                    .end(function(msgPostErr, msgPostRes) {
                        if (msgPostErr) {
                            done(msgPostErr);
                            return;
                        }
                        messagex.msgId = msgPostRes.body.message;
                        // Get the list of messages
                        agent.get('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location1.location_name + '/msgs')
                            .auth(apiCredentials.uid, apiCredentials.token)
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
                                // Check only three messages at locations
                                (messages.length).should.equal(4);

                                // Check msg is in list
                                (messages[messages.length -1].id).should.equal(messagex.msgId);

                                done();
                            })
                    })
            })
    });

	it('should not be able to create message for ended job', function(done) {
        var timestamp = ((new Date()).getTime()).toString();
        var jobEnd = {
            timestamp: timestamp
        }
        var message8 = {
            content: JSON.stringify(someContent),
            is_reply: 'false',
            timestamp: timestamp,
            msgId: null
        }
        agent.put('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/end')
            .auth(apiCredentials.uid, apiCredentials.token)
            .set('Content-Type', typeJSON)
            .send(jobEnd)
            .expect(200, {SR_status: statusOK})
            .end(function(jobPutErr, jobPutRes) {
                if (jobPutErr) {
                    done(jobPutErr);
                    return;
                }
		        agent.post('/api/projects/' + project.project_name + '/jobs/' + job.jobId + '/locations/' + location2.location_name + '/msgs')
                    .auth(apiCredentials.uid, apiCredentials.token)
                    .set('Content-Type', typeJSON)
                    .send(message8)
                    .expect(400)
                    .end(function(msgPostErr, msgPostRes) {
                        done(msgPostErr);
                    })
            });
    });

    after(function(done) {
        removeUsers(agent, credentials, done);
    });
});
