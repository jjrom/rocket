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
            .controller('ForgotPasswordController', ['$scope', 'rocketServices', 'restoUsersAPI', 'config', ForgotPasswordController]);

    function ForgotPasswordController($scope, rocketServices, restoUsersAPI, config) {

        /*
         * Focus on email
         */
        rocketServices.focus('email');

        $scope.display = {
            header:config.header.display
        };

        $scope.forgotPassword = function () {
            $scope.isLoading = true;
            restoUsersAPI.forgotPassword($scope.email).then(
                (result) => {
                    $scope.isLoading = false;
                    if (result.status === 200) {
                        rocketServices.success(rocketServices.translate('forgotPassword.success'));
                    }
                    else {
                        rocketServices.error(rocketServices.translate('forgotPassword.error'));
                    }
                }
            )
            ["catch"](
                (error) => {
                    $scope.isLoading = false;
                    rocketServices.error(rocketServices.translate('forgotPassword.error'));
                }
            );

        };
        
    }
    
})();
