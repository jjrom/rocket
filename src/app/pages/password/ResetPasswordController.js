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
            .controller('ResetPasswordController', ['$scope', '$state', 'rocketServices', 'restoUsersAPI', 'config', ResetPasswordController]);

    function ResetPasswordController($scope, $state, rocketServices, restoUsersAPI, config) {
        
        $scope.registration = {};

        $scope.display = {
            header:config.header.display
        };

        /*
         * Focus on username
         */
        rocketServices.focus('password');

        $scope.resetPassword = function () {

            if ($scope.registration.password !== $scope.registration.password2) {
                return rocketServices.error('register.password.differs');
            }

            $scope.isLoading = true;
            restoUsersAPI.resetPassword({
                token: $state.params.token,
                password: $scope.registration.password
            }).then(
                (result) => {
                    $scope.isLoading = false;
                    if (result.status === 200) {
                        rocketServices.success(rocketServices.translate('resetPassword.success'));
                    }
                    else {
                        rocketServices.error(rocketServices.translate('resetPassword.error'));
                    }
                    
                }
            )
            ["catch"](
                (error) => {
                    $scope.isLoading = false;
                    rocketServices.error(rocketServices.translate('resetPassword.error'));
                }
            );

        };

        
    }
    
})();
