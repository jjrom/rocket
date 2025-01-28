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
        .controller('HintController', ['rocketHolder', 'config', HintController]);

    function HintController(rocketHolder, config) {

        var self = this;
        
        self.watch = {
            displayHint: false
        };

        /*
         * On init check if hint should be displayed or not
         */
        self.$onInit = function () {

            // No hint in config or message is empty => no hint
            if ( !config.display.hint || !self.message || self.message === '' ) {
                self.watch.displayHint = false;
            }
            else {
                self.watch.displayHint = ! (rocketHolder.hints && rocketHolder.hints[self.message]);
            }

        };

        /**
         * Clicking on gotIt to hide hint
         * 
         * @param {Event} evt 
         */
        self.gotIt = function(evt) {

            if (evt) {
                evt.stopPropagation();
            }

            self.watch.displayHint = false;
            rocketHolder.hints[self.message] = true;

        }

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('hint', {
            templateUrl: "app/components/hint/hint.html",
            bindings: {

                // Message displayed
                message: '<'

            },
            controller: 'HintController'
        });

})();