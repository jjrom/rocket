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
        .controller('ViewsManagerController', ['rocketServices', 'rocketViews', 'rocketCache', 'rocketMagicReader', 'datacubeUtil', ViewsManagerController]);

    function ViewsManagerController(rocketServices, rocketViews, rocketCache, rocketMagicReader, datacubeUtil) {

        var self = this;

        /*
         * Datacube
         */
        self.hasDatacube = datacubeUtil.isAvailable();
        
        /*
         * Initialize
         */
        self.$onInit = function () {

            rocketCache.on('updatecache', _updateCache);

            self.isLoading = true;
            rocketViews.getViews(function(views) {
                self.isLoading = false;
                self.views = views;
            });

        };
        
        /*
         * Destroy
         */
        self.$onDestroy = function () {
            rocketCache.un('updatecache', _updateCache);
        };

        /**
         * Remove a view
         * 
         * @param {Object} view
         */
        self.remove = function(view) {

            if (!confirm(rocketServices.translate('view.remove.confirm', [view.title]))) {
                return false;
            }
           
            self.isLoading = true;
            rocketViews.removeView(view.id, function(views) {
                self.isLoading = false;
                self.views = views;
            });

        };

        /**
         * Export a catalog url to datacube
         * 
         * @param {string} url 
         */
        self.exportToDatacube = function(url) {
            if (self.hasDatacube) {
                rocketServices.copyToClipboard(datacubeUtil.getBootstrap({
                    STAC_CATALOG_URL:url
                }))
                rocketServices.success('datacube.clipboard');
            } 
        };

        /**
         * Add view to map if
         * 
         * @param {Object} view 
         */
        self.addViewToMap = function(view) {
            
            // Create an olLayer and zoom on it
            if (self.rocketMap) {

                var tmpLayer = self.rocketMap.getLayerByRocketId(view.href);
                if (tmpLayer) {
                    self.rocketMap.zoomTo(tmpLayer, {
                        padding: [100, 100, 100, 100]
                    });
                }
                else {
                    self.isLoading = true;
                    rocketMagicReader.processUrl(view.href, self.rocketMap.getProjectionCode(), function(result) {
                        if (result.features && result.features.length > 0) {
                            self.rocketMap.addLayer({
                                id: view.href,
                                title: view.title,
                                type: 'vector',
                                isSelectable: true,
                                isRemovable: true,
                                isNotSearchable: true,
                                features: result.features
                            }, {
                                center: true
                            });
                        }
                        self.isLoading = false;
                    },
                    function(error) {
                        self.isLoading = false;
                    });
                }
    
            }

        };

        /**
         * Called when cache is updated - use to get views
         * 
         * @param {object} obj 
         */
        function _updateCache(obj) {
            if (obj) {
                switch (obj.key) {
                    case rocketCache.VIEWS:
                        self.views = obj.value;
                        break;
                }
            }
        }
    
    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('viewsManager', {
            templateUrl: "app/components/viewsManager/viewsManager.html",
            bindings: {

                /*
                 * Reference to rocketMap
                 */
                rocketMap: '<'

            },
            controller: 'ViewsManagerController'
        });

})();
