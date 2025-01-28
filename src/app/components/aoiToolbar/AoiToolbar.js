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
        .controller('AoiToolbarController', [AoiToolbarController]);

    function AoiToolbarController() {

        var self = this;

        /**
         * Reference to aoiLayer
         */
        self.watch = {
            aoiLayer:null
        };

        /**
         * Initialize
         */
        self.$onInit = function() {
            _setAOILayer();
            if (self.rocketMap) {
                self.rocketMap.on('addlayer', _setAOILayer);
                self.rocketMap.on('removelayer', _setAOILayer);
            }
        }

        /**
         * Destroy
         */
        self.$onDestroy = function() {
            if (self.rocketMap) {
                self.rocketMap.un('addlayer', _setAOILayer);
                self.rocketMap.un('removelayer', _setAOILayer);
            }
        }

        /**
         * Trigger a false rocketMap click in the center of the map view
         * 
         * @param {Event} evt
         */
        self.triggerClick = function(evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (self.rocketMap) {
                var size = self.rocketMap.map.getSize();
                var pixel = [
                    size[0] / 2,
                    size[1] / 2
                ];
                self.rocketMap.triggerEvent('click', {
                    pixel:pixel,
                    coordinate:self.rocketMap.map.getCoordinateFromPixel(pixel)
                });
            }

        }

        /**
         * Set AOILayer
         */
        function _setAOILayer() {
            if (self.rocketMap) {
                self.watch.aoiLayer = self.rocketMap.getLayerByRocketId(self.rocketMap.AOI_LAYER_ID);
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('aoiToolbar', {
            templateUrl: "app/components/aoiToolbar/aoiToolbar.html",
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<'

            },
            controller: 'AoiToolbarController'
        });

})();