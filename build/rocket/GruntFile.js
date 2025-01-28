/*
 * Grunt configuration for rocket compilation
 */
"use strict";
module.exports = function (grunt) {

    grunt.initConfig({
        copy: {
            dist: {
                files:[
                    {
                        src: [ 'src/*.html', 'src/favicon.ico', 'src/robots.txt', 'src/LICENSE' ],
                        dest: '/dist/',
                        flatten:true,
                        expand: true 
                    },
                    {
                        src: [ 'node_modules/@fortawesome/fontawesome-free/webfonts/*' ],
                        dest: '/dist/assets/webfonts/',
                        expand: true,
                        flatten:true
                    },
                    {
                        src: [ 'node_modules/proj4/dist/proj4.js' ],
                        dest: '/dist/assets/libs/',
                        expand: true,
                        flatten:true
                    },
                    {
                        src: [ 'node_modules/aws-sdk/dist/aws-sdk.min.js' ],
                        dest: '/dist/assets/libs/',
                        expand: true,
                        flatten:true
                    },
                    {
                        src : [ 'src/assets/libs/openlayers-jrom/*.js', 'src/assets/libs/openlayers-jrom/*.js.map' ],
                        dest: '/dist/assets/libs/',
                        expand: true,
                        flatten:true
                    },
                    {
                        src: [ 'src/assets/libs/openlayers-ol-cesium/olcesium-debug.js' ],
                        dest: '/dist/assets/libs/',
                        expand: true,
                        flatten:true
                    },
                    {
                        cwd: 'node_modules/cesium/Build/Cesium/',
                        src: [ '**' ],
                        dest: '/dist/assets/libs/Cesium/',
                        expand: true,
                        flatten:false
                    },
                    {
                        cwd: 'src/assets/img/',
                        src: [ '**' ],
                        dest: '/dist/assets/img/',
                        expand: true,
                        flatten:false
                    }
                ]
            }
        },
        html2js: {
            options: {
                base: 'src',
                module: 'rocket.templates',
                singleModule: true,
                useStrict: true,
                htmlmin: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeComments: true,
                    removeEmptyAttributes: true,
                    removeRedundantAttributes: false,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                }
            },
            dist: {
                src: [
                    'src/app/pages/*/*.html',
                    'src/app/components/*/*.html',
                    'src/app/addons/*/*.html',
                    'src/app/addons/*/*/*.html',
                ],
                dest: 'tmp/templates.js'
            }
        },
        /*uncss: {
            dist: {
                files: {
                    '/dist/assets/css/tidy.css': ['/dist/index.html']
                }
            }
        },*/
        concat: {
            options: {
                separator: ';'
            },
            essential:{
                src: [
                    'node_modules/web-streams-polyfill/dist/ponyfill.js',
                    'node_modules/jquery/dist/jquery.js',
                    'node_modules/jquery-mousewheel/jquery.mousewheel.js',
                    //'node_modules/blueimp-md5/js/md5.js',
                    'node_modules/memorystorage/src/memorystorage.js',
                    'node_modules/moment/moment.js',
                    'node_modules/moment/locale/en.js',
                    'node_modules/moment/locale/fr.js',
                    'node_modules/flatpickr/dist/flatpickr.js',
                    'node_modules/flatpickr/dist/i10n/fr.ts',
                    'node_modules/angular/angular.js',
                    'node_modules/angular-sanitize/angular-sanitize.js',
                    'node_modules/angular-touch/angular-touch.js',
                    'node_modules/angular-animate/angular-animate.js',
                    'node_modules/@uirouter/angularjs/release/angular-ui-router.js',
                    'node_modules/angular-translate/dist/angular-translate.js',
                    'node_modules/angular-translate-once/src/translate-once.js',
                    'node_modules/satellizer/dist/satellizer.js',
                    'node_modules/angular-growl-v2/build/angular-growl.js',
                    'node_modules/ng-dialog/js/ngDialog.js',
                    'node_modules/angucomplete-alt/dist/angucomplete-alt.js',
                    /*'node_modules/angular-pageslide-directive/dist/angular-pageslide-directive.js',*/
                    'node_modules/angularjs-slider/dist/rzslider.js',
                    'node_modules/markdown-it/dist/markdown-it.js',
                    'node_modules/angular-markdown-it/dist/ng-markdownit.js',
                    'node_modules/angular-cache/dist/angular-cache.js'/*,
                    'node_modules/streamsaver/StreamSaver.js'*/
                    /*'node_modules/angularjs-tooltips/dist/angular-tooltips.js'*/
                    /*'node_modules/angular-tour/dist/angular-tour.js'*/
                    /*'node_modules/angular-popeye/release/popeye.js,'*/
                    /*'node_modules/angular-vs-repeat/dist/angular-vs-repeat.js',*/
                    /*'node_modules/angular-xeditable/dist/js/xeditable.js'*/
                ],
                dest: '/dist/assets/libs/essential.js'
            },
            rocket: {
                src: [
                    // [IMPORTANT] Loading order is important - defaultenv.js and lang file must be set first !!
                    'src/app/i18n/en.js',
                    'src/app/i18n/fr.js',
                    'src/app/app.module.js',
                    'src/app/app.constant.js',
                    'src/app/app.config.js',
                    'src/app/app.routes.js',
                    'src/app/app.filters.js',
                    'src/app/app.services.js',
                    'src/app/app.directives.js',
                    'src/app/app.controller.js',

                    /* Services */
                    'src/app/services/*.js',
                    
                    /* APIS */
                    'src/app/apis/*.js',
                    
                    /* Controllers and Components */
                    'src/app/pages/*/*.js',
                    'src/app/components/*/*.js',
                    'src/app/addons/*/*.js',
                    'src/app/addons/*/*/*.js',
                    

                    /* Templates */
                    'tmp/templates.js',

                    /* RocketMap */
                    'src/assets/js/*.js'
                    
                ],
                dest: '/dist/app/rocket.js'
            },
            chart: {
                src: [
                    'node_modules/chart.js/dist/Chart.js',
                    'src/assets/libs/angular-chart/angular-chart.js'
                ],
                dest: '/dist/app/chart.js'
            },
            jsonschemaform: {
                src: [
                    'node_modules/tv4/tv4.js',
                    'src/assets/libs/angular-schema-form/angular-schema-form.js',
                    'src/assets/libs/angular-schema-form/angular-schema-form-bootstrap.js'
                ],
                dest: '/dist/app/jsonschemaform.js'
            },
            env: {
                src:[
                    'src/defaultenv.js'
                ],
                dest: '/dist/app/env.js'
            }
        },
        uglify: {
            essential: {
                files: {
                    '/dist/assets/libs/essential.js': ['/dist/assets/libs/essential.js']
                },
                options: {
                    mangle: true
                }
            },
            rocket: {
                files: {
                    '/dist/app/rocket.js': ['/dist/app/rocket.js']
                },
                options: {
                    mangle: true
                }
            },
            chart: {
                files: {
                    '/dist/app/chart.js': ['/dist/app/chart.js']
                },
                options: {
                    mangle: true
                }
            },
            jsonschemaform: {
                files: {
                    '/dist/app/jsonschemaform.js': ['/dist/app/jsonschemaform.js']
                },
                options: {
                    mangle: true
                }
            },
            env: {
                files: {
                    '/dist/app/env.js': ['/dist/app/env.js']
                },
                options: {
                    mangle: true
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    '/dist/assets/css/essential.css': [
                        'node_modules/foundation-sites/dist/css/foundation.css',
                        'node_modules/@fortawesome/fontawesome-free/css/solid.css',
                        'node_modules/@fortawesome/fontawesome-free/css/regular.css',
                        'node_modules/@fortawesome/fontawesome-free/css/brands.css',
                        'node_modules/@fortawesome/fontawesome-free/css/fontawesome.css',
                        'node_modules/angular-growl-v2/build/angular-growl.css',
                        'node_modules/ng-dialog/css/ngDialog.css',
                        'node_modules/ng-dialog/css/ngDialog-theme-default.css',
                        /*'node_modules/angucomplete-alt/css/angucomplete-alt.css',*/
                        'node_modules/angularjs-slider/dist/rzslider.css',
                        'node_modules/flatpickr/dist/flatpickr.css',
                        'node_modules/flatpickr/dist/themes/light.css',
                        'node_modules/animate.css/animate.css',
                        /*'node_modules/angularjs-tooltips/dist/angular-tooltips.css',*/
                        //'node_modules/angular-tour/dist/angular-tour.css',
                        //'node_modules/angular-popeye/release/popeye.css',
                        /*'node_modules/pretty-checkbox/dist/pretty-checkbox.css',*/
                        //'node_modules/angular-xeditable/dist/js/xeditable.css',
                        'src/assets/libs/openlayers-jrom/ol.css',
                        'src/assets/libs/openlayers-ol-cesium/olcs.css'
                    ],
                    '/dist/assets/css/rocket.css': [
                        'src/assets/css/rocketmap.css',
                        'src/assets/css/style.css',
                        'src/app/pages/*/*.css',
                        'src/app/components/*/*.css',
                        'src/app/addons/*/*.css',
                        'src/app/addons/*/*/*.css',
                    ]
                }
            }
        },
        clean: {
            temp: {
                src: ['tmp']
            },
            dist: {
                src: ['/dist']
            }
        }/*,
        compress: {
            dist: {
                options: {
                    archive: '/dist/<%= pkg.name %>-<%= pkg.version %>.zip'
                },
                files: [{
                        src: ['index.html'],
                        dest: '/'
                    }, {
                        src: ['/dist/**'],
                        dest: 'dist/'
                    }, {
                        src: ['assets/**'],
                        dest: 'assets/'
                    }, {
                        src: ['libs/**'],
                        dest: 'libs/'
                    }]
            }
        }*/
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    //grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-concat');
    /*
     * See https://davidburgos.blog/how-to-fix-grunt-contrib-uglify-for-es6/
     * grunt.loadNpmTasks('grunt-contrib-uglify');
     */
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //grunt.loadNpmTasks('grunt-uncss');
    //grunt.loadNpmTasks('grunt-bower-task');
    grunt.registerTask('dist', [
        'clean:dist',
        'copy',
        'html2js:dist',
        'concat:essential',
        'concat:rocket',
        'concat:chart',
        'concat:jsonschemaform',
        'concat:env',
        'uglify:essential',
        'uglify:rocket',
        'uglify:chart',
        'uglify:jsonschemaform',
        'uglify:env',
        'cssmin',
        'clean:temp'
    ]);
    grunt.registerTask('dev', [
        'clean:dist',
        'copy',
        'html2js:dist',
        'concat:essential',
        'concat:rocket',
        'concat:chart',
        'concat:jsonschemaform',
        'concat:env',
        'cssmin',
        'clean:temp'
    ]);
};
