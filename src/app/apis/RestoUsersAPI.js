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
            .factory('restoUsersAPI', ['$http', '$auth', '$timeout', 'rocketAuthService', 'rocketCache', restoUsersAPI]);

    function restoUsersAPI($http, $auth, $timeout, rocketAuthService, rocketCache) {

        var api = {
            activateUser:activateUser,
            loginWithToken:loginWithToken,
            loginWithEmail:loginWithEmail,
            loginWithProvider:loginWithProvider,
            connect: connect,
            checkToken:checkToken,
            setProfile:setProfile,
            forgotPassword: forgotPassword,
            resetPassword: resetPassword,
            refreshToken: refreshToken,
            signup:signup,
            updateProfile:updateProfile,
            updatePassword:updatePassword
        };
        
        return api;

        ////////////

        /**
         * Activate user account
         * 
         * PUT /auth/activate/{token}
         * 
         * @param {string} token
         */        
        function activateUser(token) {
            return $http({
                url: rocketAuthService.getAuthEndPoint() + '/auth/activate/' + token,
                method:'PUT',
                skipAuthorization: true
            });
        }

        /**
         * Check auth token validity
         * 
         * @param {Function} callback 
         */
        function checkToken(callback) {

            if ( !$auth.getToken() ) {
                if (typeof callback === 'function') {
                    callback({
                        isValid:false
                    });
                }
            }
            else {
                $http({
                    url: rocketAuthService.getAuthEndPoint() + '/auth/check/' + $auth.getToken(),
                    method:'GET',
                    skipAuthorization: true
                })
                .then(function (result) {
                    if (typeof callback === 'function') {
                        callback(result.data);
                    }
                })
                ["catch"](function (result) {
                    if (typeof callback === 'function') {
                        callback({
                            isValid:false
                        });
                    }
                });
            }
        
        }

        /**
         * Login with external provider
         * 
         * @param {Object} provider
         * @param {Function} callback
         * @param {Function} error
         * 
         */
        function loginWithProvider(provider, callback, error) {
            $auth.authenticate(provider)
            .then(function (result) {
                
                var profile = setProfile(result);
                if (!profile) {
                    return error(result);
                }

                if (typeof callback === 'function') {
                    callback(result.data);
                }

            })
            ["catch"](function (result) {
                if (typeof error === 'function') {
                    error(result);
                }
            });
        }
        
        /**
         * Login to resto server
         * 
         * @param {Object} params
         * @param {Function} callback
         * @param {Function} error
         * 
         */
        function loginWithEmail(params, callback, error) {

            // Clear token and profile
            $auth.logout();
            rocketCache.put(rocketCache.PROFILE, {});
            
            $http({
                url:rocketAuthService.getAuthEndPoint()  + '/auth',
                method:'GET',
                headers:{
                    'Authorization': 'Basic ' + window.btoa(params.email + ':' + params.password)
                },
                skipAuthorization: true
            })
            .then(function (result) {

                var profile = setProfile(result);
                if ( !profile ) {
                    return error(result);
                }
                
                if (typeof callback === 'function') {
                    callback(result.data);
                }

            })
            ["catch"](function (result) {
                if (typeof error === 'function') {
                    error(result);
                }
            });
        }

        /**
         * Login with auth token
         * 
         * @param {string} token
         * 
         */
        function loginWithToken(token) {

            var promise = $http({
                url:rocketAuthService.getAuthEndPoint()  + '/auth',
                method:'GET',
                headers:{
                    'Authorization': 'Bearer ' + token
                },
                skipAuthorization: true
            })

            promise.then(
                (result) => {

                    setProfile(result);

                    return result;
                }
            )
            ["catch"](
                (error) => {
                    return error
                }
            );

            return promise;

        }
        
        /**
         * Refresh User profile as JSON Web Token
         * 
         * @param {Function} callback
         * @param {Function} error
         */
        function connect(callback, error) {
            $http({
                url:rocketAuthService.getAuthEndPoint()  + '/auth',
                method:'GET',
                headers:rocketAuthService.getAuthorizationHeaders(rocketAuthService.getAuthEndPoint()),
                skipAuthorization: true
            }).then(
                function (result) {
                    if (typeof callback === 'function') {
                        callback(result.data);
                    }
                },
                function (result) {
                    if (typeof error === 'function') {
                        error(result.data);
                    }
                }
            );
        }
        
        /**
         * Ask for a new password
         * 
         * POST /services/password/forgot
         * 
         * @param {string} email
         */
        function forgotPassword(email) {
            return $http({
                url:rocketAuthService.getAuthEndPoint()  + '/services/password/forgot',
                method:'POST',
                data:{
                    email: email
                },
                skipAuthorization: true
            });
        }
        
        /**
         * Reset password
         * 
         * POST /services/password/reset
         * 
         * @param {Object} params : must contains 'token' and 'password'
         */
        function resetPassword(params) {
            return $http({
                url:rocketAuthService.getAuthEndPoint()  + '/services/password/reset',
                method:'POST',
                data:{
                    token:params.token,
                    password:params.password
                },
                headers:{
                    'Content-Type': 'application/json'
                },
                skipAuthorization: true
            });
        }

        /**
         * Create an account
         * 
         * @param {Object} params
         */
        function signup(params) {
            return $http({
                url:rocketAuthService.getAuthEndPoint()  + '/users',
                method:'POST',
                data:{
                    email: params.email,
                    password: params.password,
                    name: params.name,
                    firstname: params.firstname,
                    lastname: params.lastname,
                    bio: params.bio,
                    picture: params.picture,
                    country: params.country,
                    organization: params.organization,
                    topics: params.topics
                },
                headers:{
                    'Content-Type': 'application/json'
                },
                skipAuthorization: true
            });
        }

        /**
         * Update profile
         * 
         * @param {Object} profile
         * @param {Function} callback
         * @param {Function} error
         */
        function updateProfile(profile, callback, error) {
            $http({
                url:rocketAuthService.getAuthEndPoint()  + '/users/' + profile.id,
                method:'PUT',
                data:{
                    firstname: profile.firstname,
                    lastname: profile.lastname,
                    bio: profile.bio,
                    picture: profile.picture,
                    country: profile.country,
                    organization: profile.organization,
                    topics: profile.topics
                },
                headers: $.extend({
                }, rocketAuthService.getAuthorizationHeaders(rocketAuthService.getAuthEndPoint()), {
                    'Content-Type': 'application/json'
                }),
                skipAuthorization: true
            }).then(
                function (result) {
                    
                    // Store profile
                    rocketCache.put(rocketCache.PROFILE, profile);

                    callback(result.data);
                },
                function (result) {
                    if (typeof error === 'function') {
                        error(result.data);
                    }
                }
            );
        }
        
        /**
         * Update profile
         * 
         * @param {Object} profile
         * @param {Function} callback
         * @param {Function} error
         */
        function updatePassword(profile, callback, error) {
            $http({
                url:rocketAuthService.getAuthEndPoint()  + '/users/' + profile.id,
                method:'PUT',
                data:{
                    password: profile.password
                },
                headers:$.extend(rocketAuthService.getAuthorizationHeaders(rocketAuthService.getAuthEndPoint()),{
                    'Content-Type': 'application/json'
                }),
                skipAuthorization: true
            }).then(
                function (result) {

                    callback(result.data);
                },
                function (result) {
                    if (typeof error === 'function') {
                        error(result.data);
                    }
                }
            );
        }
        
        /**
         * Get token duration
         * 
         * @returns {token.exp|Number|token.iat}
         */
        function getTokenDuration(){
            var payload = null;
            if (rocketAuthService.isAuthenticated()) {
                payload = $auth.getPayload();
            }
            return payload ? payload.exp - payload.iat : 0;
        };
        
        /**
         * Set token to local storage
         * 
         * @param {String} token
         * @param {boolean} redirect
         */
        function setToken(token, redirect) {
            rocketAuthService.addToken(rocketAuthService.getAuthEndPoint(), token);
            $auth.setToken(token, redirect);
        };
        
        /**
         * Automatically refresh token based on the token duration
         */
        function refreshToken() {
            
            /*
             * Get token duration validity
             */
            var duration = getTokenDuration() * 500;
            if (duration === 0) {
                return false;
            }
            
            /*
             * Create interval function to refresh token before expiration date
             */
            $timeout(function() {
                if (rocketAuthService.isAuthenticated()) {
                    connect(function(result){
                        setToken(result.token, false);
                        refreshToken();
                    },
                    function(result) {});
                }
            }, duration);
        }

        /**
         * Set profile from resto result
         * 
         * @param {object} result 
         */
        function setProfile(result) {
            
            if ( !result ||  !result.data || !result.data.profile ) {
                return;
            }

            // Store profile
            rocketCache.put(rocketCache.PROFILE, result.data.profile);

            // Store token
            setToken(result.data.token, false);

            refreshToken();

            return result.data.profile;

        }
        
    }

})();
