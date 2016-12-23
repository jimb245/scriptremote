
'use strict';

/**
 * Globals
 */


// Create test users defined in credentials
// if they do not already exist. Uses admin login
// so admin user must already be created via browser UI.
// credentials is updated with the users uid's.
// Calls done() if successful, done(err) otherwise.
exports.initUsers = function(agent, credentials, done) {

    // Establish admin session
    debugger;
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            done(getErr);
            return;
        }
        // Extract csrf token from response and post the admin login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + credentials.admin.email;
        var passwordForm = 'password=' + credentials.admin.password;
        agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302)
            .end(function(postErr, postRes) {
                if (postErr) {
                    done(postErr);
                    return;
                }
                // Post first user reg requst
                var req1 = agent.post('/admin/users')
                    .set('Content-Type', 'application/json')
                    .send(credentials.user1)
                    .set('X-XSRF-TOKEN', csrfToken);
                req1.end(function(postErr1, postRes1) {
                    if (postErr1) {
                        done(postErr1);
                        return;
                    }
                    if (postRes1.status != 200 && postRes1.status != 400) {
                        var err = new Error('User registration failed');
                        done(err);
                        return;
                    }
                    credentials.user1.uid = postRes1.body.uid;
                    // Post second user reg requst
                    var req2 = agent.post('/admin/users')
                        .set('Content-Type', 'application/json')
                        .send(credentials.user2)
                        .set('X-XSRF-TOKEN', csrfToken);
                    req2.end(function(postErr2, postRes2) {
                        if (postErr2) {
                            done(postErr2);
                            return;
                        }
                        if (postRes2.status != 200 && postRes2.status != 400) {
                            var err = new Error('User registration failed');
                            done(err);
                            return;
                        }
                        credentials.user2.uid = postRes2.body.uid;
                        // End admin session
                        agent.get('/logout')
                            .expect(302)
                            .end(function(getErr, getRes) {
                                if (getErr) {
                                    done(getErr);
                                    return;
                                }
                                done();
                            })
                    })
                })
            })
    })
}

var credentialsHelper = function(agent, credentials, done, callback) {
    if (!credentials.user1.uid || !credentials.user2.uid) {
        var get1 = agent.get('/admin/users').end(function(getErr1, getRes1) {
            if (getErr1) {
                done(getErr1);
                return;
            }
            if (getRes1.status != 200) {
                var err = new Error('Get credentials failed');
                done(err);
                return;
            }
            for (var i = 0; i < getRes1.users.length; i++) {
                var user = getRes1.users[i];
                if (user['email'] == credentials.user1.email) {
                    credentials.user1.uid = user['uid'];
                }
                if (user['email'] == credentials.user2.email) {
                    credentials.user2.uid = user['uid'];
                }
            }
            callback();
        })
    }
    else {
        callback(); 
    }
}


// Remove test users defined in credentials
// using admin login.
// Calls done() if successful, done(err) otherwise.
exports.removeUsers = function(agent, credentials, done) {

    // Establish admin session
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            done(getErr);
            return;
        }
        // Extract csrf token from response and post the admin login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + credentials.admin.email;
        var passwordForm = 'password=' + credentials.admin.password;
        var post1 = agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302);
        post1.end(function(postErr, postRes) {
            if (postErr) {
                done(postErr);
                return;
            }
            credentialsHelper(agent, credentials, done, function() {
                if (credentials.user1.uid) {
                    // Post first user delete requst
                    var delete1 = agent.del('/admin/users/' + credentials.user1.uid)
                        .set('X-XSRF-TOKEN', csrfToken);
                    delete1.end(function(delErr1, delRes1) {
                        if (delErr1) {
                            done(delErr1);
                            return;
                        }
                        if (delRes1.status != 200 && delRes1.status != 400 && delRes1.status != 401) {
                            var err = new Error('User delete failed');
                            done(err);
                            return;
                        }
                        // Post second user delete requst
                        var delete2 = agent.del('/admin/users/' + credentials.user2.uid)
                            .set('X-XSRF-TOKEN', csrfToken);
                        delete2.end(function(delErr2, delRes2) {
                            if (delErr2) {
                                done(delErr2);
                                return;
                            }
                            if (delRes2.status != 200 && delRes2.status != 400 && delRes2.status != 401) {
                                var err = new Error('User delete failed');
                                done(err);
                                return;
                            }
                            // End admin session
                            agent.get('/logout')
                                .expect(302)
                                .end(function(getErr, getRes) {
                                    if (getErr) {
                                        done(getErr);
                                        return;
                                    }
                                    done();
                                })
                        })
                    })
                }
            })
        })
    })
}


// Gets a user's API id and generates a hashed API token by
// logging in as user.
// Calls success(credentials) if successful,
// calls error(err) otherwise.
exports.getAPICredentials = function(agent, email, password, success, error) {


    // Establish user session
    debugger;
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            error(getErr);
            return;
        }
        // Extract csrf token from response and post the login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + email;
        var passwordForm = 'password=' + password;
        var post1 = agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302);
        post1.end(function(postErr, postRes) {
            if (postErr) {
                error(postErr);
                return;
            }
            // Get the credentials - this will generate and save token
            var post1 = agent.post('/settings-xhr/apiCredentials')
                .set('Content-Type', 'application/json')
                .set('X-XSRF-TOKEN', csrfToken)
                .expect('Cache-Control', 'no-store')
                .expect(200);
            post1.end(function(postErr1, postRes1) {
                if (postErr1) {
                    error(postErr1);
                    return;
                }
                var credentials = postRes1.body.credentials;
                // End user session
                agent.get('/logout')
                    .expect(302)
                    .end(function(getErr2, getRes2) {
                        if (getErr2) {
                            error(getErr2);
                            return;
                        }
                        success(credentials);
                    })
            })
        })
    })
}

// Gets a user's registration email token by logging in as user.
// Calls success(token) if successful,
// calls error(err) otherwise.
exports.getRegToken = function(agent, email, password, success, error) {


    // Establish user session
    debugger;
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            error(getErr);
            return;
        }
        // Extract csrf token from response and post the login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + email;
        var passwordForm = 'password=' + password;
        var post1 = agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302);
        post1.end(function(postErr, postRes) {
            if (postErr) {
                error(postErr);
                return;
            }
            // Get the credentials
            var get1 = agent.get('/settings-xhr/credentials')
                .set('Content-Type', 'application/json')
                .set('X-XSRF-TOKEN', csrfToken)
                .expect(200);
            get1.end(function(getErr1, getRes1) {
                if (getErr1) {
                    error(getErr1);
                    return;
                }
                var token = getRes1.body.credentials.token;
                // End user session
                agent.get('/logout')
                    .expect(302)
                    .end(function(getErr2, getRes2) {
                        if (getErr2) {
                            error(getErr2);
                            return;
                        }
                        success(token);
                    })
            })
        })
    })
}

// Gets a user's API id and token's by logging in as admin.
// Calls success(credentials) if successful,
// calls error(err) otherwise.
exports.getAPICredentialsByAdmin = function(agent, adminEmail, adminPassword, userEmail, success, error) {


    // Establish admin session
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            error(getErr);
            return;
        }
        // Extract csrf token from response and post the login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + adminEmail;
        var passwordForm = 'password=' + adminPassword;
        var post1 = agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302);
        post1.end(function(postErr, postRes) {
            if (postErr) {
                error(postErr);
                return;
            }
            // Get list of user uid's and email's
            var get1 = agent.get('/admin/users')
                .expect(200);
            get1.end(function(getErr1, getRes1) {
                if (getErr1) {
                    error(getErr1);
                    return;
                }
                var users = getRes1.body.users;
                var uid = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.match(userEmail)) {
                        uid = users[i].uid;
                        break;
                    }
                }
                if (uid) {
                    // Get user properties
                    var get2 = agent.get('/admin/users/' + uid)
                        .expect(200);
                    get2.end(function(getErr2, getRes2) {
                        if (getErr2) {
                            error(getErr2);
                            return;
                        }
                        var credentials = {uid: getRes2.body.user.uid, token: getRes2.body.user.token, regToken: getRes2.body.user.regToken};
                        success(credentials);
                    })
                }
                else {
                    error();
                }
            })
        })
    })
}


// Gets a list of users by logging in as admin.
// Calls success(users) if successful,
// calls error(err) otherwise.
exports.getUsers = function(agent, email, password, success, error) {


    // Establish admin session
    agent.get('/login').end(function(getErr, getRes) {
        if (getErr) {
            error(getErr);
            return;
        }
        // Extract csrf token from response and post the login credentials
        var csrfReg = new RegExp('name="_csrf" value="([^"]+)"');
        var csrfMatch = getRes.text.match(csrfReg);
        var csrfToken = csrfMatch[1];
        var csrfForm = '_csrf=' + csrfToken;
        var emailForm = 'email=' + email;
        var passwordForm = 'password=' + password;
        var post1 = agent.post('/processlogin')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(emailForm)
            .send(passwordForm)
            .send(csrfForm)
            .expect(302);
        post1.end(function(postErr, postRes) {
            if (postErr) {
                error(postErr);
                return;
            }
            // Get list of user uid's and email's
            var get1 = agent.get('/admin/users')
                .expect(200);
            get1.end(function(getErr1, getRes1) {
                if (getErr1) {
                    error(getErr1);
                    return;
                }
                var users = getRes1.body.users;
                // End admin session
                agent.get('/logout')
                    .expect(302)
                    .end(function(getErr2, getRes2) {
                        if (getErr2) {
                            error(getErr2);
                            return;
                        }
                        success(users);
                    })
            })
        })
    })
}
