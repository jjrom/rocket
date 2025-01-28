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

    /*
     * Correctly handle cancel of HTTP promise
     * (see https://itnext.io/how-to-cancel-http-requests-in-angularjs-4ccf351319e0)
     * 
     * Note: it does not work...
     */
    class PromiseService {
        constructor() {
            this._requests = [];
        }
        register(promise) {
            this._requests.push(promise);
        }
        unregister(promise) {
            const idx = this._requests.indexOf(promise);
            if (idx >= 0) {
                this._requests.splice(idx, 1);
            }
        }
        cancel(promise) {
            for (let i = 0; i < this._requests.length; i++) {
                const rootPromise = this._requests[i];
                let p = rootPromise;
                // Traverse the promise chain to see 
                // if given promise exists in the chain
                while (p !== promise && p.$$state.pending &&
                    p.$$state.pending.length > 0) {
                    p = p.$$state.pending[0][0].promise;
                }
                // If this chain contains given promise, then call the
                // cancel method to cancel the http request
                if (p === promise && typeof p.cancel === 'function') {
                    p.cancel();
                }
            }
        }
    }

    /**
     * Registered events
     * 
     *  "addendpoint"
     * 
     *      When:
     *          When an endpoint is added
     * 
     *      Returns:
     *          endPoint
     * 
     *  "initaddendpoint"
     * 
     *      When:
     *          When addEndpoint function is called
     * 
     *      Returns:
     *          null
     * 
     *   "removeendpoint"
     * 
     *      When:
     *          When endpoint is removed
     * 
     *      Returns:
     *          url
     * 
     *  "updatefilters"
     * 
     *      When:
     *          When filters is updated
     * 
     *      Returns:
     *          filters object (i.e. same as returned object from getFilters())
     * 
     *  "searchstart
     * 
     *      When:
     *          When a search start
     * 
     *      Returns:
     *          void
     *  
     *  "searchend"
     * 
     *      When:
     *          When a search end
     * 
     *      Returns:
     *          array of search responses
     *      
     * 
     */
    angular.module('rocket')
        .factory('rocketSearchService', ['$q', '$http', 'rocketServices', 'rocketMapUpdaterService', 'rocketAuthService', 'stacUtil', 'config', rocketSearchService]);

    function rocketSearchService($q, $http, rocketServices, rocketMapUpdaterService, rocketAuthService, stacUtil, config) {

        var promiseService = new PromiseService();

        var commonFilters = {};

        var registeredEvents = {};

        var _searchInProgress = false;

        var service = {
            endPoints: [],
            addEndPoint: addEndPoint,
            removeEndPoint: removeEndPoint,
            hasSearchAPI: hasSearchAPI,
            clear: clear,
            cleverSplit:cleverSplit,
            keepOnlyEndPoint: keepOnlyEndPoint,
            getEndPoint: getEndPoint,
            searchInProgress:searchInProgress,
            setActive: setActive,
            search: search,
            searchNext: searchNext,
            cancelSearch: cancelSearch,
            addFilters: addFilters,
            getFilters: getFilters,
            getSpatialFilters:getSpatialFilters,
            getFiltersFromLayer:getFiltersFromLayer,
            getSearchLayerConfig: getSearchLayerConfig,
            qToFilters: qToFilters,
            on: on,
            un: un
        };

        return service;

        /////////

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
         * Return true if endPoint is searchable
         */
        function hasSearchAPI() {
            for (var i = 0, ii = service.endPoints.length; i < ii; i++) {
                if (service.endPoints[i] && service.endPoints[i].defaultSearchLink && service.endPoints[i].defaultSearchLink.href) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Return true if a search is in progress
         */
        function searchInProgress() {
            return _searchInProgress;
        }

        /**
         * Set isInactive status
         * 
         * @param {string} url
         * @param {boolean} bool 
         */
        function setActive(url, bool) {
            if (url) {
                for (var i = service.endPoints.length; i--;) {
                    if (service.endPoints[i].url === url) {
                        if (!service.endPoints[i].options) {
                            service.endPoints[i].options = {};
                        }
                        service.endPoints[i].options.isInactive = !bool;
                    }
                }
            }
        };

        /**
         * Get endPoint from url
         * 
         * @param {string} url
         */
        function getEndPoint(url) {
            if (url) {
                for (var i = service.endPoints.length; i--;) {
                    if (service.endPoints[i].url === url) {
                        return service.endPoints[i];
                    }
                }
            }
            return null;
        };

        /**
         * Add endPoint
         * 
         * [IMPORTANT] Always _callback AFTER callback
         * 
         * @param {Object} endPoint
         * @param {function} callback
         * @param {boolean} silent
         */
        function addEndPoint(endPoint, callback, silent = false) {

            endPoint = endPoint || {};

            if (!silent) {
                _callback('initaddendpoint', null);
            }

            if (!endPoint.url) {
                if (callback) {
                    callback(null);
                }
                if (!silent) {
                    _callback('addendpoint', null);
                }
                return;
            }

            // endPoint already exist => callback it
            var existingEndPoint = service.getEndPoint(endPoint.url);
            if (existingEndPoint) {
                if (callback) {
                    callback(existingEndPoint);
                }
                if (!silent) {
                    _callback('addendpoint', existingEndPoint);
                }
                return;
            }

            // endPoint is already complete => add it to the list of endPoints and callback it
            if (endPoint.data) {
                service.endPoints.push(endPoint);
                if (callback) {
                    callback(endPoint);
                }
                if (!silent) {
                    _callback('addendpoint', endPoint);
                }
                return;
            }

            stacUtil.load(endPoint,
                function (data) {
                    var alreadyAdded = false;
                    for (var i = service.endPoints.length; i--;) {
                        if (service.endPoints[i].url === endPoint.url) {
                            alreadyAdded = true;
                            break;
                        }
                    }
                    if (!alreadyAdded) {
                        service.endPoints.push(data);
                    }

                    if (callback) {
                        callback(data)
                    };

                    if (!silent) {
                        _callback('addendpoint', data);
                    }

                },
                function (err) {

                    if (callback) {
                        callback(null);
                    };

                    if (!silent) {
                        _callback('addendpoint', null);
                    }

                }

            );

        }

        /**
         * Remove all endpoints and associated filters
         */
        function clear() {
            for (var i = service.endPoints.length; i--;) {
                if (service.endPoints[i].promise) {
                    //service.endPoints[i].promise.cancel();
                    promiseService.cancel(service.endPoints[i].promise);
                }
                _callback('removeendpoint', service.endPoints[i].url);
            }
            service.endPoints = [];

            commonFilters = {};
            _callback('updatefilters', {
                filters: service.getFilters()
            });
        }

        /**
         * Remove endPoint from the list of searches
         * 
         * @param {string} url 
         * @return {boolean}
         */
        function removeEndPoint(url) {
            for (var i = service.endPoints.length; i--;) {
                if (service.endPoints[i].url === url) {
                    if (service.endPoints[i].promise) {
                        //service.endPoints[i].promise.cancel();
                        promiseService.cancel(service.endPoints[i].promise);
                    }
                    service.endPoints.splice(i, 1);
                    _callback('removeendpoint', url);
                    return true;
                }
            }
            return false;
        }

        /**
         * Keep only endPoint from the list of searches
         * 
         * @param {string} url 
         * @return {boolean}
         */
        function keepOnlyEndPoint(url) {
            var keep = service.getEndPoint(url);
            if (keep) {
                for (var i = service.endPoints.length; i--;) {
                    if (service.endPoints[i].promise) {
                        //service.endPoints[i].promise.cancel();
                        promiseService.cancel(service.endPoints[i].promise);
                    }
                    _callback('removeendpoint', service.endPoints[i].url);
                }
                service.endPoints = [keep];
            }
        }

        /**
         * Add search filters 
         * 
         * @param {object} newFilters 
         * @param {object} options
         */
        function addFilters(newFilters, options) {

            options = options || {};

            if (newFilters) {
                if (options.url) {
                    var endPoint = service.getEndPoint(options.url);
                    if (!endPoint) {
                        return false;
                    }
                    endPoint.filters = $.extend({}, options.append ? (endPoint.filters || {}) : {}, newFilters);
                }
                else {
                    commonFilters = $.extend({}, options.append ? commonFilters : {}, newFilters);
                }
            }

            _callback('updatefilters', {
                filters: service.getFilters()
            });

        }

        /**
         * Get filters
         * 
         * @param {string} url
         */
        function getFilters(url) {

            var endPoint = service.getEndPoint(url);
            if (endPoint) {
                return $.extend({}, commonFilters, endPoint.filters || {});
            }

            var ep = {};
            for (var i = service.endPoints.length; i--;) {
                if (service.endPoints[i].filters) {
                    ep[service.endPoints[i].url] = service.endPoints[i].filters;
                }
            }
            return $.extend({}, commonFilters, {
                __ep: ep
            });
        }

        /**
         * Get spatial filters
         * 
         * @param {string} url
         */
        function getSpatialFilters() {
            var _filters = {};
            for (var filterName in commonFilters) {
                if (['name', 'lon', 'lat', 'intersects', 'bbox', '_name'].indexOf(filterName) !== -1 && commonFilters[filterName] !== null) {
                    _filters[filterName] = commonFilters[filterName];
                }
            }
            return _filters;
        }

        /**
         * Return filters from an OpenLayers Layer
         * 
         * @param {OLLayer} layer 
         * @param {string} projCode
         */
        function getFiltersFromLayer(layer, projCode) {

            if ( !layer ) {
                return {};
            }

            /*
             * Maximum length of input search WKT - use bbox if too big
             * This is to avoid HTTP 414 URI Too Large errors 
             */
            var wktLengthLimit = 1800;

            /*
             * Transform options
             */
            var transformOptions = {
                dataProjection: 'EPSG:4326',
                featureProjection: projCode,
                decimals:4
            };

            var filters = {
                bbox: null,
                intersects: null,
                name: null,
                __name:layer.get('_rocket').title
            };


            var features = layer.getSource().getFeatures();

            /*
             * Single feature either use resto Gazetteer extension if available or intersects
             */
            if (features.length === 1) {
                filters.name = features[0].getProperties().geouid ? 'geouid:' + features[0].getProperties().geouid : null;
            }

            filters.intersects = (new window.ol.format.WKT()).writeFeatures(features, transformOptions);
            
            /*
             * [Hack] Avoid HTTP 414 URI too long
             *  1. simplify geometry
             *  2. if not sufficient split geometry to bbox
             *  3. eventually use layer bbox
             */
            if (filters.intersects.length > wktLengthLimit) {
                
                /*
                 * 1. Simplify geometries to 10 km grid
                 */
                var simpleFeatures = [];
                for (var i = features.length; i--;) {
                    var simpleFeature = features[i].clone();
                    var extent = simpleFeature.getGeometry().getExtent();
                    var factor = Math.min(10000, Math.round(Math.min(extent[2] - extent[0], extent[3] - extent[1]) / 10));
                    simpleFeature.setGeometry(simpleFeature.getGeometry().simplify(factor));
                    simpleFeatures.push(simpleFeature);
                }
                filters.intersects = (new window.ol.format.WKT()).writeFeatures(simpleFeatures, transformOptions);

                /*
                 * ... or 2. Reduce geometries to individual bbox 
                 */
                if (filters.intersects.length > wktLengthLimit) {
                    filters.intersects = window.rocketmap.Util.featuresToReduceWKT(features, transformOptions);

                    /*
                     * ... or 3 Use layer bbox
                     */
                    if (filters.intersects.length > wktLengthLimit) {
                        filters.intersects = null;
                        filters.bbox = window.ol.extent.applyTransform(layer.getSource().getExtent(), window.ol.proj.getTransform(projCode, 'EPSG:4326'));
                    }
                }

            }

            return filters;

        }

        /**
         * Convert a hashtag q sentences into a list of filters
         * 
         * Example: q = "location::coastal thisisatest -platform::PX"
         * 
         * Result: filters = {
         *              q:"thisisatest",
         *              location:"coastal",
         *              platform:"-PX"
         *         }
         * 
         * @param {string} str 
         */
        function qToFilters(str) {

            var strAsArray = str.trim().split(/\s+/);
            var filters = {};

            // Force # prefix - take into account minus sign
            for (var i = 0, ii = strAsArray.length; i < ii; i++) {

                // Default - input is a hashtag i.e. starts with # or -#
                var keyword = strAsArray[i];

                // Search for minus sign
                var hashPos = strAsArray[i].startsWith('-') ? 1 : 0;

                // Detect type::value filters
                var exploded = keyword.split('::');
                if (exploded.length > 1) {
                    var key = exploded[0].substring(hashPos + 1);
                    exploded.shift();
                    if (!filters[key]) {
                        filters[key] = [];
                    }
                    filters[key].push((hashPos === 1 ? '-' : '') + exploded.join('::'));
                }
                else {
                    if (!filters.q) {
                        filters.q = [];
                    }
                    filters.q.push(keyword);
                }

            }

            // Collections special case
            if (filters.collections) {
                filters.__collection = filters.collections;
                filters.__theme = null;
            }

            // Merge everything
            for (var key in filters) {
                if (Array.isArray(filters[key])) {
                    filters[key] = filters[key].join(',');
                }
            }

            return filters;

        };

        /**
         * Return rocketMap layerConfig object for a search catalog endpoint
         * 
         * @param {object} endPoint
         * @param {object} linkedLayer
         */
        function getSearchLayerConfig(endPoint, linkedLayer) {

            var layerConfig = {
                id: endPoint.url,
                title: (endPoint.data ? endPoint.data.title : null) || 'Catalog',
                description: endPoint.data ? endPoint.data.description : null,
                type: 'search',
                // Store olFeatures in layerConfig when calling rocketMap.getLayerConfig
                storeFeatures:true,
                isNotSearchable: true,
                isSelectable: true,
                isRemovable: endPoint.options.hasOwnProperty('isRemovable') ? endPoint.options.isRemovable : true,
                isInactive: endPoint.options.hasOwnProperty('isInactive') ? endPoint.options.isInactive : false,
                style: endPoint.options.hasOwnProperty('style') ? endPoint.options.style : null,
                display: endPoint.options.hasOwnProperty('display') ? endPoint.options.display : null,
                ol: endPoint.options.hasOwnProperty('ol') ? endPoint.options.ol : null,
                zIndex: 99
            }
            
            if (linkedLayer) {
                layerConfig.linkedLayer = linkedLayer;
            }

            return layerConfig;

        };

        /**
         * Cancel running search
         * 
         * @param boolean noCallback
         */
        function cancelSearch(noCallback) {

            for (var i = service.endPoints.length; i--;) {
                if (service.endPoints[i].promise) {
                    //service.endPoints[i].promise.cancel();
                    promiseService.cancel(service.endPoints[i].promise);
                }
            }

            if ( !noCallback ) {
                _callback('searchend', null);
            }
            
        };

        /**
         * Launch searches
         * 
         * @param {object} options
         * @param {object} rocketMap
         * @param {function} callback
         */
        function search(options, rocketMap, callback) {

            options = options || {};

            /*
             * Cancel running promises
             */
            cancelSearch(true);

            /*
             * Prepare promises
             */
            for (var i = service.endPoints.length; i--;) {
                var promise = preparePromise(service.endPoints[i], options);
                if (promise) {
                    service.endPoints[i].promise = $q.when(promise);
                    service.endPoints[i].promise.cancel = () => {
                        $q.defer().resolve();
                    }
                    promiseService.register(service.endPoints[i].promise);
                }
            }

            _callback('searchstart');
            
            /*
             * Wait for all search endpoints resolve
             */
            return $q.all(service.endPoints.map(endPoint => endPoint.promise))
                .then(
                    function (responses) {
                        
                        // Unregister all promises
                        _unregisterAllPromises();

                        // Post processs responses
                        postProcess(responses, rocketMap, options, callback);

                    })
                .catch(function (error) {

                    // Unregister all promises
                    _unregisterAllPromises();
                        
                    _callback('searchend', null);
                    console.log(error);
                });

        };

        /**
         * Launch searches on next pages
         * 
         * @param {Object} rocketMap 
         * @param {function} callback 
         */
        function searchNext(rocketMap, callback) {
            search({
                next: true
            }, rocketMap, callback);
        };

        /**
         * 
         * Prepare a search promise from endPoint
         * 
         * @param {object} endPoint Search endPoint
         * @param {object} options 
         * 
         * @returns {Promise}
         */
        function preparePromise(endPoint, options) {

            options = options || {};

            /*
             * Discard non active endpoints
             */
            if (!endPoint.options) {
                return null;
            }

            var parentInfo = {
                url: endPoint.url,
                title: endPoint.data ? endPoint.data.title : null,
                description: endPoint.data ? endPoint.data.description : null,
                fromNext: options.next,
                options: endPoint.options || {}
            };

            var searchInfo = options.next ? getSearchNextInfo(endPoint) : getSearchInfo(endPoint, options);

            if (!searchInfo || !searchInfo.url) {
                return null;
            }

            /*
             * The already process case (see StacCatalogBrowserComponent)
             */
            if (options.responses && options.responses[endPoint.url]) {
                return $q.resolve({
                    status: 200,
                    config: {
                        parentInfo: parentInfo
                    },
                    data: options.responses[endPoint.url]
                });
            }

            /*
             * Inactive case
             */
            if (endPoint.options.isInactive) {
                return $q.resolve({
                    status: 200,
                    config: {
                        parentInfo: parentInfo
                    },
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            /*
             * bbox special case
             */
            if (searchInfo.params.bbox && searchInfo.params.bbox instanceof Array) {
                searchInfo.params.bbox = searchInfo.params.bbox.join(',');
            }

            var canceller = $q.defer();

            /*
             * Very important - catch error to have $q.all() resolves all promises
             */
            return $http({
                url: searchInfo.url,
                method: 'GET',
                params: searchInfo.params,
                headers: rocketAuthService.getAuthorizationHeaders(searchInfo.url),
                skipAuthorization: true,
                timeout: canceller.promise,
                // Very important - used to associate callback to the right layer
                parentInfo: parentInfo
            }).catch(function (error) {
                return error;
            });

        }

        /**
         * Return search url and search params from filters
         * 
         * @param {object} endPoint
         * @param {object} options
         */
        function getSearchInfo(endPoint, options) {

            options = options || {};

            var url;

            /*
             * Merge commonFilters and endPoint specific
             */
            var usedCommons = {};
            for (var key in commonFilters) {

                /*
                 * If option.noSpatial is set then discard spatial filters
                 */
                if (options.noSpatial && ['name', 'lon', 'lat', 'intersects', 'bbox'].indexOf(key) !== -1) {
                    continue;
                }
                usedCommons[key] = commonFilters[key];
            }
            var filters = $.extend({}, usedCommons, endPoint.filters || {});

            /*
             * Initialize search parameters
             */
            var searchParams = {
                q: filters.q,
                // Heatmap are produced without geo information
                _heatmapNoGeo:true
            };
            if (config.defaultSearchLimit && config.defaultSearchLimit > 0) {
                searchParams['limit'] = config.defaultSearchLimit;
            }
            
            /*
             * Discard unwanted filters (i.e. undefined and rocket specific)
             */
            for (var key in filters) {

                // Filters starting with double underscore are rocket specific
                if (key.startsWith('__')) {
                    continue;
                }

                if (typeof filters[key] !== 'undefined') {
                    searchParams[key] = filters[key];
                }

            }

            /*
             * Convert __theme into ck filter
             */
            if (filters.__theme) {
                searchParams.ck = filters.__theme;
                delete searchParams.collections
            }

            /*
             * Specific search on unique collection
             */
            else if (filters.collections && filters.collections.split(',').length === 1 && endPoint.collections && endPoint.collections.collections) {
                for (var i = endPoint.collections.collections.length; i--;) {
                    if (filters.collections === endPoint.collections.collections[i].id && endPoint.collections.collections[i].links) {
                        for (var j = endPoint.collections.collections[i].links.length; j--;) {
                            if (endPoint.collections.collections[i].links[j].rel === 'items') {
                                url = endPoint.collections.collections[i].links[j].href;
                                delete searchParams.collections;
                                break;
                            }
                        }
                        if (url) {
                            break;
                        }
                    }
                }
            }

            /*
             * If both 'name' and 'intersects' are provided, then 'name' is used for resto server with gazetteer
             * otherwise it is discarded
             */
            if (filters.name && filters.intersects) {
                if (stacUtil.hasExtension(endPoint, 'gazetteer')) {
                    searchParams.intersects = null;
                }
                else {
                    searchParams.name = null;
                }
            }

            return {
                // Url was not found in collection so force to defaultSearchLink
                url: url || (endPoint.defaultSearchLink ? endPoint.defaultSearchLink.href : null),
                params: stacUtil.hasExtension(endPoint, 'resto-core') ? searchParams : stacUtil.cleanSearchParams(searchParams)
            };

        }

        /**
         * Return next search url and params
         * 
         * @param {object} endPoint
         */
        function getSearchNextInfo(endPoint) {

            if (!endPoint || !endPoint.nextLink) {
                return null;
            }

            // Split nextLink into url + params
            return {
                url: endPoint.nextLink.href.match(/.+\?/)[0],
                params: extractKVP(endPoint.nextLink.href)
            };

        }

        /**
         * Post process results after a successfull search
         * 
         * @param {array} responses 
         * @param {object} rocketMap
         * @param {object} options
         * @param {function} callback
         */
        function postProcess(responses, rocketMap, options, callback) {
            
            var cleanResponses = [];

            var errors = [];

            // Nullify location of previous search
            var location = null;

            // Get projection code from rocketMap
            var projCode = rocketMap ? rocketMap.getProjectionCode() : config.defaultProjCode;

            for (var i = responses.length; i--;) {

                // Empty responses are discarded
                if (!responses[i]) {
                    continue;
                }

                // Non HTTP 200 responses are discarded but error is tracked
                if ( responses[i].status !== 200 ) {
                    errors.push(responses[i]);
                    continue;
                }

                // Keep track of next url in endPoint
                storeNext(responses[i]);
                
                if ( responses[i].data && responses[i].data.context ) {

                    // Store location
                    if ( !location ) {
                        location = getLocationFromContext(responses[i].data.context, projCode);
                    }
                    
                    // Systematically force filters update for resto servers
                    if ( responses[i].data.context.query && responses[i].data.context.query.appliedFilters ) {
                        
                        var appliedFilters = _convertAppliedFilters(responses[i].data.context.query.appliedFilters || {});

                        // Convert lon/lat to intersects
                        if (appliedFilters.hasOwnProperty('lon') && appliedFilters.hasOwnProperty('lat')) {
                            appliedFilters.intersects = 'POINT(' + appliedFilters.lon + ' ' + appliedFilters.lat + ')';
                            appliedFilters.lon = null;
                            appliedFilters.lat = null;
                        }

                        // Convert ck back to __theme and collections
                        if ( appliedFilters.hasOwnProperty('ck') ) {
                            appliedFilters['__theme'] = appliedFilters.ck;
                            delete appliedFilters.ck;
                        }
                        
                        if (responses[i].data.context.query.locationFound) {
                            appliedFilters['__name'] = responses[i].data.context.query.locationFound.name + (responses[i].data.context.query.locationFound.country_code2 && responses[i].data.context.query.locationFound.feature_code && responses[i].data.context.query.locationFound.feature_code.substr(0, 3) !== 'PCL' ? ', ' + rocketServices.translate('country:' + responses[i].data.context.query.locationFound.country_code2) : '');
                        }
                        else if ( !appliedFilters['__name'] && (appliedFilters.intersects || appliedFilters.bbox) ) {
                            appliedFilters['__name'] = window.rocketmap.Util.geometryToName(window.rocketmap.Util.WKTToGeometry(appliedFilters.intersects || window.rocketmap.Util.BBOXToWKT(appliedFilters.bbox.split(',').map(parseFloat)), projCode), projCode);
                        }
                        
                        addFilters(appliedFilters, {
                            append:false
                        });
            
                    }
                    
                }

                cleanResponses.push(responses[i]);

            }

            /**
             * Reference to rocketMap - update layers
             */
            if (rocketMap) {
                rocketMapUpdaterService.update(cleanResponses, errors, rocketMap, options, location);
            }

            if (callback) {
                callback(cleanResponses);
            }

            _callback('searchend', cleanResponses);

        };

        /**
         * Store next link per endPoint
         * 
         * @param {array} response 
         */
        function storeNext(response) {
            var url = response && response.config && response.config.parentInfo ? response.config.parentInfo.url : null;
            if (url) {
                for (var i = service.endPoints.length; i--;) {
                    if (url === service.endPoints[i].url) {
                        service.endPoints[i].nextLink = rocketServices.getLinks(response.data.links, 'next')[0];
                        break;
                    }
                }
            }
        }

        /**
         * Get location from FeatureCollection context object
         * 
         * @param {Object} context 
         * @param {string} projCode
         */
        function getLocationFromContext(context, projCode) {

            // No need
            if (!context || !context.query) {
                return null;
            }

            var location = {
                properties: {}
            };

            // Name and geouid retrieved from locationFound
            if (context.query.locationFound) {
                location.title = context.query.locationFound.name;
                location.properties.geouid = context.query.locationFound._id
            }

            // WKT retrieved from appliedFilters
            if (context.query.appliedFilters) {
                var appliedFilters = _convertAppliedFilters(context.query.appliedFilters);
                if (appliedFilters.intersects) {
                    location.wkt = appliedFilters.intersects;
                }
                else if (appliedFilters.lon && appliedFilters.lat) {
                    location.wkt = 'POINT(' + appliedFilters.lon + ' ' + appliedFilters.lat + ')';
                }
                else if (appliedFilters.bbox) {
                    location.wkt = window.rocketmap.Util.BBOXToWKT(appliedFilters.bbox.split(',').map(parseFloat));
                }
            }

            if (!location.wkt) {
                return null;
            }

            if (!location.title && window.rocketmap) {
                location.title = window.rocketmap.Util.geometryToName(window.rocketmap.Util.WKTToGeometry(location.wkt, projCode), projCode);
            }

            return location;

        }

        /**
         * (From https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Util.js)
         * 
         * Extract Key/Value pair from an url like string
         * (e.g. &lon=123.5&lat=2.3&zoom=5)
         * 
         * @param {String} str
         * @param {boolean} lowerCasedKey
         * @param {boolean} removeNull
         */
        function extractKVP(str, lowerCasedKey, removeNull) {
            var c = {};
            str = str || "";
            str.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                if (value === undefined || value === "") {
                    if (!removeNull) {
                        c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = true;
                    }
                }
                else {
                    try {
                        value = decodeURIComponent(value);
                    }
                    catch (e) {
                        value = unescape(value);
                    }
                    c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = value;
                }
            });
            return c;
        }

        /**
         * Split input filters for display
         * 
         * @param {object} filters 
         */
        function cleverSplit(filters) {

            filters = filters || {};

            if (filters.collections && !filters.__collection) {
                filters.__collection = !filters.__theme ? filters.collections : null;
            }

            var cleverFilters = {
                others: []
            };

            for (var key in filters) {

                // Should never occurs
                if (typeof filters[key] === 'object') {
                    continue;
                }

                // Not displayed
                if (['page', 'limit'].indexOf(key) !== -1) {
                    continue;
                }

                // Special cases
                if (['start', 'end', 'name', 'collections', 'intersects', 'bbox'].indexOf(key) !== -1 || key.substr(0, 2) === '__') {
                    cleverFilters[key] = filters[key];
                    continue;
                }

                // Now split every filter values against " ", "|" and "," into array
                else {
                    
                    // Hack + '' to process element that are numeric as string
                    var elements = (filters[key] + '').trim().split(/\s+/);
                    for (var i = 0, ii = elements.length; i < ii; i++) {
                        cleverFilters.others.push({
                            key: key,
                            value: elements[i]
                        });
                        /* [TODO] Do not split
                        var exploded = elements[i].split(',');
                        for (var j = 0, jj = exploded.length; j < jj; j++) {
                            cleverFilters.others.push({
                                key: key,
                                value: exploded[j]
                            });
                        }*/
                    }

                }

            }

            return cleverFilters;

        }

        /**
         * Callback
         * 
         * @param {string} eventName
         * @param {object} obj
         */
        function _callback(eventName, obj) {

            if (eventName === 'searchstart') {
                _searchInProgress = true;
            }
            if (eventName === 'searchend') {
                _searchInProgress = false;
            }

            if (registeredEvents[eventName]) {
                for (var i = registeredEvents[eventName].length; i--;) {
                    registeredEvents[eventName][i](obj);
                }
            }

        }

        /**
         * Unregister all promises
         */
         function _unregisterAllPromises() {

            for (var i = service.endPoints.length; i--;) {
                if (service.endPoints[i].promise) {
                    promiseService.unregister(service.endPoints[i].promise);
                }
            }

        }

        /**
         * Convert resto 7.x context->appliedFilters to 6.x context->query->appliedFilters
         * In resto 6.x appliedFilters is an array of property => value
         * In resto 7.x appliedFilters is an array of property => array(value, operation)
         * 
         * @param object appliedFilters
         * @return object
         * 
         */
        function _convertAppliedFilters(appliedFilters) {

            var converted = {};

            for (var key in appliedFilters) {
                if ( typeof appliedFilters[key] === 'object' && appliedFilters[key].hasOwnProperty('value') ) {
                    converted[key] = appliedFilters[key].value;
                }
                else {
                    converted[key] = appliedFilters[key];
                }
            }

            return converted;

        }

    }

})();