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

    /* Services */
    angular.module('rocket')
            .factory('rocketCache', ['CacheFactory', rocketCache]);
    function rocketCache(CacheFactory) {

        var cache;

        if ( ! CacheFactory.get('cache')) {
            cache = CacheFactory.createCache('cache');
        }

        var registeredEvents = {};
        
        /**
         * Callback
         * 
         * @param {string} eventName
         * @param {object} obj
         */
        function _callback(eventName, obj) {
            if (registeredEvents[eventName]) {
                for (var i = registeredEvents[eventName].length; i--;) {
                    registeredEvents[eventName][i](obj);
                }
            }

        };

        return {

            /* Key constants */
            AUTH:'_auth',
            CART:'_cart',
            JOBS:'_jobs',
            PROCESSES_ENDPOINTS:'_processesEndpoints',
            PROFILE:'_profile',
            S3:'_s3',
            VIEWS:'_views',
            
            get: function(key) {
                return cache.get(key);
            },

            put: function(key, value) {
                cache.put(key, value);
                _callback('updatecache', {
                    key:key,
                    value:value
                });
                return value;
            },

            /**
             * Register an event
             */
            on: function(eventName, fct) {
                
                if (!registeredEvents[eventName]) {
                    registeredEvents[eventName] = [];
                }
        
                if (registeredEvents[eventName].indexOf(fct) === -1) {
                    registeredEvents[eventName].push(fct);
                }

            },

            /**
             * Unregister an event
             */
            un: function(eventName, fct) {

                if (registeredEvents[eventName]) {
                    var index = registeredEvents[eventName].indexOf(fct);
                    if (index !== -1) {
                        registeredEvents[eventName].splice(index, 1);
                    }
                }

            }

        }
    };

})();