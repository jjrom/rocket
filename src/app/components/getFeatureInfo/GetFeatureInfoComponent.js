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
        .controller('GetFeatureInfoController', ['$timeout', 'rocketServices', 'restoAPI', 'config', GetFeatureInfoController]);

    function GetFeatureInfoController($timeout, rocketServices, restoAPI, config) {

        var self = this;

        /*
         * Array of visible wms layers
         */
        var _clearMapPin = null;

        self.watch = {

            /* 
             * Reference wmsLayers
             */
            wmsLayers: [],

            /*
             * Indicate getFeatureInfo is running
             */
            isLoading: false,

            /*
             * Clicked point lonLat
             */
            lonLat: [],

            /*
             * Feature info
             */
            featureInfo: null

        };

        /*
         * Initialization
         */
        self.$onInit = function () {
            if (self.rocketMap) {
                self.rocketMap.on('addlayer', _mapEventaddlayer);
                self.rocketMap.on('removelayer', _mapEventremovelayer);
                self.rocketMap.on('clearfeatureinfo', self.clear);
            }
        };

        /*
         * Remove map listener on destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.clear();
                self.rocketMap.un('addlayer', _mapEventaddlayer);
                self.rocketMap.un('removelayer', _mapEventremovelayer);
                self.rocketMap.un('clearfeatureinfo', self.clear);
            }
        };

        /*
         * Set remote map-pin component
         */
        self.setRemote = function(remote) {
            _clearMapPin = remote && remote.clear ? remote.clear : null;
        }

        /*
         * Callback on map click
         */
        self.onClick = function(obj) {
            _performGestalt(obj);
        };

        /*
         * Callback on translate end
         */
        self.onTranslateEnd = function(obj) {
            _performGestalt(obj);
        }

        /**
         * Clear search
         */
        self.clear = function () {
            self.watch.lonLat = [];
            if (_clearMapPin) {
                _clearMapPin();
            }
            // Callback to parent
            if (self.onFeatureInfo) {
                self.onFeatureInfo({
                    result:null
                });
            }
        }


        /**
         * Return getFeatureInfo for both WMS and WMTS
         * @param {array} lonLat 
         * @param {OLLayer} olLayer 
         */
        self.directGetFeatureInfo = function(lonLat, olLayer) {

            // This is WMS
            if (olLayer.get('_rocket').type === 'tilewms') {
                if (olLayer.get('_rocket').parsedWMS && olLayer.get('_rocket').parsedWMS.preview) {
                    self.wmsGetFeatureInfo(lonLat, olLayer.get('_rocket').parsedWMS.preview);
                }
            }
            else if (olLayer.get('_rocket').type === 'wmts') {
                self.wmtsGetFeatureInfo(lonLat, olLayer);
            }
            
        }

        /**
         * Perform a GetFeatureInfo request
         * 
         * @param {array} lonLat 
         * @param {string} getMapUrl 
         */
        self.wmsGetFeatureInfo = function(lonLat, getMapUrl) {

            self.watch.isLoading = true;

            var url = getMapTogetFeatureInfo(getMapUrl, lonLat);
            restoAPI.getResource(url)
            .then(function (result) {
                self.watch.isLoading = false;
                if (result.status !== 200) {
                    var error = result.data ? (result.data.ErrorMessage || result.data.description) : null;
                    return rocketServices.error("[ERROR] HTTP " + result.status + (error ? ' - ' + error : ''));
                }
        
                self.watch.featureInfo = {
                    request:url,
                    measurement:plainTextToJSON(result.data)
                }; 
                
                // Callback to parent
                if (self.onFeatureInfo) {
                    self.onFeatureInfo({
                        result:{
                            centroid:centroid,
                            featureInfo:self.watch.featureInfo
                        }
                    });
                }

            })
            .catch(function (error) {
                self.watch.isLoading = false;
            });
        }
    
        /**
         * GetFeatureInfo for WMTS
         * 
         * @param {array} lonLat,
         * @param {OLLayer} wmtsLayer 
         */
        self.wmtsGetFeatureInfo = function(lonLat, wmtsLayer) {

            self.watch.isLoading = true;

            const view = self.rocketMap.map.getView();
            const resolution = view.getResolution();

            const source = wmtsLayer.getSource();
            const tileGrid = source.getTileGrid();
            const coordinate = window.ol.proj.fromLonLat(lonLat, self.rocketMap.getProjectionCode());
            const pixel = self.rocketMap.map.getPixelFromCoordinate(coordinate);
            const tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, resolution);

            // Build GetFeatureInfo URL
            var url = `${source.getUrls()[0]}?SERVICE=WMTS&REQUEST=GetFeatureInfo&VERSION=1.0.0` +
                `&LAYER=${source.getLayer()}&STYLE=&TILEROW=${tileCoord[2]}&TILECOL=${tileCoord[1]}` +
                `&TILEMATRIX=${tileCoord[0]}&TILEMATRIXSET=${source.getMatrixSet()}&FORMAT=${source.getFormat()}` +
                `&I=${Math.floor(pixel[0] % 256)}&J=${Math.floor(pixel[1] % 256)}&INFOFORMAT=application/json`;

            // Get dimension values
            if (wmtsLayer.get('_rocket').layerCapability && wmtsLayer.get('_rocket').layerCapability.Dimension ) {
                for (var i = 0, ii = wmtsLayer.get('_rocket').layerCapability.Dimension.length; i < ii; i++) {
                    url = url + '&' + wmtsLayer.get('_rocket').layerCapability.Dimension[i].Identifier + '=' + wmtsLayer.get('_rocket').layerCapability.Dimension[i].CurrentValue;
                }
            }

            restoAPI.getResource(url)
            .then(function (result) {
                self.watch.isLoading = false;
                if (result.status !== 200) {
                    var error = result.data ? (result.data.ErrorMessage || result.data.description) : null;
                    return rocketServices.error("[ERROR] HTTP " + result.status + (error ? ' - ' + error : ''));
                }
    
                self.watch.featureInfo = {
                    request:url,
                    measurement: result.data.features && result.data.features.length > 0 ? result.data.features[0].properties : null
                }; 
                
                // Callback to parent
                if (self.onFeatureInfo) {
                    self.onFeatureInfo({
                        result:{
                            centroid:centroid,
                            featureInfo:self.watch.featureInfo
                        }
                    });
                }

            })
            .catch(function (error) {
                self.watch.isLoading = false;
            });
            
        }

        /**
         * Call the wms-gestalt server 
         * 
         * @param {array} centroid
         * @param {array} inputs
         */
        self.gestalt = function(centroid, inputs) {
            
            self.watch.isLoading = true;

            restoAPI.postResource(config.services.gestalt.url, null, {
                centroid:centroid,
                inputs:inputs
            }, {
                headers:config.services.gestalt.headers || {}
            })
            .then(function (result) {
                self.watch.isLoading = false;
                if (result.status !== 200) {
                    var error = result.data ? (result.data.ErrorMessage || result.data.description) : null;
                    return rocketServices.error("[ERROR] HTTP " + result.status + (error ? ' - ' + error : ''));
                }
                self.watch.featureInfo = result.data.measurements && result.data.measurements[0] ? result.data.measurements[0] : null; 

                // Callback to parent
                if (self.onFeatureInfo) {
                    self.onFeatureInfo({
                        result:{
                            centroid:centroid,
                            featureInfo:self.watch.featureInfo
                        }
                    });
                }

            })
            .catch(function (error) {
                self.watch.isLoading = false;
            });
            
        }

        /**
         * Convert a WMS GetMap request to a GetFeatureInfo request
         * 
         * Example WMS url is "http://host.docker.internal:7282/soilmoisture?productid=MV_S1B_BRETAGNE_20211024T175631.TIF&service=WMS&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=tif&WIDTH=101&HEIGHT=101&CRS=EPSG%3A4326&STYLES=&BBOX=48.284381,-1.289869,48.286381,-1.288869"
         * 
         * @param {string} url
         * @param {centroid} array 
         */
        function getMapTogetFeatureInfo(url, centroid) {

            var newParams = {
                x: 50,
                y: 50
            }

            var params = parseQuery(url.split('?')[1])
            // BBOX order depends on WMS version
            for (var key in params) {
                if (key.toUpperCase() === 'VERSION') {
                    if (params[key] === '1.3.0') {
                        centroid = centroid.reverse()
                    }
                    break
                }
            }

            for (var key in params) {

                switch (key.toUpperCase()) {

                    // Set QUERY_LAYERS=LAYERS
                    case 'LAYERS':
                        newParams[key] = params[key]
                        newParams['QUERY_LAYERS'] = params[key]
                        break

                    // Set REQUEST to GetFeaturInfo
                    case 'REQUEST':
                        newParams[key] = 'GetFeatureInfo'
                        break

                    // Force EPSG:4326 for SRS/CRS
                    case 'SRS':
                    case 'CRS':
                        newParams[key] = 'EPSG:4326'
                        break

                    // Force width/height to 101
                    case 'WIDTH':
                    case 'HEIGHT':
                        newParams[key] = 101
                        break

                    // Compute BBOX. Order depends on version (i.e. "1.1.1" is lon/lat, "1.3.0" is lat/lon)
                    case 'BBOX':
                        newParams[key] = (centroid[0] - 0.01) + ',' + (centroid[1] - 0.01) + ',' + (centroid[0] + 0.01) + ',' + (centroid[1] + 0.01)
                        break

                    default:
                        newParams[key] = params[key]
                }

            }

            return url.split('?')[0] + '?' + Object.keys(newParams).map(function (key) {
                return key + '=' + newParams[key]
            }).join('&')

        }

        /**
         * Parse query string
         * 
         * Examples
         * 
         * 			hello=1&another=2&something=
         * 
         * 		will return:
         * 
         * 			{
         *				hello: "1",
        *				another: "2",
        *  		}
        * 
        * 			hello=1&hello=2
        * 	
        * 		will return:
        * 
        * 			hello:["1","2"]
        * 
        * @param {string} str 
        * @returns array 
        */
        function parseQuery(str) {

            if (typeof str != "string" || str.length == 0) {
                return {}
            }

            var s = str.split("&")
            var s_length = s.length
            var bit, query = {}, first, second

            for (var i = 0; i < s_length; i++) {

                bit = s[i].split("=");
                first = decodeURIComponent(bit[0])
                if (first.length == 0) {
                    continue
                }
                second = decodeURIComponent(bit[1])
                if (typeof query[first] == "undefined") {
                    query[first] = second
                }
                else if (query[first] instanceof Array) {
                    query[first].push(second)
                }
                else {
                    query[first] = [query[first], second]
                }

            }

            return query
        }

        /**
         * Convert a GetFeatureInfo plain/text mapserver response to JSON object
         * 
         * Example: 
         * 
         * 		GetFeatureInfo results:
         * 		
         * 		Layer 'tif'
         *			Feature 0: 
         *  	 		x = '-1.2895915'
         *  	 		y = '48.28578'
         *  	 		value_0 = '140'
         *  	 		value_list = '140'
         *  	 		class = '25 vol.% soil moisture'
         *  	 		red = '42'
         *  	 		green = '200'
         *  	 		blue = '42' 
         * 
         * will return
         * 
         * 		{
         * 			x: -1.2895915,
         *  	 	y: 48.28578,
         * 			value_0: 140,
         *  	 	value_list: 140,
         *  	 	class: '25 vol.% soil moisture',
         *  	 	red: 42,
         *  	 	green: 200,
         *  	 	blue: 42 
         * 		}
         * 
         * @param {string} text 
         * @returns {object}
         * 
         */
        function plainTextToJSON(text) {

            var lines = text.replace(/\r\n/g, "\n").split("\n")

            if (lines.length === 0) {
                return null;
            }
            
            var obj = null;

            for (var i = 0, ii = lines.length; i < ii; i++) {

                // We have a value
                if (lines[i].indexOf('=') !== -1) {
                    if ( !obj) {
                        obj = {};
                    }
                    var pair = lines[i].split('=').map(e => e.trim());
                    var label = pair[0].replaceAll('_', ' ');
                    obj[label] = pair[1];
                }

            }
            
            return obj

        }

        /**
         * Map event : singleclick
         * 
         * @param {object} obj 
         */
        function _performGestalt(obj) {
            
            /*
             * Update properties 
             */
            self.watch.lonLat = window.rocketmap.Util.toLonLat(obj.coordinate, self.rocketMap ? self.rocketMap.getProjectionCode() : config.defaultProjCode);

            /*
             * Get feature info
             */
            if ( self.watch.wmsLayers.length === 0 ) {
                self.watch.isLoading = false;
                return;
            }

            self.directGetFeatureInfo(self.watch.lonLat, self.watch.wmsLayers[0]);
            
        };

        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
         function _mapEventaddlayer(olLayer, params) {

            // We only track WMS layers
            if (olLayer && olLayer.get('_rocket') && ['tilewms', 'wmts'].includes(olLayer.get('_rocket').type) ) {
                
                $timeout(function(){
                    self.watch.wmsLayers.push(olLayer);
                    if ( self.watch.lonLat && self.watch.lonLat.length === 2) {
                        self.directGetFeatureInfo(self.watch.lonLat, self.watch.wmsLayers[0]);
                    }
                });

            }

        }

        /**
         * Map event : removelayer
         * 
         * @param {string} layerId 
         */
        function _mapEventremovelayer(layerId) {

            var isSpliced = false;
            
            for (var i = 0, ii = self.watch.wmsLayers.length; i < ii; i++) {
                if (self.watch.wmsLayers[i].get('_rocket').id === layerId) {
                    self.watch.wmsLayers.splice(i, 1);
                    isSpliced = true;
                    break;
                }
            }

            if (isSpliced) {
                $timeout(function(){
                    if (self.watch.wmsLayers.length === 0) {
                        self.watch.lonLat = [];
                        self.rocketMap.clearFeatureInfo();
                    }
                });
                
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('getFeatureInfo', {
            templateUrl: "app/components/getFeatureInfo/getFeatureInfo.html",
            bindings: {

                /*
                 * Callback function when getFeatureInfo is returned
                 */
                onFeatureInfo: '&',

                /*
                 * rocket Map
                 */
                rocketMap: '<'
            },
            controller: 'GetFeatureInfoController'
        });

})();

