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
        .controller('StacIndexPickerController', ['restoAPI', StacIndexPickerController]);

    function StacIndexPickerController(restoAPI) {

        var self = this;

        self.watch = {
            isLoading: true
        };

        /*
         * Initialize endpoint
         */
        self.$onInit = function () {

            restoAPI.getResource('https://stacindex.org/api/catalogs')
                .then(
                    (result) => {
                        if (result.status === 200) {
                            self.catalogs = result.data;
                        }
                        self.watch.isLoading = false;
                    }
                );
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('stacIndexPicker', {
            templateUrl: 'app/components/stacIndexPicker/stacIndexPicker.html',
            bindings: {

                // Called when url is changed
                onSelect: '&',

                // Called closed
                onClose: '&',

                // Default catalog url
                defaultCatalogUrl: '<'

            },
            controller: 'StacIndexPickerController'
        });

})();
