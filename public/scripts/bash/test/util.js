'use strict'

var request = require('supertest'),
    fs = require('fs'),
    initUsers = require('../../../../app/tests/utils.js').initUsers,
    removeUsers = require('../../../../app/tests/utils.js').removeUsers,
    getAPICredentials = require('../../../../app/tests/utils.js').getAPICredentials;

var credentials = null,
    agent,
    app;

var initUsersHelper = function(agent, credentials, done) {
    initUsers(agent, credentials, function(err) {
        if (err) {
            done(false);
        }
        else {
            getAPICredentials(agent, credentials.user1.email, credentials.user1.password,
                function(apicred1) {

                    getAPICredentials(agent, credentials.user2.email, credentials.user2.password,
                        function(apicred2) {
                            var text = 'export SRUSER=' + apicred1.uid;
                            text += '\nexport SRTOKEN=' + apicred1.token;
                            text += '\nexport SREMAIL=' + credentials.user1.email;
                            text += '\nexport SRSHAREUSER=' + apicred2.uid;
                            text += '\nexport SRSHARETOKEN=' + apicred2.token;
                            text += '\nexport SRSHAREEMAIL=' + credentials.user2.email;
                            text += '\nexport SRTESTMODE=1',
                            text += '\nexport BATSDIR=public/scripts/bash/test',
                            text += '\nexport SRSERVER=localhost:3000';

                            fs.writeFile('public/scripts/bash/test/credentials.bash', text, function(err) {
                                if (err) {
                                    done(false);
                                 }
                            });
                            done(true);
                        },
                        function(err) {
                            done(false);
                        }
                    )
                },
                function(err) {
                    done(false);
                }
            )
        }
    })
}


//
// Create users, get API credentials, write them to bash file
//
exports.initBatsUsers = function(done) {

    if (!global.myapp) {
        require('../../../../server_mod.js')()
        .then( function(app1) {
            global.myapp = app1;
            app = app1;
            credentials = global.myapp.locals.credentials;
            agent = request.agent(app);
            initUsersHelper(agent, credentials, done);
        })
    }
    else {
        app = global.myapp;
        agent = request.agent(app);
        credentials = global.myapp.locals.credentials;
        initUsersHelper(agent, credentials, done);
    }
}

//
// Cleanup users
//
exports.cleanBatsUsers = function(done) {

    if (!global.myapp) {
        require('../../../../server_mod.js')()
        .then( function(app1) {
            global.myapp = app1;
            app = app1;
            credentials = global.myapp.locals.credentials;
            agent = request.agent(global.myapp);
            debugger;
            removeUsers(agent, credentials, function(err) {
                if (err) {
                    done(false);
                }
                else {
                    done(true);
                }
            })
        })
    }
    else {
        credentials = global.myapp.locals.credentials;
        debugger;
        removeUsers(agent, credentials, function(err) {
            if (err) {
                done(false);
            }
            else {
                done(true);
            }
        })
    }
}

