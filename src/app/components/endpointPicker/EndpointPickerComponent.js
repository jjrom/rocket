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
        .controller('EndPointPickerController', ['rocketSearchService', EndPointPickerController]);

    function EndPointPickerController(rocketSearchService) {

        var self = this;

        self.watch = {
            stacIndexIsOpen:false,
            isVisible:false
        }

        /**
         * Initialize endpoint
         */
        self.$onInit = function () {
            self.endPoints = rocketSearchService.endPoints;
        };
        
        /**
         * Show/hide picker 
         * 
         * @param {boolean} bool 
         */
        self.setVisible = function(bool) {
            self.watch.isVisible = bool;
        };

        self.openStacIndex = function(bool) {
            self.watch.stacIndexIsOpen = bool;
        };

        /**
         * Change endPoint
         * 
         * @param {string} url 
         */
        self.changeEndPoint = function(url) {
            
            self.openStacIndex(false);
            
            if (self.onChange) {
                self.onChange({
                    url:url
                });
            }
            
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('endPointPicker', {
            templateUrl: 'app/components/endPointPicker/endPointPicker.html',
            bindings: {

                // True to add a trigger button
                triggerButton:'<',

                // Form input class
                inputClass:'<',

                // Called when url is changed
                onChange: '&'

            },
            controller: 'EndPointPickerController'
        });

})();
