/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function() {

    'use strict';

    /* Services */

    angular.module('rocket')
            .factory('rocketCart', ['restoCartAPI', 'rocketCache', 'rocketServices', rocketCart]);

    function rocketCart(restoCartAPI, rocketCache, rocketServices) {

        var cart = {
            add: add,
            clear: clear,
            checkout: checkout,
            getContent: getContent,
            isInCart:isInCart,
            remove: remove,
            pushToServer:pushToServer,
            init:init
        };
        
        /*
         * Cookie/LocalStorage key prefix
         */
        var _items = [],
            _params = {
                synchronize:false
            };
    
        /**
         * Synchronize cart with local storage
         */
        function init() {
            var content = rocketCache.get(rocketCache.CART);
            _items = content ? content.items : [];
        }
        
        /**
         * Push cart to server
         * 
         * @param {Function} callback
         */
        function pushToServer(callback) {
            
            restoCartAPI.add({
                items: _items,
                clear:true
            },
            function (result) {
                callback(result);
            },
            function (result) {
                callback(result);
            });
            
        };

        /**
         * Return true is feature is in cart
         * False otherwise
         * 
         * @param {string} featureid
         * @returns {boolean}
         */
        function isInCart(featureid) {
            
            /*
             * Remove item from service cart content
             */
            for (var i = _items.length; i--;) {
                if (_items[i].id === featureid) {
                    return true;
                }
            }
            
            return false;
            
        };
        
        /*
         * Get cart content
         * 
         * @returns {Array|Object}
         */
        function getContent() {
            return {
                items:_items
            };
        };
        
        /*
         * Clear local cart
         */
        function clear() {
            rocketCache.put(rocketCache.CART, null);
            _items = [];
        };

        /**
         * Add feature to cart
         * 
         * @param {type} feature
         * @param {type} success
         * @param {type} error
         * @returns {undefined}
         */
        function add(feature, success, error) {
            
            /*
             * Valid feature needs at least an id and a properties property
             *
            var simpleFeature = simplify(feature);
            if (!simpleFeature) {
                error();
            }
            */
            var i, ii;
            
            /*
             * Cart already contains this item
             */
            for (i = 0, ii = _items.length; i < ii; i++) {
                if (_items[i].id === feature.id) {
                    success();
                    return;
                }
            }
            
            /*
             * Add item to service cart content
             */
            _items.push(feature);
            
            /*
             * Store to rocket storage
             */
            rocketCache.put(rocketCache.CART, {
                items:_items
            });
            
            /*
             * Callback function
             */
            success();

        };

        /*
         * Remove feature from cart
         * 
         * @param {string or array} featureids
         * @param {callback} success
         * @returns {undefined}
         */
        function remove(featureids, success) {
            
            if (!(featureids instanceof Array)) {
                featureids = [featureids];
            }

            
            /*
             * Remove item from service cart content
             */
            for (var j = 0, jj = featureids.length; j < jj; j++) {
                for (var i = 0, ii = _items.length; i < ii; i++) {
                    if (_items[i].id === featureids[j]) {
                        _items.splice(i, 1);
                        break;
                    }
                }
            }
            
            /*
             * Update storage
             */
            rocketCache.put(rocketCache.CART, {
                items:_items
            });
            
            /*
             * Callback function
             */
            if (typeof success === 'function') {
                success();
            }
        };
        
        /**
         * Checkout cart
         * 
         * @param {Function} callback
         * @param {Function} error
         */
        function checkout(callback, error) {
            
            /*
             * Post order - then return metalink url if successful
             */
            restoCartAPI.placeOrder({
                fromCart:false,
                items:getContent().items
            },
            function(result) {
                
                restoCartAPI.getOrder({
                    orderId:result.order.orderId
                    },
                    callback,
                    error
                );
 
            });
        };

        /**
         * Checkout cart
         * 
         * @param {Function} callback
         * @param {Function} error
         */
        function checkout2(callback, error) {
            
            /*
             * Synchronize cart on server
             */
            pushToServer(function(){
                
               /*
                * Post order - then return metalink url if successful
                */
               restoCartAPI.placeOrder({
                   fromCart:true
               },
               function(result) {
                   
                   /*
                    * Clear local cart
                    */
                   clear();

                   /*
                    * Get order metalink
                    */
                   var profile = rocketCache.get(rocketCache.PROFILE) || {};
                   callback(rocketServices.getMetalinkUrl({
                       userid:profile.id || -1,
                       orderId:result.order.orderId
                   }));
                   
               },
               function(result) {
                   error(result);
               });
           });
           
        };

        /*
         * Sync cart content with server. Actual cart content is overwritten
         * 
         * 
         * {"6c8e2a3ed9f43d426c3e0694988846dcd5c944ef":
         *   {
         *      "id":"7b5541f4-dbcd-56aa-bc4c-2bd9bd59a387",
         *      "properties":
         *          {
         *              "productIdentifier":"SPOT4_HRVIR1_XS_20130511_N1_TUILE_EEthiopiaD0000B0000",
         *              "productType":"REFLECTANCETOA",
         *              "quicklook":"http:\/\/spirit.cnes.fr\/take5\/ql\/SPOT4_HRVIR1_XS_20130511_N1_TUILE_EEthiopiaD0000B0000.png",
         *              "collection":"Take5",
         *              "services":
         *                  {
         *                      "download":"http:\/\/resto.mapshup.com\/2.0\/collections\/Take5\/7b5541f4-dbcd-56aa-bc4c-2bd9bd59a387\/download"
         *                  }
         *              }
         *          }
         *      }
         * 
         * @param {function} callback
         * @returns {undefined}
         */
        function _pullFromServer(callback) {
            
            /*
             * Get cart from server
             */
            restoCartAPI.get(function(data) {

                /*
                 * Save cart in service
                 * 
                 * @type @arr;data
                 */
                var items = [];
                for (var key in data) {
                    
                    /*
                     * If a collection is specified for this cart just use
                     * collection objects
                     */
                    if (_params.hasOwnProperty('cartCollection')) {
                        if (data[key].collection === _params.collection) {
                            items.push(data[key]);
                        }
                    } 
                    else {
                        items.push(data[key]);
                    }

                }
                
                /*
                 * Callback
                 */
                if (typeof callback === 'function') {
                    callback(items);
                }
                
            },
            /*
             * Error callback
             */
            function(data) {
                rocketServices.error(data);
            });
        };
        
        /**
         * Return a feature with fewer properties
         * 
         * @param {Object} feature
         * @returns {Object}
         */
        function simplify(feature) {
            
            if (!feature || !feature.id || !feature.properties) {
                return null;
            }
            
            var simplified = {
                    id:feature.id,
                    properties:{}
                },
                storedProperties = [
                'collection',
                'productIdentifier',
                'startDate',
                'quicklook',
                'platform',
                'instrument',
                'productType',
                'processingLevel',
                'sensorMode',
                'resolution',
                'orbitNumber',
                'services'
            ];
            for (var i = 0, ii = storedProperties.length; i < ii; i++) {
                if (feature.properties[storedProperties[i]] !== null) {
                    simplified['properties'][storedProperties[i]] = feature.properties[storedProperties[i]];
                }
            }
            return simplified;
           
        };
        
        return cart;
    };

})();