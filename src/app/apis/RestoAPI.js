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
            .factory('restoAPI', ['$q', '$http', 'rocketAuthService', 'rocketHolder', restoAPI]);

    function restoAPI($q, $http, rocketAuthService, rocketHolder) {

        var api = {
            getResource:getResource,
            postResource:postResource,
            getFeature:getFeature,
            createView:createView,
            deleteView:deleteView
        };
        
        return api;

        ////////////

        /**
         * Get resource
         * 
         * @param {string} url
         * @param {object} params
         * @param {object} options
         */
        function getResource(url, params, options) {
            return _methodToResource(url, 'GET', params, null, options);
        }

        /**
         * Post resource
         * 
         * @param {string} url
         * @param {object} params 
         * @param {object} body
         * @param {object} options 
         */
        function postResource(url, params, body, options) {
            return _methodToResource(url, 'POST', params, body, options);
        }

        /**
         * Create view
         * 
         * @param {string} url
         * @param {array} params
         */
        function createView(url, params) {

            if (!url) {
                return $q.defer().promise;
            }
            
            var promise = $http({
                url:url,
                method:'POST',
                data:{
                    title:params.title,
                    description:params.description || null,
                    public:params.public,
                    search:params.search
                },
                headers:{
                    'Content-Type': 'application/json'
                }
            }).then(
                (result) => {
                    return result;
                }
            );

            return promise;

        }

        /**
         * Delete view
         * 
         * @param {string} url
         * @param {array} params
         */
        function deleteView(url) {

            if (!url) {
                return $q.defer().promise;
            }
            
            var promise = $http({
                url:url,
                method:'DELETE'
            }).then(
                (result) => {
                    return result;
                }
            );

            return promise;

        }        

        /**
         * 
         * Return feature 
         * 
         * GET params.url
         * 
         * @param {string} url
         * @param {function} callback
         * @param {function} error
         * @param {boolean} noCache
         * @returns {undefined}
         */
        function getFeature(url, callback, error, noCache) {

            /*
             * Invalid route
             */
            if (!url) {
                return error();
            }
            
            /*
             * First get feature from cache
             */
            if ( !noCache && rocketHolder.features && rocketHolder.features[url]) {
                return callback(rocketHolder.features[url]);
            }

            $http({
                url:url,
                method:'GET',
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(

                function (result) {
                    var feature = window.rocketmap.Util.adaptFeature(result.data);
                    _addFeatureToCache(feature);
                    callback(feature);
                },
                
                function (result) {
                    if (typeof error === 'function') {
                        error(result.data);
                    }
                }

            );
        }
        
        /**
         * Add feature to 'features' cache
         * 
         * @param {Object} feature
         */
        function _addFeatureToCache(feature) {
            if ( !rocketHolder.features ) {
                rocketHolder.features = {};
            }
            rocketHolder.features[feature.id] = feature;
        }

        /**
         * Get resource
         * 
         * @param {string} url
         * @param {string} method
         * @param {object} body
         * @param {object} params
         * @param {object} options
         */
         function _methodToResource(url, method, params, body, options) {

            var canceller = $q.defer();

            options = options || {};
           
            if (options.useCache && options.cacheKey) {
                if (rocketHolder[options.cacheKey]) {
                    return $q.resolve(rocketHolder[options.cacheKey]).then(
                        function (data) {
                            return {
                                status:200,
                                data:data
                            }
                        }
                    );
                    
                }
            }

            if (!url) {
                return $q.defer().promise;
            }

            // Initiate the AJAX request.
            var httpParams = {
                url:url,
                method:method,
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true,
                timeout:canceller.promise
            };

            if (params) {
                httpParams.params = params;
            }

            if (body) {
                httpParams.data = body;
            }

            if (options.headers) {
                httpParams.headers = options.headers;
            }

            var request = $http(httpParams);
            
            // Rather than returning the http-promise object, we want to pipe it
            // through another promise so that we can "unwrap" the response
            // without letting the http-transport mechansim leak out of the
            // service layer.
            var promise = request.then(
                (result) => {
                    if (options.cacheKey) {
                        rocketHolder[options.cacheKey] = result.data;
                    }
                    return result;
                }
            )
            ["catch"](function (result) {
                return result;
            });

            // Now that we have the promise that we're going to return to the
            // calling context, let's augment it with the abort method. Since
            // the $http service uses a deferred value for the timeout, then
            // all we have to do here is resolve the value and AngularJS will
            // abort the underlying AJAX request.
            promise.cancel = function() {
                canceller.resolve();
            };

            // Since we're creating functions and passing them out of scope,
            // we're creating object references that may be hard to garbage
            // collect. As such, we can perform some clean-up once we know
            // that the requests has finished.
            promise.finally(
                function() {
                    promise.cancel = angular.noop;
                    canceller = request = promise = null;
                }
            );

            return promise;

        }

    }

})();
