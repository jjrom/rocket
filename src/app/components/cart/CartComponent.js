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
        .controller('CartController', ['rocketCart', 'rocketServices', 'downloadUtil', 'metalinkUtil', CartController]);

    function CartController(rocketCart, rocketServices, downloadUtil, metalinkUtil) {

        var self = this;

        /*
         * Initialize variables
         */
        self.content = rocketCart.getContent();
        
        /**
         * Remove a feature from cart
         * 
         * @param {Object} feature
         */
        self.removeFromCart = function(feature) {
            rocketCart.remove(feature,
            function () {
                self.content = rocketCart.getContent();
                rocketServices.success('cart.remove.success');
            },
            function () {
                rocketServices.success('cart.remove.error');
            });
        };
        
        /**
         * Download metalink
         * 
         * @param {Event} evt
         */
        self.downloadMetalink = function(evt) {
            
            if (evt) {
                evt.stopPropagation();
            }

            if (!self.content || !self.content.items) {
                return rocketServices.error('cart.download.error.empty');
            }

            var metalink = metalinkUtil.featuresToMetalink(self.content.items);

            var a = document.createElement('a');
            a.href = metalink.content;
            a.download = metalink.filename;
            
            // Add a to the doc for click to work.
            (document.body || document.documentElement).appendChild(a);
            if (a.click) {
                a.click(); // The click method is supported by most browsers.
            } else {
                $(a).trigger('click'); // Backup using jquery
            }
            
            // Delete the temporary link.
            a.parentNode.removeChild(a);

        };
        
        /**
         * Download items individually
         * 
         * @param {Event} evt
         */
        self.downloadItems = function(evt) {
            
            if (evt) {
                evt.stopPropagation();
            }

            if (!self.content || !self.content.items) {
                return rocketServices.error('cart.download.error.empty');
            }

            for (var i = 0, ii = self.content.items.length; i < ii; i++) {
                downloadUtil.downloadAssets(self.content.items[i].assets);
            }

            //_cleanCart();
            
        };
        
        //////////////////////////////
        
        /*
         * Clean cart and scope
         */
        function _cleanCart() {
            rocketCart.clear();
            self.content = rocketCart.getContent();
        }
        

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('cart', {
            templateUrl: "app/components/cart/cart.html",
            bindings: {

            },
            controller: 'CartController'
        });

})();
