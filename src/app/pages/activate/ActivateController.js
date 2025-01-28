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
            .controller('ActivateController', ['$scope', '$state', 'rocketServices', 'restoUsersAPI', 'config', ActivateController]);

    function ActivateController($scope, $state, rocketServices, restoUsersAPI, config) {

        $scope.display = {
            header:config.header.display
        };

        /**
         * Go to map
         * 
         * @params {object} params
         */
        $scope.goToMap = function(params) {

            rocketServices.go('map', params || {}, {
                reload: true
            });

        };

        $scope.isLoading = true;
        $scope.isActivated = false;
        restoUsersAPI.activateUser($state.params.token)
        .then(
            (result) => {
                $scope.isLoading = false;
                if (result.status === 200) {
                    $scope.isActivated = true;
                    restoUsersAPI.setProfile(result);
                }
            }
        )
        ["catch"](
            (error) => {
                $scope.isLoading = false;
            }
        );
        
    }
    
})();
