'use strict';

module.exports = {
	port: process.env.SRPORT || 3000,

    db: process.env.MONGO_URL || 'mongodb://' + (process.env.MONGO_HOST_PORT || 'localhost') + '/scriptremote-dev',

	assets: {
        client: {
            lib: {
                css: [
                    //'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',
                    'public/lib/bootstrap/dist/css/bootstrap.min.css',
                    'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
                    'public/lib/html5-boilerplate/dist/css/normalize.css',
                    'public/lib/html5-boilerplate/dist/css/main.css'
                ],
                js: [
                    //'https://code.angularjs.org/1.3.17/angular/angular.min.js',
                    //'https://code.angularjs.org/1.3.17/angular-route/angular-route.min.js', 
                    //'https://code.angularjs.org/1.3.17/angular-resource/angular-resource.min.js', 
                    //'https://code.jquery.com/jquery-2.1.4.min.js'.
                    //'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js',
                    'public/lib/angular/angular.min.js',
                    'public/lib/angular-route/angular-route.min.js', 
                    'public/lib/angular-resource/angular-resource.min.js', 
                    'public/lib/jquery/dist/jquery.min.js',
                    'public/lib/bootstrap/dist/js/bootstrap.min.js',
                    'public/lib/forge-bower/js/forge.min.min.js',
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
    }
};
