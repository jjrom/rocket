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
        .controller('CatalogChangerController', ['rocketServices', 'rocketSearchService', 'rocketHolder', 'config', CatalogChangerController]);

    function CatalogChangerController(rocketServices, rocketSearchService, rocketHolder, config) {

        var self = this;

        /*
         * Pointers
         */
        self.watch = {
            defaultCatalogUrl:config.defaultCatalogUrl,
            endPoints: rocketSearchService.endPoints
        };

        /*
         * Init event
         */
        self.$onInit = function () {
            rocketSearchService.on('addendpoint', _addEndPoint);
            rocketSearchService.on('removeendpoint', _removeEndPoint);
            self.setEndPoint(self.watch.endPoints && self.watch.endPoints.length > 0 ? self.watch.endPoints[0] : null);
        };

        /*
         * Destroy event
         */
        self.$onDestroy = function () {
            rocketSearchService.un('addendpoint', _addEndPoint);
            rocketSearchService.un('removeendpoint', _removeEndPoint);
        };

        /**
         * Show stac picker
         * 
         * @param {boolean} bool
         * @param {Event} evt
         */
        self.openStacIndex = function (bool, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            self.stacIndexIsOpen = bool;
        };

        /* 
         * Add endPoint
         *
         * @param {string} url 
         * @param {boolean} append
         */
        self.addEndPoint = function (url, append) {

            self.openStacIndex(false);

            // If append, add endPoint to existing endPoints - otherwise clear all
            if ( !append ) {
                rocketSearchService.clear();
            }
            
            rocketSearchService.addEndPoint({
                url: url.trim(),
                options: {
                    isRemovable: true
                }
            }, function (endPoint) {

                if (!endPoint || !endPoint.url) {
                    return rocketServices.error(rocketServices.translate('change.endpoint.error'));
                }

                if (self.clearMapContext) {
                    rocketHolder.mapContext = null;
                }

            });

        };

        /**
         * Select the next or previous endPoint in the list
         *
         * @param {string} direction
         */
         self.rotateEndPoint = function (direction) {

            var ii = self.watch.endPoints.length;

            for (var i = 0; i < ii; i++) {
                if (self.endPoint.url === self.watch.endPoints[i].url) {
                    if (direction === 'next') {
                        self.setEndPoint(self.watch.endPoints[i + 1 < ii ? i + 1 : 0]);
                    }
                    else {
                        self.setEndPoint(self.watch.endPoints[i - 1 >= 0 ? i - 1 : ii - 1]);
                    }
                    break;
                }
            }

        };

        /**
         * Set active endPoint
         * 
         * @param {Object} endPoint 
         */
        self.setEndPoint = function (endPoint) {
            self.endPoint = endPoint;
        };

        /**
         * Called when a search endPoint is added
         * 
         * @param {object} endPoint 
         */
        function _addEndPoint(endPoint) {
            self.setEndPoint(endPoint);
            self.watch.endPoints = rocketSearchService.endPoints;
        }

        /**
         * Called when endPoints is updated
         * 
         * @param {array} endPoints 
         */
         function _removeEndPoint(url) {
            self.watch.endPoints = rocketSearchService.endPoints;
        }


    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('catalogChanger', {
            templateUrl: "app/components/catalogChanger/catalogChanger.html",
            bindings: {

                /**
                 * Triggered on rotate endPoint
                 */
                onRotate: '&',

                /**
                 * True to clear mapContext on change
                 */
                clearMapContext: '<'

            },
            controller: 'CatalogChangerController'
        });

})();