/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function () {
    'use strict';

    angular.module('rocket')
        .controller('MainController', ['$window', '$transitions', '$location', 'rocketAuthService', 'rocketHolder', 'rocketCart', 'restoUsersAPI', 'rocketSearchService', 'stacUtil', 'googleTagManager', 'config', MainController]);

    function MainController($window, $transitions, $location, rocketAuthService, rocketHolder, rocketCart, restoUsersAPI, rocketSearchService, stacUtil, googleTagManager, config) {

        var vm = this;

        /*
         * Config
         */
        vm.config = config || {};

        /*
         * True when endpoints are loaded
         */
        vm.endPointsAreLoaded = false;

        /*
         * Initialize Google analytics
         */
        if (config.services && config.services.analytics && config.services.analytics.gtag) {
            googleTagManager.init(config.services.analytics.gtag, {
                'event': 'page_view',
                'options': {
                    'page_location':$location.path()
                }
            });
        }

        /*
         * Initialize projections
         */
        if ( window.rocketmap.Proj ) {
            window.rocketmap.Proj.register(config.projections);
        }
        
        /**
         * Get mapContext from planet
         * 
         * @param {string} planet 
         */
        vm.setMapContext = function(planet) {
            
            planet = (planet || config.defaultPlanet).toLowerCase();
            var planetConfig = config.planets && config.planets[planet];

            rocketHolder.mapContext = {
                planetInfo:{
                    planet: planet,
                    defaultProjCode: planetConfig && planetConfig.defaultProjCode ? planetConfig.defaultProjCode : config.defaultProjCode, 
                    preview: planetConfig ? planetConfig.preview : null,
                    gazetteer: planetConfig && planetConfig.gazetteer ? planetConfig.gazetteer : {}
                },
                defaultLayersConfig: planetConfig ? planetConfig.layers : []
            };

            // [HACK] Set SMS_PLANET
            if (config.services && config.services.sms) {
                window.rocketmap.Util.SMS_PLANET = planet
            }
            
            return rocketHolder.mapContext;

        };

        /*
         * Broadcast resize event
         */
        $window.onresize = function () {
            
            /*
             * iPad, iPhone browser UI is breaking 100vh
             * (see https://stackoverflow.com/questions/43575363/css-100vh-is-too-tall-on-mobile-due-to-browser-ui)
             */
            document.body.style.height = window.innerHeight + 'px';

            /*
             * Effectively replace 100vh by correctly computed --vh CSS variable
             * (see https://chanind.github.io/javascript/2019/09/28/avoid-100vh-on-mobile-web.html)
             */
            document.documentElement.style.setProperty('--vh', (window.innerHeight / 100) + 'px');

        }

        // Called to initially set the height.
        $window.onresize();

        // [HACK] Set SMS_URL
        if (config.services && config.services.sms) {
            window.rocketmap.Util.SMS_SERVICE = config.services.sms;
        }

        // [HACK] Set CORRECT_WRAP_DATELINE
        if (config && config.hasOwnProperty('correctWrapDateline')) {
            window.rocketmap.Util.CORRECT_WRAP_DATELINE = config.correctWrapDateline;
        }

        //////////////////////////////////////////////////////////////////////////////////

        /*
         * Store default endpoint url
         */
        if (vm.config.endPoints.length > 0) {
            vm.config.defaultCatalogUrl = vm.config.endPoints[0].url;
        }

        /*
         * Load search endPoints
         * 
         * If query parameter 'u' is set then replace config.endPoints with input endPoints
         * If query parmaeter 'uk' is set then add input endPoints to existing config.endPoints
         */
        var _nbOfprocessedEndPoints = 0;
        if ($location.search().u && $location.search().u.split) {
            vm.config.endPoints = $location.search().u.split(',').map(function (url) {
                return {
                    url:url,
                    options:{
                        isRemovable:true
                    }
                }
            });
        }
        else if ($location.search().uk && $location.search().uk.split) {
            vm.config.endPoints = vm.config.endPoints.concat($location.search().uk.split(',').map(function (url) {
                return {
                    url:url,
                    options:{
                        isRemovable:true
                    }
                }
            }));
        }
        
        if (vm.config.endPoints.length === 0) {
            vm.endPointsAreLoaded = true;
        }
        for (var i = 0, ii = vm.config.endPoints.length; i < ii; i++) {
            rocketSearchService.addEndPoint({
                url: vm.config.endPoints[i].url,
                options: vm.config.endPoints[i].options,
            }, function (endPoint) {
                
                var planet = (endPoint && endPoint.url && endPoint.data && endPoint.data.planet ? endPoint.data.planet : config.defaultPlanet).toLowerCase();
                    
                // Keep last planet for mapContext
                if (!rocketHolder.mapContext || rocketHolder.mapContext.planetInfo.planet !== planet) {
                    vm.setMapContext(planet);
                }

                _nbOfprocessedEndPoints++;
                rocketHolder.endPointsAreLoaded = vm.config.endPoints.length === _nbOfprocessedEndPoints;
                vm.endPointsAreLoaded = rocketHolder.endPointsAreLoaded;

            });
        }

        /*
         * Check authentication token during startup
         */
        restoUsersAPI.checkToken(function (result) {

            // Token is valid => get a refreshed token 
            if (result.isValid) {
                restoUsersAPI.refreshToken();
            }
            // Token is invalid => clear token and profile
            else {
                rocketAuthService.disconnect();
            }

        });

        /*
         * Initialize cart
         */
        rocketCart.init();

        /*
         * Store previous state to redirect after
         * successfull signin
         */
        $transitions.onSuccess({}, function (transition) {

            var params = {};
            var paramsFrom = transition.params('from');
            for (var key in paramsFrom) {
                if (key !== "#") {
                    params[key] = paramsFrom[key];
                }
            }
            rocketHolder.previousState = {
                from: transition.from().name,
                params: params
            };

            
            /*
             * On page change (i.e. not only query params)
             */
            if (transition.from().name !== transition.to().name) {
                
                /*
                 * Scroll to top of the page
                 */
                $window.scrollTo(0, 0);

                /* 
                 * Google analytics
                 */
                googleTagManager.push('event', 'page_view', {
                    'page_location':$location.path()
                });

            }

        });

        if (console && console.log) {
            console.log('[INFO] Version ' + vm.config.version);
        }

    }
})();
