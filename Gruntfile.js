module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    var fs = require('fs');
  	grunt.loadNpmTasks('grunt-sass');
    //grunt.loadNpmTasks('grunt-typescript');
    grunt.initConfig({
        // TODO: Grunt watch uses slow fs.watchFile - either use alternative watch... or hmm
        // https://www.npmjs.org/package/grunt-fast-watch
        // http://tech.nitoyon.com/en/blog/2013/10/10/grunt-watch-slow/
        sass: {
          options: {
            sourceMap: true,
            outputStyle: 'compressed',
            includePaths: ['cdn_source/scss', 'cdn/bower_components/compass-mixins/lib', 'cdn/bower_components/bootstrap-sass-xl/assets/stylesheets']
          },
          dist: {
            files: {
              'cdn/css/main.css': 'cdn_source/scss/main.scss',
              'cdn/css/app.css': 'cdn_source/scss/app.scss',
              'cdn/fonts/fonts.css': 'cdn_source/scss/fonts.scss',
              'cdn/css/admin.css': 'cdn_source/scss/admin.scss',
              'cdn/css/lib.css': 'cdn_source/scss/lib.scss'
            }
          }
        },
        watch: {
            options: {
                reload: true,
                interval: 500
            },
            libs: {
                files: 'cdn_source/vendor/libs/js/**/*.js',
                tasks: ['uglify:libs', 'shell:toast:libs']
            },
            bower_components: {
                files: ['cdn/bower_components/**/*.js', 'bower.json'],
                tasks: ['bower_concat', 'shell:toast:bower_components']
            },
            bower_views: {
                files: 'cdn/bower_components/**/*.html',
                tasks: ['ngtemplates:bower', 'bower_concat', 'shell:toast:bower_views']
            },
            bower: {
                files: 'bower.json',
                tasks: ['shell:bower', 'shell:toast:bower']
            },

            css: {
                files: [
                    'cdn_source/scss/**/*.scss',
                    'cdn_source/scss/**/*.sass',
                    'cdn_source/app/**/*.scss',
                    'cdn_source/app/**/*.sass',
                    // 'cdn_source/aurelia/**/*.scss',
                    // 'cdn_source/aurelia/**/*.sass',
                    'cdn/bower_components/**/*.css',
                    'cdn/bower_components/**/*.scss',
                    'cdn/bower_components/**/*.sass',
                    'cdn_source/vendor/libs/css/**/*.css'
                ],
                tasks: ['sass:dist', 'shell:toast:scss']
            },
            metadata: {
                files: [
                    '../Libraries/SN.withSIX.UpdateBreeze.Library/bin/Release/SN.withSIX.UpdateBreeze.Library.dll'
                ],
                tasks: ['shell:build_metadata', 'shell:toast:metadata']
            }
        },
        bgShell: {
          _defaults: {
            bg: true
          },

          watchGulp: {
            cmd: 'gulp watch-only'
          }
        },
        shell: {
            build_metadata: {
// Target
                command: function () {
                  if (!fs.existsSync('..\\Libraries\\SN.withSIX.UpdateBreeze.Node\\app.js'))
                    return 'echo "Not processing Metadata"';
                return 'cd ..\\Libraries\\SN.withSIX.UpdateBreeze.Node && %appdata%\\nvm\\v0.12.7\\node app.js';
            }
            },
            toast: {
// Target
                command: function(greeting) {
                    return 'cd /D C:\\tools\\toast && toast.exe -t "Ran Grunt" -m "' + greeting + '"';
                }
            },
            bower: {
              command: 'bower prune && bower install --config.interactive=false'
            },
            jspm: {
              command: 'cd ..\\buildscripts && run_jspm.bat'
            },
            bundle: {
              command: 'gulp bundle'
            },
            build: {
              command: 'gulp build'
            }
        },
        notify: {
            watch: {
                options: {
                    title: 'Task Complete', // optional
                    message: 'SASS and Uglify finished running', //required
                }
            }
        },

        ngtemplates: {
            Components: {
                cwd: 'cdn_source/app',
                src: 'components/**/*.html',
                dest: 'cdn/app/dist/components/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppPlayTemplates: {
                cwd: 'cdn_source/app',
                src: 'play/**/*.html',
                dest: 'cdn/app/dist/play/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppConnectTemplates: {
                cwd: 'cdn_source/app',
                src: 'connect/**/*.html',
                dest: 'cdn/app/dist/connect/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppAuthTemplates: {
                cwd: 'cdn_source/app',
                src: 'auth/**/*.html',
                dest: 'cdn/app/dist/auth/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppMainTemplates: {
                cwd: 'cdn_source/app',
                src: 'main/**/*.html',
                dest: 'cdn/app/dist/main/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppKbTemplates: {
                cwd: 'cdn_source/app',
                src: 'kb/**/*.html',
                dest: 'cdn/app/dist/kb/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            MyAppAdminTemplates: {
                cwd: 'cdn_source/app',
                src: 'admin/**/*.html',
                dest: 'cdn/app/dist/admin/template.js',
                options: {
                    prefix: '/cdn_source/app',
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            bower: {
                cwd: 'cdn/bower_components/angular-ui-bootstrap',
                src: 'template/**/*.html',
                dest: 'cdn/js/vendor/bower-template.js',
                options: {
                    module: 'ui.bootstrap.tabs'
                }
            }
        },
        bower_concat: {
            all: {
                dest: 'cdn/js/vendor/bower.js',
                mainFiles: {
                    'angular-ui': ['build/angular-ui.js'],
                    'breezejs': ['breeze.debug.js', 'labs/breeze.angular.js', 'labs/breeze.metadata-helper.js', 'labs/breeze.directives.js', 'labs/breeze.getEntityGraph.js', 'labs/breeze.saveErrorExtensions.js'],
                    'ng-tags-input': ['ng-tags-input.js'],
                    'angular-ui-bootstrap': ['src/tabs/tabs.js'],
                    'ngmap': [''],
                    'allmighty-autocomplete': ['script/autocomplete.js'],
                    'ng-flags': ['src/directives/ng-flags.js'],
                    'angular-rangeslider': ['angular.rangeSlider.js'],
                    'angular_progress': ['compiled/angular_progress.js'],
                    'angular-rx': ['dist/rx.angular.js'],
                    'rxjs': ['dist/rx.all.js'],
                    'underscore.string': ['lib/underscore.string.js'],
                    'redactor': ['redactor/redactor.js']
                },
                dependencies: {
                    'angular': ['jquery'],
                    'typeahead.js': ['jquery'],
                    'autofill-event': ['angular'],
                    'signalr': ['jquery'],
                    'jquery-colorbox': ['jquery'],
                    'jquery-cookie': ['jquery'],
                    'jquery-timeago': ['jquery']
                },
                exclude: [
                    'bootstrap',
                    'bootstrap-sass-official',
                    'compass-mixins',
                    'angular-motion',
                    'bootstrap-additions',
                    'zeroclipboard'
                ]
            }
        },
// typescript: {
//     base: {
//         src: ['**/*.ts'],
//         //dest: 'where/you/want/your/js/files',
//         options: {
//             //module: 'amd', //or commonjs
//             target: 'es5', //or es3
//             //basePath: 'cdn',
//             sourceMap: false,
//             declaration: false,
//         }
//     }
// },
        uglify: {
            bower: {
                options: {
                    mangle: true,
                    compress: false, // d3 incompatibility
                    sourceMap: true
                },
                files: {
                    'cdn/js/vendor/bower.min.js': [
                        'cdn/js/vendor/bower.js', 'cdn/js/vendor/bower-template.js'
                    ]
                }
            },
            libs: {
                options: {
                    mangle: true,
                    compress: false, // d3 incompatibility
                    sourceMap: true
                },
                files: {
                    'cdn/js/vendor/libs.min.js': [
                      'cdn_source/vendor/libs/js/**/*.js',
                      'node_modules/babel-core/browser-polyfill.js'
                    ]
                }
            },
            app: {
                options: {
                    mangle: true,
                    compress: {},
                    sourceMap: true
                },
                files: {
                    // TODO: Unclusterf*ck
                    'cdn/js/app.min.js': [
                        'cdn/app/dist/_base/**/*.js',
                        'cdn/app/dist/app.js',
                        'cdn/app/dist/*.js',
                        'cdn/app/dist/components/*.js',
                        'cdn/app/dist/components/**/*.js',
                        'cdn/app/dist/main/*.js',
                        'cdn/app/dist/main/**/*.js',
                        'cdn/app/dist/auth/*.js',
                        'cdn/app/dist/auth/**/*.js',
                        'cdn/app/dist/connect/*.js',
                        'cdn/app/dist/connect/**/*.js',
                        'cdn/app/dist/play/*.js',
                        'cdn/app/dist/play/**/*.js',
                        'cdn/app/dist/kb/*.js',
                        'cdn/app/dist/kb/**/*.js'
                    ]
                }
            },
            admin: {
                options: {
                    mangle: true,
                    compress: {},
                    sourceMap: true
                },
                files: {
                    'cdn/js/admin.min.js': [
                        'cdn/app/dist/admin/*.js',
                        'cdn/app/dist/admin/**/*.js'
                    ]
                }
            },
            misc: {
                options: {
                    mangle: true,
                    compress: {},
                    sourceMap: true
                },
                files: {
                    'cdn/js/misc.min.js': ['cdn/misc/dist/*.js']
                }
            }
        }
    });

    // For publishing
    grunt.registerTask('buildallPublish', ['buildBase', 'uglify:bower', 'ngtemplates', 'buildApp', 'shell:bundle']);
    // For development
    grunt.registerTask('watchAll', ['buildall', 'bgShell:watchGulp', 'watch']);
    // General
    grunt.registerTask('buildall', ['buildBase', 'shell:build_metadata']);
    grunt.registerTask('buildBase', ['shell:bower', 'bower_concat', 'buildAurelia', 'uglify:libs', 'buildCss'])
    grunt.registerTask('buildApp', ['uglify:app', 'uglify:misc', 'uglify:admin']);
    grunt.registerTask('buildCss', ['sass:dist']);
    grunt.registerTask('buildAurelia', ['shell:jspm','shell:build']);
    grunt.loadNpmTasks('grunt-notify');
}
