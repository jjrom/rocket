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
        .controller('AssetsBrowserComponent', ['$window', '$timeout', 'rocketServices', 'rocketCart', 'metalinkUtil', 's3Util', 'config', AssetsBrowserComponent]);

    function AssetsBrowserComponent($window, $timeout, rocketServices, rocketCart, metalinkUtil, s3Util, config) {

        var self = this;

        /*
         * Keep list of shown layers to 
         * be removed when feature change
         */
        var _oldAssets = {};
        var _uniqueId = '__mappable__';

        // Watch variable
        self.watch = {
            hasS3Assets: false,
            s3ConfigIsOpen: false,
            layers: {},
            s3Config: {}
        };

        self.niceAssets = [];
        self.metalink = {};

        this.$onInit = function() {
            if (self.rocketMap) {
                self.rocketMap.on('addlayer', _mapEventaddlayer);
                self.rocketMap.on('removelayer', _mapEventremovelayer);
            }
            self.watch.s3Config = s3Util.getConfig();
        }

        this.$onDestroy = function() {
            if (self.rocketMap) {
                self.rocketMap.un('addlayer', _mapEventaddlayer);
                self.rocketMap.un('removelayer', _mapEventremovelayer);
            }
        }

        /**
         * Watch endPoint url change - retrieve data
         */
        this.$onChanges = function (changesObj) {

            if (changesObj.assets && changesObj.assets.currentValue) {
                self.niceAssets = _getNiceAssets(JSON.parse(JSON.stringify(self.assets))); 
                _oldAssets = JSON.parse(JSON.stringify(self.assets));
            }

            if (changesObj.feature && changesObj.feature.currentValue) {

                /*
                 * Not feature assets - skip the rest
                 */
                if ( !self.feature || !self.feature.assets) {
                    return;
                }

                if ( self.rocketMap && self.rocketMap.map ) {

                    /*
                     * Remove previous asset layers (see switching similarFeatures in feature page for instance)
                     */
                    if (self.removeAssetLayersOnChange) {
                        for (var key in _oldAssets) {
                            var layer = self.getAssetLayer(_oldAssets[key]);
                            if (layer) {
                                self.rocketMap.removeLayer(layer);
                            }
                        }
                        self.watch.layers = [];
                    }

                    /*
                     * Be sure to update watch.layers accordingly to existing layers on map
                     */
                    var overlays = self.rocketMap.getLayers().overlays;
                    for (var i = 0, ii = overlays.length; i < ii; i++) {
                        _updateLayers(overlays[i].get('_rocket').id, true);
                    }

                    /*
                     * Finally load first mappable asset if present and not already loaded
                     */
                    if ( self.autoLoadMappable ) {
                        var thumbnailToShow = null;
                        var otherToShow = null;
                        for (var key in self.feature.assets) {
                            if (!self.watch.layers[self.feature.assets[key].href]) {
                                if (_isValidThumbnail(self.feature.assets[key])) {
                                    thumbnailToShow = self.feature.assets[key];
                                }
                                else if ( self.isMappable(self.feature.assets[key]) ) {
                                    otherToShow = self.feature.assets[key];
                                }
                            }
                        }
                        if (otherToShow) {
                            self.addAssetLayer(otherToShow);
                        }
                        else if (thumbnailToShow) {
                            self.addAssetLayer(thumbnailToShow);
                        }
                        else if (config.assets.uniqueMappableInMap) {
                            self.removeAssetLayer();
                        }
                    }

                }
    
                self.metalink = metalinkUtil.featureToMetalink(self.feature);
                self.niceAssets = _getNiceAssets(JSON.parse(JSON.stringify(self.feature.assets))); 
                _oldAssets = JSON.parse(JSON.stringify(self.feature.assets));

            }
    
        };

        /**
         * Show/Hide s3Config panel
         * 
         * @param {boolean} visible 
         */
        self.showS3Config = function(visible) {
            self.watch.s3ConfigIsOpen = visible;
            self.watch.s3Config = s3Util.getConfig();
        }

        /**
		 * Open external link
		 * 
		 * @param {string} url
		 */
		self.openExternalLink = function (url) {
			if (url) {
				$window.open(url, '_blank');
			}
		};

        /**
         * Download asset
         * 
         * @param {Object} niceAsset 
         * @param {Event} evt
         */
        self.download = function (niceAsset, evt) {
            
            if (evt) {
                evt.stopPropagation();
            }

            /*
             * S3 download !
             */
            if (niceAsset.downloadMethod.indexOf('s3') === 0) {


                // No S3 configuration available - open popup to do so
                if ( !self.watch.s3Config.accessKeyId ) {
                    self.watch.s3ConfigIsOpen = true;
                    return;
                }

                return s3Util.getSignedUrl(s3Util.getS3Instance(), {
                    s3Url: niceAsset.asset.href,
                    RequestPayer: self.watch.s3Config.RequestPayer
                }, function(url) {
                    _downloadFromHttp(url, {
                        type: niceAsset.asset.type,
                        title: niceAsset.asset.title || niceAsset.key
                    });
                }, function (error) {
                    rocketServices.error(error.message);
                });

            }

            else {
                _downloadFromHttp(niceAsset.asset.href, {
                    type: niceAsset.asset.type,
                    title: niceAsset.asset.title || niceAsset.key
                });
            }

        };

        /**
         * Return true if layer is mappable (i.e. COG or WMS, etc.)
         */
        self.isMappable = function (asset) {

            asset = asset || {};

            // Special case for quicklook
            if ( _isValidThumbnail(asset) ) {
                return true;
            }

            switch(asset.type) {
                case 'OGC:WMS':
                case 'OGC:WMTS':
                case 'wms':
                case 'wmts':
                case 'image/tiff; application=geotiff; profile=cloud-optimized':
                case 'image/vnd.stac.geotiff; cloud-optimized=true':
                    return true;
                default:
                    return false;
            }
        };

        /**
         * Get layer
         *
         * @param {object} asset
         */
        self.getAssetLayer = function (asset) {
            return self.rocketMap.getLayerByRocketId(config.assets.uniqueMappableInMap ? _uniqueId : asset.href);
        };

        /**
         * Add layer in map
         * COG thanks to Radiant Earth Fundation endpoint tiles.rdnt.io
         * 
         * @param {object} asset
         * @param {Event} evt
         */
        self.addAssetLayer = function(asset, evt) {
            
            asset = asset || {};

            if (evt) {
                evt.stopPropagation();
            }
            
            if ( !self.rocketMap || !self.rocketMap.map ) {
                return;
            }

            self.removeAssetLayer(asset, evt);

            /*
             * Show layers tab after layer add
             */
            self.rocketMap.addLayer(_getLayerConfig(asset), {
                showLayersTab: true
            }, function(layer, error) {
                if (error) {
                    $timeout(function(){
                        self.watch.layers[asset.href] = 0;
                    });
                    return rocketServices.error(error);
                }
                else {
                    $timeout(function(){
                        self.watch.layers[asset.href] = 1;
                    })
                }
            });

        };

        /**
         * Remove layer in map
         * 
         * @param {object} asset
         * @param {Event} evt
         */
        self.removeAssetLayer = function(asset, evt) {
            
            asset = asset || {};

            if (evt) {
                evt.stopPropagation();
            }
            
            if ( !self.rocketMap || !self.rocketMap.map ) {
                return;
            }

            var layer = self.getAssetLayer(asset);
            if (layer) {
                if ( config.assets.uniqueMappableInMap ) {
                    self.watch.layers = [];
                }
                else if ( self.watch.layers[asset.href] ) {
                    self.watch.layers[asset.href] = 0;
                }
                return self.rocketMap.removeLayer(layer);
            }

        };

        /**
         * Download all assets
         */
        self.downloadAllAssets = function(assets, evt) {
            
            if (evt) {
                evt.stopPropagation();
            }

            assets = assets || {};
            var files = [];
            for (var key in assets) {
                files.push({
                    download:assets[key].href,
                    filename:assets[key].href.split('/').slice(-1)[0]
                });
            }
            
            rocketServices.multiDownload2(files);

        };

        /**
         * Add a feature to cart
         * 
         * @param {Object} feature
         * @param {Object} evt
         */
        self.addToCart = function (feature, evt) {
            rocketCart.add(feature,
                function () {
                    rocketServices.success('cart.add.success');
                },
                function () {
                    rocketServices.success('cart.add.error');
                }
            );
            evt.stopPropagation();
        };

        /**
         * Remove feature from cart
         * 
         * @param {string} featureId
         * @param {Object} evt
         */
        self.removeFromCart = function (featureId, evt) {
            rocketCart.remove(featureId,
                function () {
                    rocketServices.success('cart.remove.success');
                },
                function () {
                    rocketServices.error('cart.remove.error');
                }
            );
            evt.stopPropagation();
        };

        /**
         * Return true is featureId is in cart
         * @param {string} featureId
         * @returns {boolean}
         */
        self.isInCart = function (featureId) {
            return rocketCart.isInCart(featureId);
        };

        /**
         * Copy to clipboard
         * 
         * @param {string} str
         * @param {string} message
         */
         self.copyToClipboard = function (str, message) {
            rocketServices.copyToClipboard(str);
            if (message) {
                rocketServices.success(message);
            }
        };

        /**
         * Prepare nice assets for display
         * 
         * @param {Object} assets 
         */
        function _getNiceAssets(assets) {

            var niceAssets = [];
            var hasS3Assets = false;

            for (var key in assets) {

                // Not displayed
                if ( !config.display.thumbnailInAssets && assets[key].roles && assets[key].roles.indexOf('thumbnail') !== -1 ) {
                    continue;
                }

                if ( assets[key].href && assets[key].href.toLowerCase().indexOf('s3://') === 0 ) {
                    hasS3Assets = true;
                }

                niceAssets.push({
                    key:key,
                    downloadMethod:assets[key].href && metalinkUtil.isDownloadable(assets[key]) && !_isValidThumbnail(assets[key]) ? assets[key].href.split(':')[0].toLowerCase() : null,
                    extension:assets[key].href ? _niceExtensionName(assets[key].href.split('?')[0].split('/').pop().split('.').pop().toLowerCase()) : null,
                    isMappable:self.isMappable(assets[key]),
                    asset:assets[key]
                });
            }

            self.watch.hasS3Assets = hasS3Assets;

            return niceAssets;

        }

        /**
         * Return a human readable extension name - null otherwise
         * 
         * @param {string} extension 
         */
        function _niceExtensionName(extension) {

            var knownExtensions = [
                'jpeg',
                'jpg',
                'tif',
                'tiff',
                'json',
                'xml',
                'png',
                'gif'
            ]

            if (knownExtensions.includes(extension)) {
                return extension.toUpperCase();
            }

            return null;

        }

        /**
         * Return layer config from asset
         *  
         * @param {object} asset 
         */
        function _getLayerConfig(asset) {

            var layerConfig = {
                id: config.assets.uniqueMappableInMap ? _uniqueId : asset.href,
                isBackground: false,
                isRemovable:true,
                options:{
                    url: asset.href
                }
            }

            // Special case for quicklook
            if ( _isValidThumbnail(asset) ) {

                // We need the feature bbox - either from STAC (default) or computed from feature geometry (OpenLayers)
                if ( !self.feature.bbox ) {
                    self.feature.bbox = window.ol.extent.applyTransform(self.rocketMap.getFeatureById(self.feature.id).getGeometry().getExtent(), window.ol.proj.getTransform(self.rocketMap.getProjectionCode(), 'EPSG:4326'));
                }

                layerConfig = $.extend(layerConfig, {
                    title: self.feature.properties.title || self.feature.properties.productIdentifier || self.feature.id,
                    description: self.feature.properties.description,
                    type: 'image'
                });

                layerConfig.options.imageExtent = self.feature.bbox;

            }
            else {

                var type;
                switch (asset.type) {
                    case 'OGC:WMS':
                    case 'wms':
                        type = 'tilewms';
                        break;
                    case 'OGC:WMTS':
                        type = 'wmts';
                        break;
                    default:
                        type = 'cog'
                }

                layerConfig = $.extend(layerConfig, {
                    // Default to cog
                    title: self.feature.properties.title || self.feature.properties.productIdentifier || self.feature.id,
                    type: type,
                    progressBarTarget:self.progressBarTarget ? document.getElementById(self.progressBarTarget) : null
                });

                layerConfig.options.wrapX = true;

            }

            return layerConfig;
            
        }

        /**
         * Return true if input asset is valid thumbnail
         * 
         * @param {object} asset 
         */
        function _isValidThumbnail(asset) {
            if (asset && asset.roles && asset.roles.indexOf('thumbnail') !== -1) {
                // Special case, thumbnail is not a realQuicklook
                if (self.feature && self.feature.properties['rocket:notRealQuicklook'] && self.feature.properties['quicklook'] === asset.href ) {
                    return false;
                }
                return true;
            }
            return false;
        }  

        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            _updateLayers(olLayer && olLayer.get('_rocket') ? olLayer.get('_rocket').id : null, true);
        }

        /**
         * Map event : removelayer
         * 
         * @param {string} layerId 
         */
        function _mapEventremovelayer(layerId) {
            _updateLayers(layerId, false);
        }

        /**
         * Update watch.layers
         * 
         * @param {string} layerId 
         * @param {boolean} add 
         */
        function _updateLayers(layerId, add) {
            for (var key in self.feature.assets) {
                if (self.feature.assets[key].href === layerId ) {
                    $timeout(function(){
                        self.watch.layers[layerId] = add ? 1 : 0;
                    });
                    return;
                }
            }
        }

        /**
         * Download from http
         * 
         * @param {string} href
         * @param {Object} params
         */
        function _downloadFromHttp(href, params) {

            params = params || {};
            var a = document.createElement('a');
            var target = '_blank';
            /*var target = [
                'text/xml',
                'plain/text',
                'application/json',
                'image/jpeg',
                'image/png'].indexOf((params.type || '').split(';')[0].trim().toLowerCase()) === -1 ? '_self' : '_blank';
            */
            a.style.display = 'none';
            document.body.appendChild(a);
            a.setAttribute('target',  target);
            a.setAttribute('download',  params.title || href.split('?')[0].split('/').pop());
            a.href = href;
            a.click();
            document.body.removeChild(a);

        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('assetsBrowser', {
            templateUrl: 'app/components/assetsBrowser/assetsBrowser.html',
            bindings: {

                /*
                 * Callback to parent when a trigger (e.g. click on asset) is actived
                 * List of trigger names:
                 *   - 'showmeasurement'
                 */
                onAssetTrigger: '&',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * True to allow cart functions
                 */
                enableCart: '<',

                /*
                 * True to auto load first mappable asset
                 */
                autoLoadMappable: '<',

                /*
                 * Progress bar dom target
                 */
                progressBarTarget: '<',

                /*
                 * Input feature
                 * Note: used for product page (see FeatureController.js)
                 */
                feature: '<',

                /*
                 * Input assets
                 */
                assets: '<',

                /*
                 * True to remove asset layers on change feature
                 */
                removeAssetLayersOnChange: '<',

            },
            controller: 'AssetsBrowserComponent'
        });

})();