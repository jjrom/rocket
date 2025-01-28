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
        .controller('MetaSuggestController', ['$timeout', 'rocketServices', 'restoGazetteerAPI', 'restoAPI', 'config', MetaSuggestController]);

    function MetaSuggestController($timeout, rocketServices, restoGazetteerAPI, restoAPI, config) {

        var self = this;

        var _searchPromise = null;

        /*
         * Set remote control on component
         */
        self.$onInit = function () {
            rocketServices.focus('suggest_value');
        };

        /**
         * Clear input field
         */
        self.clear = function () {
            $timeout(function () {
                var element = document.getElementById('suggest_value');
                if (element) {
                    element.value = '';
                }
            });
        };

        /**
         * Suggest search location name
         *
         * @param {string} input
         */
        self.suggest = function (input) {

            if (_searchPromise && typeof _searchPromise.cancel === 'function') {
                _searchPromise.cancel();
            }

            if ( config.display.suggest.catalogs && !config.display.suggest.gazetteer ) {
                _searchPromise = self.suggestCatalog(input);
            }
            /*
             * If input starts with "#" then search on hashtag, otherwise on location
             */
            else if (input.startsWith('#') && config.display.suggest.catalogs) {
                _searchPromise = self.suggestCatalog(input.substring(1));
            }
            else if (config.display.suggest.gazetteer) {
                _searchPromise = self.suggestLocation(input);
            }
            else {
                _searchPromise.cancel();
            }

            return _searchPromise;

        }

        /**
         * Suggest search location name
         *
         * @param {string} input
         */
        self.suggestLocation = function (input) {

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
         * Suggest cataog search
         *
         * @param {string} input
         */
        self.suggestCatalog = function (input) {

            _searchPromise = restoAPI.getResource(
                self.suggestUrl,
                {
                    q: input,
                    limit: 30,
                    _nocount: 1
                }
            );

            _searchPromise.then(
                (result) => {

                    // Convert results to suggest format
                    var updated = [];
                    if (result.data && result.data.links) {
                        for (var i = 0, ii = result.data.links.length; i < ii; i++) {
                            if (result.data.links[i].rel && result.data.links[i].rel === 'child') {
                                updated.push({
                                    id: result.data.links[i].id,
                                    href:result.data.links[i].href,
                                    name: result.data.links[i].title,
                                    description: result.data.links[i].description || '',
                                    parents:result.data.links[i].id.split('/').slice(0, -1),
                                    type:result.data.links[i]['type'],
                                    _from: 'hashtag'
                                });
                            }

                        }
                        result.data.results = updated;
                    }
                    return result;
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

            if (!result || typeof result.originalObject === 'string') {
                return false;
            }

            if (result.originalObject._from === 'hashtag') {

                if (self.onSelectSuggest) {
                    self.onSelectSuggest({
                        catalog: result.originalObject
                    });
                }

            }
            else if (self.onSelectGazetteer) {
                self.onSelectGazetteer({
                    location: {
                        title: result.originalObject['name'],
                        wkt: result.originalObject['wkt'],
                        properties: {
                            geouid: result.originalObject['_id']
                        }
                    }
                });
            }

            // Clear input after selection
            self.clear();

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
                if (self.onHover) {
                    self.onHover({
                        location: {
                            title: result.originalObject['name'],
                            wkt: result.originalObject['wkt'],
                            properties: {
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
                    properties: {
                        geouid: result.originalObject._id
                    },
                    styleName: 'aoihilited'
                }, {
                    center: true
                });

            }

        }

        /**
         * Remove temporary location layer from map
         */
        function _hideLocation() {

            if (self.rocketMap && self.rocketMap.map) {
                var tmpLayer = self.rocketMap.getLayerByRocketId('__tmpaoi__');
                if (tmpLayer) {
                    self.rocketMap.map.removeLayer(tmpLayer);
                }
            }

        }

        /**
         * Return flag from facet type
         * 
         * @param {string} type
         */
        function _getFlag(type) {

            var flag = 'hashtag.svg';

            switch (type) {

                case 'landuse':
                    flag = 'landuse.svg';
                    break;

                case 'day':
                case 'month':
                case 'season':
                case 'year':
                    flag = 'calendar.svg';
                    break;

                case 'location':
                    flag = 'location.svg';
                    break;

                case 'instrument':
                case 'platform':
                case 'sensorType':
                    flag = 'satellite.svg';
                    break;

                case 'observedProperty':
                    flag = 'observedProperty.svg';
                    break;

                default:
                    break;

            }

            return flag;

        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('metaSuggest', {
            templateUrl: "app/components/metaSuggest/metaSuggest.html",
            bindings: {

                /*
                 * Callback function when an item is hovered
                 */
                onHover: '&',

                /*
                 * Callback function when a suggest item is selected (i.e. user click on an item)
                 */
                onSelectSuggest: '&',

                /*
                 * Callback function when a gazetteer item is selected (i.e. user click on an item)
                 */
                onSelectGazetteer: '&',

                /*
                 * Input field type (search or text (default))
                 */
                inputType: '<',

                /*
                 * Class to apply to form
                 */
                inputClass: '<',

                /*
                 * Class to apply to button
                 */
                inputButtonClass: '<',

                /*
                 * Suggest url is mandatory
                 */
                suggestUrl: '<',

                /*
                 * Gazetteer is mandatory
                 */
                gazetteer: '<',

                /*
                 * rocket Map (optional)
                 */
                rocketMap: '<'

            },
            controller: 'MetaSuggestController'
        });

})();