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
        .controller('BackgroundsManagerController', [BackgroundsManagerController]);

    function BackgroundsManagerController() {

        var self = this;

        self.watch = {
            layers: {}
        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {

            if (changesObj.rocketMap && changesObj.rocketMap.currentValue) {
                if (self.rocketMap) {

                    // Initialize layers
                    self.watch.layers = self.rocketMap.getLayers();
                    
                    // Register events
                    self.rocketMap.on('addlayer', _mapEventaddlayer);
                    self.rocketMap.on('removelayer', _mapEventremovelayer);
                }
            }
            
        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.un('addlayer', _mapEventaddlayer);
                self.rocketMap.un('removelayer', _mapEventremovelayer);
            }
        };

        /**
         * Change background
         * 
         * @param {string} activeBackground
         */
        self.setBackground = function (activeBackground) {
            if (activeBackground) {
                self.watch.layers.activeBackground = activeBackground;
            }
            
            if (self.watch.layers.activeBackground && self.watch.layers.activeBackground.get('_rocket')) {
                self.rocketMap.setActiveBackground(self.watch.layers.activeBackground.get('_rocket').id);
            }
        }
        
        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            self.watch.layers = self.rocketMap.getLayers();
        }

        /**
         * Map event : removelayer
         * 
         * @param {string} layerId 
         */
        function _mapEventremovelayer(layerId) {
            self.watch.layers = self.rocketMap.getLayers();
        }

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('backgroundsManager', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/backgroundsManager/backgroundsManager.html',
                    circles: 'app/components/backgroundsManager/backgroundsManagerCircles.html',
                    innerMap: 'app/components/backgroundsManager/backgroundsManagerInnerMap.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Template
                 */
                template: '@',

                /*
                 * Input class
                 */
                ulInputClass: '<',

                /*
                 * rocket Map
                 */
                rocketMap: '<'

            },
            controller: 'BackgroundsManagerController'
        });

})();