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
        .controller('BrandsController', ['$window', 'config', BrandsController]);

    function BrandsController($window, config) {

        var self = this;

        /*
         * Initialize
         */
        self.$onInit = function () {
            self.brands = self.target ? _getBrands(self.target.charAt(0).toUpperCase() + self.target.slice(1)) : [];
        };

        /**
         * Open external link
         * 
         * @param {string} url
         */
        self.openExternalLink = function (url) {
            if (url) {
                $window.open(url, '_blank');
            }
        };

        /**
         * Get brands
         * 
         * @param {string} target
         * @returns array
         */
        function _getBrands(target) {
            
            var brands = [];

            if (!config.display['brandsIn' + target] || !config.brands || config.brands.length == 0) {
                return null;
            }

            for (var i = 0, ii = config.brands.length; i < ii; i++) {
                brands.push({
                    title: config.brands[i].title,
                    icon: config.brands[i].icon,
                    url: config.brands[i].url,
                    class: 'white',
                    img: config.brands[i].img,
                    imgSmall: config.brands[i].imgSmall || config.brands[i].img
                });
            }

            return brands;

        }
    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('brands', {
            templateUrl: "app/components/brands/brands.html",
            bindings: {

                // Where is the brands display
                target: '<'

            },
            controller: 'BrandsController'
        });

})();