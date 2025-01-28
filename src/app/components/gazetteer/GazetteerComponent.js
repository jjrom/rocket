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
        .controller('GazetteerController', ['restoGazetteerAPI', GazetteerController]);

    function GazetteerController(restoGazetteerAPI) {

        var self = this;

        var _searchPromise = null;

        /**
         * Suggest search location name
         *
         * @param {string} input
         */
        self.suggest = function (input) {

            if (_searchPromise && typeof _searchPromise.cancel === 'function') {
                _searchPromise.cancel();
            }

            _searchPromise = restoGazetteerAPI.search(
                self.gazetteer,
                {
                    q: input,
                    limit: 30
                }
            );

            return _searchPromise;

        }

        /**
         * Set location
         *
         * @param {Object} result : object from suggestLocationName
         */
        self.select = function (result) {
            
            _hideLocation();

            if ( !result || typeof result.originalObject === 'string') {
                return false;
            }
            
            if ( self.onSelect ) {
                self.onSelect({
                    location:{
                        title:result.originalObject['name'],
                        wkt: result.originalObject['wkt'],
                        properties:{
                            geouid: result.originalObject['_id']
                        }
                    }
                });
                
            }

        }

        /*
         * Mouse over
         */
        self.hover = function (result) {
            
            if (self.rocketMap && result && result.originalObject) {

                /*
                 * Apparently user hit enters before selecting a value
                 * Guess with name !
                 */
                if (!result.originalObject['name'] || !result.originalObject['wkt']) {
                    return;
                }

                // Warn parent
                if ( self.onHover ) {
                    self.onHover({
                        location:{
                            title: result.originalObject['name'],
                            wkt: result.originalObject['wkt'],
                            properties:{
                                geouid: result.originalObject._id
                            }
                        }
                    });
                }
                
                // Remove Existing layer
                _hideLocation();

                self.rocketMap.addLayer({
                    id: '__tmpaoi__',
                    title: result.originalObject['name'],
                    type: 'vector',
                    zIndex: 100,
                    notInPanel: true,
                    wkt: result.originalObject['wkt'],
                    properties:{
                        geouid: result.originalObject._id
                    },
                    styleName: 'aoihilited'
                }, {
                    center:true
                });

            }

        }

        /**
         * Remove temporary location layer from map
         */
        function _hideLocation() {

            if ( self.rocketMap && self.rocketMap.map ) {
                var tmpLayer = self.rocketMap.getLayerByRocketId('__tmpaoi__');
                if (tmpLayer) {
                    self.rocketMap.map.removeLayer(tmpLayer);
                }
            }
            
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('gazetteer', {
            templateUrl: "app/components/gazetteer/gazetteer.html",
            bindings: {

                /*
                 * Callback function when a location is hovered
                 */
                onHover: '&',

                /*
                 * Callback function when location is selected (i.e. user click on a location name)
                 */
                onSelect: '&',

                /*
                 * Input field type (search or text (default))
                 */
                inputType: '<',

                /*
                 * Class to apply to form
                 */
                inputClass: '<',

                /*
                 * Gazetteer is mandatory
                 */
                gazetteer: '<',

                /*
                 * rocket Map (optional)
                 */
                rocketMap: '<'

            },
            controller: 'GazetteerController'
        });

})();