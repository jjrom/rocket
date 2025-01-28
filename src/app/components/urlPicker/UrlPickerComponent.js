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
        .controller('UrlPickerController', [UrlPickerController]);

    function UrlPickerController() {}

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('urlPicker', {
            templateUrl: 'app/components/urlPicker/urlPicker.html',
            bindings: {

                // Called when url is changed
                onSelect: '&',

                // Called closed
                onClose: '&',

                // Default catalog url
                defaultUrl: '<'

            },
            controller: 'UrlPickerController'
        });

})();
