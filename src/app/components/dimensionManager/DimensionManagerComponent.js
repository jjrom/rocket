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
        .controller('DimensionManagerComponent', [DimensionManagerComponent]);

    function DimensionManagerComponent() {

        var self = this;

        // Dimension sliders
        self.sliders = [];

        /*
         * Track changes
         */
        self.$onInit = function () {
            if (self.rocketMap) {
                self.rocketMap.on('propertychange', _propertyChange);
            }
        };

        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.on('propertychange', _propertyChange);
            }
        };
        
        self.$onChanges = function (changesObj) {
            if (changesObj.layer && changesObj.layer.currentValue) {
                _initDimensions();
            }
        };

        /**
         * Update WMTS dimension
         * 
         * @param {string} identifier
         * @param {integer} index
         * @param {boolean} updateLayer
         */
        self.updateDimension = function (identifier, index, updateLayer) {

            var params = {};
            var value = this.getDimensionValue(identifier, index);
            
            params[identifier] = value;

            var _rocket = self.layer.get('_rocket');
            for (var i = _rocket.layerCapability.Dimension.length; i--;) {
                if (_rocket.layerCapability.Dimension[i].Identifier === identifier) {
                    _rocket.layerCapability.Dimension[i].CurrentValue = value;
                    break;
                }
            }

            self.layer.set('_rocket', _rocket);
            
            if (updateLayer) {
                // Trigger propertychange
                if (self.rocketMap) {
                    self.rocketMap.propertyChange(self.layer, identifier, index);
                }
                self.layer.getSource().updateDimensions(params);
            }
            
        };

        /**
         * 
         * @param {*} identifier 
         * @param {*} index 
         */
        self.getDimensionValue = function (identifier, index) {
            for (var i = self.layer.get('_rocket').layerCapability.Dimension.length; i--;) {
                if (self.layer.get('_rocket').layerCapability.Dimension[i].Identifier === identifier) {
                    return self.layer.get('_rocket').layerCapability.Dimension[i].Value[index];
                }
            }
            return null;
        }

         /**
         * Initialize dimensions
         */
         function _initDimensions() {

            var dimensions = self.layer.get('_rocket').layerCapability && self.layer.get('_rocket').layerCapability.Dimension ? self.layer.get('_rocket').layerCapability.Dimension : null;
            if (dimensions) {
                var defaultIndex = 0;
                for (var i = dimensions.length; i--;) {
                    (function (dimension, self) {
                        for (var j = dimension.Value.length; j--;) {
                            if (dimension.Value[j] === dimension.Default) {
                                defaultIndex = j;
                                break;
                            }
                        }
                        var identifier = dimension.Identifier;
                        self.sliders[identifier] = {
                            default: defaultIndex,
                            options: {
                                floor: 0,
                                ceil: dimension.Value.length - 1,
                                step: 1,
                                showTicks: false,
                                noSwitching: true,
                                translate: function (value, sliderId, label) {
                                    return '';
                                    /*switch (label) {
                                      case 'model':
                                        return '';
                                      default:
                                        return self.getDimensionValue(identifier, value);
                                    }*/
                                },
                                onChange: function (sliderId, modelValue, highValue, pointerType) {
                                    self.updateDimension(identifier, modelValue, false);
                                },
                                onEnd: function (sliderId, modelValue, highValue, pointerType) {
                                    self.updateDimension(identifier, modelValue, true);
                                }

                            }
                        };
                    })(dimensions[i], self);
                }

            }

        }

        function _propertyChange(olLayer, properties) {
            if (olLayer.get('_rocket').id === self.layer.get('_rocket').id) {
                for (var propertyName in properties) {
                    if (self.sliders[propertyName]) {
                        self.sliders[propertyName].default = properties[propertyName];
                    }
                }
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('dimensionManager', {
            templateUrl: 'app/components/dimensionManager/dimensionManager.html',
            bindings: {

                /*
                 * olLayer
                 */
                layer: '<',

                rocketMap: '<'

            },
            controller: 'DimensionManagerComponent'
        });

})();