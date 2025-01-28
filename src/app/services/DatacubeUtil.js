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
            .factory('datacubeUtil', ['config', datacubeUtil]);

    function datacubeUtil(config) {

        var service = {
            isAvailable:isAvailable,
            getBootstrap:getBootstrap
        };

        /**
         * Return true if datacube is available
         * 
         * @param {object} asset
         */
        function isAvailable()
        {
            return config && config.services && config.services.datacube ? true : false;
        };

        /**
         * Return datacube template bootstrap
         * Template should contains %KEYS% to be replaced
         * 
         * @param {object} params
         */
        function getBootstrap(params) 
        {

            params = params || {};
            
            var template = params.template || config.services.datacube.template;
            
            if ( !template ) {
                return null;
            }
    
            return template.replace(/%(\w*)%/g, function( m, key ) {
                return params.hasOwnProperty( key ) ? params[key] : "";
            });

        };

        return service;

    };

})();