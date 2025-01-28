/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function() {

    'use strict';

    /* 
     * Factory to store data between controllers
     */
    angular.module('rocket')
            .factory('rocketHolder', [rocketHolder]);
    function rocketHolder() {

        return {
           
            /*
             * Set to true when endPoints are loaded
             */
            endPointsAreLoaded: false,

            /*
             * Hints
             */
            hints: {},
            
            /*
             * Associative array of all features - key is featureId
             */
            features:{},
 
            /* 
             * Pages/Component states
             * Associative array with key = page/component name in camelCase
             * (e.g. mapBottomContainer)
             */
            states: {}
            
        }
    };

})();