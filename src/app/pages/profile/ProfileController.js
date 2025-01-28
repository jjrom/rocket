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
            .controller('ProfileController', ['$scope', '$location', 'rocketCache', 'config', ProfileController]);

    function ProfileController($scope, $location, rocketCache, config) {
        
        $scope.display = {
            header:config.header.display
        };
        
        /*
         * Active tab
         */
        $scope.activeTab = $location.search()['t'] || 'profile';

        /*
         * Get profile from cache
         */
        $scope.profile = rocketCache.get(rocketCache.PROFILE) || {};
        
        /**
         * Show tab
         * 
         * @param {string} tabName 
         */
        $scope.setActiveTab = function (tabName) {
            $scope.activeTab = tabName;
            $location.search('t', tabName);
        };

    }

})();