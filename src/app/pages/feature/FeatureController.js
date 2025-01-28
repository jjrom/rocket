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

    /* Feature Controller */

    angular.module('rocket')
        .controller('FeatureController', ['$timeout', '$scope', '$state', 'rocketHolder', 'rocketServices', 'rocketSearchService', 'restoAPI', 'config', FeatureController]);

    function FeatureController($timeout, $scope, $state, rocketHolder, rocketServices, rocketSearchService, restoAPI, config) {

        var  _defaultProjCode = rocketHolder.mapContext && rocketHolder.mapContext.planetInfo ? rocketHolder.mapContext.planetInfo.defaultProjCode : config.defaultProjCode;
        
        /*
         * Convert STAC property name to resto property name
         */
        var _stacMapping = {
            startDate: 'start',
            completionDate: 'end',
            instruments: 'instrument'
        };

        /*
         * Reference to <features-carousel> selecteFeature function
         */
        var _remoteSelectFeature = null;

        /*
         * Reference to feature layer
         */
        var _featureLayer = null;

        /*
         * Reference to measurements
         */
        $scope.measurements = [];

        /*
         * True to display similarFeatures
         */
        $scope.display = { 
            header:config.header.display,
            hint:config.display.hint,
            similars:config.display.similarFeatures,
            getFeatureInfo:config.display.getFeatureInfo,
            gestalt:config.display.chartGestalt
        };
        $scope.rocketMap = new window.rocketmap.Map();
        $scope.rocketMap.init({
            target: 'feature-map',
            defaultProjCode: _defaultProjCode,
            stylesConfig: config.map.stylesConfig,
            layersConfig: null,
            interactions: {
                mouseWheelZoom: 'modifierKey',
                pinchRotate: false,
                onFocusOnly: false
            },
            controls: {
                FullScreen: !rocketServices.isMobileOrTablet(),
                ScaleLine: true,
                ZoomOnMap: false,
                MousePosition: !rocketServices.isMobileOrTablet()
            },
            mapPinUseLongClick: true,
            selectFeatureOnMap: config.map.selectFeatureOnMap,
            selectHitTolerance: config.map.selectHitTolerance
        });

        if (!rocketHolder.mapContext || !rocketHolder.mapContext.defaultLayersConfig) {

            /*
             * Events registration
             */
            rocketSearchService.on('addendpoint', _addEndPoint);

            /*
             * Events unregistration when destroying component
             */
            $scope.$on("$destroy", function () {
                rocketSearchService.un('addendpoint', _addEndPoint);
            });

        }
        else {

            /* 
             * Set planet
             */
            $scope.rocketMap.setPlanet(rocketHolder.mapContext.planetInfo.planet, rocketHolder.mapContext.planetInfo.defaultProjCode);

            /*
             * Add default layers
             */
            $scope.rocketMap.setLayers(rocketHolder.mapContext.defaultLayersConfig);

            restoAPI.getFeature($state.params.url,
                function (data) {
                    _setFeature(data);
                    _init(data);
                },
                function () {
                    alert('Not found');
                }
            );
        }

        /*
		 * True to display basemaps panel
		 */
		$scope.showBasemaps = false;

		/**
		 * Toggle basemaps panel
		 * 
		 * @param {boolean} visible
		 */
		$scope.toggleBasemapsPanel = function (visible) {
			$scope.showBasemaps = visible;
		}

        /**
         * Return collection preview url if set - null otherwise
         * 
         * @param {Object} collection 
         * @return {String}
         */
        $scope.getPreview = function (collection) {
            var previewLinks = rocketServices.getLinks(collection.links, 'preview');
            return previewLinks && previewLinks[0] ? previewLinks[0].href : null;
        }

        /**
         * Set remote controller to <features-carousel>
         * 
         * @param {Object} remote
         */
        $scope.setRemoteCarousel = function(remote) {
            if (remote && remote.selectFeature) {
                _remoteSelectFeature = remote.selectFeature;
            }
        }

        /**
         * Trigger asset function
         * 
         * @param {String} name
         * @param {String} asset
         */
        $scope.onAssetTrigger = function (name, asset) {
            console.log("[TODO] onAssetTrigger : " + name);
        }

        /**
         * Trigger property function
         * 
         * @param {String} propertyName
         * @param {String} propertyValue
         * @param {Object} more
         */
        $scope.onPropertyTrigger = function (propertyName, propertyValue, more) {
                   
            var filters = {};

            more = more || {};

            /*
             * Convert STAC property name to resto property name
             */
            propertyName = _stacMapping[propertyName] || propertyName;

            /*
             * Get feature endPoint
             */
            var url = null;
            for (var i = rocketSearchService.endPoints.length; i--;) {

                // Support endpoint ending with or without '/'
                var epUrl = rocketSearchService.endPoints[i].url[rocketSearchService.endPoints[i].url.length - 1] === '/' ? rocketSearchService.endPoints[i].url.substring(0, rocketSearchService.endPoints[i].url.length - 1) : rocketSearchService.endPoints[i].url;
                for (var j = $scope.feature.links.length; j--;) {
                    var href = $scope.feature.links[j].href[$scope.feature.links[j].href.length - 1] === '/' ? $scope.feature.links[j].href.substring(0, $scope.feature.links[j].href.length - 1) : $scope.feature.links[j].href;
                    if (epUrl === href) {
                        url = rocketSearchService.endPoints[i].url;
                        break;
                    }
                    if (url) {
                        break;
                    }
                }
            }

            /*
             * No url found - got to map with empty filter
             */
            if (!url) {
                return rocketServices.go('map');
            }

            filters.__ep = {};
            filters.__ep[url] = {};

            /*
             * These are common properties
             */
            switch (propertyName) {

                // Convert q to filters
                case 'q':
                    var newFilters = rocketSearchService.qToFilters(propertyValue);
                    for (var key in newFilters) {
                        filters[key] = newFilters[key];
                    }
                    break;

                case 'name':
                case 'start':
                case 'end':
                    filters[propertyName] = propertyValue;
                    if (propertyName === 'start') {
                        filters['end'] = propertyValue;
                    }
                    break;

                case 'collections':
                    filters.collections = propertyValue.id;
                    filters.__collection = propertyValue.name || propertyValue.id;
                    filters.__theme = null;
                    break;

                default:
                    if (propertyValue !== null) {
                        filters.__ep[url][propertyName] = propertyValue;
                    }

            }

            if ($scope.collection) {
                filters.__ep[url]['collections'] = $scope.collection.id;
            }

            // [Hack] Pass location name
            if (more.__name) {
                filters.__name = more.__name;
            }

            // Store collection for search
            rocketHolder._search = {
                filters: filters
            };

            return rocketServices.go('map', {});

        };

        /**
         * Trigger when a point is clicked in rocket-chart
         * 
         * @param {string} label
         * @param {any} value 
         * @returns 
         */
        $scope.onSelectInGraph = function (label, value) {
            
            if ( !label || !$scope.similarFeatures || !_remoteSelectFeature ) {
                return;
            }

            for (var i = $scope.similarFeatures.length; i--;) {
                if ($scope.similarFeatures[i].properties.datetime === label) {
                    return _remoteSelectFeature($scope.similarFeatures[i]);
                }
            }

        }

        /**
         * Switch to similar feature
         * 
         * @param {Object} feature 
         */
        $scope.onSelectSimilar = function (feature) {

            if (!feature) {
                return;
            }

            if (_featureLayer) {
                $scope.rocketMap.updateLayer(_featureLayer, {
                    type: 'FeatureCollection',
                    features: [feature]
                }, {
                    append: false
                });
            }

            $timeout(function(){
                _setFeature(feature);
            });
            
        }

        /**
         * On getFeatureInfo
         *  
         * @param {Object} result
         */
        $scope.onFeatureInfo = function (result) {

            /*
             * New featureInfo but centroid did not change 
             * In this case keep measurements
             */
            if ( $scope.featureInfo && result ) {
                if ($scope.featureInfo.centroid[0] === result.centroid[0] && $scope.featureInfo.centroid[1] === result.centroid[1]) {
                    $scope.featureInfo = result;
                    return
                }
            }
            
            // Other case - clean measurements
            $scope.featureInfo = result;
            $scope.measurements = [];

        }

        /**
         * Process temporal
         *  
         * @param {Object} featureInfo
         */
        $scope.processTemporal = function (featureInfo) {
            
            $scope.chartLoadingIndicator = true;

            var inputs = [];
            for (var i = 0, ii = $scope.similarFeatures.length; i < ii; i++ ) {
                for (var key in $scope.similarFeatures[i].assets) {
                    if ($scope.similarFeatures[i].assets[key].type === 'OGC:WMS' || $scope.similarFeatures[i].assets[key].type === 'wms') {
                        inputs.push({
                            datetime:$scope.similarFeatures[i].properties.datetime,
                            wms_getmap:$scope.similarFeatures[i].assets[key].href
                        });
                        break;
                    }
                }
            }

            restoAPI.postResource(config.services.gestalt.url, null, {
                centroid:featureInfo.centroid,
                inputs:inputs
            }, {
                headers:config.services.gestalt.headers || {}
            })
            .then(function (result) {
                $scope.chartLoadingIndicator = false;
                if (result.status !== 200) {
                    var error = result.data ? (result.data.ErrorMessage || result.data.description) : null;
                    return rocketServices.error("[ERROR] HTTP " + result.status + (error ? ' - ' + error : ''));
                }
                $scope.measurements = result.data ? result.data.measurements : []; 

            })
            .catch(function (error) {
                $scope.chartLoadingIndicator = false;
            });

        }

        /**
         * On measurements
         * 
         * @param {Object} measurements
         */
        $scope.onMeasurements = function (measurements) {
            console.log(measurements);
        }


        ///////////////////////////////////////////////////

        /**
         * Called when a search endPoint is added
         * 
         * @param {object} endPoint 
         */
        function _addEndPoint(endPoint) {

            /* 
             * Set planet
             */
            $scope.rocketMap.setPlanet(rocketHolder.mapContext.planetInfo.planet, rocketHolder.mapContext.planetInfo.defaultProjCode);

            /*
             * Add default layers
             */
            $scope.rocketMap.setLayers(rocketHolder.mapContext.defaultLayersConfig);

            restoAPI.getFeature($state.params.url,
                function (data) {
                    _setFeature(data);
                    _init(data);
                },
                function () {
                    alert('Not found');
                }
            );

        }

        /*
         * Initialize view
         *
         * @param {Object} feature
         */
        function _init(feature) {

            if ( !feature ) {
                return;
            }

            
            /*
             * Get collection from link
             */
            if (feature.links) {

                var collectionHref;
                for (var i = 0, ii = feature.links.length; i < ii; i++) {
                    if (feature.links[i].rel === 'collection') {
                        collectionHref = rocketServices.makeAbsoluteUrl($state.params.url ? $state.params.url : '', feature.links[i].href);
                        break;
                    }
                }
                if (collectionHref && !$scope.collection) {

                    // Get collection
                    restoAPI.getResource(collectionHref)
                        .then(
                            (result) => {
                                if (result.status === 200) {
                                    $scope.collection = result.data;
                                }
                            }
                        );

                    // Get similar features
                    if (config.display.similarFeatures) {
                        _getSimilar(feature, collectionHref + '/items');
                    }


                }

            }

            /*
             * Display feature footprint
             */
            $scope.rocketMap.addLayer({
                id: $scope.feature.id,
                type: 'vector',
                isSelectable: false,
                isRemovable: false,
                styleName: 'aoi',
                zIndex: 99
            },
                {},
                function (layer) {

                    layer.getSource().addFeatures(window.rocketmap.Util.geoJSONToOlFeatures({
                        type: 'FeatureCollection',
                        features: [$scope.feature]
                    }, $scope.rocketMap.getProjectionCode()));

                    $scope.rocketMap.zoomTo(layer, {
                        padding: [100, 100, 100, 100]
                    });

                    // Store layer reference
                    _featureLayer = layer;

                }
            );

        };

        /**
         * Retriece similar features
         * 
         * @param {Object} feature
         * @param {String} href
         */
        function _getSimilar(feature, href) {
            if (feature && feature.properties && feature.properties.centroid) {
                restoAPI.getResource(href, {
                    intersects: 'POINT(' + feature.properties.centroid.join(' ') + ')'
                })
                    .then(
                        (result) => {
                            if (result.status === 200) {
                                var similarFeatures = [];
                                for (var i = result.data.features.length; i--;) {
                                    similarFeatures.push(window.rocketmap.Util.adaptFeature(result.data.features[i]));
                                }
                                $scope.similarFeatures = similarFeatures;
                            }
                            else {
                                $scope.similarFeatures = [];
                            }
                        }
                    ).catch(function (error) {
                        $scope.similarFeatures = [];
                    });
            }
            else {
                $scope.similarFeatures = [];
            }
        }

        /**
         * Set current feature
         * 
         * @param {Object} feature 
         */
        function _setFeature(feature) {  
            $scope.feature = feature;
            _hiliteChartLabel(feature.properties.datetime);     
        }

        /**
         * Set current feature
         * 
         * @param {Object} feature 
         */
         function _hiliteChartLabel(label) {  
            $scope.hiliteLabel = label;
        }

    };

})();