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
        .controller('FeaturesCarouselController', ['$window', 'rocketSearchService', FeaturesCarouselController]);

    function FeaturesCarouselController($window, rocketSearchService) {

        var self = this;

        var _selectedFeatureIds = [];
        var _tmpDiv = null;

        /*
         * Initialization
         */
        self.$onInit = function () {

            /*
             * Features carousel offset and limit
             */
            self.position = {
                offset: 0,
                limit: self.limitPerPage
            };
            
            if (self.rocketMap) {

                // Compute carousel limit
                _computeCarouselLimit({
                    target:self.rocketMap.target
                });

                // Initial load
                _updateFeaturesInView();
                
                self.rocketMap.on('selectedfeatures', _mapSelectedfeatures);
                self.rocketMap.on('moveend', _updateFeaturesInView);
                self.rocketMap.on('addlayer', _updateFeaturesInView);
                self.rocketMap.on('removelayer', _updateFeaturesInView);
                rocketSearchService.on('searchend', _updateFeaturesInView);
            }

            /*
             * Set header remote
             */
            if (self.onReady) {
                self.onReady({
                    remote: {
                        selectFeature: self.selectFeature
                    }
                });
            }

        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {

            if (changesObj.features && changesObj.features.currentValue) {
                self.loadingIndicator = null;
                _selectedFeatureIds = [self.selectedId];
                _scrollToFeature(self.selectedId);
            }

        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.un('selectedfeatures', _mapSelectedfeatures);
                self.rocketMap.un('moveend', _updateFeaturesInView);
                self.rocketMap.un('addlayer', _updateFeaturesInView);
                self.rocketMap.un('removelayer', _updateFeaturesInView);
                rocketSearchService.un('searchend', _updateFeaturesInView);
            }
        };

        /**
         * Normize identifier i.e. remove . and /
         */
        self.normalize = function (str) {
            return str.replace(/\./g, '').replace(/\//g, '');
        };

        /**
         * Display previous page of features
         */
        self.prev = function () {
            self.position.offset = Math.max(self.position.offset - self.position.limit, 0);
        };

        /**
         * Display next page of results - eventually call parent
         */
        self.next = function () {
           
            var offset = self.position.offset + self.position.limit;
    
            if (self.features.length >= offset) {
                self.position.offset = offset;
            }
    
        };
    
        /**
         * Return true if feature is selected
         */
        self.isSelected = function (feature) {
            for (var i = _selectedFeatureIds.length; i--;) {
                if (_selectedFeatureIds[i] === feature.id) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Quick select feature from carousel
         *
         * @param {Object} feature
         */
        self.selectFeature = function (feature) {

            // Call parent if needed
            if ( self.onSelect ) {
                self.onSelect({
                    feature:feature
                });
            }

            // No rocketMap - direct select
            if (!self.rocketMap || !self.rocketMap.map) {
                _selectedFeatureIds = [feature.id];
                _scrollToFeature(feature.id);
            }

            // rocketMap - select through selectFeature callback
            else {

                // Clear line connector if any
                _clearLineConnector()

                // Unselect
                if (_selectedFeatureIds.length === 1 && _selectedFeatureIds[0] === feature.id) {
                    self.rocketMap.selectFeature(null);
                    self.rocketMap.hiliteFeature(null);
                }

                // Select
                else {

                    // [IMPORTANT] Convert input feature into olFeature
                    var olFeature = (self.rocketMap.getFeatureById(feature.id));
                    self.rocketMap.selectFeature(olFeature);
                    self.rocketMap.hiliteFeature(olFeature, {
                        center:true
                    });

                }
            }
            
            
        };


        /**
         * Hilite feature on map
         *
         * @param {Feature} feature
         * @param {boolean} hilite
         * @param {boolean} evt
         */
        self.hiliteFeature = function (feature, hilite, evt) {

            // Avoid unecessary computation
            if (hilite && self.hilitedFeature && self.hilitedFeature.id === feature.id) {
                return;
            }

            // Always done - display hilited feature text above carousel
            self.hilitedFeature = hilite ? feature : null;

            // No map - no hilite on map
            if ( !self.rocketMap || !self.rocketMap.map) {
                return;
            }

            // Always clear hover if exist
            if (self.rocketMap.hoverLayer) {
                self.rocketMap.hoverLayer.getSource().clear();
            }

            // Hilite the olFeature on map
            var olFeature = self.rocketMap.getFeatureById(feature.id);
            if (!olFeature || !olFeature.getGeometry() || !hilite) {
                self.hilitedFeature = null;
                _clearLineConnector();
            }
            else if (self.rocketMap.hoverLayer) {
                self.rocketMap.hoverLayer.getSource().addFeatures(window.rocketmap.Util.geoJSONToOlFeatures({
                    type: 'FeatureCollection',
                    features: [feature]
                }, self.rocketMap.getProjectionCode()));
            }

            // Eventually hilite with line
            if ( self.hiliteWithLine ) {

                // Compute the parent offset
                var parentOffset = $('#' + self.rocketMap.target).offset();

                // Support dot and / in identifier
                var normalizedId = self.normalize(evt.currentTarget.id); 
                if (!normalizedId) {
                    return;
                }
                var div = $('#' + normalizedId);
                if ( !div.offset() ) {
                    self.hilitedFeature = null;
                    _clearLineConnector();
                }

                else {

                    if (!_tmpDiv || _tmpDiv.attr('id') !== div.attr('id')) {

                        var p1 = [Math.round(div.offset().left + (div.width() / 2)), Math.round(div.offset().top  - parentOffset.top)];

                        // Avoid -180/180 crossing geometries to be seen on 0,0
                        var centroid = feature.properties && feature.properties.centroid ? window.ol.proj.fromLonLat(feature.properties.centroid, self.rocketMap.getProjectionCode()) : window.ol.extent.getCenter(olFeature.getGeometry().getExtent());
                        var p2 = self.rocketMap.map.getPixelFromCoordinate(centroid);
                        if (p1 && p2) {    
                            var length = Math.sqrt(((p2[0] - p1[0]) * (p2[0] - p1[0])) + ((p2[1] - p1[1]) * (p2[1] - p1[1])));
                            var cx = ((p1[0] + p2[0]) / 2) - (length / 2);
                            var cy = ((p1[1] + p2[1]) / 2) - 0.5;
                            var angle = Math.atan2((p1[1] - p2[1]), (p1[0] - p2[0])) * (180 / Math.PI);
                            if (angle > 0) {
                                $('#connector').css({
                                    "position": "absolute",
                                    "padding": "0px",
                                    "margin": "0px",
                                    "height": "1px",
                                    "background-color": self.background && self.background.color === 'light' ? '#000' : '#fff',
                                    "line-height": "1px",
                                    "left": cx + "px",
                                    "top": cy + "px",
                                    "width": length + "px",
                                    "transform": "rotate(" + angle + "deg)",
                                    "z-index": "10000"
                                }).show();
                                _tmpDiv = div;
                                return;
                            }
                        }
                    }
                    _clearLineConnector();
                }
            }

        };

        /**
         * Map event : selectedfeatures
         * 
         * @param {array} olFeatures 
         */
        function _mapSelectedfeatures(olFeatures) {
            var tmp = [];
            for (var i = 0, ii = olFeatures.length; i < ii; i++) {
                tmp.push(olFeatures[i].getId())
            }
            _selectedFeatureIds = tmp;
            if (olFeatures.length > 0) {
                _scrollToFeature(olFeatures[0].getId());
            };
        };

        /**
         * Map event : moveend
         */
        function _updateFeaturesInView() {

            if (!self.rocketMap) {
                return [];
            }

            var featuresInView = self.rocketMap.getFeaturesInView();
            featuresInView.sort(function (a, b) {
                if (a.properties.datetime && b.properties.datetime) {
                    return (a.properties.datetime < b.properties.datetime) ? 1 : (a.properties.datetime > b.properties.datetime) ? -1 : 0;
                }
                return !a.properties.datetime ? 0 : 1;
            });
            
            self.features = featuresInView;

            // Scroll to begining
            if (self.features.length > 0) {
                _scrollToFeature(self.features[0].id);
            }
            else {
                self.position.offset = 0;
            }

            // Clear hoverLayer
            if (self.rocketMap.hoverLayer) {
                self.rocketMap.hoverLayer.getSource().clear();
            }

        };

        /**
         * Compute carousel features number displayed based on carousel size
         * 
         * @params {Object} params
         */
        function _computeCarouselLimit(params) {

            params = params || {};

            var width, carouselWidth;

            /*
             * Base size is the number of fixed elements i.e. 'next', 'prev' (always)
             */
            var baseSize = 3;
            
            /*
             * Get the rocketMap target element as the max width
             */
            var targetWidth = params.target ? $('#' + params.target).width(): window.innerWidth;
            

            /*
             * Compute carouselWidth
             */
            var carouselStrWidth = window.getComputedStyle(document.body, null).getPropertyValue('--features-carousel-max-width');
            if (carouselStrWidth) {
                carouselWidth = Math.floor((targetWidth * Math.max(parseInt(carouselStrWidth.split('vw')[0]), 1)) / 100);
            }

            /*
             * Get feature carousel element width from CSS variable
             * (see https://stackoverflow.com/questions/36088655/accessing-a-css-custom-property-aka-css-variable-through-javascript)
             */
            var strWidth = window.getComputedStyle(document.body, null).getPropertyValue('--features-carousel-width');
            if (strWidth) {
                width = Math.max(parseInt(strWidth.split('px')[0]), 1);
            }

            if (width && carouselWidth) {
                self.position.limit = Math.min(self.limitPerPage, Math.floor((carouselWidth - (baseSize * width)) / width));
            }

            if (params.hasOwnProperty('offset')) {
                self.position.offset = params.offset;
            }

        };

        /**
         * Scroll carousel feature
         * 
         * @param {String} id
         */
        function _scrollToFeature(id) {
            
            var index = -1;

            if (!self.features) {
                return;
            }

            for (var i = 0, ii = self.features.length; i < ii; i++) {
                if (self.features[i].id === id) {
                    index = i;
                    break;
                }
            }
            
            // Compute carousel offset from index so id is visible
            if (index > -1 && self.position.limit > 0) {
                self.position.offset = (Math.floor(index / self.position.limit)) * self.position.limit;
            }

        };

        /*
         * Unhilite feature on map (i.e. when mouse is not hover a feature on carousel)
         */
        function _clearLineConnector() {
            $('#connector').hide();
            _tmpDiv = null;
        } 

        /**
         * Listen to window resize for carousel computation
         */
        angular.element($window).on('resize', function () {
            if (self.rocketMap) {
                _computeCarouselLimit({
                    target:self.rocketMap.target
                });
            }
        });

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('featuresCarousel', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/featuresCarousel/featuresCarousel.html',
                    innerMap: 'app/components/featuresCarousel/featuresCarouselInnerMap.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Callback function to set remote controller
                 */
                onReady: '&',

                /*
                 * Callback function when a feature is clicked
                 */
                onSelect: '&',

                /*
                 * Pre-selected id
                 */
                selectedId: '<',

                /* 
                 * Input features
                 */
                features: '<',

                /*
                 * Display loading indicator until features is set
                 */
                loadingIndicator: '<',

                /*
                 * True add a pointing line to the center of the feature on map when hover it on carousel
                 */
                hiliteWithLine: '<',

                /*
                 * Maximum number of feature displayed per page
                 */
                limitPerPage: '<',

                /*
                 * rocket Map
                 */
                rocketMap: '<'

            },
            controller: 'FeaturesCarouselController'
        });

})();
