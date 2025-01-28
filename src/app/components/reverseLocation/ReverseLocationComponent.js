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
        .controller('ReverseLocationController', ['$timeout', 'rocketHolder', 'restoGazetteerAPI', 'rocketSearchService', 'config', ReverseLocationController]);

    function ReverseLocationController($timeout, rocketHolder, restoGazetteerAPI, rocketSearchService, config) {

        var self = this;

        var _clearMapPin,
            _defaultPinMenu = {
            lonLat:[],
            locations:[],
            position:null,
            mapExtent:{}
        };

        self.watch = {

            /*
             * Indicate if gazetteer search is running
             */
            gazetteerIsLoading: false,

            /*
             * Indicate if catalog search is running
             */
            searchInProgress: false,

            /*
             * Pin menu
             */
            pinMenu: $.extend({}, _defaultPinMenu)

        };

        /*
         * Watch changes in parent
         */
        self.$onInit = function () {
            rocketSearchService.on('searchstart', _searchStart);
            rocketSearchService.on('searchend', _searchEnd);
        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            rocketSearchService.un('searchstart', _searchStart);
            rocketSearchService.un('searchend', _searchEnd);
        };

        /*
         * Set remote map-pin component
         */
        self.setRemote = function(remote) {
            _clearMapPin = remote && remote.clear ? remote.clear : null;
        }

        /*
         * Callback on map click
         */
        self.onClick = function(obj) {
            _reverseLocation(obj);
        };

        /*
         * Callback on translate start
         */
        self.onTranslateStart = function() {
            if (self.watch.pinMenu.position) {
                self.watch.pinMenu.position = null;
            }
        }

        /*
         * Callback on translate end
         */
        self.onTranslateEnd = function(obj) {
            _reverseLocation(obj);
        }

        /*
         * Callback on map move start
         */
        self.onMoveStart = function() {
            $timeout(function(){
                if (self.watch.pinMenu.position) {
                    self.watch.pinMenu.position = null;
                }
            });
        }

        /*
         * Callback on map move end
         */
        self.onMoveEnd = function(obj) {
            $timeout(function(){
                self.watch.pinMenu = $.extend(self.watch.pinMenu, {
                    position:_getPinPosition(obj.pixel),
                    mapExtent:obj.mapExtent
                });
            });
        }

        /**
         * Clear search
         */
        self.clear = function () {
            self.watch.pinMenu = $.extend({}, _defaultPinMenu);
            if (_clearMapPin) {
                _clearMapPin();
            }
        }

        /**
         * Add a temporary location layer on map
         * 
         * @param {object} location
         */
        self.showLocation = function (location) {
            self.hideLocation();
            if (location && location.wkt) {
                self.rocketMap.addLayer({
                    id: '__tmpaoi__',
                    type: 'vector',
                    zIndex: 100,
                    notInPanel: true,
                    wkt: location.wkt,
                    styleName: 'aoihilited'
                });
            }
        }

        /**
         * Remove temporary location layer from map
         */
        self.hideLocation = function () {
            if (!self.rocketMap || !self.rocketMap.map) {
                return;
            }
            var tmpLayer = self.rocketMap.getLayerByRocketId('__tmpaoi__');
            if (tmpLayer) {
                self.rocketMap.map.removeLayer(tmpLayer);
            }
        }

        /**
         * Select location
         *
         * @param {object} obj
         */
        self.selectLocation = function (obj) {

            // Eventually hide temporary location layer
            self.hideLocation();

            obj = obj || {};

            if (obj.wkt || obj.lonLat) {

                if (self.onSelect) {
                    self.onSelect({
                        location: {
                            title: obj.name ? obj.name : window.rocketmap.Util.dms(obj.lonLat[1], false) + ', ' + window.rocketmap.Util.dms(obj.lonLat[0], true),
                            wkt: obj.wkt ? obj.wkt : 'POINT(' + obj.lonLat.join(' ') + ')',
                            properties: {
                                geouid: obj.geouid,
                                _from:'reverseLocation'
                            }
                        }
                    });
                }

            }

        };

        /**
         * Show pinMenu and process reverseLocation
         * 
         * @param {Object} obj 
         * @returns 
         */
        function _reverseLocation(obj) {
            
            var lonLat = window.rocketmap.Util.toLonLat(obj.coordinate, self.rocketMap ? self.rocketMap.getProjectionCode() : config.defaultProjCode, 6);

            /*
             * Update pinMenu
             */
            $timeout(function(){
                self.watch.pinMenu = $.extend({
                    lonLat:lonLat,
                    locations:[]
                }, {
                    position:_getPinPosition(obj.pixel),
                    mapExtent:obj.mapExtent
                });
            });

            /*
             * Perform a reverse location if gazetteer is present
             */
            self.watch.gazetteerIsLoading = true;

            if ( !rocketHolder.mapContext || !rocketHolder.mapContext.planetInfo.gazetteer || !rocketHolder.mapContext.planetInfo.gazetteer.url ) {
                self.watch.gazetteerIsLoading = false;
                return;
            }

            restoGazetteerAPI.reverse(
                rocketHolder.mapContext.planetInfo.gazetteer,
                {
                    lon: lonLat[0],
                    lat: lonLat[1],
                    discard_class: 'S'
                }
            )
                .then(function (locations) {
                    self.watch.gazetteerIsLoading = false;
                    self.watch.pinMenu.locations = locations;
                })
                .catch(function (error) {
                    self.watch.gazetteerIsLoading = false;
                });

        }

        function _searchStart() {
            self.watch.searchInProgress = true;
        };

        function _searchEnd() {
            self.watch.searchInProgress = false;
        };

        function _getPinPosition(pixel) {
            if (pixel && pixel.length === 2) {
                return {
                    left:(pixel[0] - 135) + 'px', // Use the half of the pinMenu element width
                    bottom: ($('#map').height() - pixel[1] + 30) + 'px'
                }
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('reverseLocation', {
            templateUrl: "app/components/reverseLocation/reverseLocation.html",
            bindings: {

                /*
                 * Callback function when location is selected (i.e. user click on a location name in the locations popup)
                 */
                onSelect: '&',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * True to hide pin on click
                 */
                hidePinOnClick: '<'


            },
            controller: 'ReverseLocationController'
        });

})();

