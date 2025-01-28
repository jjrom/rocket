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

    /**
     * Registered events
     * 
     *  "loadstart"
     * 
     *      When:
     *          When load function is call
     * 
     *      Returns:
     *          EndPoint
     * 
     */
    angular.module('rocket')
        .factory('stacUtil', ['$http', '$q', 'rocketAuthService', 'config', stacUtil]);

    function stacUtil($http, $q, rocketAuthService, config) {

        var registeredEvents = {};

        var api = {
            cleanSearchParams:cleanSearchParams,
            getAssetsArray:getAssetsArray,
            hasRole:hasRole,
            hasExtension: hasExtension,
            load:load,
            stacToEndPoint:stacToEndPoint,
            on:on,
            un:un
        };

        return api;

        ////////////

        /**
         * Register an event
         */
         function on(eventName, fct) {

            if (!registeredEvents[eventName]) {
                registeredEvents[eventName] = [];
            }

            if (registeredEvents[eventName].indexOf(fct) === -1) {
                registeredEvents[eventName].push(fct);
            }

        };

        /**
         * Unregister an event
         */
        function un(eventName, fct) {

            if (registeredEvents[eventName]) {
                var index = registeredEvents[eventName].indexOf(fct);
                if (index !== -1) {
                    registeredEvents[eventName].splice(index, 1);
                }
            }

        };

        /**
         * Return clean search filters eventually removing unknown STAC search params
         * to avoid HTTP 400 error on very restrictive servers
         * 
         * @param {object} inputParams 
         */
        function cleanSearchParams(inputParams) {

            // Limit to STAC allowed query parameters to avoid "HTTP 400 Bad Request" on strict servers
            var allowedKeys = [
                'limit',
                'datetime',
                'bbox',
                'intersects',
                'query',
                'ids',
                'collections',
                'next'
            ];
            var outputParams = {};

            for (var key in inputParams) {
                if ( allowedKeys.indexOf(key) !== -1 ) {
                    outputParams[key] = inputParams[key];
                }
            }
            
            // STAC: rewrite time search
            var datetime = _getDatetimeFromParams(inputParams);
            if (datetime) {
                outputParams.datetime = datetime;
            }

            /* STAC: rewrite intersects search as a bbox
            var bbox = _getBBOXFromParams(inputParams);
            if (bbox) {
                outputParams.bbox = bbox;
            }
            */
           
            return outputParams;

        };

        /**
         * Return all feature assets from a given role as an array of assets
         * 
         * @param {object} feature
         * @param {string} role
         */
        function getAssetsArray(feature, role) {
            var assets = [];
            if ( !feature || !feature.assets ) {
                return assets;
            }
            for (var key in feature.assets) {
                if (!role  || (feature.assets[key].roles && feature.assets[key].roles.indexOf(role) !== -1)) {
                    assets.push(feature.assets[key]);
                }
            }
            return assets;
        };

        /**
         * Return true if role exist in feature assets
         * 
         * @param {object} feature
         * @param {string} role
         * 
         */
        function hasRole(feature, role) {
            if ( !feature || !feature.assets ) {
                return false;
            }
            for (var key in feature.assets) {
                if (feature.assets[key].roles && feature.assets[key].roles.indexOf(role) !== -1) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Return true if endpoint has extension
         * 
         * @param {Objext} endPoint 
         * @param {string} str 
         */
        function hasExtension(endPoint, str) {
            if (endPoint && endPoint.data && endPoint.data.capabilities) {
                return endPoint.data.capabilities.indexOf(str) !== -1;
            }
            return false;
        };

        /**
         * Load STAC url and convert to rocket endPoint asynchronously
         * 
         * @param {object} ep
         * @param {function} callback
         * @param {function} error
         */
        function load(ep, callback, error) {

            _callback('loadstart', ep);

            ep = ep || {};

            if ( !ep.url ) {
                if (typeof error === 'function') {
                    return error('No url');
                }
            }

            // Rewrite url if missing http 
            if ( ep.url.toLowerCase().indexOf('file') === 0 ) {
                return error('[SECURITY] Local ressources cannot be loaded');
            }

            // Rewrite url if missing http 
            if ( ep.url.toLowerCase().indexOf('http') !== 0 ) {
                ep.url = 'http://' + ep.url;
            }
            
            _getEndPoint(ep,
                
                // Success get endPoint
                function (endPoint) {
                    
                    _getCollections(endPoint, 

                        function (collections) {

                            endPoint.collections = collections;

                            if (typeof callback === 'function') {
                                return callback(endPoint);
                            }
                        }
                        
                    );

                },
                
                // Error _getEndPoint
                function(endPointInError){
                    if (typeof error === 'function') {
                        return error(endPointInError);
                    }
                }
            
            );

        };

        /**
         * Create rocket endPoint from stac info
         * 
         * @param {object} stacData
         * @param {string} stacRoot
         */
        function stacToEndPoint(stacData, stacRoot) {
            
            var endPoint = {
                url:stacRoot,
                data:stacData
            };

            // Get self and default search link
            if (endPoint.data.links) {
                for (var i = 0, ii = endPoint.data.links.length; i < ii; i++) {
                    if (endPoint.data.links[i].rel === 'self' && endPoint.data.links[i].href !== stacRoot) {
                        endPoint.data.links[i].href = stacRoot; 
                    }
                    if (endPoint.data.links[i].rel == 'search') {
                        endPoint.defaultSearchLink = endPoint.data.links[i];
                    }
                    // Backup for server that do not specify a search endPoint
                    if (endPoint.data.links[i].rel == 'items' && !endPoint.defaultSearchLink) {
                        endPoint.defaultSearchLink = endPoint.data.links[i];
                    }
                    // [STAC][1.0.0-rc.3] Add preview
                    if (endPoint.data.links[i].rel == 'preview') {
                        endPoint.preview = endPoint.data.links[i];
                    }
                }
            }

            // Set planet
            if ( !endPoint.data.planet ) {
                endPoint.data.planet = (endPoint.data['ssys:targets'] && endPoint.data['ssys:targets'][0] ? endPoint.data['ssys:targets'][0] : config.defaultPlanet).toLowerCase();
            }

            // Set stacRoot
            endPoint.data.stacRoot = endPoint.url;

            /* [TODO] Remove ?
            endPoint.title = endPoint.data.title || null;
            */
           
            return endPoint;

        };

        /**
         * 
         * @param {object} ep 
         * @param {function} callback
         * @param {function} error
         * 
         */
        function _getEndPoint(ep, callback, error) {
           
            $http({
                url:ep.url,
                method:'GET',
                rocketAuthService:rocketAuthService.getAuthorizationHeaders(ep.url),
                skipAuthorization: true
            }).then(
                function (result) {

                    if (typeof result.data !== 'object') {
                        return error({
                            url:ep.url,
                            options:ep.options || {},
                            error:'Input endpoint is not valid'
                        });
                    }
                    var endPoint = stacToEndPoint(result.data, ep.url);

                    // Add input options
                    endPoint.options = ep.options || {};

                    // Force url
                    endPoint.url = ep.url;

                    // Callback is mandatory
                    callback(endPoint);

                },
                function (err) {

                    // Error is mandatory
                    error({
                        url:ep.url,
                        options:ep.options || {},
                        error:err
                    });
                    
                }
            );
            
        }

        /**
         * 
         * Return collections from endPoint
         * 
         * @param {function} callback
         */
        function _getCollections(endPoint, callback) {
            
            var url = null;
            if (endPoint.data && endPoint.data.links) {
                for (var i = 0, ii = endPoint.data.links.length; i < ii; i++) {
                    if (endPoint.data.links[i].rel === 'data' && (!endPoint.data.links[i].type || endPoint.data.links[i].type === 'application/geo+json' || endPoint.data.links[i].type === 'application/json')) {
                        url = endPoint.data.links[i].href;
                        break; 
                    }
                }
            }

            /*
             * No collection url
             */
            if ( !url ) {
                return $q.resolve().then( () => {
                    callback({});
                });
            }

            $http({
                url:url,
                method:'GET',
                rocketAuthService:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function (result) {
                    callback(result.data || null);
                },
                function (err) {
                    callback(null)
                }

            );

        };

        /**
         * Convert resto start/end to STAC datetime
         * @param {object} params 
         */
        function _getDatetimeFromParams(params) {
            var datetime = null;
            if (params['start']) {
                if ( !params['end'] ) {
                    datetime = params['start'].substring(0, 10) + 'T00:00:00Z/' +  _toISO8601(new Date(), 'T23:59:59Z');
                }
                else {
                    datetime = params['start'] + '/' + params['end'];
                }
            }
            else if (params['end']) {
                datetime = _toISO8601(new Date(config.startDate), 'T00:00:00Z') + '/' +  params['end'].substring(0, 10) + 'T23:59:59Z';
            }
            return datetime;
        }

        /**
         * Convert resto lon,lat,intersects to STAC intersects
         * 
         * @param {object} params 
         */
        function _getBBOXFromParams(params) {

            var bbox = null;
            
            if (params.bbox) {
                bbox = params.bbox instanceof Array ? params.bbox : params.bbox.split(',').map(parseFloat);
            }

            else if (params.lon && params.lat) {
                //intersects = '{"type":"Point","coordinates":[' + params['lon'] + ',' + params['lat'] + ']}';
                bbox = [parseFloat(params.lon) - 0.01, parseFloat(params.lat) - 0.01, parseFloat(params.lon) + 0.01, parseFloat(params.lat) + 0.01];
            }
            
            // This is for STAC servers that don't support intersects filter => convert it to bbox
            else if (params.intersects) {
                bbox = window.rocketmap.Util.toBBOX(params.intersects, 0.01);
            }

            return bbox;

        }

        /**
         * Returns ISO 8601 from input date
         * 
         * @param {Date} d
         * @param {string} time (i.e. THH:MM:SSZ)
         * @returns {String}
         */
        function _toISO8601(d, time) {
            function pad(n) {
                return n < 10 ? '0' + n : n;
            }
            return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + (time || '');
        };

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


    }
})();