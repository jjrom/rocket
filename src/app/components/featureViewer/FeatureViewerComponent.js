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
        .controller('FeatureViewerComponent', ['$window', '$timeout', '$state', 'rocketHolder', 'restoAPI', 'rocketSearchService', 'rocketServices', 'stacUtil', 'stacFieldsUtil', 'stacFields', 'config', FeatureViewerComponent]);

    function FeatureViewerComponent($window, $timeout, $state, rocketHolder, restoAPI, rocketSearchService, rocketServices, stacUtil, stacFieldsUtil, stacFields, config) {

        var self = this;

        /*
         * Keep states in rocketHolder
         */
        rocketHolder.states.featureViewerComponent = rocketHolder.states.featureViewerComponent || {};

        /*
         * Active tab i.e. metadata or assets
         */
        self.watch = {
            isLoading:false,
            activeIndex: -1,
            activeTab:'metadata',
            enableCart:config.cart,
            // Auto load first mappable asset in feature page
            autoLoadMappable:config && config.assets && config.assets.autoLoadMappable || false,
            // Auto load first mappable asset in map page
            autoLoadMappableInMap:config && config.assets && config.assets.autoLoadMappableInMap || false
        };

        /*
         * These properties are not displayed
         */
        self.notDisplayedProperties = [
            // These properties are displayed on top
            'rocket:notRealQuicklook',
            'title',
            //'description',
            'collection',
            'quicklook',
            // Special properties
            'resto:catalogs',
            'resto:links',
            'vs'
            /*'quicklook',
            'centroid',
            'comments',
            'likes',
            'status' */
        ];

        /*
         * Feature relations
         */
        self.relations = {};

        /*
         * Feature formatted properties grouped by extension
         */
        self.formattedProperties = {};

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {

            // RocketMap
            if (changesObj.selectedFeatures && changesObj.selectedFeatures.currentValue) {
                self.watch.activeIndex = rocketHolder.states.featureViewerComponent.activeIndex || 0;
                if (self.selectedFeatures.length <= self.watch.activeIndex) {
                    self.watch.activeIndex = self.selectedFeatures.length > 0 ? 0 : -1;
                }
                _onSelectFeature(self.watch.activeIndex);
            }

            // Feature - rebuild properties
            if (changesObj.feature && changesObj.feature.currentValue) {
                if (self.feature) {
                    self.formattedProperties[self.feature.id] = _getformattedProperties(self.feature);
                    self.legendUrl = _getLegendUrl(self.feature);
                    _retrieveRelations(self.feature);
                }
            }

        };

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
         * Show tab
         * 
         * @param {string} tabName 
         */
        self.showTab = function (tabName) {

            self.watch.activeTab = tabName;

            /*
             * Scroll to top of page
             * Chrome strange stuff - https://stackoverflow.com/a/27556697 
             */
            $('body, html, #feature-panel-content').animate({ scrollTop: 0} , 200);

        };

        /**
         * Close panel i.e. unselect all features
         * 
         */
        self.close = function () {
            self.rocketMap.unselectAll(true);
        };

        /**
         * Return true if role exist in feature assets
         * 
         * @param {object} feature
         * @param {string} role
         */
        self.hasRole = function (feature, role) {
            return stacUtil.hasRole(feature, role)
        };

        /**
         * Return assets from role
         * 
         * @param {object} feature
         * @param {string} role
         */
        self.getAssetsArray = function (feature, role) {
            return stacUtil.getAssetsArray(feature, role);
        };

        /**
         * Select the next or previous feature in the selection list
         *
         * @param {string} direction
         */
        self.rotateSelectedFeature = function (direction) {

            var index = 0, ii = self.selectedFeatures.length;

            if (ii === 0) {
                return;
            }

            if (self.watch.activeIndex > -1) {
                if (direction === 'next') {
                    index = self.watch.activeIndex + 1 < ii ? self.watch.activeIndex + 1 : 0;
                } else {
                    index = self.watch.activeIndex - 1 >= 0 ? self.watch.activeIndex - 1 : ii - 1;
                }
            }

            self.watch.activeIndex = index;
            _onSelectFeature(self.watch.activeIndex);

        };

        /**
         * Zoom on feature
         *
         * @param {Feature} feature
         * @param {Event} evt
         */
        self.centerOnFeature = function (feature, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            var olFeature = self.rocketMap.getFeatureById(feature.id);
            if (olFeature) {
                self.rocketMap.zoomTo([olFeature], {
                    padding: [100, 100, 100, 100]
                });
            }
        };

        /**
         * Return the jumpUrl of input obj
         * 
         * @param {object} obj
         * @param {Event} evt
         */
        self.getJumpUrl = function(obj) {
            
            obj = obj || {};
            var selfLinks = rocketServices.getLinks(obj.links, 'self');
            if (selfLinks.length > 0) {
                return selfLinks[0].href;
            }

            return null;

        };

        /**
         * Jump to a feature page
         * 
         * @param {object} obj
         * @param {Event} evt
         */
        self.jumpTo = function (obj, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            obj = obj || {};
            obj.link = obj.link || {}
            obj.link.href = self.getJumpUrl(obj.feature);

            if (!obj.link.href) {
                return;
            }

            // Non local - easy just jump to page
            if (!obj.local) {

                return config.openFeaturePageInNewTab ? window.open($state.href('feature', {
                    url: obj.link.href
                }), '_blank') : rocketServices.go('feature', {
                    url: obj.link.href
                },
                {
                    reload: true
                });
                
            }

            // Local means - go to feature on the map
            // If it does not exist create it first
            self.watch.isLoading = true;

            restoAPI.getFeature(obj.link.href,
                function (feature) {

                    self.watch.isLoading = false;

                    // First search feature in existing layers
                    var olFeature = self.rocketMap.getFeatureById(feature.id);

                    if (!olFeature) {

                        if (!self.rocketMap.getLayerByRocketId(obj.link.href)) {

                            // Otherwise create layer
                            self.rocketMap.addLayer({
                                id: obj.link.href,
                                title: obj.link.title || feature.id,
                                features: window.rocketmap.Util.geoJSONToOlFeatures({
                                    type: 'FeatureCollection',
                                    features: [
                                        feature
                                    ]
                                }, self.rocketMap.getProjectionCode()),
                                isSelectable: true,
                                isRemovable: true
                            }, {
                                center: true
                            });
                            olFeature = self.rocketMap.getFeatureById(feature.id);
                        }
                    }

                    if (olFeature) {
                        self.rocketMap.selectFeature(olFeature);
                        self.rocketMap.hiliteFeature(olFeature, {
                            center:true
                        });
                        self.rocketMap.zoomTo([olFeature], {
                            padding: [100, 100, 100, 100]
                        });

                        return $timeout(function () {
                            self.selectedFeatures = window.rocketmap.Util.featuresToGeoJSON([olFeature], self.rocketMap.getProjectionCode());
                            self.watch.activeIndex = self.selectedFeatures.length > 0 ? 0 : -1;
                            _onSelectFeature(self.watch.activeIndex);
                        });

                    }
                },
                function (error) {
                    self.watch.isLoading = false;
                }
            );

        };

        /**
         * Search on catalog
         * 
         * @param {string} catalog 
         * @param {object} options // append:true to append to existing filters
         */
        self.searchOnCatalog = function (catalog, options) {

            options = options || {};

            /*
             * Compute keywords from keyword
             */
            var filters = $.extend(rocketSearchService.qToFilters(catalog),{
                next:null,
                prev:null
            });

            /*
             * Set filters and search
             */
            rocketSearchService.addFilters(filters, {
                append: options.append
            });
            rocketSearchService.search({}, self.rocketMap);

        };

        self.getNiceFeatureTitle = function(feature) {
            return rocketServices.getNiceFeatureTitle(feature);
        }

        /**
         * Called when feature is indexed
         * 
         * @param {integer} index 
         */
        function _onSelectFeature(index) {

            var olFeature;
            if (index > -1) {
                olFeature = self.rocketMap.getFeatureById(self.selectedFeatures[index].id);

                // Retrieve resources
                _retrieveRelations(self.selectedFeatures[index]);

                // Rebuild formatted properties
                self.formattedProperties[self.selectedFeatures[index].id] = _getformattedProperties(self.selectedFeatures[index]);

                /*self.rocketMap.zoomTo([olFeature], {
                    padding: [100, 100, 100, 100]
                });*/
            }

            self.rocketMap.hiliteFeature(olFeature);

            // Store to rocketHolder
            rocketHolder.states.featureViewerComponent.activeIndex = index;

            $('body, html, #feature-panel-content').animate({ scrollTop: 0} , 0);
        };

        /**
         * Retrieve relations for feature
         * 
         * @param {object} feature
         */
        function _retrieveRelations(feature) {

            if (!feature || !feature.links) {
                return;
            }

            for (var i = feature.links.length; i--;) {
                if (feature.links[i].rel === 'child' || feature.links[i].rel === 'isSampleOf') {
                    (function (link, rel) {
                        restoAPI.getResource(link)
                            .then(
                                (result) => {
                                    if (result.status !== 200) {
                                        return;
                                    }
                                    var catalog = result.data || {};
                                    var items = [];

                                    if (catalog.links) {
                                        for (var j = 0, jj = catalog.links.length; j < jj; j++) {
                                            if (catalog.links[j].rel === 'item') {
                                                items.push(catalog.links[j]);
                                            }
                                        }
                                    }
                                    if (items.length > 0) {
                                        if (!self.relations[feature.id]) {
                                            self.relations[feature.id] = {};
                                        }
                                        self.relations[feature.id][rel] = items;
                                    }
                                }
                            );
                    })(feature.links[i].href, feature.links[i].rel);

                }
            }
        }

        /**
         * Group properties per extension and format display
         * 
         * @param {Object} feature
         */
        function _getformattedProperties(feature) {

            var formattedProperties = [];

            if ( !feature ) {
                return formattedProperties;
            }

            feature.properties = feature.properties || {};

            var groupedProperties = {
                common: {
                    title: 'Common',
                    properties: []
                }
            };

            for (var key in stacFields.extensions) {
                groupedProperties[key] = {
                    title:typeof stacFields.extensions[key] === 'string' ? stacFields.extensions[key] : stacFields.extensions[key].label,
                    description:stacFields.extensions[key].explain,
                    properties:[]
                }
            }

            // Add Other
            groupedProperties.other = {
                title:'Other',
                properties:[
                    {
                        key:'id',
                        value:feature.id
                    }
                ]
            };

            // Collection
            if ( feature.collection ) {
                groupedProperties.common.properties.push({
                    key:'collection',
                    value:stacFieldsUtil.format(feature.collection, 'collection', feature)
                });
            }

            for (var property in feature.properties) {

                if (self.notDisplayedProperties.indexOf(property) !== -1) {
                    continue;
                }

                // [TODO] Temporary discard itag - would be better to display it nicely instead
                if (property.startsWith('itag:')) {
                    continue;
                }

                groupedProperties[_getExtensionName(property)].properties.push({
                    key:property,
                    label:_getPropertyLabel(property),
                    value:stacFieldsUtil.format(feature.properties[property], property, feature)
                });

            }

            for (var key in groupedProperties) {
                if (groupedProperties[key].properties.length > 0) {
                    formattedProperties.push({
                        key:groupedProperties[key].title,
                        isHeader:true
                    });
                    formattedProperties.push(...groupedProperties[key].properties);
                }
            }
            
            return formattedProperties;

        }

        /**
         * Return extension name form STAC property
         * 
         * @param {string} propertyName
         */
        function _getExtensionName(propertyName) {

            switch (propertyName) {
                case 'title':
                case 'description':
                case 'datetime':
                case 'created':
                case 'updated':
                case 'start_datetime':
                case 'end_datetime':
                case 'license':
                case 'providers':
                case 'platform':
                case 'instruments':
                case 'constellation':
                case 'mission':
                case 'gsd':
                    return 'common';
            }

            var exploded = propertyName.split(':');
            var extensions = Object.keys(stacFields.extensions);

            if ( extensions.indexOf(exploded[0]) !== -1) {
                return exploded[0];
            }

            return 'other';

        }

        function _getPropertyLabel(propertyName) {
            var metadata = stacFields.metadata[propertyName];
            if (metadata) {
                return typeof metadata == 'string' ? metadata : metadata.label;
            }
            return null;
        }

        /**
         * Return legend url of first WMS layer
         * 
         * @param {Object} feature 
         */
        function _getLegendUrl(feature) {
            if ( !feature || !feature.assets ) {
                return null;
            }
            for (var key in feature.assets) {
                if (feature.assets[key].type === 'OGC:WMS' || feature.assets[key].type === 'wms') {
                    var parsedWMS = window.rocketmap.Util.parseWMSGetMap(feature.assets[key].href);
                    if (parsedWMS && parsedWMS.legend) {
                        return parsedWMS.legend;
                    }
                }
            }
            return null;
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('featureViewer', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/featureViewer/featureViewerDefault.html',
                    panel: 'app/components/featureViewer/featureViewerPanel.html',
                    panelTabs: 'app/components/featureViewer/featureViewerPanelTabs.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Callback to parent when a trigger (e.g. click on asset) is actived
                 * List of trigger names:
                 *   - 'showmeasurement'
                 */
                onAssetTrigger: '&',

                /*
                 * Callback to parent when a click on a property
                 */
                onPropertyTrigger: '&',

                /*
                 * Input classes
                 */
                inputClass: '<',

                /*
                 * True to have close button
                 */
                closeMe: '<',

                /* 
                 * HTML template - either 'default' or 'panel'.
                 */
                template: '@',

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /*
                 * Single input feature
                 */
                feature: '<',

                /*
                 * Input features
                 */
                selectedFeatures: '<'

            },
            controller: 'FeatureViewerComponent'
        });

})();