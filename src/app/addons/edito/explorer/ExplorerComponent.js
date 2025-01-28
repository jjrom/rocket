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
        .controller('ExplorerComponent', ['$window', '$timeout', 'rocketHolder', 'rocketSearchService', 'stacUtil', 'rocketMagicReader', 'config', ExplorerComponent]);

    function ExplorerComponent($window, $timeout, rocketHolder, rocketSearchService, stacUtil, rocketMagicReader, config) {

        var self = this;

        self.defaultOAPIPEndPoint = config.processesEndPoints && config.processesEndPoints.length > 0 ? config.processesEndPoints[0] : null;
        
        /* 
         * Initialize rocketHolder
         */
        rocketHolder.states.explorer = rocketHolder.states.explorer || {
            activeTab: 'explore'
        };

        /*
         * Counters
         */
        self.counters = rocketHolder.states.explorer.counters || {
            results: 0
        };

        self.watch = {

            /*
             * Active tab
             */
            activeTab: 'explore',

            /**
             * Pointer to endPoints
             */
            endPoints: rocketSearchService.endPoints,

            /*
             * True to display layers tab
             */
            displayLayersTab: config.display.layersTab,

            /* 
             * True to display filters tab
             */
            displayFiltersTab: config.display.filtersTab,

            /*
             * True to allow change catalog
             */
            displayChangeCatalog: config.display.changeCatalog,

            /*
             * True to allow change OGC API Processes endpoint
             */
            displayChangeOAPIP: config.display.changeOAPIP,

            /*
             * Search catalog by keyword
             */
            suggestUrl: rocketSearchService.endPoints[0] && rocketSearchService.endPoints[0].url ? rocketSearchService.endPoints[0].url + '/catalogs' : null,

            /*
             * True means a file is uploaded
             */
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
            }

            // Open Tab if needed
            if (self.defaultActiveTab || rocketHolder.states.explorer.activeTab) {
                self.showTab(self.defaultActiveTab || rocketHolder.states.explorer.activeTab);
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
            var explorer = $('.explorer');

            if (tabName) {
                explorer.css({
                    top: top - Math.round(top / 4.0),
                    position: 'relative'
                });/*
                explorer.animate({ top: top - Math.round(top / 4.0) }, 200, function () {
                    explorer.css({
                        position: 'relative'
                    });
                });*/
            }
            else {
                explorer.css({
                    top: top ,
                    position: 'fixed'
                });
                /*
                explorer.animate({ top: top }, 200, function () {
                    explorer.css({
                        position: 'fixed'
                    });
                });*/
            }

            $timeout(function () {
                self.watch.activeTab = tabName;
            });

            // Store activeTab status
            rocketHolder.states.explorer.activeTab = tabName;

            /*
             * Scroll to top of page
             * Chrome strange stuff - https://stackoverflow.com/a/27556697 
             */
            $('body, html, #explore-panel-content').animate({ scrollTop: 0} , 200);

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
                rocketHolder.states.explorer.counters = self.counters;
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
            rocketHolder.states.explorer.counters = self.counters;
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
            rocketHolder.states.explorer.counters = self.counters;
        };

        /**
         * Called when a search endPoint is added
         * 
         * @param {object} endPoint 
         */
        function _addEndPoint(endPoint) {
            self.setEndPoint(endPoint);
            self.watch.endPoints = rocketSearchService.endPoints;
            self.watch.suggestUrl = endPoint.url + '/catalogs';
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
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            // Show layers tab if showLayersTab is true
            if (config.display.tabOnAddLayer && self.watch.displayLayersTab && params && params.showLayersTab) {
                self.showTab("layers");
                return;
            }

            // Show layer if it specifically tells you so from _rocket.showLayerTabOnAdd
            if ( olLayer.get('_rocket') && olLayer.get('_rocket').showLayersTabOnAdd ) {
                self.showTab("layers");
                return;
            }

        }

        /**
         * Called when layer upload start/stop
         * @param {boolean} bool 
         */
        function _uploadStart(bool) {
            self.watch.uploadInProgress = bool;
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('explorer', {
            templateUrl: 'app/addons/edito/explorer/explorer.html',
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
            controller: 'ExplorerComponent'
        });

})();