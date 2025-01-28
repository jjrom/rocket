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
        .controller('FeaturesBrowserController', ['rocketSearchService', FeaturesBrowserController]);

    function FeaturesBrowserController(rocketSearchService) {

        var self = this;

        /**
         * Array of search results
         */
        self.searchResults = [];

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.rocketMap && changesObj.rocketMap.currentValue) {
                if (self.rocketMap) {
                    self.searchResults = self.rocketMap.getSearchResults();
                    self.rocketMap.on('searchend', _mapSearchend);
                }
            }
        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.un('searchend', _mapSearchend);
            }
        };

        /**
         * Select feature
         *
         * @param {Object} feature
         */
        self.selectFeature = function (feature) {
            var olFeature = (self.rocketMap.getFeatureById(feature.id));
            self.rocketMap.selectFeature(olFeature);
            self.rocketMap.hiliteFeature(olFeature, {
                center:true
            });
        };

        /**
         * Search next
         */
        self.next = function () {
            rocketSearchService.searchNext(self.rocketMap);
        }

        /**
         * Map event: searchend
         * 
         * @param {array} searchResults
         */
        function _mapSearchend(searchResults) {
            self.searchResults = searchResults;
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('featuresBrowser', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/featuresBrowser/featuresBrowser.html',
                    explore: 'app/components/featuresBrowser/featuresBrowserExplore.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {
                
                /*
                 * rocket Map
                 */
                rocketMap: '<'

            },
            controller: 'FeaturesBrowserController'
        });

})();
