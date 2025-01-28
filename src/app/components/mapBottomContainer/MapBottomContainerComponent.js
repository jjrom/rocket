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
        .controller('MapBottomContainerComponent', ['$window', '$timeout', 'rocketHolder', 'rocketSearchService', 'stacUtil', 'rocketMagicReader', 'config', MapBottomContainerComponent]);

    function MapBottomContainerComponent($window, $timeout, rocketHolder, rocketSearchService, stacUtil, rocketMagicReader, config) {

        var self = this;

        self.defaultOAPIPEndPoint = config.processesEndPoints && config.processesEndPoints.length > 0 ? config.processesEndPoints[0] : null;
        
        /* 
         * Initialize rocketHolder
         */
        rocketHolder.states.mapBottomContainer = rocketHolder.states.mapBottomContainer || {};

        /*
         * Counters
         */
        self.counters = rocketHolder.states.mapBottomContainer.counters || {
            results: 0
        };

        self.watch = {

            /*
             * Active tab
             */
            activeTab: null,

            /**
             * Pointer to endPoints
             */
            endPoints: rocketSearchService.endPoints,

            /*
             * True to display layers tab
             */
            displayLayersTab: config.display.layersTab,

            /*
             * True to allow change catalog
             */
            displayChangeCatalog: config.display.changeCatalog,

            /*
             * True to allow change OGC API Processes endpoint
             */
            displayChangeOAPIP: config.display.changeOAPIP,

            uploadInProgress: false

        }

        /*
         * Init event
         */
        self.$onInit = function () {

            rocketSearchService.on('addendpoint', _addEndPoint);
            rocketSearchService.on('removeendpoint', _removeEndPoint);
            rocketSearchService.on('searchstart', _searchStart);
            rocketSearchService.on('searchend', _searchEnd);
            self.setEndPoint(self.watch.endPoints && self.watch.endPoints.length > 0 ? self.watch.endPoints[0] : null);
            stacUtil.on('loadstart', _loadstart);
            rocketMagicReader.on('uploadstart', _uploadStart);

            if (self.rocketMap) {

                self.rocketMap.on('addlayer', _mapEventaddlayer);
                self.rocketMap.on('selectedfeatures', _mapClickStart);
                if (self.hideOnMapClick) {
                    self.rocketMap.on('clickstart', _mapClickStart);
                }

                // Open Tab if needed
                if (rocketHolder.states.mapBottomContainer.activeTab) {
                    self.showTab(rocketHolder.states.mapBottomContainer.activeTab);
                }
            }

        };

        /*
         * Destroy event
         */
        self.$onDestroy = function () {

            rocketSearchService.un('addendpoint', _addEndPoint);
            rocketSearchService.un('removeendpoint', _removeEndPoint);
            rocketSearchService.un('searchstart', _searchStart);
            rocketSearchService.un('searchend', _searchEnd);
            stacUtil.un('loadstart', _loadstart);
            rocketMagicReader.un('uploadstart', _uploadStart);
            if (self.rocketMap) {
                self.rocketMap.un('addlayer', _mapEventaddlayer);
                self.rocketMap.un('selectedfeatures', _mapClickStart);
                if (self.hideOnMapClick) {
                    self.rocketMap.un('clickstart', _mapClickStart);
                }
            }

        };

        /**
         * Show tab
         * 
         * @param {string} tabName 
         */
        self.showTab = function (tabName) {

            // Hack - do nothing on fullscreen active
            if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
                return;
            }

            // Layers tab cannot be opened if not available
            if (tabName === 'layers' && !self.watch.displayLayersTab) {
                return;
            }

            var top = $('#map').height() + $('#map').offset().top;
            var mapBottomContainer = $('.map-bottom-container');

            if (tabName) {
                mapBottomContainer.css({
                    top: top - Math.round(top / 4.0),
                    position: 'relative'
                });/*
                mapBottomContainer.animate({ top: top - Math.round(top / 4.0) }, 200, function () {
                    mapBottomContainer.css({
                        position: 'relative'
                    });
                });*/
            }
            else {
                mapBottomContainer.css({
                    top: top ,
                    position: 'fixed'
                });
                /*
                mapBottomContainer.animate({ top: top }, 200, function () {
                    mapBottomContainer.css({
                        position: 'fixed'
                    });
                });*/
            }

            $timeout(function () {
                self.watch.activeTab = tabName;
            });

            // Store activeTab status
            rocketHolder.states.mapBottomContainer.activeTab = tabName;

        };

        /**
         * Set active endPoint
         * 
         * @param {Object} endPoint 
         */
        self.setEndPoint = function (endPoint) {
            self.endPoint = endPoint;
            if (!endPoint) {
                self.counters = {
                    results: 0
                };
                rocketHolder.states.mapBottomContainer.counters = self.counters;
            }
        };

        /**
         * Set endpoint loading flag
         */
        function _loadstart() {
            self.endPointIsLoading = true;
        };

        /**
         * Called when search starts
         */
        function _searchStart() {
            self.counters.results = 0;
            self.searchInProgress = true;
            rocketHolder.states.mapBottomContainer.counters = self.counters;
        };

        /**
         * Called when search ends
         */
        function _searchEnd(searchResults) {
            if (searchResults && searchResults.length > 0) {
                self.counters.results = searchResults[0].data && searchResults[0].data.context && searchResults[0].data.context.hasOwnProperty('matched') ? searchResults[0].data.context.matched : searchResults[0].data.features.length;
                if ( config.display.tabOnSearchResults && self.counters.results > 0 && ['filters', 'results'].indexOf(self.watch.activeTab) === -1) {
                    self.showTab('results');
                }
            }
            else {
                self.counters.results = 0;
            }
            self.searchInProgress = false;
            rocketHolder.states.mapBottomContainer.counters = self.counters;
        };

        /**
         * Called when a search endPoint is added
         * 
         * @param {object} endPoint 
         */
        function _addEndPoint(endPoint) {
            self.setEndPoint(endPoint);
            self.watch.endPoints = rocketSearchService.endPoints;
            self.endPointIsLoading = false;
            if (config.display.tabOnAddCatalog) {
                self.showTab('explore');
            }
        }

        /**
         * Called when endPoints is updated
         * 
         * @param {array} endPoints 
         */
        function _removeEndPoint(url) {
            self.watch.endPoints = rocketSearchService.endPoints;
            self.setEndPoint(self.watch.endPoints.length > 0 ? self.watch.endPoints[0] : null);
            self.counters.results = 0;
        }

        /**
         * Called when map is clicked
         * 
         * @param {object} obj
         */
        function _mapClickStart(obj) {
            self.showTab(null);
        }

        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            // Show layers tab if showLayersTab is true
            if (config.display.tabOnAddLayer && self.watch.displayLayersTab && params && params.showLayersTab) {
                self.showTab("layers");
            }

        }

        /**
         * Called when layer upload start/stop
         * @param {boolean} bool 
         */
        function _uploadStart(bool) {
            self.watch.uploadInProgress = bool;
        }

        /**
         * Listen to window resize for carousel computation
         */
        angular.element($window).on('resize', function () {
            self.showTab(null);
        });

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('mapBottomContainer', {
            templateUrl: 'app/components/mapBottomContainer/mapBottomContainer.html',
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * True to hide panel on map click
                 */
                hideOnMapClick: '<'

            },
            controller: 'MapBottomContainerComponent'
        });

})();