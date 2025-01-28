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
        .controller('LayerManagerController', [LayerManagerController]);

    function LayerManagerController() {

        var self = this;

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.layer && changesObj.layer.currentValue) {}
        };

        /**
         * Trigger info button
         * 
         * @param {olLayer} olLayer 
         * @param {Event} evt 
         */
        self.triggerInfo = function(olLayer, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (self.onTriggerInfo) {
                self.onTriggerInfo({
                    layerId:olLayer.get('_rocket').id || null
                });
            }

        };

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('layerManager', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/layerManager/layerManager.html',
                    explore: 'app/components/layerManager/layerManagerExplore.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Parent call on trigger ingo button
                 */
                onTriggerInfo: '&',

                /*
                 * True to show info button
                 */
                infoButton: '<',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * Layer
                 */
                layer: '<'

            },
            controller: 'LayerManagerController'
        });

})();