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
        .controller('HeatmapManagerComponent', [HeatmapManagerComponent]);

    function HeatmapManagerComponent() {

        var self = this;

         self.watch = {
			blur:1,
            radius:5
        };

        /**
         * Update blur for heatmap
         */
        self.onUpdateBlur = function() {
            if (self.layer) {
                self.layer.setBlur(parseInt(self.watch.blur, 10));
            }

            if (self.onChange) {
                self.onChange({
                    blur:self.watch.blur
                });
            }
        };

        /**
         * Update radius for heatmap
         */
        self.onUpdateRadius = function() {

            if (self.layer) {
                self.layer.setRadius(parseInt(self.watch.radius, 10));
            }

            if (self.onChange) {
                self.onChange({
                    radius:self.watch.radius
                });
            }

        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('heatmapManager', {
            templateUrl: 'app/components/heatmapManager/heatmapManager.html',
            bindings: {

                /*
                 * olLayer
                 */
                layer: '<',

                onChange: '&'

            },
            controller: 'HeatmapManagerComponent'
        });

})();