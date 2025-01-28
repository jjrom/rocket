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
        .controller('LocatorMapController', ['$element', 'config', LocatorMapController]);

    function LocatorMapController($element, config) {

        var self = this;
        var map;
        var backgroundLayer = null;
        var overlayLayer = null;
        var globeView = new window.ol.View({
            center: [0, 0],
            zoom: 0
        });

        /*
         * Initialize map
         */
        self.$onInit = function () {
            
            // Apply a non null size to map element
            var target = $element.find('div')[0];
            var css = {
                width:(this.size ? this.size[0] : 300) + 'px',
                height:(this.size ? this.size[1] : 150) + 'px'
            }
            $(target).css(css);

            map = new window.ol.Map({
                controls: [],
                interactions: [],
                view: new window.ol.View({
                    center: [0, 0],
                    zoom: 0
                }),
                layers: [],
                target: target
            });
            setBackgroundLayer(this.planet);
            setOverlayLayer(this.geometry);
        };

        self.$onChanges = function (changesObj) {
            if (changesObj.planet) {
                setBackgroundLayer(changesObj.planet.currentValue);
            }
            if (changesObj.geometry) {
                setOverlayLayer(changesObj.geometry.currentValue);
            }
        };

        /**
         * Set background
         * 
         * @param {String} planet 
         */
        function setBackgroundLayer(planet) {
            
            var source;

            if ( !planet ) {
                return false;
            }

            planet = planet.toLowerCase();
            
            var mapConfig = config.planets[planet] ? config.planets[planet] : config.planets[config.defaultPlanet];
            var backgroundConfig = mapConfig.layers && mapConfig.layers[0] ? mapConfig.layers[0] : {};
            
            backgroundConfig.options = backgroundConfig.options || {};

            switch (backgroundConfig.source) {
                case "bing":
                    source = new window.ol.source.BingMaps(backgroundConfig.options);
                    break;
                case "stamen":
                    source = new window.ol.source.StadiaMaps(backgroundConfig.options);
                    break;
                case "xyz":
                    source = new window.ol.source.XYZ(backgroundConfig.options);
                    break;
                default:
                    source = new window.ol.source.OSM(backgroundConfig.options);
                    break;
            };

            if (source && map) {

                if (backgroundLayer) {
                    map.removeLayer(backgroundLayer);
                }
                backgroundLayer = new window.ol.layer.Tile({
                    source: source
                });

                map.addLayer(backgroundLayer);

            }

        }

        /**
         * Set overlay layer
         * 
         * @param {Object} geometry 
         */
        function setOverlayLayer(geometry) {
            
            if ( !map ) {
                return false;
            }

            if ( !geometry ) {
                if ( overlayLayer ) {
                    map.removeLayer(overlayLayer);
                    overlayLayer = null;
                }

                // Recenter on globe
                map.getView().fit(globeView.calculateExtent(map.getSize()));

                return false;
            }

            // Geometry is either a string (i.e WKT) or a GeoJSON geometry
            var feature;
            if (typeof geometry === 'object') {
            
                var format = new window.ol.format.GeoJSON({
                    defaultDataProjection: "EPSG:4326"
                });
    
                feature = format.readFeature({
                    type:"Feature",
                    properties:{},
                    geometry:geometry
                }, {
                    featureProjection: config.defaultProjCode
                });
            }
            // WKT
            else {

                feature = new window.ol.format.WKT().readFeature(geometry, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: config.defaultProjCode
                });

            }

            if ( overlayLayer ) {
                map.removeLayer(overlayLayer);
            }

            overlayLayer = new window.ol.layer.Vector({
                source: new window.ol.source.Vector({
                    features: [feature]
                }),
                style: new window.ol.style.Style({
                    stroke: new window.ol.style.Stroke({
                        color: 'blue',
                        width: 3
                    }),
                    fill: new window.ol.style.Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                })
            });

            map.addLayer(overlayLayer);

            map.getView().fit(feature.getGeometry().getExtent(), {
                size: map.getSize(),
                maxZoom: 4
            });

        }

    }

    angular.module('rocket')
    .component('locatorMap', {
      template: '<div></div>',
      bindings: {
        planet: '<',
        geometry:'<',
        size:'<'
      },
      controller: 'LocatorMapController'
    });

})();