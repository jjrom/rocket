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
        .controller('StacCatalogBrowserController', ['$window', '$timeout', '$location', 'rocketServices', 'rocketSearchService', 'stacUtil', 'rocketCatalogTree', 'rocketHolder', 'restoAPI', 'restoGazetteerAPI', 'datacubeUtil', 'config', StacCatalogBrowserController]);

    function StacCatalogBrowserController($window, $timeout, $location, rocketServices, rocketSearchService, stacUtil, rocketCatalogTree, rocketHolder, restoAPI, restoGazetteerAPI, datacubeUtil, config) {

        var self = this;

        /*
         * Default planet
         */
        var defaultPlanet = 'earth';

        /*
         * Datacube
         */
        self.hasDatacube = datacubeUtil.isAvailable();

        /*
         * One search can be performed at one time
         */
        self.promise = null;

        /*
         * Root endPoint url
         */
        self.endPointUrl;

        /*
         * Store current geometry for locatorMap
         */
        self.currentGeometry;

        /*
         * Initilize scope with input variables
         */
        self.$onInit = function () {
            refreshEndPoint(self.activeChild);
            if (self.rocketMap) {
                self.rocketMap.on('hilitedfeature', _featureHilited);
            }
        };

        /*
         * Initilize scope with input variables
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.un('hilitedfeature', _featureHilited);
            }
        };

        /*
         * Watch changes in parent
         */
        self.$onChanges = function (changesObj) {

            if (changesObj.endPoint) {
                if (changesObj.endPoint && changesObj.endPoint.currentValue) {
                    self.endPointUrl = changesObj.endPoint.currentValue.data.stacRoot;
                    defaultPlanet = (changesObj.endPoint.currentValue.data.planet || 'earth').toLowerCase();
                    refreshEndPoint(changesObj.activeChild && changesObj.activeChild.currentValue ? self.activeChild : null);
                }
                else {
                    self.endPointUrl = null;
                    refreshEndPoint(null);
                }
            }

            if (changesObj.activeChild && changesObj.activeChild.currentValue) {
                self.setChild(self.activeChild);
            }

        };

        /*
         * Loading status
         */
        self.isLoading = false;

        /*
         * Action on map in progress
         */
        self.mapIsLoading = false;

        /*
         * Expanded
         */
        self.isExpanded = false;
        self.isOverflowing = false;

        /*
         * Local features
         */
        self.features = rocketHolder.features;

        /*
         * Catalogs tree
         */
        self.tree = {};

        /*
         * Active STAC info
         */
        self.stacInfo;

        self.watch = {
            hilitedFeatureId: null
        };

        /**
         * [STAC] Set active child
         * 
         * @param {string} href
         * @param {string} rel
         */
        self.setChild = function (child) {
            
            if (!child || !child.href) {
                return;
            }
            
            /*
             * If mimeType is not JSON => open in new tab
             */
            if ( child.type && ['application/json', 'application/ld+json', 'application/geo+json'].indexOf(child.type) === -1 ) {
                return $window.open(child.href, '_blank');
            }

            self.isLoading = true;

            if (self.onLoadStart) {
                self.onLoadStart();
            }

            /*
             * Cancel running promise
             */
            if (self.promise) {
                self.promise.cancel();
            }
            
            /*
             * Force authorization if authenticated
             */
            self.promise = restoAPI.getResource(child.href);

            self.promise.then(

                    (result) => {
                        
                        self.isLoading = false;

                        if (result.status !== 200) {
                            var error = result.data ? (result.data.ErrorMessage || result.data.description) : null;
                            self.isExpanded = false;
                            checkCollapsibleOverflow();
                            return rocketServices.error("[ERROR] HTTP " + result.status + (error ? ' - ' + error : ''));
                        }

                        var stacInfo = result.data || {};
                        
                        // Store stacInfo - add planet if not there
                        self.stacInfo = stacInfo;

                        // Set currentGeometry either from extent if set or from geouid otherwise
                        if (self.stacInfo.extent && self.stacInfo.extent.spatial && self.stacInfo.extent.spatial.bbox) {
                            self.currentGeometry = bboxToGeometry(self.stacInfo.extent.spatial.bbox[0]);
                        }
                        else if (child.geouid) {
                            self.setGeouid(child.geouid);
                        }
                        else {
                            self.currentGeometry = null;
                        }

                        // Support to https://raw.githubusercontent.com/thareUSGS/ssys/main/json-schema/schema.json extension
                        if (stacInfo['ssys:targets']) {
                            stacInfo.planet = stacInfo['ssys:targets'][0];
                        }

                        stacInfo.planet = (stacInfo.planet || defaultPlanet).toLowerCase();
                        var preview = _getPreview(stacInfo);
                        if (preview) {
                            stacInfo.preview = preview.href;
                        }

                        // Special case - result is FeatureCollection
                        if (stacInfo.type === 'FeatureCollection') {
                            stacInfo = _processFeatureCollection(stacInfo, child);
                        }

                        // Update rocketHolder and set self.tree
                        self.tree = rocketCatalogTree.getTree(child, stacInfo, self.tree ? self.tree.parents : null);
                        
                        // Rebuild a FeatureCollection from individual items
                        if (self.tree.isLeaf && !self.tree.context) {
                            console.log("TODO : build a FeatureCollection from single item");
                            //_processFeatureCollectionFromSingleItems(stacInfo, self.tree.childs);
                        }

                        // Store to rocketHolder
                        if (!rocketHolder.stacBrowser) {
                            rocketHolder.stacBrowser = {};
                        }

                        rocketHolder.stacBrowser[self.endPoint.data.stacRoot] = {
                            activeChild: self.activeChild,
                            tree: self.tree,
                            stacInfo: stacInfo
                        };

                        // Callback to parent
                        if (self.onLoadEnd) {
                            self.onLoadEnd({ tree: self.tree });
                        }

                        self.isExpanded = false;
                        checkCollapsibleOverflow();

                        // Update location search
                        $location.search('catalog', child.href);

                    }
                )
                .catch(function (error) {
                    console.log(error);
                    self.isLoading = false;
                    checkCollapsibleOverflow();
                });

        };

        /**
         * Add filters q
         * 
         * @param {Object} keyword
         * @param {string} selectedFeatureHref
         */
        self.setCatalog = function (catalog, selectedFeatureHref) {

            if (catalog.rootUrl) {
                var parentId = null;
                var parentsTree = [
                    {
                        id:'root',
                        title: (self.endPoint && self.endPoint.data ? self.endPoint.data.title : 'root') || null,
                        href: catalog.rootUrl,
                        isLeaf:false
                    }
                ];
              
                for (var i = 0, ii = catalog.parents.length; i < ii; i++) {
                    parentId = parentId ? parentId + '/' + catalog.parents[i] : catalog.parents[i];
                    var title = parentId.split('/').pop();
                    parentsTree.push({
                        id:parentId,
                        title: String(title).charAt(0).toUpperCase() + String(title).slice(1),
                        href: catalog.rootUrl + '/' + parentId,
                        isLeaf:false
                    });
                }
                
                self.tree.parents = parentsTree;
            }
            self.activeChild = catalog;
            self.setChild(catalog);

            if (selectedFeatureHref) {
                self.selectFeature({
                    _href:selectedFeatureHref
                });
            }
        };

        /**
         * Tooggle collapsible element
         */
        self.toggleCollapsible = function() {
            self.isExpanded = !self.isExpanded;
        };

        /**
         * Check collapsible overflow
         */
        function checkCollapsibleOverflow() {
            $timeout(function () {
                var element = document.getElementById('collapsible');
                if (element) {
                    self.isOverflowing = element.scrollHeight > element.clientHeight;
                }
            });
        };

        /**
         * Export a catalog url to datacube
         * 
         * @param {string} url 
         */
        self.exportToDatacube = function(url) {
            if (self.hasDatacube) {
                return self.copyToClipboard(datacubeUtil.getBootstrap({
                    STAC_CATALOG_URL:url
                }), 'datacube.clipboard');
            } 
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
         * Zoom on geouid
         * 
         * @param {string} geouid 
         */
        self.setGeouid = function (geouid) {

            if (rocketHolder.mapContext && rocketHolder.mapContext.planetInfo.gazetteer && rocketHolder.mapContext.planetInfo.gazetteer.url) {
                self.mapIsLoading = true;
                restoGazetteerAPI.get(rocketHolder.mapContext.planetInfo.gazetteer, geouid)
                    .then(function (result) {

                        // rocketMap is set => display on rocket map
                        if (self.rocketMap) {
                            self.rocketMap.addAOILayer({
                                title: result.data.name,
                                wkt: result.data.wkt,
                                properties:{
                                    geouid:geouid
                                }
                            }, {
                                center: true
                            });
                        }
                        // Otherwise, display on locator
                        else {
                            self.currentGeometry = result.data.wkt;
                        }
                        self.mapIsLoading = false;
                    })
                    .catch(function (error) {
                        self.mapIsLoading = false;
                    });

            }

        };

        /**
         * Fit map view to bbox
         * 
         * @param {array} bbox 
         */
        self.setBBOX = function (bbox) {

            var wkt =  window.rocketmap.Util.BBOXToWKT(bbox);

            if (self.rocketMap) {
                var projCode = self.rocketMap.getProjectionCode();
                self.rocketMap.addAOILayer({
                    title: window.rocketmap.Util.geometryToName(window.rocketmap.Util.WKTToGeometry(wkt, projCode), projCode),
                    wkt: wkt
                }, {
                    center: true
                });
            }

        };

        /**
         * Select feature
         * 
         * @param {Object} feature 
         * @param Event evt
         */
        self.selectFeature = function (feature, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (!feature) {
                return null;
            }

            if ( feature._href ) {
                self.isLoading = true;
                restoAPI.getFeature(feature._href,
                    function (data) {
                        rocketHolder.features[feature._href] = data;
                        self.selectFeature(data);
                        self.isLoading = false;
                    },
                    function () {
                        self.isLoading = false;
                    },
                    true // No cache !!
                    );
            }

            else if (self.rocketMap && self.rocketMap.map) {
                
                // [IMPORTANT] Convert input feature into olFeature
                var olFeature = self.rocketMap.getFeatureById(feature.id);
                
                /*
                 * Tricky part - olFeature does not exist => add it to a layer
                 */
                if (!olFeature) {

                    var tmpLayer = self.rocketMap.getLayerByRocketId(feature.id);
                    if (tmpLayer) {
                        self.rocketMap.map.removeLayer(tmpLayer);
                    }
                    self.rocketMap.addLayer({
                        id: feature.id,
                        title: feature.properties && feature.properties.productIdentifier ? feature.properties.productIdentifier : feature.id,
                        type: 'vector',
                        zIndex: 100,
                        notInPanel: true,
                        isSelectable: true,
                        isRemovable: true,
                        isNotSearchable: true,
                        features: window.rocketmap.Util.geoJSONToOlFeatures({
                            type: 'FeatureCollection',
                            features: [
                                feature
                            ]
                        }, self.rocketMap.getProjectionCode())
                    });

                    olFeature = self.rocketMap.getFeatureById(feature.id);

                }

                self.rocketMap.selectFeature(olFeature);
                self.rocketMap.hiliteFeature(olFeature, {
                    center:true
                });
                self.rocketMap.zoomTo([olFeature], {
                    padding: [100, 100, 100, 100]
                });


                // Update selected search
                $location.search('selected', rocketServices.getLinks(feature.links, 'self')[0].href || null);

            }

            // No rocket map - jump to feature page
            else if (feature.links) {
                var selfLinks = rocketServices.getLinks(feature.links, 'self');
                if (selfLinks.length > 0) {
                    return rocketServices.go('feature', {
                        url: rocketServices.makeAbsoluteUrl(self.endPoint && self.endPoint.data ? self.endPoint.data.stacRoot : '', selfLinks[0].href)
                    },
                    {
                        reload: true
                    });
                }
            }

        };

        /**
         * Search next
         */
        self.next = function () {

            self.isLoading = true;
            rocketSearchService.searchNext(self.rocketMap, function(results) {

                self.isLoading = false;
                var featureCollection = {};
                if ( results && Array.isArray(results) ) {
                    featureCollection = results[0].data || {};
                }
                if (featureCollection.context) {
                    self.stacInfo.context.numberReturned = self.stacInfo.context.numberReturned + featureCollection.context.numberReturned;
                }
                if (featureCollection.links) {
                    for (var i = 0, ii = featureCollection.links.length; i < ii; i++) {
                        if (featureCollection.links[i].rel === 'next') {
                            self.stacInfo.hasNext = true;
                            break; 
                        }
                    }
                }

                // Make features resto compliant
                for (var i = 0, ii = featureCollection.features.length; i < ii; i++) {
                    featureCollection.features[i] = window.rocketmap.Util.adaptFeature(featureCollection.features[i]);
                }
                
                self.stacInfo.features = self.stacInfo.features.concat(featureCollection.features);
                self.tree.childs = rocketCatalogTree.getChildsFromFeatureCollection(self.stacInfo);
                
            });
        }

        /**
         * Refresh values
         * 
         * @param {Object} activeChild
         */
        function refreshEndPoint(activeChild) {
    
            if (self.endPoint && self.endPoint.data) {

                if (rocketHolder.stacBrowser && rocketHolder.stacBrowser[self.endPoint.data.stacRoot]) {
                    self.stacInfo = rocketHolder.stacBrowser[self.endPoint.data.stacRoot].stacInfo;
                    self.tree = rocketHolder.stacBrowser[self.endPoint.data.stacRoot].tree;
                    self.currentGeometry = bboxToGeometry(self.stacInfo && self.stacInfo.extent && self.stacInfo.extent.spatial && self.stacInfo.extent.spatial.bbox ? self.stacInfo.extent.spatial.bbox[0] : null);
                }

                else {
                    var stacInfo = self.endPoint.data;
                    stacInfo.planet = (self.endPoint.data && self.endPoint.data.planet ? self.endPoint.data.planet : defaultPlanet).toLowerCase();
                    self.stacInfo = stacInfo;
                    var endPoint = stacUtil.stacToEndPoint(self.stacInfo, self.endPoint.data.stacRoot);
                    self.tree = rocketCatalogTree.getTree({ 
                        href: endPoint.url,
                        title: self.stacInfo.title
                    }, endPoint.data, null);
                    self.currentGeometry = bboxToGeometry(self.stacInfo && self.stacInfo.extent && self.stacInfo.extent.spatial && self.stacInfo.extent.spatial.bbox ? self.stacInfo.extent.spatial.bbox[0] : null);
                }
        
                if (activeChild) {
                    self.setChild(activeChild);
                }
                else {
                    if (self.onLoadEnd) {
                        self.onLoadEnd({ tree: self.tree });
                    }
                }

                if ($location.search().catalog) {
                    _retrieveCatalog($location.search().catalog);
                }
                else if (self.endPoint && self.endPoint.options && self.endPoint.options.defaultUnfolded) {
                    _retrieveCatalog(self.endPoint.options.defaultUnfolded);
                }

            }
            else {
                self.stacInfo = null;
                self.tree = null;
                self.currentGeometry = null;
            }

        }

        /**
         * Convert a bbox to a polygonal geometry
         * 
         * @param {array} bbox 
         */
        function bboxToGeometry(bbox) {

            if (!bbox) {
                return null;
            }

            return {
                type: 'Polygon',
                coordinates: [
                    [
                        [bbox[0], bbox[1]],
                        [bbox[0], bbox[3]],
                        [bbox[2], bbox[3]],
                        [bbox[2], bbox[1]],
                        [bbox[0], bbox[1]]
                    ]
                ]
            }
            
        }

        /**
         * Extract preview for collection from links or assets
         * 
         * @param {object} stacInfo 
         */
        function _getPreview(stacInfo) {

            var previewLinks = rocketServices.getLinks(stacInfo.links, 'preview');
            if (previewLinks && previewLinks[0]) {
                return previewLinks[0];
            }

            if (stacInfo.assets) {
                for (var key in stacInfo.assets) {
                    // [STAC] support new "roles" array and old "role" string
                    if (stacInfo.assets[key].role === 'thumbnail' || (stacInfo.assets[key].roles && stacInfo.assets[key].roles.indexOf('thumbnail') !== -1)) {
                        return stacInfo.assets[key];
                    }
                }
            }

            return null;

        }

        /**
         * Process input FeatureCollection
         * 
         * @param {Object} stacInfo
         * @param {Object} child
         */
        function _processFeatureCollection(stacInfo, child) {

            // First make features resto compliant
            for (var i = 0, ii = stacInfo.features.length; i < ii; i++) {
                stacInfo.features[i] = window.rocketmap.Util.adaptFeature(stacInfo.features[i]);
            }

            /*
             * Next is here
             */
            if ( stacInfo.links ) {
                for (var i = 0, ii = stacInfo.links.length; i < ii; i++) {
                    if (stacInfo.links[i].rel === 'next') {
                        stacInfo.hasNext = true;
                        break; 
                    }
                }
            }

            /* 
             * If result is a resto FeatureCollection then replace
             * the current search layer with new results
             */ 
            if ( stacInfo.context && stacInfo.context.query && stacInfo.context.query.appliedFilters )  {

                var responses = {};
                responses[self.endPointUrl] = stacInfo;
                rocketSearchService.search({
                    responses:responses
                }, self.rocketMap);

            }

            /*
             * Otherwise create a new olLayer from the FeatureCollection and zoom on it
             */
            else if (self.rocketMap && self.rocketMap.map) {

                var tmpLayer = self.rocketMap.getLayerByRocketId(child.href);
                if (tmpLayer) {
                    self.rocketMap.map.removeLayer(tmpLayer);
                }
                self.rocketMap.addLayer({
                    id: child.href,
                    title: child.title,
                    type: 'vector',
                    zIndex: 100,
                    notInPanel: false,
                    isSelectable: true,
                    isRemovable: true,
                    isNotSearchable: true,
                    features: window.rocketmap.Util.geoJSONToOlFeatures(stacInfo, self.rocketMap.getProjectionCode())
                }, {
                    center: true
                });

            }

            return stacInfo;

        }

        function _initAddEndPoint() {
            console.log('init')
            self.mapIsLoading = true;
        }

        function _addEndPoint() {
            console.log('add')
            self.mapIsLoading = false;
        }

        function _featureHilited(obj) {
            if (obj) {
                self.watch.hilitedFeatureId = obj.getId();
            }
        }

        /**
         * Retrieve catalog from url
         * 
         * @param string url
         */
        function _retrieveCatalog(url) {

            var rootUrl = null;
            var catalog = null;
            restoAPI.getResource(url)
				.then(
					(result) => {
						if (result.status === 200) {
							if (result.data && result.data.links) {
                                for (var i = 0, ii = result.data.links.length; i < ii; i++) {
                                    if (result.data.links[i].rel) {
                                        if (result.data.links[i].rel === 'root') {
                                            rootUrl = result.data.links[i].href;
                                        }
                                    }
                                    if (result.data.links[i].rel === 'self') {
                                        catalog = {
                                            id: result.data.id,
                                            href:result.data.links[i].href,
                                            title: result.data.title || result.data.id,
                                            description: result.data.description || '',
                                            parents:result.data.id.split('/').slice(0, -1),
                                            type:result.data.links[i]['type']
                                        };
                                    }
                                }

                                if (rootUrl) {
                                    catalog.rootUrl = rootUrl;
                                    catalog.parents = catalog.href.substring(rootUrl.length + 1).split('/').slice(0, -1);
                                }
                                self.setCatalog(catalog, $location.search().selected || null);
                            }
						}
					}
				);
        };


    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('stacCatalogBrowser', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/stacCatalogBrowser/stacCatalogBrowserDefault.html',
                    explore: 'app/components/stacCatalogBrowser/stacCatalogBrowserExplore.html'
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Callback function when start loading tree - returns nothing
                 */
                onLoadStart: '&',

                /*
                 * Callback function when tree is loaded - returns "tree" object
                 */
                onLoadEnd: '&',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * Display a breadcrumb on top of tree - default is "true"
                 */
                breadcrumb: '<',

                /*
                 * STAC catalog description as JSON document
                 */
                endPoint: '<',

                /*
                 * Active child (use to navigate in tree from parent)
                 */
                activeChild: '<',

                /*
                 * True to add changeCatalog
                 */
                canChangeCatalog: '<'

            },
            controller: 'StacCatalogBrowserController'
        });

})();