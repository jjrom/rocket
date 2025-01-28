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
        .controller('MapPinController', [MapPinController]);

    function MapPinController() {

        var self = this;

        var _translateObject = {
            interaction:null,
            inProgress:false,
            point:null,
            multiLineString:null,
            pointFeature:null,
            lineFeature:null
        };

        /*
         * Watch changes in parent
         */
        self.$onInit = function () {

            if (self.rocketMap) {
                self.rocketMap.on('movestart', _mapMovestart);
                self.rocketMap.on('moveend', _mapMoveend);
                self.rocketMap.on('click', _mapClick);
            }

            /*
             * Set header remote
             */
            if (self.onReady) {
                self.onReady({
                    remote: {
                        clear: self.clear
                    }
                });
            }

        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.clear();
                self.rocketMap.un('movestart', _mapMovestart);
                self.rocketMap.un('moveend', _mapMoveend);
                self.rocketMap.un('click', _mapClick);
            }
        };

        /**
         * Clear search
         */
        self.clear = function () {

            if (self.rocketMap && self.rocketMap.map) {

                var layer = self.rocketMap.getLayerByRocketId('__mappin__');
                if (layer) {
                    self.rocketMap.map.removeLayer(layer);
                }

                self.rocketMap.map.removeInteraction(_translateObject.interaction);
                _translateObject = {
                    interaction:null,
                    inProgress:false,
                    point:null,
                    multiLineString:null,
                    pointFeature:null,
                    lineFeature:null
                };
                
            }

        }

        /**
         * Map event : singleclick
         * 
         * @param {object} obj 
         */
        function _mapClick(obj) {

            /*
             * Avoid click during translation
             */
            if (_translateObject.inProgress) {
                return;
            }
            
            /*
             * Hide pin menu
             */
            self.clear();
           
            /*
             * Add translate interaction on cross 
             * (see https://jsfiddle.net/jonataswalker/70vsd0of/)
             */
            _translateObject.point = new window.ol.geom.Point(obj.coordinate);
            _translateObject.multiLineString = new window.ol.geom.MultiLineString(_getMLSCoords(obj.coordinate));
            _translateObject.pointFeature = new window.ol.Feature(_translateObject.point);
            _translateObject.lineFeature = new window.ol.Feature(_translateObject.multiLineString);

            _translateObject.interaction = new window.ol.interaction.Translate({
                hitTolerance:10,
                //condition: window.ol.events.condition.shiftKeyOnly,
                features: new window.ol.Collection([_translateObject.pointFeature])
            });
            self.rocketMap.map.addInteraction(_translateObject.interaction);

            _translateObject.interaction.on('translatestart', function (evt) {
                _translateObject.inProgress = true;
                if (self.onTranslateStart) {
                    self.onTranslateStart();
                }
            });
            _translateObject.interaction.on('translating', function (evt) {
                _translateObject.multiLineString.setCoordinates(_getMLSCoords(_translateObject.point.getCoordinates()));
            });
            _translateObject.interaction.on('translateend', function (evt) {
                _translateObject.inProgress = false;
                if (self.onTranslateEnd) {
                    self.onTranslateEnd({
                        obj:_getPinPosition(_translateObject.point.getCoordinates())
                    });
                }
            });

            /*
             * New layer
             */
            self.rocketMap.addLayer({
                id: '__mappin__',
                type: 'vector',
                zIndex: 100,
                notInPanel: true,
                isSystem:true,
                features:[
                    _translateObject.pointFeature,
                    _translateObject.lineFeature
                ],
                style:[
                    new window.ol.style.Style({
                        stroke: new window.ol.style.Stroke({
                            color: [255, 255, 255, 1],
                            width: 1,
                            lineDash: [4,8],
                            lineDashOffset: 6
                        })  
                    }),
                    new window.ol.style.Style({
                        stroke: new window.ol.style.Stroke({
                            color: [0, 0, 0, 1],
                            width: 1,
                            lineDash: [4,8]
                        })
                    }),
                    new window.ol.style.Style({
                        image: new window.ol.style.Circle({
                            radius: 10,
                            stroke: new window.ol.style.Stroke({
                                color: [255, 255, 255, 1],
                                width: 1
                            })
                        })
                    }),
                ]
            },
            {},
            function (layer) {});

            // Important !
            _translateObject.inProgress = false;
            
            if (self.onClick && _translateObject.point) {
                self.onClick({
                    obj:_getPinPosition(_translateObject.point.getCoordinates())
                });
            }

        };

        /**
         * Return MultiLineString coordinates array for cross on Earth Extent
         * 
         * @param {array} coordinate 
         * @returns array
         */
        function _getMLSCoords(coordinate) {
            //var mapExtent = [-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244];
            var mapExtent = self.rocketMap.map.getView().calculateExtent(self.rocketMap.map.getSize());
            return [
                [
                    [mapExtent[0], coordinate[1]],
                    [mapExtent[2], coordinate[1]]
                ],
                [
                    [coordinate[0], mapExtent[1]],
                    [coordinate[0], mapExtent[3]]
                ]
            ];
        }

        function _mapMovestart() {
            if (self.onMoveStart) {
                self.onMoveStart();
            }
        }

        function _mapMoveend() {
            if (_translateObject.point) {
                var coordinate = _translateObject.point.getCoordinates();
                if (_translateObject.multiLineString) {
                    _translateObject.multiLineString.setCoordinates(_getMLSCoords(coordinate));
                }
                if (self.onMoveEnd) {
                    self.onMoveEnd({
                        obj:_getPinPosition(coordinate)
                    });
                }
            }
            
        }

        /**
         * Returns pin position
         * @param {object} coordinate 
         * @returns 
         */
        function _getPinPosition(coordinate) {
            if (coordinate) {
                var wkt = window.rocketmap.Util.BBOXToWKT(self.rocketMap.getGeoExtent(7));
                var projCode = self.rocketMap.getProjectionCode();
                return {
                    coordinate:coordinate,
                    pixel:self.rocketMap.map.getPixelFromCoordinate(coordinate),
                    mapExtent:{
                        name: window.rocketmap.Util.geometryToName(window.rocketmap.Util.WKTToGeometry(wkt, projCode), projCode),
                        wkt: wkt
                    }
                }
            }
            return {};
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('mapPin', {
            templateUrl: "app/components/mapPin/mapPin.html",
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * Remote
                 */
                onReady: '&',

                /*
                 * Callback on feature translatestart
                 * @returns nothing
                 */
                onTranslateStart: '&',

                /*
                 * Callback on feature translateend
                 * @returns "obj" {coordinate, pixel, mapExtent}
                 */
                onTranslateEnd: '&',

                /*
                 * Callback on map click
                 * @returns "obj" {coordinate, pixel, mapExtent}
                 */
                onClick: '&',

                /*
                 * Callback on map movestart
                 * @returns nothing
                 */
                onMoveStart: '&',

                /*
                 * Callback on map moveend
                 * @returns "obj" {coordinate, pixel, mapExtent}
                 */
                onMoveEnd: '&'

            },
            controller: 'MapPinController'
        });

})();

