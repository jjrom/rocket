/* 
 * rocket Map
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
/**
 * RocketMap rules 
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    /**
     * map view
     */
    window.rocketmap.Map = function () {

        this.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

        /*
         * CONSTANT
         */
        this.AOI_LAYER_ID = 'AOI_LAYER_ID';

        this.MAX_ZOOM = 19;

        /*
         * Default extent includes an horizontal margin to window.ol.proj.get("EPSG:3857").getExtent()
         * (i.e. [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244] )
         * for easy viewing of -180/180 centred map
         */
        this.EARTH_EXTENT = [
            -20037508.342789244 - 10018754,
            -20037508.342789244,
            20037508.342789244 + 10018754,
            20037508.342789244
        ];

        /*
         * Default projCode
         */
        this.defaultProjCode = 'EPSG:3857';

        /*
         * Default extent
         */
        this.defaultExtent = [];

        /*
         * Create only one style to limit memory leaks
         */
        this.styles = {};

        /*
         * Styles configuration
         */
        this.stylesConfig = {};

        /*
         * The div container of the map
         */
        this.target = 'map';

        /*
         * True to enable navigation on click.
         * False otherwise
         */
        this.navigationEnabled = true;

        /*
         * True when pinMenu is enabled i.e. visible
         */
        this._pinMenuEnabled = false

        /*
         * Active background config
         */
        this._activeBackground = {};

        /*
         * Reference to 3D Globe
         */
        this.globe = null;

        /*
         * True if map is initialized
         */
        this.isInitialized = false;

        /*
         * Current planet - for 3D Globe
         */
        this.planet = 'earth';

        /**
         * Registered events
         * 
         *  "initialized"
         * 
         *      When:
         *          When map object is ready
         * 
         *      Returns:
         *          center: [lon, lat, zoom] // New map center
         * 
         *  "enableglobe"
         * 
         *      When:
         *          When 3D globe is enable/disable
         * 
         *      Returns:
         *          boolean
         * 
         *  "preaddlayer"
         * 
         *      When:
         *          Triggered before addLayer is requested
         * 
         *      Returns:
         *          layerConfig, params
         * 
         * *  "propertychange"
         * 
         *      When:
         *          Triggered when a layer property (usually _rocket) changed
         * 
         *      Returns:
         *          olLayer, params
         * 
         *  "addlayer"
         * 
         *      When:
         *          When a layer is added to the map
         * 
         *      Returns:
         *          olLayer, params
         * 
         *  "updatelayer"
         * 
         *      When:
         *          When a layer is updated
         * 
         *      Returns:
         *          olLayer
         * 
         *  "removelayer"
         * 
         *      When:
         *          When a layer is removed from the map
         * 
         *      Returns:
         *          olLayer
         * 
         * "searchend"
         * 
         *      When:
         *          When searchEnd() function is called. This function should be triggered
         *          by external call e.g. by rocket searchToolbar component once search is complete
         * 
         *      Returns:
         *          [] // Array of results
         *          {} // Additional parameters
         * 
         *  "selectedfeatures"
         * 
         *      When:
         *          Each time features are selected/unselected
         *      
         *      Returns:
         *          [] // Array of olFeatures or [] if no features selected   
         * 
         *  "moveend"
         * 
         *      When:
         *          Each time map stop moving
         *      
         *      Returns:
         *          center: [lon, lat, zoom] // New map center   
         * 
         *  "hilitedfeature"
         * 
         *      When:
         *          Each time a feature is hilited
         *      
         *      Returns:
         *          olFeature // olFeature hilited 
         * 
         *   "hoverfeature"
         * 
         *      When:
         *          Each time a feature is hovered by the mouse
         *      
         *      Returns:
         *          olFeature // olFeature hovered
         *          pixel: [line, col]
         * 
         *  "clearfeatureinfo"
         * 
         *      When:
         *          Never. Triggered using clearFeatureInfo()
         * 
         *  "click"
         * 
         *      When:
         *          Each time a click is performed on map
         *          [WARNING] The click event is linked with mapPinUseLongClick
         *                    To get a click instantaneously whatever mapPinUseLongClick value, use 'clickstart' event 
         *      
         *      Returns:
         *          {
         *              pixel: [line, col], // Pixel position on viewport (i.e. in map)
         *              coordinate: [] // Map coordinate in map projection
         *          }   
         * 
         *  "clickstart"
         * 
         *      When:
         *          Each time a click is performed on map
         *      
         *      Returns:
         *          {
         *              pixel: [line, col], // Pixel position on viewport (i.e. in map)
         *              coordinate: [] // Map coordinate in map projection
         *          }   
         * 
         *  "panstart"
         *      
         *      When:
         *          Each time a click is performed on map
         *      
         *      Returns:
         *          {
         *              pixel: [line, col] // Pixel position on viewport (i.e. in map)
         *          }   
         * 
         *  "dragfeaturestart"
         *      
         *      When:
         *          Each time a feature drag start
         *      
         *      Returns:
         *          {
         *              coordinate: [], // Map coordinate in map projection
         *              olFeature: // olFeature dragged
         *          }   
         * 
         *   "dragfeature"
         *      
         *      When:
         *          Each time a feature is dragged
         *      
         *      Returns:
         *          {
         *              coordinate: [], // Map coordinate in map projection
         *              olFeature: // olFeature dragged
         *          }   
         * 
         *   "dragfeaturestop"
         *      
         *      When:
         *          Each time a feature drag stop
         *      
         *      Returns:
         *          {
         *              coordinate: [], // Map coordinate in map projection
         *              olFeature: // olFeature dragged
         *          }   
         * 
         */
        this.registeredEvents = {};

        /**
         * Initialize map with input features array
         * 
         * @param {Object} options
         */
        this.init = function (options) {
            
            options = options || {};

            if (options.target) {
                this.target = options.target;
            }

            /*
             * Default map defaultProjCode
             */
            if (options.defaultProjCode) {
                this.defaultProjCode = options.defaultProjCode;
            }

            /*
             * Initialize layer config
             */
            this.stylesConfig = options.stylesConfig;

            /*
             * Initialize map
             */
            this._initMap(options);

            /*
             * Initialize controls
             */
            this._initControls(options);

            /*
             * Set events
             */
            this._initEvents(options);

            /*
             * Add layers
             */
            this.setLayers(options.layersConfig, options.defaultParams);

            /*
             * Initialize 3D if requested
             */
            if (options.globeConfig && options.globeConfig.enabled && window.rocketmap.Util.hasWebGL()) {
                this.globe = new window.rocketmap.Globe(this, options.globeConfig);
            }

            return this;
        };

        /**
         * Trigger a click at a given latlon
         * @param {array} coordinate 
         */
        this.triggerClick = function(coordinate) {
            this._callback('click', {
                coordinate: coordinate
            });
        }

        /**
         * Trigger a clearfeatureinfo
         * @param {array} coordinate 
         */
        this.clearFeatureInfo = function() {
            this._callback('clearfeatureinfo');
        }

        /**
         * Set planet (for 3D globe)
         * 
         * @param {string} planet 
         * @param {string} defaultProjCode 
         */
        this.setPlanet = function (planet, defaultProjCode) {
            this.planet = planet;
            if (defaultProjCode !== this.defaultProjCode) {
                this.defaultProjCode = defaultProjCode;
                this.setViewProjection({
                    projection:this.defaultProjCode
                });
            }
        }

        /**
         * Set view projection
         * 
         * @param {object} viewOptions
         */
        this.setViewProjection = function(viewOptions) {
            
            // Store old (i.e. before setView) projection
            var sourceProj = this.getProjectionCode();

            viewOptions = viewOptions || {};
            viewOptions.projection = viewOptions.projection ? viewOptions.projection.toUpperCase() : this.defaultProjCode;

            // No proj4
            if ( !window.proj4 ) {
            //if ( !window.proj4 || !viewOptions.projection || ['EPSG:3857', 'EPSG:4326'].indexOf(viewOptions.projection) !== -1 ) {
                this.map.setView(new window.ol.View({
                    center: viewOptions.center || [0, 0],
                    zoom: viewOptions.zoom || 1,
                    extent: viewOptions.extent || undefined,
                    projection: viewOptions.projection
                }));
            }
            else {

                var proj = window.ol.proj.get(viewOptions.projection);
                var extent = proj.getExtent();
                var projectedExtent = this.map.getView() && this.map.getView().getCenter() ? window.ol.proj.transformExtent(this.map.getView().calculateExtent(this.map.getSize()), this.getProjectionCode(), viewOptions.projection) : null;

                this.map.setView(new window.ol.View({
                    projection: proj,
                    center: viewOptions.center || window.ol.extent.getCenter(extent || [0, 0, 0, 0]),
                    zoom: viewOptions.zoom || 0,
                    extent: extent || undefined,
                }));

                if ( projectedExtent ) {
                    this.map.getView().fit(projectedExtent);
                }
                
            }
            
            // Reproject also vector layers
            var targetProj = this.getProjectionCode();
            if ( sourceProj !== targetProj ) {
                this.map.getLayers().forEach(function (layer) {
                    if ( typeof layer.getSource().getFeatures === 'function' ) {
                        layer.getSource().getFeatures().forEach(function (feature) {
                            if (feature.getGeometry()) {
                                feature.getGeometry().transform(sourceProj, targetProj);
                            }
                        });
                    }
                });
            }
            
          
            /* Example how to prevent double occurrence of map by limiting layer extent
            if (newProj.isGlobal()) {
              layers['bng'].setExtent(
                transformExtent(proj27700.getExtent(), proj27700, newProj, 2)
              );
            } else {
              layers['bng'].setExtent(undefined);
            }
            */
        }

        /**
         * Get map projection code
         * @returns string
         */
        this.getProjectionCode = function() {
            return this.map && this.map.getView() ? this.map.getView().getProjection().getCode() : this.defaultProjCode; 
        };

        /**
         * Register an event
         */
        this.on = function (eventName, fct) {

            if (!this.registeredEvents[eventName]) {
                this.registeredEvents[eventName] = [];
            }

            if (this.registeredEvents[eventName].indexOf(fct) === -1) {
                this.registeredEvents[eventName].push(fct);
            }

        };

        /**
         * Unregister an event
         */
        this.un = function (eventName, fct) {

            if (this.registeredEvents[eventName]) {
                var index = this.registeredEvents[eventName].indexOf(fct);
                if (index !== -1) {
                    this.registeredEvents[eventName].splice(index, 1);
                }
            }

        };

        /**
         * Trigger an event
         * 
         * @param {string} eventName
         * @param {Object} obj Attached object
         */
        this.triggerEvent = function (eventName, obj) {
            return this._callback(eventName, obj);
        };

        /**
         * Return true if map is in 3D mode - false otherwise
         */
        this.isGlobeEnabled = function () {
            return this.globe && this.globe.isEnabled();
        };

        /**
         * Enable/disable globe
         * 
         * @param {boolean} bool
         * @param {Event} evt
         */
        this.enableGlobe = function (bool, evt) {

            if (evt) {
                evt.stopPropagation();
            }

            if (!this.globe) {
                return false;
            }

            if ( !this.globe.initialized ) {
                var self = this;
                $('#' + this.target).append('<div id="globeisloading" class="loading-mask"><div class="amiddle bigger white center"><h4>Loading 3D Globe</h4><i class="fa fa-spin fa-refresh fa-circle-notch"></i></div></div>');
                return this.globe.init(function() {
                    $( "#globeisloading" ).remove();
                    self.enableGlobe(bool);
                });
            }
            
            // Callback
            this._callback('enableglobe', this.globe.setEnabled(bool, this.planet));
            
        };

        /**
         * Set layers to map from layers config object
         * 
         * [WARNING] This would erase existing layers
         * 
         * @param {array} layersConfig 
         * @param {object} params
         */
        this.setLayers = function (layersConfig, params) {
            
            var self = this;

            /*
             * Clear activeBackground
             */
            this._activeBackground = null;

            /*
             * Clear selectLayer
             */
            this.selectLayer = null;

            /*
             * Remove all layers
             */
            this._removeAllLayers();

            layersConfig = layersConfig || [];
            params = params || {};

            for (var i = 0, ii = layersConfig.length; i < ii; i++) {
                (function (layerConfig, params) {
                    self.addLayer(layerConfig, params, function (layer) {
                        if (!self._activeBackground && layer.get('_rocket') && layer.get('_rocket').isBackground) {
                            self.setActiveBackground(layer.get('_rocket').id);
                        }
                    });
                })(layersConfig[i], params);
            }

            /*
             * Initialize selectLayer and hoverLayer if not exist
             */
            ['select', 'hover'].forEach(name => {

                var tmpLayer = this.getLayerByRocketId('__' + name + '__');

                // Layer already
                if (tmpLayer) {

                    self[name + 'Layer'] = tmpLayer;

                    // Select layer already exist => trigger callback for selectedfeatures
                    if (name === 'select' && tmpLayer.get('_rocket').features) {
                        this._callback('selectedfeatures', tmpLayer.get('_rocket').features);
                    }
                    
                }
                else {
                    this._getLayer({
                        id: '__' + name + '__',
                        type: 'vector',
                        notInPanel: true,
                        // Store olFeatures in layerConfig when calling rocketMap.getLayerConfig
                        storeFeatures: name === 'select' ? true : false,
                        isSystem: name === 'select' ? false : true,
                        styleName: name === 'select' ? 'selected' : 'hilited',
                        zIndex: 200
                    },
                    {},
                    function (layer, error) {

                        self[name + 'Layer'] = layer;

                        // For 3D mode
                        self[name + 'Layer'].set('altitudeMode', 'clampToGround');

                        if (self.map) {
                            self.map.addLayer(self[name + 'Layer']);
                        }

                    });
                }
            });

        };

        /**
         * Add a layer from layer config object
         * 
         * @param {object} layerConfig
         * @param {object} params
         * @param {function} callback
         */
        this.addLayer = function (layerConfig, params, callback) {

            var self = this;

            params = params || {};

            // Provide a preaddlayer info
            self._callback('preaddlayer', layerConfig, params);

            self._getLayer(layerConfig, params, function (layer, error) {

                if (layer && self.map) {

                    // Add to map
                    self.map.addLayer(layer);

                    // Callback
                    self._callback('addlayer', layer, params);

                    // Eventually zoom on layer
                    if (params.center) {
                        self.zoomTo(layer, {
                            padding: [100, 100, 100, 100]
                        });
                    }

                }

                if (callback) {
                    callback(layer, error);
                }

            });

        };

        /**
         * Remove a layer - just a wrapper to OpenLayers with an event
         * 
         * @param {object} olLayer
         */
        this.removeLayer = function (olLayer) {

            if ( !olLayer || !this.map ) {
                return olLayer;
            }
            
            var isSearchLayer = olLayer.get('_rocket') && olLayer.get('_rocket').type === 'search';

            // Remove attached layer (e.g. heatmap)
            if (olLayer.get('_rocket') && olLayer.get('_rocket').linkedLayer) {
                var tmpLayer = this.getLayerByRocketId(olLayer.get('_rocket').linkedLayer.id);
                if (tmpLayer) {
                    this.map.removeLayer(tmpLayer);
                }
            }

            var layerId = olLayer.get('_rocket') && olLayer.get('_rocket').id;

            // Eventually remove linked AOI layer
            var aoiLayer = this.getLayerByRocketId(this.AOI_LAYER_ID);
            if (aoiLayer && layerId && aoiLayer.get('_rocket').parent === layerId) {
                this.map.removeLayer(aoiLayer);
            }

            // And selected/hilited feature
            // [TODO] Find a better way to only unselect feature if it belongs to removed layer
            this.unselectAll();
             
            var output = this.map.removeLayer(olLayer);

            // Callback
            this._callback('removelayer', layerId);

            // [IMPORTANT] Callback to searchend if a search layer is removed
            if (isSearchLayer) {
                this.searchEnd();
            }

            return output;

        };

        /**
         * Return layers config object
         */
        this.getLayers = function () {

            var self = this;

            var layers = {
                activeBackground: this._activeBackground ? this.getLayerByRocketId(this._activeBackground.id) : null,
                aoi:this.getLayerByRocketId(this.AOI_LAYER_ID),
                backgrounds:[],
                overlays:[],
                searches:[]
            }
            if ( this.map ) {
                this.map.getLayers().forEach(function (layer) {
                    var _rocket = layer.get('_rocket');
                    if (_rocket) {
                        if (!_rocket.notInPanel) {
                            if (_rocket.isBackground) {
                                layers.backgrounds.push(layer) 
                            }
                            else if (_rocket.type === 'search') {
                                layers.searches.push(layer);
                            }
                            else if (_rocket.id !== self.AOI_LAYER_ID) {
                                layers.overlays.push(layer);
                            }
                        }
                    }
                });
            }
            
            return layers;

        };

        /**
         * Return rocket layerConfig
         */
        this.getLayersConfig = function () {
            
            var layersConfig = [];

            if ( this.map ) {
                this.map.getLayers().forEach(function (layer) {

                    var rocket = layer.get('_rocket');

                    // Force store features when specified
                    if (rocket.storeFeatures) {
                        rocket.features = layer.getSource().getFeatures();
                    }

                    // Return all layer config except "system" layers
                    if (!rocket.isSystem) {
                        layersConfig.push(rocket);
                    }
                });
            }

            return layersConfig;
        };

        /**
         * Return the map extent with longitude strictly between -180 and 180 degrees
         * 
         * @param {integer} precision (number of digits returned)
         */
        this.getGeoExtent = function (precision) {

            if ( !this.map ) {
                return [-180, -90, 180, 90];
            }

            var rawExtent = window.ol.extent.applyTransform(this.map.getView().calculateExtent(this.map.getSize()), window.ol.proj.getTransform(this.getProjectionCode(), 'EPSG:4326'));

            /*
             * Longitudes are updated to be within [-180, 180] but the order of
             * longitude should not be changed otherwise resto will split input bbox
             * into completmentary bbox (i.e. two polygons around -180/180
             */
            var lonMin, lonMax;
            if (rawExtent[2] - rawExtent[0] >= 180) {
                lonMin = -180;
                lonMax = 180;
            }
            else {
                lonMin = window.rocketmap.Util.correctLongitude(rawExtent[0]);
                lonMax = window.rocketmap.Util.correctLongitude(rawExtent[2]);
            }
            return [
                precision ? window.rocketmap.Util.round(lonMin, precision) : lonMin,
                precision ? window.rocketmap.Util.round(rawExtent[1], precision) : rawExtent[1],
                precision ? window.rocketmap.Util.round(lonMax, precision) : lonMax,
                precision ? window.rocketmap.Util.round(rawExtent[3], precision) : rawExtent[3]
            ];
        };

        /**
         * Call this function to propagate a 'searchend' event with
         * the list of 'search' olLayers
         * 
         * @param {object} Additional params pass to searchend
         */
        this.searchEnd = function (params) {
            this._callback('searchend', this.getSearchResults(), params || {});
        };

        /**
         * Call this function to propagate a 'propertychange' event
         * 
         * @param {object} Additional params pass to searchend
         */
        this.propertyChange = function (olLayer, propertyName, propertyValue) {
            var properties = {};
            properties[propertyName] = propertyValue;
            this._callback('propertychange', olLayer, properties);
        };

        /**
         * Return results from all 'search' layers
         * 
         * @return {array}
         */
        this.getSearchResults = function () {
            var results = [];
            var projCode = this.getProjectionCode();
            if (this.map && this.map.getLayers) {
                this.map.getLayers().forEach(function (olLayer) {
                    if (olLayer.get('_rocket') && olLayer.get('_rocket').type === 'search') {

                        // Reorder features based on datetime property
                        var next = null;
                        var featureCollection = window.rocketmap.Util.layerToGeoJSON(olLayer, projCode);
                        if (featureCollection && featureCollection.features) {
                            featureCollection.features.sort(function (a, b) {
                                if (a.properties.datetime && b.properties.datetime) {
                                    return (a.properties.datetime < b.properties.datetime) ? 1 : (a.properties.datetime > b.properties.datetime) ? -1 : 0;
                                }
                                return !a.properties.datetime ? 0 : 1;
                            });
                            if (featureCollection.links) {
                                for (var i = 0, ii = featureCollection.links.length; i < ii; i++) {
                                    if (featureCollection.links[i].rel === 'next') {
                                        next = featureCollection.links[i].href;
                                    }
                                }    
                            }
                        }
                        
                        results.push({
                            id: olLayer.get('_rocket').id,
                            title: olLayer.get('_rocket').title,
                            next:next,
                            featureCollection: featureCollection
                        });
                    }
                });
            }
            return results;
        };

        /**
         * Return search results extent
         * 
         * @return array
         */
        this.getSearchResultsExtent = function () {
            var extent = window.ol.extent.createEmpty();
            if (this.map && this.map.getLayers) {
                this.map.getLayers().forEach(function (olLayer) {
                    if (olLayer.get('_rocket') && olLayer.get('_rocket').type === 'search') {
                        window.ol.extent.extend(extent, olLayer.getSource().getExtent())
                    }
                });
            }
            return extent;
        };

        /**
         * Return all features in map view
         * 
         * @return array
         */
        this.getFeaturesInView = function() {

            var self = this;
            var layers = self.getLayers();
            var featuresInView = [];
            var mapExtent = self.map.getView().calculateExtent(self.map.getSize());
            var projCode = this.getProjectionCode();
            // Parse searches and overlays
            for (var key of ['searches', 'overlays']) {
                for (var i = 0, ii = layers[key].length;  i <ii; i++) {
                    if (typeof layers[key][i].getSource === 'function' && typeof layers[key][i].getSource().getFeatures === 'function') {
                        layers[key][i].getSource().getFeatures().forEach(function (olFeature) {
                            if (olFeature && olFeature.getGeometry() && window.ol.extent.intersects(olFeature.getGeometry().getExtent(), mapExtent)) {
                                featuresInView.push(window.rocketmap.Util.featureToGeoJSON(olFeature, projCode));
                            }
                        });
                    } 
                    
                }
            }

            return featuresInView;
        };

        /**
         * Enable/Disable navigation click
         * 
         * @param {boolean} bool
         */
        this.enableNavigation = function (bool) {
            this.navigationEnabled = bool;
        };

        /**
         * Pan map to center 
         * 
         * @param {array} lonLatZoom
         * @param {Object} options
         * 
         * @returns {undefined}
         */
        this.panTo = function (lonLatZoom, options) {

            options = options || {};

            if (!this.map || !lonLatZoom || lonLatZoom.length !== 3) {
                return;
            }

            if (isNaN(lonLatZoom[0]) || isNaN(lonLatZoom[1])) {
                return;
            }

            options.duration = typeof options.duration === "undefined" ? 200 : options.duration;

            if (options.duration > 0) {
                this.map.beforeRender(window.ol.animation.pan({
                    duration: options.duration,
                    source: (this.map.getView().getCenter())
                }));
            }

            // Convert lonLat to map projection
            this.map.getView().setCenter(window.ol.proj.fromLonLat([lonLatZoom[0], lonLatZoom[1]], this.getProjectionCode()));

            if (!isNaN(lonLatZoom[2])) {
                this.map.getView().setZoom(lonLatZoom[2]);
            }

        };

        /**
         * Zoom to target (can be either layer or features)
         * 
         * @param {Object} target (layer or features)
         * @param {Object} options
         * 
         * @returns {undefined}
         */
        this.zoomTo = function (target, options) {

            var radius = 50000, extent = null;

            if ( !target ) {
                return false;
            }

            // Case target is an array of features
            if (target instanceof Array) {

                if (target.length === 0) {
                    return false;
                }

                extent = window.ol.extent.createEmpty();

                /*
                 * Compute extent from features array
                 */
                target.forEach(function (feature) {
                    if (feature && feature.getGeometry()) {
                        window.ol.extent.extend(extent, feature.getGeometry().getExtent());
                    }
                });

            }

            // Case target is a layer
            else {

                if (typeof target.getSource !== 'function') {
                    return false;
                }

                /*
                 * Image
                 */
                if (typeof target.getSource().getImageExtent === 'function') {
                    extent = window.ol.proj.transformExtent(target.getSource().getImageExtent(), 'EPSG:4326', this.getProjectionCode());
                }

                /*
                 * Extent
                 */
                else if (typeof target.getSource().getExtent === 'function') {
                    extent = target.getSource().getExtent();
                }

                /*
                 * From layer bbox
                 */
                else if (target.get('_rocket') && target.get('_rocket').parsedWMS && target.get('_rocket').parsedWMS.bbox) {
                    extent = window.ol.proj.transformExtent(target.get('_rocket').parsedWMS.bbox, target.get('_rocket').parsedWMS.srs, this.getProjectionCode());
                } 

                /*
                 * From layer extent
                 */
                else if (target.get('_rocket') && target.get('_rocket').extent) {
                    extent = window.ol.proj.transformExtent(target.get('_rocket').extent, 'EPSG:4326', this.getProjectionCode());
                } 

            }


            if ( extent ) {

                if (this.map) {

                    try {

                        /*
                         * Get a minimal extent (POINT case)
                         */
                        if (extent[0] === extent[2] || extent[1] === extent[4]) {
                            extent = [
                                extent[0] - radius,
                                extent[1] - radius,
                                extent[2] + radius,
                                extent[3] + radius
                            ];
                        }

                        options = options || {};
                        options.size = this.map.getSize();

                        this.map.getView().fit(extent, options);

                    } catch (e) {
                        return false;
                    }

                }

            }

        };

        /**
         * Add an AOI layer.
         * 
         * @param {object} layerConfig
         * @param {object} params
         * @param {function} callback
         */
        this.addAOILayer = function (layerConfig, params, callback) {

            layerConfig = layerConfig || {};

            /*
             * Delete existing aoiLayer
             */
            var aoiLayer = this.getLayerByRocketId(this.AOI_LAYER_ID);

            if (aoiLayer) {
                this.removeLayer(aoiLayer);
            }

            /*
             * Create an AOI layer if wkt is set
             */
            if (layerConfig.wkt || layerConfig.features) {
                this.addLayer({
                    id: this.AOI_LAYER_ID,
                    title: layerConfig.title || null,
                    type: 'vector',
                    zIndex: 100,
                    notInPanel: false,
                    isRemovable:true,
                    wkt: layerConfig.wkt || null,
                    features: layerConfig.features || null,
                    properties: layerConfig.properties || {},
                    styleName: 'aoi',
                    parent: layerConfig.parent || null
                },
                    params,
                    callback
                );
            }

        }

        /**
         * Return AOI layer 
         */
        this.getAOILayer = function () {
            return this.getLayerByRocketId(this.AOI_LAYER_ID);
        };

        /**
         * Return layer identified by _rocket.id
         * 
         * @param {string} id
         */
        this.getLayerByRocketId = function (id) {
            var layer = null;
            if ( this.map ) {
                this.map.getLayers().forEach(function (_layer) {
                    if (_layer.get('_rocket') && _layer.get('_rocket').id === id) {
                        layer = _layer;
                    }
                });
            }
            return layer;
        };

        /**
         * Update features layer
         * 
         * @param {Object} layer - Target array
         * @param {Object} featureCollection - FeatureCollection object
         * @param {Object} options :
         *              
         *              {
         *                  append: // true to add features to existing features
         *              } 
         */
        this.updateLayer = function (layer, featureCollection, options) {

            if (!this.map || !layer || !featureCollection) {
                return null;
            }

            options = options || {};

            /*
             * Update _rocket info
             */
            if (options._rocket) {
                var _rocket = layer.get('_rocket');
                for (var key in options._rocket) {
                    _rocket[key] = options._rocket[key];
                }
                layer.set('_rocket', _rocket);
            }

            /*
             * Erase previous features unless "append" is set to true
             */
            if (!options.append) {
                layer.getSource().clear();
            }

            // Add/update context and links
            if (featureCollection.context) {
                layer.set('context', featureCollection.context, true);
            }

            if (featureCollection.links) {
                layer.set('links', featureCollection.links, true);
            }

            /*
             * Add features to result layer and check for selected features
             */
            if (featureCollection.features && featureCollection.features.length > 0) {
                layer.getSource().addFeatures(window.rocketmap.Util.geoJSONToOlFeatures(featureCollection, this.getProjectionCode()));
            }

            /*
             * Eventually center on layer
             */
            if (options.center) {
                self.zoomTo(layer, {
                    padding: [100, 100, 100, 100]
                });
            }

            /*
             * Tell client API that layer is updated
             */
            this._callback('updatelayer', layer);

        };

        /**
         * Unselect all feature
         * 
         * @param {boolean} activateCallback
         */
        this.unselectAll = function (activateCallback) {

            if (this.selectLayer) {
                this.selectLayer.getSource().clear();
            }

            /*
             * Tell client API that features are selected
             */
            if (activateCallback) {
                this._callback('selectedfeatures', []);
            }

        };

        /**
         * Search every layer for a feature with given id
         * 
         * @param {string} id
         */
        this.getFeatureById = function (id) {

            var feature = null;

            if ( this.map ) {
                this.map.getLayers().forEach(function (layer) {
                    if (!feature && layer.getSource() && typeof layer.getSource().getFeatures === 'function') {
                        feature = layer.getSource().getFeatureById(id);
                    }
                });
            }

            return feature;

        };

        /**
         * Select feature
         * 
         * @param {OpenLayersFeature} olFeature
         */
        this.selectFeature = function (olFeature) {

            /*
             * Unselect all features
             */
            this.unselectAll();

            /*
             * Update select layer
             */
            if (olFeature && this.selectLayer) {
                try{
                    this.selectLayer.getSource().addFeatures(window.rocketmap.Util.geoJSONToOlFeatures({
                        type: 'FeatureCollection',
                        features: [window.rocketmap.Util.featureToGeoJSON(olFeature, this.getProjectionCode())]
                    }, this.getProjectionCode()));
                }
                catch (e) {
                    console.log(e);
                }
            }

            this._callback('selectedfeatures', olFeature ? [olFeature] : []);

        };

        /**
         * Select features at coordinate
         * 
         * @param {Array} coordinate
         * @param {boolean} keepSelectedIfEmpty
         * @param {integer} hitTolerance
         * @returns {array}
         */
        this.selectFeaturesAt = function (coordinate, keepSelectedIfEmpty, hitTolerance) {

            var self = this,
                fromCluster = false,
                olFeatures = [];

            if ( !this.map ) {
                return this.updateSelectLayer(olFeatures, {
                    fromCluster: fromCluster,
                    keepSelectedIfEmpty: keepSelectedIfEmpty
                });
            }

            var mapExtent = this.map.getView().calculateExtent(this.map.getSize());
            
            /*
             * Select features below center
             * [NOTE] Use featueContainsExtent to only select feature visible
             *        in the viewport and avoid nasty "always-select-map-size-extent-features"
             */
            self.map.forEachFeatureAtPixel(self.map.getPixelFromCoordinate(coordinate), function (feature, layer) {
                
                if (!fromCluster && feature && layer && layer.get('_rocket') && layer.get('_rocket').isSelectable && !window.rocketmap.Util.featureContainsExtent(feature, mapExtent)) {

                    /*
                     * Cluster case - zoom on extent
                     */
                    if (layer.get('isCluster')) {
                        var features = feature.get('features');
                        if (features.length === 1) {
                            olFeatures.push(features[0]);
                        }
                        else {
                            self.unselectAll();
                            self.zoomTo(features, {
                                padding: [100, 100, 100, 100]
                            });
                        }
                        fromCluster = true;
                    }
                    /*
                     * Select features
                     */
                    else {
                        olFeatures.push(feature);
                    }
                }
            }, {
                hitTolerance:hitTolerance
            });

            /*
             * Sort array by date (newest first)
             */
            olFeatures.sort(function (a, b) {
                var asd = a.getProperties()['datetime'] ? a.getProperties()['datetime'] : a.getProperties()['start_datetime'];
                var bsd = b.getProperties()['datetime'] ? b.getProperties()['datetime'] : b.getProperties()['start_datetime'];
                if (asd && bsd) {
                    return (asd < bsd) ? 1 : (asd > bsd) ? -1 : 0;
                }
                return -1;
            });

            return this.updateSelectLayer(olFeatures, {
                fromCluster: fromCluster,
                keepSelectedIfEmpty: keepSelectedIfEmpty
            });

        };

        /**
         * Select features at coordinate
         * 
         * @param {Array} olFeatures
         * @param {object} options
         * @returns {array}
         */
        this.updateSelectLayer = function (olFeatures, options) {

            options = options || {};

            /*
             * Update selectLayer
             */
            if (this.selectLayer) {

                /*
                 * Cluster special case
                 */
                if (olFeatures.length === 0 && options.fromCluster) {
                    if ( !options.noCallback ) {
                        this._callback('selectedfeatures', olFeatures);
                    }
                }
                else if (olFeatures.length > 0 || !options.keepSelectedIfEmpty) {

                    /*
                     * Clear previous selectLayer
                     */
                    this.unselectAll();

                    this.selectLayer.getSource().addFeatures(window.rocketmap.Util.geoJSONToOlFeatures({
                        type: 'FeatureCollection',
                        features: window.rocketmap.Util.featuresToGeoJSON(olFeatures, this.getProjectionCode())
                    }, this.getProjectionCode()));

                    /*
                     * Tell client API that features are selected except 
                     */
                    if ( !options.noCallback ) {
                        this._callback('selectedfeatures', olFeatures);
                    }

                }

            }

        }

        /**
         * Hilite feature by id
         * 
         * @param {string} id
         * @param {object} options
         */
        this.hiliteFeatureById = function (id, options) {
            return this.hiliteFeature(this.getFeatureById(id), options);
        }

        /**
         * Hilite feature
         * 
         * @param {olFeature} olFeature
         * @param {object} options
         */
        this.hiliteFeature = function (olFeature, options) {

            var self = this;

            options = options || {};

            /*
             * Unhilite all features
             */
            this.unhiliteAll();

            /*
             * Only a selected feature can be hilited excepted if forced
             */
            if (olFeature && this.selectLayer) {

                this.selectLayer.getSource().getFeatures().forEach(function (feature) {
                    if (feature && feature.getId() === olFeature.getId()) {
                        feature.setStyle(self.getStyle({
                            name: 'hilited'
                        }));
                    }
                });

                // Center on feature if requested
                if (options.center) {
                    this.zoomTo(olFeature.getGeometry(), {
                        padding: [100, 100, 100, 100]
                    });
                }

            }

            this._callback('hilitedfeature', olFeature);

        };

        /**
         * Unhilite selected features
         */
        this.unhiliteAll = function () {

            var self = this;

            if (self.selectLayer) {
                self.selectLayer.getSource().getFeatures().forEach(function (feature) {
                    feature.setStyle(self.getStyle({
                        name: 'selected'
                    }));
                });
            }

        };

        /**
         * Zoom on feature
         * 
         * @param {string} id
         * @param {object} options
         * @returns {array}
         */
        this.zoomOnFeature = function (id, options) {

            var feature = this.getFeatureById(id);

            if (this.map && feature) {
                options = options || {};
                options.size = this.map.getSize();
                this.map.getView().fit(feature.getGeometry().getExtent(), options);
            }

        };

        /**
         * Set active background
         * 
         * If backgroundId is not set then defaultBackground is used
         * 
         * @param {string} backgroundId
         */
        this.setActiveBackground = function (backgroundId) {

            var self = this;

            /*
             * Do nothing
             */
            if ( !backgroundId || !this.map) {
                return;
            }

            var _activeBackground = null;

            /*
             * Set raster to visible and update feature styles
             */
            this.map.getLayers().forEach(function (layer) {

                // Only one background is visible at a time
                var _rocket = layer.get('_rocket');
                if (_rocket && _rocket.isBackground) {
                    if (_rocket.id === backgroundId) {
                        layer.setVisible(true);
                        _activeBackground = _rocket;

                        // Change new max zoom
                        var maxZoom = _rocket.maxZoom || _rocket.tileMatrix;
                        self.map.getView().setMaxZoom(maxZoom ? maxZoom : self.MAX_ZOOM);

                    }
                    else {
                        layer.setVisible(false);
                    }
                }

                /* 
                 * [TODO] Remove support for invert color ?
                 * Update style based on background color
                 *
                if (_rocket && _rocket.isSelectable && layer.getSource() && typeof layer.getSource().getFeatures === 'function') {

                    layer.getSource().getFeatures().forEach(function (feature) {
                        if (feature) {
                            feature.setStyle(self.getStyle(['default', feature.get('_hilited') ? 'hilited' : (feature.get('_selected') ? 'selected' : 'default')]));
                        }
                    });

                }*/

            });

            this._activeBackground = _activeBackground;

            return this._activeBackground;

        };

        /**
         * Toogle draw controls
         * Note - if type is null then desactivate all draw controls
         * 
         * @param {string} type
         */
        this.toggleDraw = function (type) {

            if (this.drawControl) {
                this.drawControl.deactivate();
                if (type) {
                    this.drawControl.activate(type);
                }
            }

        };

        /**
         * Return style object
         * {
         *   name: // Mandatory
         *   options: // style config
         * }
         * 
         * @param {object} styleConfig
         */
        this.getStyle = function (styleConfig) {

            styleConfig = styleConfig || {};

            if (!styleConfig.name) {
                styleConfig.name = 'default';
            }

            if (!this.styles[styleConfig.name] || styleConfig.refresh) {
                this.styles[styleConfig.name] = window.rocketmap.Util.createStyle(styleConfig.options ? styleConfig.options : (this.stylesConfig[styleConfig.name] || this.stylesConfig.default));
            }

            return this.styles[styleConfig.name];

        };

        /**
         * Initialize Map controls
         * 
         * @param {array} options
         */
        this._initControls = function (options) {

            var self = this;

            if ( !self.map ) {
                return;
            }

            /*
             * Set map controls
             */
            if (options.controls.FullScreen) {
                self.map.addControl(new window.ol.control.FullScreen());
            }
            if (options.controls.ScaleLine) {
                self.map.addControl(new window.ol.control.ScaleLine({
                    target: document.querySelector('.mapfooter')
                }));
            }
            if (options.controls.MousePosition) {
                self.map.addControl(new window.ol.control.MousePosition({
                    target: document.querySelector('.mapfooter'),
                    coordinateFormat: window.ol.coordinate.toStringHDMS,
                    projection: 'EPSG:4326'
                }));
            }

            /*
             * Enable draw
             */
            if (options.controls.Draw && window.rocketmap.Draw) {
                self.drawControl = new window.rocketmap.Draw();
                self.map.addControl(new self.drawControl.DrawControl({
                    parent: self.drawControl,
                    rocketMap: self,
                    callback: function (eventName, obj) {
                        self._callback(eventName, obj);
                    },
                    messages: options.controls.Draw.messages,
                    maxRadius: options.controls.Draw.maxRadius || null
                }));
            }

            /*
             * Enable zoom on whole map
             */
            if (options.controls.ZoomOnMap) {
                var zoomOnMap = new window.rocketmap.GenericButton();
                self.map.addControl(new zoomOnMap.GenericButtonControl({
                    parent: zoomOnMap,
                    rocketMap: self,
                    className: 'zoomonmap',
                    innerHTML: '<span class="fa fa-expand"></span>',
                    title: options.controls.ZoomOnMap,
                    callback: function () {
                        self.map.getView().fit(self.defaultExtent, {
                            size: self.map.getSize()
                        });
                    }
                }));
            }

        };

        /**
         * Initialize Map layers
         * 
         * [IMPORTANT] All input extent should be in Lon/Lat WGS84
         * 
         * @param {object} options
         */
        this._initMap = function (options) {

            var self = this,
                interactions = null;

            options = options || {};
            options.interactions = options.interactions || {};

            var extensions = [];

            /*
             * Convert drag interaction
             */
            if (options.interactions.drag && window.rocketmap.Drag) {
                delete options.interactions.drag;
                extensions.push(new window.rocketmap.Drag({
                    rotate:options.interactions.drag.rotate,
                    callback:function (eventName, obj) {
                        self._callback(eventName, obj);
                    }
                }));
            }

            /*
             * Convert mouseWheel interaction
             */
            if (options.interactions.mouseWheelZoom == 'modifierKey') {
                options.interactions.mouseWheelZoom = false;
                extensions.push(mouseWheelZoom = new window.ol.interaction.MouseWheelZoom({
                    condition: window.ol.events.condition.platformModifierKeyOnly
                }));
            }
            
            // OL 7: window.ol.interaction.defaults.defaults instead of window.ol.interaction.defaults
            interactions = window.ol.interaction.defaults.defaults(options.interactions).extend(extensions);

            this.defaultExtent = options.defaultExtent ? window.ol.proj.transformExtent(options.defaultExtent, 'EPSG:4326', this.getProjectionCode()) : window.ol.proj.transformExtent(this.EARTH_EXTENT, 'EPSG:3857', this.getProjectionCode());

            /*
             * Get center - [WARNING] In lonLat !!!
             */
            var viewOptions = {
                //multiWorld:true,
                // [TODO] Comment that otherwise it brokes initial zoom on not zoom 1 map centered
                //maxResolution: 40000,
            };

            if (options.center && options.center.length === 3) {
                if (!isNaN(options.center[0]) && !isNaN(options.center[1])) {
                    viewOptions.center = window.ol.proj.fromLonLat([options.center[0], options.center[1]], this.getProjectionCode());
                }
                if (!isNaN(options.center[2])) {
                    viewOptions.zoom = options.center[2];
                }
            }

            /*
             * If options.maxExtent is not set then no map restriction with infinite panning
             * If set then :
             *   - value is "EARTH_EXTENT" then panning is restricted to -180/180
             *   - value is a EPSG:4326 bbox (array of 4 coordinates in latmin,lonmin,latmax,lonmax)
             */
            if ( options.maxExtent ) {
                viewOptions.extent = options.maxExtent === 'EARTH_EXTENT' ? this.EARTH_EXTENT : window.ol.proj.transformExtent(options.maxExtent, 'EPSG:4326', this.getProjectionCode());
            }

            /*
             * Initialize map
             */
            this.map = new window.ol.Map({
                logo: null,
                controls: [
                    new window.ol.control.Zoom(),
                    new window.ol.control.Attribution({
                        target: document.querySelector('.mapfooter'),
                        collapsible: false
                    })
                ],
                interactions: interactions,
                /*
                 * Improve user experience by loading tiles while dragging/zooming.
                 * Will make zooming choppy on mobile or slow devices
                 */
                loadTilesWhileInteracting: true,
                target: this.target
            });

            /*
             * Initial view
             */
            this.setViewProjection(viewOptions);

            /*
             * Fit view to input extent
             */
            if (!options.center) {
                this.map.getView().fit(options.extent ? window.ol.proj.transformExtent(options.extent, 'EPSG:4326', this.getProjectionCode()) : this.defaultExtent, {
                    size: this.map.getSize()
                });
            }

            return this.map;

        };

        /**
         * Initialize map events
         * 
         * @param {object} options
         */
        this._initEvents = function (options) {

            var self = this;

            options = options || {};

            if ( !self.map ) {
                return;
            }

            /*
             * Map event - mousemove
             * Hilite hovered feature on mousemove
             */
            $(self.map.getViewport()).on('mousemove', function (evt) {

                if (!self.navigationEnabled || !options.selectFeatureOnMap) {
                    return;
                }

                var mapExtent = self.map.getView().calculateExtent(self.map.getSize());
                var hoverFeature = null;
                var pixel = self.map.getEventPixel(evt.originalEvent);
                var hit = self.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                    var bool = (layer && (layer.get('_rocket').isSelectable || layer.get('_rocket').isHoverable) && !window.rocketmap.Util.featureContainsExtent(feature, mapExtent)) || (layer && layer.get('_rocket').isMovable) ? true : false;
                    if (bool) {
                        hoverFeature = feature;
                    }
                    return bool;
                });
                self._callback('hoverfeature', {
                    feature: hoverFeature,
                    pixel:pixel
                });
                $('#' + self.target).css('cursor', hit ? 'pointer' : 'default');

            });

            /*
             * Map singleclick - marker
             */
            if (options.mapPinUseLongClick) {

                /*
                 * Trigger a long click (i.e greater than 200 ms)
                 */
                self._timeoutId = -1;
                self._startPixel;
                self.map.on('pointerdown', function (evt) {

                    if (!self.navigationEnabled) {
                        return;
                    }

                    clearTimeout(self._timeoutId);

                    self._startPixel = self.map.getEventPixel(evt.originalEvent);

                    var coordinate = self.map.getCoordinateFromPixel(self._startPixel);

                    // Always send a 'clickstart'
                    self._callback('clickstart', {
                        pixel: self._startPixel,
                        coordinate: coordinate
                    })

                    self._timeoutId = setTimeout(function () {
                        if (self._timeoutId) {
                            self.pinMenuEnabled = true;
                            var clickedMarker = $('#clickedmarker');
                            coordinate = self.map.getCoordinateFromPixel(self._startPixel);
                            clickedMarker.css({
                                top: self._startPixel[1] + 'px',
                                left: self._startPixel[0] + 'px'
                            }).append('<div class="inner"></div>');
                            setTimeout(function () {
                                clickedMarker.empty();
                            }, 1000);
                            self._callback('click', {
                                pixel: self._startPixel,
                                coordinate: coordinate
                            })
                        }
                    }, 200, false);
                });

                self.map.on('pointerup', function (evt) {

                    if (!self.navigationEnabled) {
                        return;
                    }

                    clearTimeout(self._timeoutId);
                    self._startPixel = undefined;

                });

            }
            else {

                self.map.on('singleclick', function (evt) {

                    if (!self.navigationEnabled) {
                        return;
                    }

                    // Display marker
                    var clickedMarker = $('#clickedmarker');
                    var _startPixel = self.map.getEventPixel(evt.originalEvent);
                    var coordinate = self.map.getCoordinateFromPixel(_startPixel);

                    // Always send a 'clickstart'
                    self._callback('clickstart', {
                        pixel: self._startPixel,
                        coordinate: coordinate
                    })

                    clickedMarker.css({
                        top: _startPixel[1] + 'px',
                        left: _startPixel[0] + 'px'
                    }).append('<div class="inner"></div>');
                    setTimeout(function () {
                        clickedMarker.empty();
                    }, 1000);

                    /*
                     * Send click
                     */
                    self._callback('click', {
                        pixel: _startPixel,
                        coordinate: coordinate
                    });

                });

            }

            /*
             * Map click - select features
             */
            self.map.on('click', function (evt) {

                if (!self.navigationEnabled || !options.selectFeatureOnMap) {
                    return;
                }

                // Pin menu is enabled - no select !
                if (self.pinMenuEnabled) {
                    self.pinMenuEnabled = false;
                    return;
                }

                var _startPixel = self.map.getEventPixel(evt.originalEvent);
                var coordinate = self.map.getCoordinateFromPixel(_startPixel);

                /*
                 * Select features
                 */
                self.selectFeaturesAt(coordinate, true, options.selectHitTolerance || 0);
                
            });

            /*
             * Start pointer drag
             */
            self.map.on('pointerdrag', function (evt) {
                if (self._dragIsActive) {
                    self._dragIsActive = false;
                    self._callback('panstart', {
                        pixel: self.map.getEventPixel(evt.originalEvent)
                    });
                }

                // This is for longclick
                if (self._startPixel) {
                    var pixel = self.map.getEventPixel(evt.originalEvent);
                    if (Math.abs(self._startPixel[0] - pixel[0]) + Math.abs(self._startPixel[1] - pixel[1]) > 6) {
                        clearTimeout(self._timeoutId);
                        self._startPixel = undefined;
                    }
                }
            });

            /*
             * Map moveend
             */
            self.map.on('moveend', function (evt) {

                var lonLat = self.getProjectionCode() === 'EPSG:4326' ? self.map.getView().getCenter() : window.ol.proj.toLonLat(self.map.getView().getCenter(), self.getProjectionCode());
                
                var center = {
                    center: [
                        window.rocketmap.Util.round(lonLat[0], 7),
                        window.rocketmap.Util.round(lonLat[1], 7),
                        window.rocketmap.Util.round(self.map.getView().getZoom(), 2)
                    ]
                };
                
                /*
                 * Callback to client API
                 */
                if (self.isInitialized) {
                    self._callback('moveend', center);
                }
                else {
                    self.isInitialized = true;
                    self._callback('initialized', center);
                }

                self._dragIsActive = true;
            });

            /*
             * Map movestart
             */
            self.map.on('movestart', function(evt) {
                self._callback('movestart', evt);
            });

        };

        /**
         * Get a layer from layer config object
         * 
         * @param {object} layerConfig
         * @param {object} params
         */
        this._getLayer = function (layerConfig, params, callback) {

            var fct = function (layer, updatedConfig, error) {

                if (layer) {
                    // [IMPORTANT]
                    layer.set('_rocket', updatedConfig);

                    // Set zIndex
                    if (updatedConfig.hasOwnProperty('zIndex')) {
                        layer.setZIndex(updatedConfig.zIndex);
                    }
                }

                callback(layer, error);

            }

            layerConfig = layerConfig || {};
            params = params || {};

            // id is mandatory
            if (!layerConfig.id) {
                fct(null);
            }

            // Default type to vector
            layerConfig.type = layerConfig.type || 'vector';

            // Force title
            layerConfig.title = layerConfig.title || layerConfig.id.replace(/_/g, ' ');

            switch (layerConfig.type.toLowerCase()) {

                case 'bing':
                case 'cog':
                case 'osm':
                case 'stamen':
                case 'tilewms':
                case 'xyz':
                    (new window.rocketmap.TileWMS(layerConfig, params, this.getProjectionCode())).then(function (tileWMS) {
                        fct(tileWMS.layer, tileWMS.layerConfig, tileWMS.error);
                    });
                    break;
                
                case 'wmts':
                    (new window.rocketmap.WMTS(layerConfig, params, this.getProjectionCode())).then(function (wmts) {
                        fct(wmts.layer, wmts.layerConfig, wmts.error);
                    });
                    break;
                
                case 'image':
                    this._getImageLayer(layerConfig, fct);
                    break;
                
                case 'mvt':
                    this._getMVTLayer(layerConfig, fct);
                    break;

                default:
                    this._getVectorLayer(layerConfig, fct);

            }

        };

        /**
         * Add a static image layer
         *
         * @param {object} layerConfig
         */
        this._getImageLayer = function (layerConfig, callback) {

            /*
             * Mandatory layerConfig.options = {
             *      {
             *          url: // Image url
             *          imageExtent: // Image extent (in EPSG:4326 projection by default)
             *      }
             */
            if (!layerConfig.options || !layerConfig.options.url || !layerConfig.options.imageExtent) {
                callback(null);
            }

            layerConfig.options.projection = layerConfig.options.projection || 'EPSG:4326';

            /* 
             * [TODO] Converting black to transparent does not work because canvas manipulation
             *        on image url raises cross-origin exception
             *
            var source = new window.ol.source.Raster({
                sources: [new window.ol.source.ImageStatic(layerConfig.options)],
                operation: function (pixels, data) {
                    var pixel = pixels[0];
                    return pixel;
                }
            });
            */

            callback(new window.ol.layer.Image({
                source: new window.ol.source.ImageStatic(layerConfig.options)
            }), layerConfig);

        };

        /**
         * Add a Mapbox Vector Tiles layer
         *
         * @param {object} layerConfig
         */
        this._getMVTLayer = function (layerConfig, callback) {

            if (!layerConfig.options || !layerConfig.options.url ) {
                callback(null);
            }

            //layerConfig.options.projection = layerConfig.options.projection || 'EPSG:4326';
            layerConfig.options.tileGrid = window.ol.tilegrid.createXYZ(layerConfig.ol || {});
            layerConfig.options.format = new window.ol.format.MVT();

            callback(new window.ol.layer.VectorTile({
                source: new window.ol.source.VectorTile(layerConfig.options)
            }), layerConfig);

        };

        /**
         * Add vector layer
         * 
         * @param {Object} layerConfig
         */
        this._getVectorLayer = function (layerConfig, callback) {

            var self = this;
            var layer = null;
            var source = null;

            var clusterize = layerConfig.clusterize || false;

            // GeoJSON
            if (layerConfig.type === 'GeoJSON' && layerConfig.options && layerConfig.options.url) {

                source = new window.ol.source.Vector({
                    format: new ol.format.GeoJSON(),
                    url: layerConfig.options.url
                });

                /*
                 * [TODO] PR on openlayers to send specific event when url is loaded ?
                 *
                source.on('change', function(e) {
                    console.log(e.target);
                });
                */

            }

            // WKT or features
            else {

                var features = layerConfig.features || [];

                if (layerConfig.wkt) {

                    var feature = new window.ol.format.WKT().readFeature(layerConfig.wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: this.getProjectionCode()
                    });

                    if (layerConfig.properties) {
                        feature.setProperties(layerConfig.properties);
                    }

                    var features = [feature];

                }

                if (features) {

                    source = new window.ol.source.Vector({
                        features: features
                    });

                    /* No because it breaks on linestring / polygon
                     Always clusterize Point layer with more than 100 features
                    if ( features.length > 100 ) {
                        clusterize = true;
                    }
                    */

                }

            }

            if (source) {

                if (clusterize) {

                    layer = new window.ol.layer.Vector({
                        isCluster: true,
                        visible: layerConfig.hasOwnProperty('visible') ? layerConfig.visible : true,
                        source: new window.ol.source.Cluster({
                            distance: 50,
                            source: source
                        }),
                        style: function (feature, resolution) {
                            var size = feature.get('features').length;
                            if (size === 1) {
                                return self.getStyle({
                                    name: 'default'
                                });
                            }
                            else {
                                return [new window.ol.style.Style({
                                    image: new window.ol.style.Circle({
                                        radius: 20,
                                        fill: new window.ol.style.Fill({
                                            stroke: '#fff',
                                            color: '#000'
                                        })
                                    }),
                                    text: new window.ol.style.Text({
                                        text: size.toString(),
                                        font: '10px sans-serif',
                                        fill: new window.ol.style.Fill({
                                            color: '#fff'
                                        })
                                    })
                                })];
                            }

                        }
                    });

                }
                else {

                    if (layerConfig.display === 'heatmap') {
                        var params = {
                            visible: layerConfig.hasOwnProperty('visible') ? layerConfig.visible : true,
                            source: source,
                        };
                        if (layerConfig.ol) {
                            for (key in layerConfig.ol) {
                                params[key] = layerConfig.ol[key];
                            }    
                        }
                        layer = new window.ol.layer.Heatmap(params);
                    }
                    else {
                        var style = null;
                        if (typeof layerConfig.style === 'function') {
                            style = layerConfig.style;
                        }
                        else {
                            style = Array.isArray(layerConfig.style) ? layerConfig.style : (self.getStyle(layerConfig.style ? layerConfig.style : {
                                name: layerConfig.styleName || 'default'
                            }));
                        }
                        layer = new window.ol.layer.Vector({
                            visible: layerConfig.hasOwnProperty('visible') ? layerConfig.visible : true,
                            source: source,
                            style: style
                        });
                    }
                }
            }


            // For 3D mode, vector layers are clamped to ground
            if (layer) {
                layer.set('altitudeMode', 'clampToGround');
            }

            callback(layer, layerConfig);

        };

        /**
         * Callback
         * 
         * @param {string} eventName
         * @param {object} obj
         * @param {object} params
         */
        this._callback = function (eventName, obj, params) {
            if (this.registeredEvents && this.registeredEvents[eventName]) {
                for (var i = this.registeredEvents[eventName].length; i--;) {
                    this.registeredEvents[eventName][i](obj, params || {});
                }
            }
        };

        /**
         * Remove all map layers
         */
        this._removeAllLayers = function () {

            if ( !this.map ) {
                return;
            }

            /*
             * Remove all existing layers
             * (see https://stackoverflow.com/questions/40862706/unable-to-remove-all-layers-from-a-map/41566755#41566755)
             * 
             * [UPDATE] This does not work with 3D - map is blank
             * this.map.setLayerGroup(new window.ol.layer.Group());
             */
            var layerArray = this.map.getLayers().getArray(),
                len = layerArray.length,
                layer;
            while (len > 0) {
                layer = layerArray[len - 1];
                this.map.removeLayer(layer);
                len = layerArray.length;
            }
        };

        return this;

    };

})(window);
