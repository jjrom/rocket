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
        .controller('SearchTagsController', ['rocketServices', SearchTagsController]);

    function SearchTagsController(rocketServices) {

        var self = this;

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.search && changesObj.search.currentValue) {
                self.hashtags = _cleverSplit(self.search.q);
            }
        };

        /**
         * Get relation from string
         * 
         * @param {string} str
         * @return string 
         */
        self.getRelation = function (str) {
            if ( !str ) {
                return null;
            }
            switch(str.substr(-1)) {
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
         * Split a string against multiple spaces
         * 
         * @param {string} str
         * @return array 
         */
        function _cleverSplit(str) {
            if ( !str ) {
                return null;
            }
            return str.trim().split(/\s+/);
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('searchTags', {
            templateUrl: "app/components/searchTags/searchTags.html",
            bindings: {

                /*
                 * Search object
                 */
                search: '<'
                
            },
            controller: 'SearchTagsController'
        });

})();
