'use strict';

var cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv();


module.exports = {
    port: appEnv.port,
    db: process.env.MONGO_URL || 'mongodb://' + (process.env.MONGO_HOST_PORT || 'localhost') + '/scriptremote-dev',
	assets: {
        client: {
            lib: {
                css: [
                    'public/dist/bootstrap.min.*.css',
                    'public/dist/bootstrap-theme.min.*.css',
                    'public/dist/normalize.*.css',
                    'public/dist/main.*.css'
                ],
                js: [
                    'public/dist/angular.min.*.js',
                    'public/dist/angular-route.min.*.js', 
                    'public/dist/angular-resource.min.*.js', 
                    'public/dist/jquery.min.*.js',
                    'public/dist/bootstrap.min.*.js',
                    'public/dist/forge.min.*.js',
                    'public/dist/modernizr-2.8.3.min.*.js'
                ]
            },
            css: 'public/dist/application.min-*.css',
            js: 'public/dist/application.min-*.js',
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
                'public/dist/bootstrap.min.*.css',
                'public/dist/normalize.*.css',
                'public/dist/main.*.css'
            ],
            js: [
                'public/dist/jquery.min.*.js',
                'public/dist/bootstrap.min.*.js',
                'public/dist/modernizr-2.8.3.min.*.js'
            ]
        }
    }
};
