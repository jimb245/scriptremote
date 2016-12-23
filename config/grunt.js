'use strict';

module.exports = {
    // Grunt initialization requires files to watch
    // independent of environment selection
	watchFiles : {
		serverViews: ['app/views/**/*.*'],
		serverJS: ['gruntfile.js', 'server.js', 'server_mod.js', 'config/**/*.js', 'app/**/*.js'],
		clientViews: ['public/modules/**/views/**/*.html'],
		clientJS: ['public/*.js', 'public/modules/**/*.js'],
		clientCSS: ['public/modules/**/*.css'],
		mochaTests: ['app/tests/api/**/*.js', 'app/tests/browser/**/*.js']
	}
}
