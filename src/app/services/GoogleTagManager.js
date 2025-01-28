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

    /* Services */

    angular.module('rocket')
            .factory('googleTagManager', ['$window', googleTagManager]);

    function googleTagManager($window) {

        var isInitialized = false;

        var service = {
            init:init,
            push:push
        };

        /**
         * Push data to google analytics
         * 
         */
        function push() {

            if ( !isInitialized ) {
                return;
            }
            
            try {
                
                // Push data dataLayer will trigger google analytics
                $window.dataLayer.push(arguments);
                
            } catch (e) {}
            
        };

        /**
         * Initialize google analytics script
         * 
         * @param {string} tag 
         * @param {Object} data
         */
        function init(tag, data) {

            if ( isInitialized ) {
                return;
            }

            var script = document.createElement('script');
            script.onload = function () {
                isInitialized = true;
                $window.dataLayer = $window.dataLayer || [];
                service.push('js', new Date());
                service.push('config', tag);
                if (data) {
                    service.push('event', data.event, data.options);
                }
            };
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + tag;
            document.head.appendChild(script);

        }

        return service;

    };

})();