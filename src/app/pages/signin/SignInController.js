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
            .controller('SignInController', ['$scope', 'restoUsersAPI', 'rocketHolder', 'rocketServices', 'config', SignInController]);

    function SignInController($scope, restoUsersAPI, rocketHolder, rocketServices, config) {
        
        /*
         * Focus on email
         */
        rocketServices.focus('email');

        $scope.display = {
            header:config.header.display
        };
        
        $scope.registration = {};

        /*
         * Set signin configs
         */
        $scope.providers = ['both', 'external'].indexOf(config.auth.strategy) !== -1 && config.auth.providers ? config.auth.providers : null;
        $scope.canRegister = ['both', 'internal'].indexOf(config.auth.strategy) !== -1 ? true : false;
        $scope.canSignInWithEmail = ['both', 'internal'].indexOf(config.auth.strategy) !== -1 ? true : false;
        
        $scope.loginWithEmail = function () {

            $scope.isLoading = true;
            restoUsersAPI.loginWithEmail({
                email: $scope.registration.email,
                password: $scope.registration.password
            },
            function(result) {

                $scope.isLoading = false;

                // Suppress sensitive information from $scope
                clean();

                goCaller();
                
            },
            function(result) {
                $scope.isLoading = false;
                clean();
                rocketServices.error('signin.login.error');
            });
        };
        $scope.loginWithProvider = function (provider) {
            $scope.isLoading = true;
            restoUsersAPI.loginWithProvider(provider, function(result) {
                $scope.isLoading = false;
                goCaller();
            },
            function(){
                $scope.isLoading = false;
                rocketServices.error('signin.login.error');
            });
        };
        
        /*
         * Remove email/password from scope after
         * authentication for security reasons
         */
        function clean() {
            $scope.registration = {};
        };

        /**
         * Redirect to calling page - default to map page
         */
        function goCaller() {
            var previousState = rocketHolder.previousState || {
                from:'map'
            };
            // Set default to map state
            if ( ['map', 'feature', 'cart'].indexOf(previousState.from) === -1 ) {
                previousState.from = 'map',
                previousState.params = {};
            }
            
            return rocketServices.go(previousState.from, previousState.params || {}, {
                reload:true
            });
        };
        
        
    }

})();