/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function() {

    'use strict';

    /**
     * Registered events
     * 
     *  "updateprofile"
     * 
     *      When:
     *          When user profile change - a null profile means disconnect
     * 
     *      Returns:
     *          profile
     * 
     */
    angular.module('rocket')
            .factory('rocketAuthService', ['$auth', 'rocketCache', 'config', rocketAuthService]);
    
    function rocketAuthService($auth, rocketCache, config) {
       
        var service = {
            addToken:addToken,
            deleteToken:deleteToken,
            disconnect:disconnect,
            getAuthEndPoint:getAuthEndPoint,
            getAuthorizationHeaders:getAuthorizationHeaders,
            isAuthenticated: isAuthenticated
        };
            
        return service;

        /////////

        /**
         * Attach an authentication token to url
         * 
         * @param {*} url
         */
        function addToken(url, token) {
            var auth = _getCacheAuth();
            auth.tokens[url] = token;
            return rocketCache.put(rocketCache.AUTH, auth);
        };

        /**
         * Remove an authentication token url
         * 
         * @param {*} url
         */
        function deleteToken(url) {
            var auth = _getCacheAuth();
            delete auth.tokens[url];
            return rocketCache.put(rocketCache.AUTH, auth);
        };

        /**
         * Return auth endpoint
         */
        function getAuthEndPoint() {
            return config && config.auth ? config.auth.endPoint : null;
        };

        /**
         * Log out user
         * 
         * @param {Function} callback
         */
        function disconnect(callback) {
            $auth.logout();
            rocketCache.put(rocketCache.PROFILE, {});
            deleteToken(getAuthEndPoint());
            if (typeof callback === 'function') {
                callback();
            }
        }
        
        /**
         * Return true if user is authenticated to authEndPoint - false otherwise
         */
        function isAuthenticated() {
            return $auth.isAuthenticated();
        };

        /**
         * Return authorization headers for input url
         * 
         * @param {string} url
         */
        function getAuthorizationHeaders(url) {
            
            // Search for a valid token
            var tokens = _getCacheAuth().tokens;
            for (var key in tokens) {
                if (url.indexOf(key) === 0) {
                    return {
                        Authorization: 'Bearer ' + tokens[key]
                    };
                }
            }
            return {};
        };

        /**
         * Return auth object stored in cache
         */
        function _getCacheAuth() {
            var auth = rocketCache.get(rocketCache.AUTH) || {};
            if ( !auth.tokens ) {
                auth.tokens = {};
            }
            return auth;
        }

    };

})();