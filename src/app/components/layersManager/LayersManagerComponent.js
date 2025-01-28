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
        .controller('LayersManagerController', [ '$timeout', 'rocketServices', 'rocketMagicReader', 'config', LayersManagerController]);

    function LayersManagerController($timeout, rocketServices, rocketMagicReader, config) {

        var self = this;

        self.watch = {

            /*
             * List layers
             */
            layers: {},

            /* 
             * Used to add layer url from input
             */
            layerUrl:null,

            /*
             * True to display catalogs in layers list
             */
            displayCatalogsInLayers: config.display.catalogsInLayers,

            /*
             * True to display basemaps in layers list
             */
            displayBasemapsInLayers: !config.display.basemapsInMap,

            /*
             * True to display projection switcher
             */
            displayProjectionSwitcher: config.display.projectionSwitcher,

            /*
             * Track hilited layer i.e. the one with lateral panel
             */
            hilitedLayerId: null

        };

        /* 
         * Register magicReader on init
         */
        self.$onInit = function() {
            rocketMagicReader.on('uploadstart', _uploadStart);
            rocketServices.focus('add_layer_url');
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
            rocketMagicReader.un('uploadstart', _uploadStart);
        };

        /*
         * Hilite / unhilite layerId
         * [IMPORTANT] layedId is an url
         * 
         * @param {string} layerId 
         */
        self.setHilitedLayerId = function (layerId) {
            self.watch.hilitedLayerId = self.watch.hilitedLayerId === layerId ? null : layerId;
        };

        /**
         * Trigger by input 
         *
         * @params {Event} evt 
         */
        self.addLayerUrl = function (evt) {

            if (self.watch.layerUrl) {
                rocketMagicReader.trigger('drop', {
                    url:self.watch.layerUrl
                });
                self.watch.layerUrl = null;
            }
        };

        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            $timeout(function () {
                self.watch.layers = self.rocketMap.getLayers();
            });
        }

        /**
         * Map event : removelayer
         * 
         * @param {string} layerId 
         */
        function _mapEventremovelayer(layerId) {
            $timeout(function () {
                self.watch.layers = self.rocketMap.getLayers();
            });
        }

        /**
         * Called when layer upload start/stop
         * @param {boolean} bool 
         */
        function _uploadStart(bool) {
            self.uploadInProgress = bool;
        }

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('layersManager', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/layersManager/layersManagerDefault.html',
                    inMap: 'app/components/layersManager/layersManagerInMap.html',
                    explore: 'app/components/layersManager/layersManagerExplore.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /* 
                 * HTML template - either 'default' or 'panel'.
                 */
                template: '@'

            },
            controller: 'LayersManagerController'
        });

})();