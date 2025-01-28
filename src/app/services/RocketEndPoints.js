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
            .factory('rocketEndPoints', ['config', rocketEndPoints]);

    function rocketEndPoints(config) {

        /*
         * Initial endPoints
         */
        var _endPoints = config.endPoints;
       
        /**
         * Add endPoint to list of endpoints
         * 
         * @param {object} endPoint
         * @return {array}
         */
        function add(endPoint) {
            
            // Add endPoint to list of endPoints
            var shouldAdd = true;
            for (var i = _endPoints.length; i--;) {

                // endPoint exists - update data
                if (_endPoints[i].url === endPoint.url) {
                    shouldAdd = false;
                    /* [TODO] Remove ?
                    _endPoints[i].title = endPoint.title;
                    */
                    _endPoints[i].data = endPoint.data;
                    _endPoints[i].defaultSearchLink = endPoint.defaultSearchLink;
                    break;
                }
            }

            if (shouldAdd) {
                _endPoints.push(endPoint);
            }

            return _endPoints;
                         
        };

        /**
         * Return endPoint from url
         * 
         * @param {string} url
         */
        function get(url) {

            if ( !url ) {
                return null;
            }

            for (var i = _endPoints.length; i--;) {
                if ( _endPoints[i].url === url ) {
                    return _endPoints[i];
                }
            }
            
            return null;
        }

        /**
         * Remove endPoint from list of endpoints
         * 
         * @param {string} url
         * @return {array}
         */
        function remove(url) {
            for (var i = 0, ii = _endPoints.length; i < ii; i++) {
                if ( _endPoints[i].url === url ) {
                    _endPoints.splice(i, 1);
                    break;
                }
            }
            return _endPoints;
        };

        /**
         * Return all endPoints
         */
        function list() {
            return _endPoints;
        }

        return {
            add:add,
            get:get,
            remove:remove,
            list:list
        };

    }

})();