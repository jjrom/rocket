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
        .controller('ProfileUpdaterController', ['rocketServices', 'restoUsersAPI', ProfileUpdaterController]);

    function ProfileUpdaterController(rocketServices, restoUsersAPI) {

        var self = this;
        
        self.watch = {
            isLoading: false
        };

        /*
         * Countries
         */
        self.countries = rocketServices.countries;

        /**
         * Update profile info (except password)
         */
        self.updateProfile = function () {
            self.watch.isLoading = true;
            restoUsersAPI.updateProfile(self.profile,
                function (result) {
                    self.watch.isLoading = false;
                    rocketServices.success('profile.updated');
                },
                function (result) {
                    self.watch.isLoading = false;
                    rocketServices.error(result.ErrorMessage);
                });
        };

        /**
         * Update password
         */
        self.updatePassword = function () {

            if (self.password !== self.password2) {
                return rocketServices.error('register.password.differs');
            }
            self.watch.isLoading = true;
            restoUsersAPI.updatePassword({
                id:self.profile.id,
                password:self.password
            },
                function (result) {
                    self.watch.isLoading = false;
                    rocketServices.success('profile.updated');
                },
                function (result) {
                    self.watch.isLoading = false;
                    rocketServices.error(result.ErrorMessage);
                });
        };

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('profileUpdater', {
            templateUrl: "app/components/profileUpdater/profileUpdater.html",
            bindings: {

                /*
                 * Input profile
                 */
                profile: '<'

            },
            controller: 'ProfileUpdaterController'
        });

})();