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
        .controller('OapipChangerController', ['rocketCache', 'config', OapipChangerController]);

    function OapipChangerController(rocketCache, config) {

        var self = this;

        /*
         * Pointers
         */
        self.watch = {
            endPoints: config.processesEndPoints || []
        };

        /**
         * Show picker
         * 
         * @param {boolean} bool
         * @param {Event} evt
         */
        self.showHideUrlPicker = function (bool, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            self.urlPickerIsOpen = bool;
        };

        /* 
         * Add endPoint
         *
         * @param {string} url
         */
        self.addEndPoint = function (url) {
            
            self.showHideUrlPicker(false);

            var addIt = true;
            for (var i = 0, ii = self.watch.endPoints.length; i <ii; i++) {
                if (self.watch.endPoints[i].url === url) {
                    addIt = false;
                    break;
                }
            }

            if (addIt) {
                config.processesEndPoints.unshift({
                    url:url
                });
                self.watch.endPoints = config.processesEndPoints;
                rocketCache.put(rocketCache.PROCESSES_ENDPOINTS, config.processesEndPoints);
            }

            if ( !self.endPoint || self.endPoint.url !== url) {
                self.endPoint = {
                    url:url
                }
                if (self.onChange) {
                    self.onChange({
                        endPoint: self.endPoint
                    });
                }
            }

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
                        self.endPoint = self.watch.endPoints[i + 1 < ii ? i + 1 : 0];
                    }
                    else {
                        self.endPoint = self.watch.endPoints[i - 1 >= 0 ? i - 1 : ii - 1];
                    }
                    break;
                }
            }
            
            if (self.onChange) {
                self.onChange({
                    endPoint: self.endPoint
                });
            }

        };


    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('oapipChanger', {
            templateUrl: "app/components/oapipChanger/oapipChanger.html",
            bindings: {
                endPoint: '<',
				onChange: '&',
            },
            controller: 'OapipChangerController'
        });

})();