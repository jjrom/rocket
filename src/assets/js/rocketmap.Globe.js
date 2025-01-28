/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    /**
     * 3D globe based on Cesium
     * 
     * @param {object} rocketMap
     * @param {object} config
     */
    window.rocketmap.Globe = function (rocketMap, config) {

        /**
         * True when globe isInitialized
         */
        this.initialized = false;

        /**
         * OpenLayers map reference
         */
        this.map = rocketMap.map;

        /**
         * Configuration reference
         */
        this.config = config || {};

        /**
         * OpenLayers Cesium Globe reference
         */
        this.ol3d = null;

        /*
         * Parent reference
         */
        this.parent = rocketMap;

        /**
         * Camera orientation - default is looking down with heading North
         * 
         * @param {*} map 
         */
        this.defaultOrientation = {
            heading: 0, // North
            pitch: -(Math.PI / 2),   // Looking down
            roll: 0.0
        };

        /**
         * Camera orientation - default is looking down with heading North
         * 
         * @param {*} map 
         */
        this.currentOrientation;

        /**
         * Enable 3D view with Cesium if available
         * 
         * @param {function} callback
         */
        this.init = function (callback) {

            var self = this;

            /*
             * Load Cesium dynamically
             */
            loadScripts.loaded = new Set();
    
            (async () => {
                
                if ( !window.Cesium ) {
                    await loadScripts([
                        'assets/libs/Cesium/Cesium.js', 
                        'assets/libs/olcesium-debug.js'
                    ]);
                }
                
                /*
                 * Initialize 3D globe with terrain provider
                 */
                self.ol3d = new window.olcs.OLCesium({
                    map: self.map
                });

                self.initialized = true;

                if (callback) {
                    callback();
                }
                
            })();
                
            return true;
        };

        /**
         * Return true is 3d is enables
         */
        this.isEnabled = function () {
            return this.ol3d && this.ol3d.getEnabled();
        };

        /**
         * Enable/disable 3D mode
         * 
         * @param {boolean} Enable/disable 3D mode
         * @param {string} Planet
         */
        this.setEnabled = function (bool, planet) {

            /*
             * Globe is already enable/disabled
             * Do nothing except changing terrain
             */
            if (this.isEnabled() === bool) {
                if (bool) {
                    this._toggleTerrain(planet);
                }
                return false;
            }

            return bool ? this._enable(planet) : this._disable();

        };

        /**
         * Initialize events
         * 
         * @param {CesiumScene} scene 
         */
        this._initEvents = function (scene) {

            var self = this;
            var terrainProvider = scene.terrainProvider;
            var screenSpaceEventHandler = new window.Cesium.ScreenSpaceEventHandler(scene.canvas);

            /*
             * Event - click
             */
            screenSpaceEventHandler.setInputAction(function (click) {
                
                var pickedObject = scene.pick(click.position);
                if (typeof pickedObject !== 'undefined' && typeof self.parent.updateSelectLayer === 'function') {
                    self.parent.updateSelectLayer([pickedObject.primitive.olFeature], {
                        keepSelectedIfEmpty:true
                    });
                }

            }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

            /*
             * Event - mousemove
             */
            screenSpaceEventHandler.setInputAction(function (movement) {
                var lonLat = self._convertScreenPixelToLocation(movement.endPosition, scene);
            }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE)

        }

        /**
         * Convert click position on 3D map to Lat/lon
         * 
         * @param array
         */
        this._convertScreenPixelToLocation = function (mousePosition, scene) {

            var ellipsoid = scene.globe.ellipsoid;
            var cartesian = scene.camera.pickEllipsoid(mousePosition, ellipsoid);

            if (cartesian) {

                var cartographic = ellipsoid.cartesianToCartographic(cartesian);

                var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
                var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
                var height = (scene.camera.positionCartographic.height / 1000).toFixed(2);
                return {
                    lat: Number(latitudeString),
                    lng: Number(longitudeString),
                    height: height
                };

            }

            return null;

        };

        /**
         * Get terrain height from lon/lat
         * 
         * @param {TerrainProvider} terrainProvider
         * @param {object} lonLat
         */
        this._getTerrainHeight = function (terrainProvider, lonLat) {

            var positions = [window.Cesium.Cartographic.fromDegrees(lonLat.lng, lonLat.lat)];

            var promise = window.Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
            window.Cesium.when(promise, function (updatedPositions) {
                console.log(updatedPositions);
                console.log(positions[0].height);
            });

        };

        /**
         * Enable 3D globe
         * 
         * @param {string} planet
         */
        this._enable = function (planet) {

            // Must be enabled
            if ( !this.ol3d ) {
                return false;
            }

            this.ol3d.setEnabled(true);

            this._toggleTerrain(planet);

            if (this.currentOrientation) {
                var camera = this.ol3d.getCesiumScene().camera;
                camera.setView({
                    heading: window.Cesium.Math.toRadians(camera.heading),
                    pitch: window.Cesium.Math.toRadians(camera.pitch),
                    roll: window.Cesium.Math.toRadians(camera.roll)
                });
            }

            return true;

        };

        /**
         * Disable 3D mode (first reset orientation to North)
         */
        this._disable = function () {

            var camera = this.ol3d.getCesiumScene().camera;
            this.currentOrientation = {
                heading: camera.heading,
                pitch: camera.pitch,
                roll: camera.roll
            };
            camera.setView(this.defaultOrientation);
            this.ol3d.setEnabled(false);

        };

        /**
         * Set terrain provider from planet
         * 
         * @param {string} planet - if set to null remove terrain
         */
        this._toggleTerrain = function(planet) {    
            
            var terrainProvider;
            var scene = this.ol3d.getCesiumScene();

            var url = null;

            // Earth special case
            if ( planet === 'earth' && this.config.ionToken ) {
                window.Cesium.Ion.defaultAccessToken = this.config.ionToken;
                url = window.Cesium.IonResource.fromAssetId(1);
            }
            else if ( this.config.terrainProviders && this.config.terrainProviders[planet] ) {
                url = this.config.terrainProviders[planet].url;
            }

            // Add a simple terain so no terrain shall be preseneted
            if ( !url ){
                terrainProvider = new Cesium.EllipsoidTerrainProvider({});
            }
            else {
                terrainProvider = new Cesium.CesiumTerrainProvider({
                    url : url,
                    requestWaterMask: true
                });
            }

            this._initEvents(scene);
            
            scene.terrainProvider = terrainProvider;

        }

        /**
         * Load Cesium scripts
         */
        async function loadScripts(script_urls) {
            function load(script_url) {
                return new Promise(function(resolve, reject) {
                    if (loadScripts.loaded.has(script_url)) {
                        resolve();
                    } else {
                        var script = document.createElement('script');
                        script.onload = resolve;
                        script.src = script_url
                        document.head.appendChild(script);
                    }
                });
            }
            var promises = [];
            for (const script_url of script_urls) {
                promises.push(load(script_url));
            }
            await Promise.all(promises);
            for (const script_url of script_urls) {
                loadScripts.loaded.add(script_url);
            }
        }

        return this;

    };
})(window);
