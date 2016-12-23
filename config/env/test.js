'use strict';

module.exports = {
	port: process.env.SRPORT || 3000,

    db: process.env.MONGO_URL || 'mongodb://' + (process.env.MONGO_HOST_PORT || 'localhost') + '/scriptremote-test',

	assets: {
        client: {
            lib: {
                css: [
                    'public/lib/bootstrap/dist/css/bootstrap.min.css',
                    'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
                    'public/lib/html5-boilerplate/dist/css/normalize.css',
                    'public/lib/html5-boilerplate/dist/css/main.css'
                ],
                js: [
                    'public/lib/angular/angular.min.js',
                    'public/lib/angular-route/angular-route.min.js', 
                    'public/lib/angular-resource/angular-resource.min.js', 
                    'public/lib/jquery/dist/jquery.min.js',
                    'public/lib/bootstrap/dist/js/bootstrap.min.js',
                    'public/lib/forge/js/forge.min.js',
                    'public/lib/html5-boilerplate/dist/js/vendor/modernizr-2.8.3.min.js'
                ]
            },
            css: [
                'public/modules/**/css/*.css'
            ],
            js: [
                'public/config.js',
                'public/application.js',
                'public/modules/*/*/*.js',
                'public/modules/*/*/src/*.js',
                'public/modules/*/*[!tests]*/*.js'
            ],
            tests: [
                'public/lib/angular-mocks/angular-mocks.js',
                'public/modules/**/tests/*.js'
            ],
            views: [
                'public/modules/**/src/**/*.html',
                'public/modules/views/content/src/templates/*.html'
            ]
        },
        login: {
            css: [
                'public/lib/bootstrap/dist/css/bootstrap.css',
                'public/lib/html5-boilerplate/dist/css/normalize.css',
                'public/lib/html5-boilerplate/dist/css/main.css'
            ],
            js: [
                'public/lib/jquery/dist/jquery.min.js',
                'public/lib/bootstrap/dist/js/bootstrap.min.js',
                'public/lib/html5-boilerplate/dist/js/vendor/modernizr-2.8.3.min.js'
            ]
        }
    },

    credentials: {
        admin: {
            email: process.env.SRADMINEMAIL,
            password: process.env.SRADMINPASSWORD,
            project1: process.env.SRUSER1PROJECT1 || 'project1',
            project2: process.env.SRUSER1PROJECT2 || 'project2'
        },
        user1: {
            name: 'User1',
            company: 'foo',
            email: process.env.SRUSER1EMAIL || 'user1@foo1zxwlmpqrtdip.com',
            password: process.env.SRUSER1PASSWORD || '123',
            project1: process.env.SRUSER1PROJECT1 || 'project1',
            project2: process.env.SRUSER1PROJECT2 || 'project2'
        },
        user2: {
            name: 'User2',
            company: 'foo',
            email: process.env.SREUSER2EMAIL || 'user2@foo1zxwlmpqrtdip.com',
            password: process.env.SRUSER2PASSWORD || '123'
        }
    },

    limits: {
        // Optional limits on data usage
        //maxUsers: process.env.SR_MAX_USERS,
        projectsPerUser: 4,
        jobsPerProject: 4,
        locationsPerJob: 4,
        messagesPerLocation: 4,
        // Message size limit in bytes - approximate, applies to 
        // encoded/uploaded data including attachments
        messageSize: 100000,
        // Job message size limit in bytes -  approximate, applies to 
        // encoded/uploaded data including attachments. Limit may be 
        // overshot due to concurrent DB requests.
        messageSizeJob: 200000
    }
};
