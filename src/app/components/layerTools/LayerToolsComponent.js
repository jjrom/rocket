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
        .controller('LayerToolsController', ['rocketServices', 'rocketSearchService', LayerToolsController]);

    function LayerToolsController(rocketServices, rocketSearchService) {

        var self = this;

        self.watch = {
            
            /*
             * By default no search in progress
             */
            searchInProgress: rocketSearchService.searchInProgress()

        };

        /*
         * Initialize events
         */
        self.$onInit = function () {
            rocketSearchService.on('searchstart', _searchStart);
            rocketSearchService.on('searchend', _searchEnd);
        };

        /*
         * Destroy events
         */
        self.$onDestroy = function () {
            rocketSearchService.un('searchstart', _searchStart);
            rocketSearchService.un('searchend', _searchEnd);
        };

        /**
         * Return true is this can be searched
         * 
         * @returns boolean
         */
        self.showSearch = function () {
            return rocketSearchService.hasSearchAPI();
        }

        /**
         * Remove layer
         * 
         * @param {string} id
         * @param {boolean} ask
         * @param {Event} evt
         */
        self.removeLayer = function (layer, ask, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (!self.rocketMap) {
                return;
            }

            var shouldRemove = true;

            if (ask) {

                var confirmText;
                if (layer.get('_rocket').id === self.rocketMap.AOI_LAYER_ID) {
                    confirmText = rocketServices.translate('map.aoi.remove.confirm');
                }
                else {
                    confirmText = rocketServices.translate('map.layer.remove.confirm', [layer.get('_rocket') ? (layer.get('_rocket').title || layer.get('_rocket').id) : '']);
                }

                if (!confirm(confirmText)) {
                    shouldRemove = false;
                }

            }

            if (shouldRemove) {

                // Search layer - remove endpoint
                if (layer.get('_rocket').type === 'search') {
                    rocketSearchService.removeEndPoint(layer.get('_rocket').id);
                }

                // AOI layer - clear geo filter
                if (layer.get('_rocket').id === self.rocketMap.AOI_LAYER_ID) {
                    rocketSearchService.addFilters({
                        name: null,
                        intersects: null,
                        bbox: null,
                        __name: null
                    },
                        {
                            append: true
                        });
                }

                // Remove layer
                self.rocketMap.removeLayer(layer);

            }

        };


        /**
         * Zoom on layer
         *
         * @param {olLayer} layer
         * @param {Event} evt
         */
        self.centerOnLayer = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (self.rocketMap && olLayer) {
                self.rocketMap.zoomTo(olLayer, {
                    padding: [100, 100, 100, 100]
                });
            }

        };

        /**
         * Search on layer
         *
         * @param {olLayer} olLayer
         * @param {Event} evt
         */
        self.searchOnLayer = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            // Already a search in progress
            if (self.watch.searchInProgress) {
                return;
            }

            if (self.rocketMap && olLayer && olLayer.getSource && olLayer.getSource().getFeatures) {

                var features = [];
                for (var i = 0, ii = olLayer.getSource().getFeatures().length; i < ii; i++) {
                    features.push(olLayer.getSource().getFeatures()[i].clone());
                }

                self.rocketMap.addAOILayer({
                    title: olLayer.get('_rocket').title,
                    parent: olLayer.get('_rocket').id,
                    features: features
                }, {}, function (aoiLayer) {

                    if (aoiLayer) {

                        // Set filters nullify next/prev
                        rocketSearchService.addFilters(
                            $.extend({
                                next: null,
                                prev: null
                            }, rocketSearchService.getFiltersFromLayer(aoiLayer, self.rocketMap.getProjectionCode())),
                            {
                                append: false
                            }
                        );

                        // Launch search
                        rocketSearchService.search({}, self.rocketMap);

                    }
                });

            }

        };

        /**
         * Toggle search layer visibility
         * 
         * @param {olLayer} olLayer
         * @param {Event} evt 
         */
        self.switchVisible = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            // Get layer from id
            var visible = !olLayer.getVisible();

            olLayer.setVisible(visible);

            // Switch attached layer visibility
            if (self.rocketMap && olLayer.get('_rocket') && olLayer.get('_rocket').linkedLayer) {
                var tmpLayer = self.rocketMap.getLayerByRocketId(olLayer.get('_rocket').linkedLayer.id);
                if (tmpLayer) {
                    tmpLayer.setVisible(visible);
                }
            }

            return visible;
        };

        /**
         * Switch legend
         * 
         * @param {olLayer} olLayer 
         * @param {Event} evt 
         */
        self.switchLegend = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            self.showLegend = !self.showLegend;
        };

        /**
         * Trigger info button
         * 
         * @param {olLayer} olLayer 
         * @param {Event} evt 
         */
        self.triggerInfo = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (self.onTriggerInfo) {
                self.onTriggerInfo({
                    layerId: olLayer.get('_rocket').id || null
                });
            }

        };

        /**
         * Toggle search layer visibility
         * 
         * @param {string} layerId
         * @param {Event} evt 
         */
        self.getLayer = function (layerId) {
            return self.rocketMap ? self.rocketMap.getLayerByRocketId(layerId) : null;
        };

        /**
         * Toggle search layer activity
         * 
         * @param {olLayer} olLayer
         * @param {Event} evt 
         */
        self.toggleSearch = function (olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (olLayer) {
                olLayer.get('_rocket').isInactive = !olLayer.get('_rocket').isInactive;
                rocketSearchService.setActive(olLayer.get('_rocket').id, !olLayer.get('_rocket').isInactive);
            }

        };

        self.switchFeatureInfo = function(olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            var center = self.rocketMap.map.getView().getCenter();
            
            if (olLayer.get('_rocket').parsedWMS && olLayer.get('_rocket').parsedWMS.bbox) {
                var bbox = window.ol.extent.applyTransform(olLayer.get('_rocket').parsedWMS.bbox, window.ol.proj.getTransform('EPSG:4326', self.rocketMap.getProjectionCode()));
                center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
            }
            self.rocketMap.triggerClick(center);
        }

        /**
         * Set search button inactive
         */
        function _searchStart() {
            self.watch.searchInProgress = true;
        };

        function _searchEnd() {
            self.watch.searchInProgress = false;
        };

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('layerTools', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/layerTools/layerTools.html',
                    asset: 'app/components/layerTools/layerToolsAsset.html',
                    inMap: 'app/components/layerTools/layerToolsInMap.html'
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Parent call on trigger ingo button
                 */
                onTriggerInfo: '&',

                /*
                 * True to show info button
                 */
                infoButton: '<',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * Show legend by default
                 */
                showLegent: '<',

                /*
                 * Layer
                 */
                layer: '<'

            },
            controller: 'LayerToolsController'
        });

})();