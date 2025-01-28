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
        .controller('PlasticInfoComponent', ['$timeout', PlasticInfoComponent]);

    function PlasticInfoComponent($timeout) {

        var self = this;

        self.watch = {

            /*
             * Hilite feature
             */
            feature: null,

            pixel:null

        };

        /*
         * Initialization
         */
        self.$onInit = function () {
            if (self.rocketMap) {
                self.rocketMap.on('hoverfeature', _mapEventHoverFeature);
            }
        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.clear();
                self.rocketMap.un('hoverfeature', _mapEventHoverFeature);
            }
        };

        /**
         * Round value with precision digit
         * @param {float} value 
         * @param {integer} precision 
         * @returns integer
         */
        self.round = function (value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(value * multiplier) / multiplier;
        }

        /**
		 * Map event : selectedfeatures
		 * 
		 * After a features selection
		 *  - Change chartAsset if already set
		 * 
		 * @param {Object} obj 
		 */
		function _mapEventHoverFeature(obj) {
            $timeout(function(){
                self.watch.feature = obj.feature ? window.rocketmap.Util.featuresToGeoJSON([obj.feature], self.rocketMap ? self.rocketMap.getProjectionCode() : _defaultProjCode)[0] : null;
                self.watch.pixel = obj.pixel;
            });
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('plasticInfo', {
            templateUrl: "app/addons/plastic/plasticInfo/plasticInfo.html",
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<'
                
            },
            controller: 'PlasticInfoComponent'
        });

})();

