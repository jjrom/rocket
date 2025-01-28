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
            .factory('restoCartAPI', ['$http', 'rocketServices', 'rocketAuthService', restoCartAPI]);

    function restoCartAPI($http, rocketServices, rocketAuthService) {

        var api = {
            add: add,
            get: get,
            remove:remove,
            placeOrder:placeOrder,
            getOrder:getOrder
        };
        
        return api;
        
        /////////
        
        /*
         * Add item to the user cart
         * 
         * @param {array} params
         * @param {function} callback
         * @param {function} error
         */
        function add(params, callback, error) {

            var url = rocketAuthService.getAuthEndPoint();

            $http({
                url: rocketServices.concatUrl(url, '/user/cart') + (params.clear ? '?_clear=1' : ''),
                method: 'POST',
                data: params.items,
                async:params.hasOwnProperty('async') ? params.async : true,
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function (result) {
                    callback(result);
                },
                function (result) {
                    error(result);
                }
            );
        };

        /**
         * Remove item from the user cart
         * 
         * @param {array} params
         *          {string} : featureid
         * @param {function} callback
         * @param {function} error
         */
        function remove(params, callback, error) {

            var url = rocketAuthService.getAuthEndPoint();

            $http({
                url: rocketServices.concatUrl(url, '/user/cart/' + params.featureid),
                method: 'DELETE',
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function (result) {
                    callback(result);
                },
                function (result) {
                    error(result);
                }
            );
        };
        
        /**
         * Get cart content
         * 
         * @param {Function} callback
         * @param {Function} error
         */
        function get(callback, error) {

            var url = rocketAuthService.getAuthEndPoint();

            $http({
                url: rocketServices.concatUrl(url, '/user/cart'),
                method: 'GET',
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function (result) {
                    callback(result);
                },
                function (result) {
                    error(result);
                }
            );
        };
        
        /*
         * Place order
         * 
         * @param {Object} params
         * @param {Function} success
         * @param {Function} error
         */
        function placeOrder(params, success, error) {

            var url = rocketAuthService.getAuthEndPoint();

            $http({
                url: rocketServices.concatUrl(url, '/user/orders') + (params.fromCart ? '?_fromCart=1' : ''),
                method: 'POST',
                dataType:'json',
                data: params.items || null,
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function(result) {
                    success(result);
                },
                function(result) {
                    error(result);
                }
            );
        };
        
        /*
         * Get order
         * 
         * @param {Object} params
         * @param {Function} success
         * @param {Function} error
         */
        function getOrder(params, callback, error) {

            var url = rocketAuthService.getAuthEndPoint();
            $http({
                url: rocketServices.concatUrl(url, '/user/orders/' + params.orderId),
                method: 'GET',
                contentType: 'application/json',
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true
            }).then(
                function(result) {
                    callback(result);
                },
                function(result) {
                    error(result);
                }
            );
        }

    };

})();
