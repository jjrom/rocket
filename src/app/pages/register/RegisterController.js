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
        .controller('RegisterController', ['$scope', 'rocketServices', 'restoUsersAPI', 'config', RegisterController]);

    function RegisterController($scope, rocketServices, restoUsersAPI, config) {

        $scope.display = {
            header:config.header.display
        };

        $scope.countries = rocketServices.countries;

        $scope.registration = {};
        $scope.signup = function () {

            if ($scope.registration.password !== $scope.registration.password2) {
                return rocketServices.error('register.password.differs');
            }
            $scope.isLoading = true;

            restoUsersAPI.signup($scope.registration)
            .then(
                (result) => {
                    return _processSignUp(result);
                }
            ).finally(
                () => {
                    $scope.isLoading = false;
                }
            )
            ["catch"](function (result) {
                return _processSignUp(result);
            });
        };

        /*
         * Focus on username
         */
        rocketServices.focus('emailfield');

        /**
         * Display message from result
         * 
         * @param {object} result 
         */
        function _processSignUp(result) {
            switch (result.status) {
                case 200:
                    rocketServices.success(rocketServices.translate('register.success', [$scope.registration.email]));
                    rocketServices.go('map', null, {
                        reload: true
                    });
                    break;

                case 409:
                    rocketServices.error(rocketServices.translate('register.account.exist', [$scope.registration.email]));
                    break;
                
                case 412:
                    rocketServices.error(rocketServices.translate('register.account.notactivated', [$scope.registration.email]));
                    break;

                default:
                    rocketServices.error(result.data.ErrorMessage);
            }
        }

    }
})();
