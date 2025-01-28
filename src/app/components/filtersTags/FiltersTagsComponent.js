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
        .controller('FiltersTagsController', ['rocketServices', 'rocketSearchService', FiltersTagsController]);

    function FiltersTagsController(rocketServices, rocketSearchService) {

        var self = this;

        /*
         * Set remote control on component
         */
        self.$onInit = function () {
            _updateFilters({
                filters: rocketSearchService.getFilters()
            });
            rocketSearchService.on('updatefilters', _updateFilters);
        }

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            rocketSearchService.un('updatefilters', _updateFilters);
        };

        /**
         * Get relation from string
         * 
         * @param {string} str
         * @return string 
         */
        self.getRelation = function (str) {
            if (!str || typeof str !== 'string') {
                return null;
            }
            switch (str.substr(-1)) {
                case '*':
                    return rocketServices.translate('narrower');
                case '!':
                    return rocketServices.translate('broader');
                case '~':
                    return rocketServices.translate('related');
                default:
                    return null;
            }
        }

        /**
         * Remove filter
         * 
         * @param {string} key
         * @param {string} value
         */
        self.removeFilter = function (key, value) {

            var filters = {};

            switch (key) {

                case 'collections':
                    filters = {
                        collections: null,
                        __theme: null,
                        __collection: null
                    };
                    break;

                case 'date':
                    filters = {
                        start: null,
                        end: null
                    };
                    break;

                case 'spatial':
                    filters = {
                        bbox: null,
                        intersects: null,
                        name: null,
                        __name: null
                    };
                    break;

                default:
                    var values = [];
                    for (var i = 0, ii = self.cleverFilters.others.length; i < ii; i++) {
                        if (self.cleverFilters.others[i].key === key) {
                            if (self.cleverFilters.others[i].value !== value) {
                                values.push(self.cleverFilters.others[i].value);
                            }
                        }
                    }
                    filters[key] = values.length === 0 ? null : values.join(',');

            }

            return rocketSearchService.addFilters(
                $.extend({
                    next: null,
                    prev: null
                }, filters || {}),
                {
                    append: true
                }
            );

        };

        /**
         * Clear all filters
         * 
         * @param {boolean} keepGeo
         */
        self.clearFilters = function (keepGeo) {
            return rocketSearchService.addFilters(
                $.extend({
                    next: null,
                    prev: null
                }, keepGeo ? {
                    bbox:self.cleverFilters.bbox,
                    intersects: self.cleverFilters.intersects,
                    name: self.cleverFilters.name,
                    __name: self.cleverFilters.__name
                }: {}),
                {
                    append: false
                }
            );
        };

        /**
         * Update local filters after rocketSeachService filters update
         * 
         * @param {object} obj
         */
        function _updateFilters(obj) {
            obj = obj || {};
            obj.filters = obj.filters || {};
            self.cleverFilters = rocketSearchService.cleverSplit(obj.filters);
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('filtersTags', {
            templateUrl: "app/components/filtersTags/filtersTags.html",
            bindings: {

                /*
                 * Input class
                 */
                inputClass: '<'

            },
            controller: 'FiltersTagsController'
        });

})();