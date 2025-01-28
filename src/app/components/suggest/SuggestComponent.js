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
        .controller('SuggestController', ['rocketServices', 'restoAPI', SuggestController]);

    function SuggestController(rocketServices, restoAPI) {

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

            _searchPromise = restoAPI.getResource(
                self.suggestUrl,
                {
                    q: input,
                    limit: 30,
                    _countCatalogs: 0
                }
            );
            
            _searchPromise.then(
                (result) => {

                    // Convert results to suggest format
                    var updated = [];
                    if (result.data) {

                        // This is Gazetteer suggest
                        if (result.data.results) {
                            for (var i = 0, ii = result.data.results.length; i < ii; i++) {
                                updated.push({
                                    id: result.data.results[i].id,
                                    name: result.data.results[i].value,
                                    description: rocketServices.translate(result.data.results[i].type) + ' (' + rocketServices.translate('search.products', [result.data.results[i].counter]) + ')',
                                    type:result.data.results[i].type,
                                    flag: 'assets/img/facets/' + _getFlag(result.data.results[i].type.split(':')[0])
                                });
                            }
                        }
                        // This is catalogs suggest
                        else if (result.data.links) {
                            for (var i = 0, ii = result.data.links.length; i < ii; i++) {
                                if (result.data.links[i].rel && result.data.links[i].rel === 'child') {
                                    updated.push({
                                        id: result.data.links[i].id,
                                        name: result.data.links[i].title,
                                        description: result.data.links[i].description || '',
                                        type:result.data.links[i]['resto:type'],
                                        flag: 'assets/img/facets/' + _getFlag(result.data.links[i]['resto:type'].split(':')[0])
                                    });
                                }
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
         * Select item
         *
         * @param {Object} result
         */
        self.select = function (result) {
            
            if ( !result || !result.originalObject ) {
                return;
            }

            if ( self.onSelect ) {
                self.onSelect({
                    q:typeof result.originalObject === 'string' ? result.originalObject : result.originalObject.id
                });
            }

        }

        /*
         * Mouse over
         */
        self.hover = function (result) {
            return;
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
        .component('suggest', {
            templateUrl: "app/components/suggest/suggest.html",
            bindings: {

                /*
                 * Callback function when an item is hovered
                 */
                onHover: '&',

                /*
                 * Callback function when an item is selected (i.e. user click on an item)
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
                 * Suggest url is mandatory
                 */
                suggestUrl: '<'

            },
            controller: 'SuggestController'
        });

})();