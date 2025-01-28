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
        .factory('rocketMapUpdaterService', ['rocketServices', 'rocketHolder', 'config', rocketMapUpdaterService]);

    function rocketMapUpdaterService(rocketServices, rocketHolder, config) {

        var service = {
            update:update
        };

        return service;

        /////////

        /** 
         * Update rocketMap search layers
         * 
         * @param {array} responses
         * @param {array} errors
         * @param {object} rocketMap 
         * @param {object} options
         * @param {object} location // Extracted location from search result (used to set AOI)
         *
         */
        function update(responses, errors, rocketMap, options, location) {

            options = options || {};

            if ( !rocketMap ) {
                return;
            }

            var fromNext = false;

            /*
             * Array of responses - each response correspond to a search result to a unique endPoint
             * identifier by "parentUrl"
             */
            for (var k = 0, kk = responses.length; k < kk; k++) {

                var featureCollection = responses[k].data;

                /*
                 * Invalid result
                 */
                if ( !featureCollection.hasOwnProperty('type') || !featureCollection.hasOwnProperty('features') ) {
                    continue;
                }

                /* 
                 * STAC 0.9 support
                 * [TODO][TO BE REMOVED] Temporary support to STAC < 0.9 rename searchMetadata to context
                 */
                if (featureCollection['search:metadata']) {
                    featureCollection.context = featureCollection['search:metadata'];
                    delete featureCollection['search:metadata'];
                }

                var parentInfo = responses[k].config.parentInfo;
                var append = responses[k].config.params && responses[k].config.params.next ? true : false;

                /*
                 * If at least one search is fromNext then consider the whole fromNext
                 */
                if (parentInfo.fromNext) {
                    fromNext = true;
                }
                
                /*
                 * 1. Rewrite features geometry to avoid awkward drawing
                 * when crossing the -180/+180 meridian
                 * 
                 * 2. Add feature to cache
                 */
                for (var i = 0, ii = featureCollection.features.length; i < ii; i++) {

                    featureCollection.features[i] = window.rocketmap.Util.adaptFeature(featureCollection.features[i]);

                    /*
                     * Cache mechanism
                     */
                    var selfLinks = rocketServices.getLinks(featureCollection.features[i].links, 'self'); 
                    if (selfLinks.length > 0) {
                        if (!rocketHolder.features) {
                            rocketHolder.features = {};
                        }
                        rocketHolder.features[selfLinks[0].href] = featureCollection.features[i];
                    }

                }

                if (featureCollection) {

                    /*
                     * Create/update search layer
                     */
                    _updateSearchLayer(rocketMap, parentInfo, featureCollection, append);

                    /*
                     * Add AOI layer from featureCollection results
                     */
                    _setAOILayerIfNeeded(rocketMap, location, {
                        center: !options.next
                    });
                    
                }
                
            }

            /*
             * Tell rocketMap to propagate event 'searchcomplete'
             */
            rocketMap.searchEnd({
                fromNext: fromNext
            });
            
            /*
             * Center
             */
            if ( featureCollection && featureCollection.features.length > 0) {

                // Easy - force center
                if (rocketMap && rocketMap.map) {

                    var resultsExtent = rocketMap.getSearchResultsExtent();
                    for (var i = resultsExtent.length; i--;) {
                        if ( Math.abs(resultsExtent[i]) === Infinity) {
                            resultsExtent = true;
                            break;
                        }
                    }
                    if (options.center || !resultsExtent || !window.ol.extent.intersects(resultsExtent, rocketMap.map.getView().calculateExtent(rocketMap.map.getSize()))) {

                        // If options.center is a bbox then center on it
                        if (typeof options.center === 'string') {
                            var bbox = options.center.split(',').map(parseFloat);
                            if (bbox.length === 4) {
                                resultsExtent = window.ol.proj.transformExtent(bbox , 'EPSG:4326', rocketMap.getProjectionCode());
                            }
                        }
                        
                        // Center on result extent
                        if (resultsExtent) {
                            rocketMap.map.getView().fit(resultsExtent);
                        }
                        
                    }
                }
            
            }
            else {
                if (errors.length > 0) {

                    // This is a CORS issue
                    if (errors[0].status === -1) {
                        rocketServices.error('cors.issue');
                    }
                    else {
                        rocketServices.error('[ERROR] HTTP ' + errors[0].status + ' - ' + errors[0].statusText);
                    }
                    
                }
                else {
                    rocketServices.error('search.noresult');
                }
            }

        }

        /**
         * Create/update a search layer
         * 
         * @param {Object} rocketMap
         * @param {Object} target
         * @param {Object} featureCollection
         * @param {boolean} append // True to append features to existing layer - otherwise replace it
         */
        function _updateSearchLayer(rocketMap, target, featureCollection, append) {

            // Attached layer identified by endPoint root url
            var searchLayer = rocketMap.getLayerByRocketId(target.url);

            // Check if heatmap layer is attached to the search layer
            var heatmapConfig = _updateHeatmapLayer(rocketMap, target.url, rocketServices.getLinks(featureCollection.links, 'heatmap')[0]);
            
            if (!searchLayer) {
                rocketMap.addLayer(rocketSearchService.getSearchLayerConfig(target, heatmapConfig),
                {},
                function (layer) {
                    rocketMap.updateLayer(layer, featureCollection, {
                        append: append
                    });
                });
            }
            else {

                rocketMap.updateLayer(searchLayer, featureCollection, {
                    append: append,
                    _rocket:{
                        linkedLayer: heatmapConfig
                    }
                });
                
            }

        }

        /**
         * Update Heatmap layer
         * 
         * @param {Object} rocketMap
         * @param {string} url
         * @param {Object} heatmapLink 
         * 
         * @return object
         */
         function _updateHeatmapLayer(rocketMap, url, heatmapLink) {
            
            var heatmapConfig = {
                id:'heatmap|' + url,
                title:rocketServices.translate('search.heatmap'),
                thumbnail: 'assets/img/backgrounds/heatmap.png',
                iconClass: 'fas fa-fire-alt'
            };

            var heatmapLayer = rocketMap.getLayerByRocketId(heatmapConfig.id);

            if (heatmapLink) {

                var visible = config.display.heatmapVisible;
                
                // Heatmap layer already exists    
                if (heatmapLayer) {

                    // Same heatmap - leave it untouched
                    if (heatmapLayer.getSource() && heatmapLayer.getSource().urls && heatmapLayer.getSource().urls[0] === window.rocketmap.Util.parseWMSGetMap(heatmapLink.href).url) {
                        return heatmapConfig;
                    }

                    // Heatmap updated - remove it
                    visible = heatmapLayer.getVisible();
                    rocketMap.removeLayer(heatmapLayer);
                }

                rocketMap.addLayer({
                    id:heatmapConfig.id,
                    title:heatmapConfig.title,
                    type: 'TileWMS',
                    thumbnail: heatmapConfig.thumbnail,
                    notInPanel:true,
                    options: {
                        url: heatmapLink.href,
                        wrapX: true,
                        visible: visible
                    }
                });

                return heatmapConfig;

            }

            else {

                // Remove layer but not heatmap config
                if (heatmapLayer) {
                    rocketMap.removeLayer(heatmapLayer);
                }

                return null;

            }

        }

        /**
         * 
         * Set an AOI layer from featureCollection description if needed
         * 
         * @param {Object} rocketMap
         * @param {Object} location
         * @param {Object} options {center: // True to center after updating AOI}
         */
         function _setAOILayerIfNeeded(rocketMap, location, options) {
            
            if ( !location ) {
                return;
            }    
            
            /*
             * Optimize - only change aoiLayer for geouid cases and not for drawn aoiLayer for instance
             */
            var aoiLayer = rocketMap.getLayerByRocketId(rocketMap.AOI_LAYER_ID);
            if (aoiLayer && ( !location.properties.geouid || (aoiLayer.get('_rocket').properties && aoiLayer.get('_rocket').properties.geouid === location.properties.geouid) ) ) {
                return;
            }
        
            // Replace AOI layer
            rocketMap.addAOILayer(location, options);

        }


    };

})();