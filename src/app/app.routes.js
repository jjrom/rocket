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
            .config(['$locationProvider', '$stateProvider', '$urlRouterProvider', 'config', RocketRoutes]);

    function RocketRoutes($locationProvider, $stateProvider, $urlRouterProvider, config) {
        
        /*
         * HTML 5 - remove # in url
         */
        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('');
        
        var resolve = {
            authenticated: ['$q', '$location', 'rocketAuthService', function ($q, $location, rocketAuthService) {
                var deferred = $q.defer();
                if (!rocketAuthService.isAuthenticated()) {
                    $location.path('/signin');
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }]
        };
        
        var commonQueryParameters = [
            // Replace endPoints with input comma separated urls
            'u',
            // Same as 'u' but keep existing endpoints
            'uk',
            // For StacBrowser
            'catalog',
            'selected'
        ];

        /* 
         * For any unmatched url, redirect to config.defaultRoute
         */
        $urlRouterProvider.otherwise(config.defaultRoute);

        /*
         * Home page is defined in config.homePage
         */
        if ( config.homePage ) {
            $stateProvider.state('home', {
                url: '/home?' + commonQueryParameters,
                controller: config.homePage.controller,
                templateUrl: config.homePage.templateUrl
            });
        }

        /*
         * Define default routes
         */
        $stateProvider
            .state('404', {
                url: '/404',
                templateUrl: "app/pages/404/404.html"
            })
            .state('activate', {
                url: '/activate/:token?' + commonQueryParameters,
                controller: 'ActivateController',
                templateUrl: "app/pages/activate/activate.html"
            })
            .state('feature', {
                url: '/feature/:url?' + commonQueryParameters,
                templateUrl: 'app/pages/feature/feature.html',
                controller: 'FeatureController'
            })
            .state('map', {
                url: "/map?" + commonQueryParameters.concat([
                    // lon,lat,zoom triplet
                    'c',
                    's',
                    // JSON filters encoded as base64
                    'f'
                ]).join('&'),
                templateUrl: config.mapPage.templateUrl ? config.mapPage.templateUrl : 'app/pages/map/map.html',
                controller: config.mapPage.controller ? config.mapPage.controller : 'MapController',
                reloadOnSearch: false
            });
        
        /*
         * Addon states read from config
         */
        if (config.auth && config.auth.strategy !== 'none') {
            
            /*
             * These routes are available whatever the auth strategy (except none of course)
             */
            $stateProvider
                .state('signin', {
                    url: '/signin?' + commonQueryParameters,
                    templateUrl: "app/pages/signin/signIn.html",
                    controller:"SignInController"
                })
                .state('profile', {
                    url: '/profile?' + commonQueryParameters.concat([
                        // Tab
                        't'
                    ]).join('&'),
                    templateUrl: 'app/pages/profile/profile.html',
                    controller: 'ProfileController',
                    resolve:resolve
                });

            /*
             * These routes are available only if internal strategy is chosen
             */
            if (['internal', 'both'].indexOf(config.auth.strategy) !== -1) {
                $stateProvider
                    .state('forgotPassword', {
                        url: '/forgotPassword?' + commonQueryParameters,
                        templateUrl: "app/pages/password/forgotPassword.html",
                        controller:"ForgotPasswordController"
                    })
                    .state('register', {
                        url: '/register?' + commonQueryParameters,
                        templateUrl: "app/pages/register/register.html",
                        controller:"RegisterController"
                    })
                    .state('resetPassword', {
                        url: '/resetPassword/:token?' + commonQueryParameters,
                        templateUrl: "app/pages/password/resetPassword.html",
                        controller:"ResetPasswordController"
                    });
            }

        }

    }

})();