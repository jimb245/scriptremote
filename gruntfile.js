'use strict';

module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = require('./config/grunt.js').watchFiles;

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			serverViews: {
				files: watchFiles.serverViews,
				options: {
					livereload: true
				}
			},
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			clientViews: {
				files: watchFiles.clientViews,
				options: {
					livereload: true,
				}
			},
			clientJS: {
				files: watchFiles.clientJS,
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			clientCSS: {
				files: watchFiles.clientCSS,
				tasks: ['csslint'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
            options: {
                jshintrc: true
            },
			files: {
				src: watchFiles.clientJS.concat(watchFiles.serverJS),
            }
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc',
			},
			all: {
				src: watchFiles.clientCSS
			}
		},
		uglify: {
			production: {
				options: {
					mangle: false
				},
				files: {
					'public/dist/application.min-<%= appVersion %>.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/dist/application.min-<%= appVersion %>.css': '<%= applicationCSSFiles %>'
				}
			}
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: [],
					ext: 'js,html',
					watch: watchFiles.serverViews.concat(watchFiles.serverJS)
				}
			}
		},
		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		concurrent: {
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		},
		env: {
			test: {
				NODE_ENV: 'test',
                SRTESTMODE: '1', // Used in bash tests
                SRSERVER: 'http://localhost:3000'
			},
			secure: {
				NODE_ENV: 'secure'
			},
            production: {
                NODE_ENV: 'production'
            },
            development: {
                NODE_ENV: 'development'
            }
		},
		mochaTest: {
            test: {
                src: watchFiles.mochaTests,
                options: {
                    timeout: 8000,
                    reporter: 'spec'
                }
            }
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},
        bats: {
            files: [ 'public/scripts/bash/test/set*.bats' ],
            options: {
                p: true
            }
        },
        nose: {
            options: { 'verbose': true, 'nocapture': true },
            files: [ 'public/scripts/python/test' ]
        },
        'string-replace': {
            inline: {
                files: {
                    'public/dist/srio.sh': ['public/scripts/bash/srio.sh'],
                    'public/dist/srio.py': ['public/scripts/python/srio.py'],
                    'package.json': ['package.json'],
                    '<%= cssPath %>' : [ '<%= cssPath %>' ],
                    'public/doc/readme.html': ['public/doc/readme.html'],
                    'public/doc/InstallDigitalOcean.html': ['public/doc/InstallDigitalOcean.html'],
                    'public/doc/guide.html': ['public/doc/guide.html'],
                    'public/doc/InstallBluemix.html': ['public/doc/InstallBluemix.html'],
                    'public/doc/InstallGeneric.html': ['public/doc/InstallGeneric.html'],
                    'public/doc/InstallDevelop.html': ['public/doc/InstallDevelop.html']
                },
                // Set version in script files and package.json.
                // Fix some font references in css files.
                // Fix .md references in readme.html which 
                // was generated from README.md by md2html,
                // Make Home link visible in .html doc files
                // that were generated from md by md2html.
                options: {
                    replacements: [
                        { pattern: /%version%/, replacement: '<%= appVersion %>' },
                        { pattern: /"version":\s+"\d.\d.\d"/, replacement: '"version": "<%= appVersion %>"' },
                        { pattern: "../fonts/glyphicons-halflings-regular.woff", replacement: '<%= woffPath %>' },
                        { pattern: "../fonts/glyphicons-halflings-regular.ttf", replacement: '<%= ttfPath %>' },
                        { pattern: /public\/doc/g, replacement: '/doc' },
                        { pattern: "guide.md", replacement: 'guide.html' },
                        { pattern: "InstallDigitalOcean.md", replacement: 'InstallDigitalOcean.html' },
                        { pattern: "InstallBluemix.md", replacement: 'InstallBluemix.html' },
                        { pattern: "InstallGeneric.md", replacement: 'InstallGeneric.html' },
                        { pattern: "InstallDevelop.md", replacement: 'InstallDevelop.html' },
                        { pattern: "display:none", replacement: 'display:block' }
                    ]
                }
            }
        },
        md2html: {
            readme_file: {
                options: {},
                files: [{
                src: ['README.md'],
                dest: 'public/doc/readme.html'
                }]
            },
            guide_file: {
                options: {},
                files: [{
                src: ['public/doc/guide.md'],
                dest: 'public/doc/guide.html'
                }]
            },
            installdo_file: {
                options: {},
                files: [{
                src: ['public/doc/InstallDigitalOcean.md'],
                dest: 'public/doc/InstallDigitalOcean.html'
                }]
            },
            installblue_file: {
                options: {},
                files: [{
                src: ['public/doc/InstallBluemix.md'],
                dest: 'public/doc/InstallBluemix.html'
                }]
            },
            installgen_file: {
                options: {},
                files: [{
                src: ['public/doc/InstallGeneric.md'],
                dest: 'public/doc/InstallGeneric.html'
                }]
            },
            installdev_file: {
                options: {},
                files: [{
                src: ['public/doc/InstallDevelop.md'],
                dest: 'public/doc/InstallDevelop.html'
                }]
            }
        },
        kapocs: {
            glyphiconTarget: {
                options: {
                    referencePrefix: 'url(../fonts/',
                    referenceSuffix: ')'
                },
                assets: [{
                    expand: true,
                    cwd: 'public/lib/bootstrap/dist/fonts',
                    dot: true,
                    src: ['glyphicons-halflings-regular.ttf', 'glyphicons-halflings-regular.woff'],
                    dest: 'public/dist'
                }]
            },
            jsTarget: {
                assetTemplates: [{
                    expand: true,
                    dot: true,
                    src: ['<%= applicationJavaScriptLibFiles %>'],
                    dest: 'public/dist',
                    flatten: true
                }]
            },
            cssTarget: {
                assetTemplates: [{
                    expand: true,
                    dot: true,
                    src: ['<%= applicationCSSLibFiles %>'],
                    dest: 'public/dist',
                    flatten: true
                }]
            }
        },
        apidoc: {
            apiTarget: {
                src: 'app/routes/api',
                dest: 'public/doc/api'
            }
        }
    });

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

    // Shrinkwrap with and without dev dependencies, outputs in npm-shrinkwrap.json
    // and npm-shrinkwrap-dev.json
    grunt.registerTask('shrinkwrap', 'Grunt task for shrinkwrapping via npm shrinkwrap', function() { 
        var shelljs = require('shelljs');
        shelljs.exec('npm prune');
        shelljs.exec('npm shrinkwrap --dev');
        shelljs.exec('mv npm-shrinkwrap.json npm-shrinkwrap-dev.json');
        shelljs.exec('npm shrinkwrap');
    });

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');
		grunt.config.set('applicationJavaScriptFiles', config.assets.client.js);
		grunt.config.set('applicationJavaScriptLibFiles', config.assets.client.lib.js);
		grunt.config.set('applicationCSSFiles', config.assets.client.css);
		grunt.config.set('applicationCSSLibFiles', config.assets.client.lib.css);
        grunt.config.set('appVersion', config.app.version);
	});

	// A Task to check if admin credentials are available when needed for test
	grunt.task.registerTask('checkAdmin', 'Task that loads the config and checks admin credentials.', function() {
	    grunt.option('force', false); // No point in continuing if this fails
        grunt.config.set('adminEmail', process.env.SRADMINEMAIL);
        grunt.config.set('adminPW', process.env.SRADMINPASSWORD);
        grunt.config.requires('adminEmail');
        grunt.config.requires('adminPW');
	    grunt.option('force', true); 
	});

	// A Task to get cache-busted names of bootstrap glyphicon files.
    // kapocs doesnt handle references to them in bootstrap.min.css
    // so it's done with string-replace instead
	grunt.task.registerTask('glyphiconNames', 'Task that gets glyphicon filenames.', function() {
        var options = {'cwd': 'public/dist'};
        var woff = grunt.file.expand(options, '**.woff');
        grunt.config.set('woffPath', woff[0]);
        var ttf = grunt.file.expand(options, '**.ttf');
        grunt.config.set('ttfPath', ttf[0]);
        var css = grunt.file.expand('public/dist/bootstrap.**.css');
        grunt.config.set('cssPath', css[0]);
	});

    // A task to check for leftover cache-busted files in public/dist -
    // they need to be removed from repository.
	grunt.task.registerTask('extraFilesCheck', 'Task that prevents extra files in public/dist.', function() {
	    grunt.option('force', false);
        var cssFiles = grunt.file.expand('public/dist/**.css');
        var cssLib = grunt.config.get('applicationCSSLibFiles');
        if (cssFiles.length > cssLib.length + 1) {
            console.log('Extra .css file in public/dist');
            return false;
        }
        var jsFiles = grunt.file.expand('public/dist/**.js');
        var jsLib = grunt.config.get('applicationJavaScriptLibFiles');
        if (jsFiles.length > jsLib.length + 1) {
            console.log('Extra .css file in public/dist');
            return false;
        }
        var woffFiles = grunt.file.expand('public/dist/**.woff');
        if (woffFiles.length > 1) {
            console.log('Extra .woff file in public/dist');
            return false;
        }
        var ttfFiles = grunt.file.expand('public/dist/**.ttf');
        if (ttfFiles.length > 1) {
            console.log('Extra .ttf file in public/dist');
            return false;
        }
	    grunt.option('force', true);
    });

    // Task to set up environment for bats (bash script testing)
    grunt.task.registerTask('initBats', 'Task to set up environment for bats', function() {
        var util = require('./public/scripts/bash/test/util.js');
        var done = this.async();
        util.initBatsUsers(done);
    });

    // Task to clean up after bats (bash script testing)
    grunt.task.registerTask('cleanBats', 'Task to clean up after bats', function() {
        var util = require('./public/scripts/bash/test/util.js');
        var done = this.async();
        util.cleanBatsUsers(done);
    });


    // Task to set up environment for nose (python script testing)
    grunt.task.registerTask('initNose', 'Task to set up environment for nose', function() {
        var util = require('./public/scripts/python/test/pyutil.js');
        var done = this.async();
        util.initNoseUsers(done);
    });

    // Task to clean up after nose (python script testing)
    grunt.task.registerTask('cleanNose', 'Task to clean up after nose', function() {
        var util = require('./public/scripts/python/test/pyutil.js');
        var done = this.async();
        util.cleanNoseUsers(done);
    });

    // Foreground server task
    grunt.registerTask('server', 'Start a web server.', function() {
        var done = this.async();
        require('./server_mod.js')();
    });

	// Default task
	grunt.registerTask('default', ['lint', 'env:development', 'concurrent:default']);

	// Debug task
	grunt.registerTask('debug', ['lint', 'concurrent:debug']);

	// Development server task
	grunt.registerTask('development', ['env:development', 'server']);

	// Test server task
	grunt.registerTask('testserver', ['env:test', 'server']);

	// Production server task
	grunt.registerTask('production', ['env:production', 'server']);

	// Secure (https) server task
	grunt.registerTask('secure', ['env:secure', 'server']);

	// Lint task
	grunt.registerTask('lint', ['jshint', 'csslint']);

	// Build task
	grunt.registerTask('build', ['lint', 'env:development', 'loadConfig', 'uglify', 'cssmin', 'kapocs', 'extraFilesCheck', 'glyphiconNames', 'md2html', 'string-replace', 'apidoc', 'shrinkwrap']);

    // Task for testing bash utilities script
	grunt.registerTask('batsRun', ['env:test', 'checkAdmin', 'initBats', 'bats', 'cleanBats']);
        
    // Task for testing python utilities script
	grunt.registerTask('noseRun', ['env:test', 'checkAdmin', 'initNose', 'nose', 'cleanNose']);

    // Task for testing server/API with mocha
	grunt.registerTask('mochaRun', ['env:test', 'checkAdmin', 'mochaTest']);

    // Task for testing Angular client with karma
	grunt.registerTask('karmaRun', ['env:test', 'karma:unit']);
        
	// Task for all tests
	grunt.registerTask('test', ['batsRun', 'noseRun', 'mochaRun', 'karmaRun']);
};
