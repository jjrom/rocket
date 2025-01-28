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
        .controller('ProfileManagerController', ['rocketServices', 'rocketAuthService', 'rocketCache', 'config', ProfileManagerController]);

    function ProfileManagerController(rocketServices, rocketAuthService, rocketCache, config) {

        var self = this;

        self.config = {
            display:config.display,
            processesEndPoints:config.processesEndPoints
        };
        
        /*
         * Register event
         */
        self.$onInit = function () {
            var cart = rocketCache.get(rocketCache.CART) || {};
            self.cartSize = (cart.items || []).length;
            var jobs = rocketCache.get(rocketCache.JOBS) || [];
            self.jobsSize = jobs.length;
            rocketCache.on('updatecache', _updateCache);
        };

        /*
         * Destroy event
         */
        self.$onDestroy = function () {
            rocketCache.un('updatecache', _updateCache);
        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.activeTab && changesObj.activeTab.currentValue) {
                self.setActiveTab(changesObj.activeTab.currentValue);
            }
        };


        /**
         * Signout user
         */
        self.signOut = function() {
            rocketAuthService.disconnect(function() {
                self.onClose();
            });
        };

        /**
         * Go profile
         */
        self.goProfile = function() {
            self.onClose();
            rocketServices.go('profile', {});
        };

        /**
         * Show tab
         * 
         * @param {string} tabName 
         */
        self.setActiveTab = function (tabName) {
            self.activeTab = tabName;
        };

        /**
         * Called when cache is updated
         * 
         * @param {object} obj 
         */
        function _updateCache(obj) {
            if (obj && obj.key === rocketCache.CART) {
                self.cartSize = (obj.value.items || []).length;
            }
            else if (obj && obj.key === rocketCache.JOBS) {
                self.jobsSize = (obj.value || []).length;
            }
            else if (obj && obj.key === rocketCache.PROCESSES_ENDPOINTS) {
                self.watch.processesEndPoints = obj.value;
            }
        }

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('profileManager', {
            templateUrl: "app/components/profileManager/profileManager.html",
            bindings: {

                /*
                 * Called when closed
                 */
                onClose: '&',

                /*
                 * Input profile
                 */
                profile: '<',

                /*
                 * Active tab
                 */
                activeTab: '<',

                /*
                 * Reference to rocketMap
                 */
                rocketMap: '<'

            },
            controller: 'ProfileManagerController'
        });

})();