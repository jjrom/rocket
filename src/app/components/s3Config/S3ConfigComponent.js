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
        .controller('S3ConfigController', ['rocketServices', 's3Util', S3ConfigController]);

    function S3ConfigController(rocketServices, s3Util) {

        var self = this;

        self.$onInit = function() {
            self.s3Config = s3Util.getConfig();
            rocketServices.focus('accessKeyId');
        }

        self.updateConfig = function() {
            s3Util.storeConfig(self.s3Config);
            rocketServices.success('s3.config.updated');
            if (self.onClose) {
                self.onClose();
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('s3Config', {
            templateUrl: 'app/components/s3Config/s3Config.html',
            bindings: {

                // Called closed
                onClose: '&'

            },
            controller: 'S3ConfigController'
        });

})();
