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

    /* Search Controller */

    angular.module('rocket')
            .controller('licenseController', ['$scope', LicenseController]);

    function LicenseController($scope) {
        
        /*
         * Return license url get from parent controller
         */
        $scope.getLicenseUrl = function() {
            return $scope.ngDialogData['licenseUrl'];
        };
        
    };
    
})();