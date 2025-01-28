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
        .controller('PDSSPController', ['$scope', 'rocketSearchService', 'rocketServices', 'rocketHolder', 'config', PDSSPController]);

    function PDSSPController($scope, rocketSearchService, rocketServices, rocketHolder, config) {

        $scope.targets = config.pdssp.targets || [];

        $scope.display = {
            header:config.header.display
        };
        
        /**
         * Scroll to div
         * 
         * @param {string} id 
         */
        $scope.scrollTo = function(id) {
            var element = document.getElementById(id);
            element.scrollIntoView({
                behavior: 'smooth'
            });
        }

        /**
         * Go to target map
         * 
         * @params {object} params
         */
        $scope.goToTargetMap = function(url) {

            $scope.endPointIsLoading = true;
            rocketSearchService.clear();
            rocketSearchService.addEndPoint({
                url: url,
                options: {
                    isRemovable: false
                }
            }, function (endPoint) {

                // Important clear the mapContext
                rocketHolder.mapContext = null;
                rocketHolder.states = {};
                $scope.endPointIsLoading = false;
                rocketServices.go('map', {}, {
                    reload: true
                });
            }, false);

        };

    }

})();