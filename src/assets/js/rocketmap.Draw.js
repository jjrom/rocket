/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
/**
 * rocketmap Draw
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    window.rocketmap.Draw = function () {


        var _maxRadius = null;
        
        /**
         * Currently drawn feature.
         * @type {import("../src/ol/Feature.js").default}
         */
        var sketch;

        /**
         * Current measure
         */
        var currentMeasure;

        /**
         * Array of listeners
         */
        var listeners = [];

        /**
         * The help tooltip element.
         * @type {HTMLElement}
         */
        var helpTooltipElement;


        /**
         * Overlay to show the help messages.
         * @type {Overlay}
         */
        var helpTooltip;


        /**
         * The measure tooltip element.
         * @type {HTMLElement}
         */
        var measureTooltipElement;


        /**
         * Overlay to show the measurement.
         * @type {Overlay}
         */
        var measureTooltip;


        /**
         * Message to show when the user is drawing a polygon.
         * @type {string}
         */
        var continuePolygonMsg = 'Click to continue drawing the polygon';


        /**
         * Message to show when the user is drawing a line.
         * @type {string}
         */
        var continueLineMsg = 'Click to continue drawing the line';

        /**
         * Help message
         * @type {string}
         */
        var helpMsg = 'Click to start drawing';

        /**
         * Handle pointer move.
         * @param {import("../src/ol/MapBrowserEvent").default} evt The event.
         */
        var pointerMoveHandler = function (evt) {
            if (evt.dragging) {
                return;
            }
            
            if (sketch) {
                var geom = sketch.getGeometry();
                if (geom instanceof window.ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof window.ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }

            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);

            helpTooltipElement.classList.remove('hidden');
        };

        /*
         * Pointer to draw interaction
         */
        this.draw = null;

        /*
         * Reference to tool button
         */
        this.button = null;

        /*
         * Reference to rocketMap
         */
        this.rocketMap = null;

        /*
         * Callback function
         */
        this.callback = null;

        /**
         * Create a Draw control button
         * 
         * @param {Object} options
         */
        this.DrawControl = function (options) {

            options = options || {};

            var handleDraw;
            
            if (options.maxRadius) {
                _maxRadius = options.maxRadius;
            }

            if (options.messages) {
                if (options.messages.continuePolygonMsg) {
                    continuePolygonMsg = options.messages.continuePolygonMsg;
                }
    
                if (options.messages.continueLineMsg) {
                    continueLineMsg = options.messages.continueLineMsg;
                }
    
                if (options.messages.helpMsg) {
                    helpMsg = options.messages.helpMsg;
                }
            }

            if (options.parent) {

                options.parent.button = document.createElement('button');
                options.parent.button.innerHTML = '<span class="fa fa-edit"></span>';
                options.parent.rocketMap = options.rocketMap;
                options.parent.callback = options.callback;
                options.parent.type = options.type;
                handleDraw = function (e) {
                    options.parent.toggleDraw();
                };
                options.parent.button.addEventListener('click', handleDraw, {
                    passive:true
                });
                options.parent.button.addEventListener('touchstart', handleDraw, {
                    passive:true
                });
            
                var element = document.createElement('div');
                element.className = 'draw-control ol-unselectable ol-control';
                element.appendChild(options.parent.button);

                // Deprecated in OL 7
                /*window.ol.control.Control.call(this, {
                    element: element,
                    target: options.target
                });*/

                // OL 7 style
                return new window.ol.control.Control({
                    element: element,
                    target: options.target
                });

            }


        };

        /**
         * Return true if control is active - false otherwise
         * 
         * @returns {Boolean}
         */
        this.isActive = function () {
            return this.draw ? true : false;
        };

        /**
         * Toggle draw interaction
         * 
         * @param {string} type
         */
        this.toggleDraw = function (type) {
            this.draw ? this.deactivate() : this.activate(type);
        };

        /** 
         * 
         * Activate control
         * 
         * @returns {boolean}
         */
        this.activate = function (type) {

            if (!this.rocketMap || !this.rocketMap.map) {
                return;
            }

            if (self.button) {
                self.button.innerHTML = '<span class="fa fa-edit activated"></span>';
            }

            // Deactivate navigation
            this.rocketMap.enableNavigation(false);

            listeners.push(this.rocketMap.map.on('pointermove', pointerMoveHandler));
            listeners.push(this.rocketMap.map.getViewport().addEventListener('mouseout', function() {
                helpTooltipElement.classList.add('hidden');
            }));

            addInteraction(this, type);

        };

        /**
         * Deactivate control
         * 
         * @returns {boolean}
         */
        this.deactivate = function () {

            var self = this;

            if (self.draw && self.rocketMap && self.rocketMap.map) {

                /*
                 * See issue https://github.com/openlayers/ol3/issues/3610/
                 */
                setTimeout(function () {
                    if (self.draw) {
                        self.draw.setActive(false);
                        self.draw = null;
                    }
                }, 251);
                
                if (self.button) {
                    self.button.innerHTML = '<span class="fa fa-edit"></span>';
                }

                self.rocketMap.enableNavigation(true);

                /*
                 * Clear listeners
                 */
                for (var i = listeners.length; i--;) {
                    window.ol.Observable.unByKey(listeners[i]);
                }
                listeners = [];
                self.rocketMap.map.removeOverlay(helpTooltip);
                self.rocketMap.map.removeOverlay(measureTooltip);

            }
            return true;

        };

        /*
         * Initialize draw control
         */
        // Deprecate OL 5
        // window.ol.inherits(this.DrawControl, window.ol.control.Control);
        this.DrawControl.prototype = Object.create(window.ol.control.Control.prototype);
        this.DrawControl.prototype.constructor = this.DrawControl;


        function addInteraction(self, type) {

            if (!self.rocketMap || !self.rocketMap.map) {
                return;
            }

            type = type || 'LineString';

            var params = {
                source: new window.ol.source.Vector(),
                type: type,
                style: new window.ol.style.Style({
                    fill: new window.ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new window.ol.style.Stroke({
                        color: 'rgba(255, 255, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2
                    }),
                    image: new window.ol.style.Circle({
                        radius: 5,
                        stroke: new window.ol.style.Stroke({
                            color: 'rgba(255, 255, 0, 0.7)'
                        }),
                        fill: new window.ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        })
                    })
                })
            };

            if (type === 'Circle' && _maxRadius) {
                params.geometryFunction = function (coordinates, geometry) {
                    const center = coordinates[0];
                    const last = coordinates[coordinates.length - 1];
                    const dx = center[0] - last[0];
                    const dy = center[1] - last[1];
                    const radius = Math.min(Math.sqrt(dx * dx + dy * dy), _maxRadius);
                    if (!geometry) {
                        geometry = new ol.geom.Circle(center, radius);
                    }
                    else {
                        geometry.setCenterAndRadius(center, radius);
                    }
                    return geometry;
                };
            }

            self.draw = new window.ol.interaction.Draw(params);
            self.rocketMap.map.addInteraction(self.draw);

            createMeasureTooltip(self.rocketMap.map);
            createHelpTooltip(self.rocketMap.map);

            self.draw.on('drawstart',

                function (evt) {
                    // set sketch
                    sketch = evt.feature;

                    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
                    var tooltipCoord = evt.coordinate;

                    listeners.push(sketch.getGeometry().on('change', function (evt) {
                        var geom = evt.target;
                        if (geom instanceof window.ol.geom.Circle) {
                            geom = window.ol.geom.Polygon.fromCircle(geom);
                        }
                        else if (geom instanceof window.ol.geom.Polygon) {
                            currentMeasure = window.rocketmap.Util.formatArea(geom);
                            tooltipCoord = geom.getInteriorPoint().getCoordinates();
                        } else if (geom instanceof window.ol.geom.LineString) {
                            currentMeasure = window.rocketmap.Util.formatLength(geom);
                            tooltipCoord = geom.getLastCoordinate();
                        }
                        measureTooltipElement.innerHTML = currentMeasure;
                        measureTooltip.setPosition(tooltipCoord);
                    }));
                }

            );

            self.draw.on('drawend',

                function () {

                    var geometry = sketch.getGeometry();
                    
                    // unset sketch
                    sketch = null;

                    /* [TODO] Remove - final measure is displayed to user from "measure" property
                    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
                    measureTooltip.setOffset([0, -7]);
                    */
                    // unset tooltip so that a new one can be created
                    measureTooltipElement = null;
                    /*
                     * [TODO] Remove - final measure is displayed to user from "measure" property
                    createMeasureTooltip(self.rocketMap.map);
                    */

                    /*
                     * Clear listeners
                     */
                    for (var i = listeners.length; i--;) {
                        window.ol.Observable.unByKey(listeners[i]);
                    }
                    listeners = [];
                    self.rocketMap.map.removeOverlay(helpTooltip);
                
                    /*
                     * Convert geometry to wkt
                     */
                    if (geometry.getType() === 'Circle') {
                        geometry = window.ol.geom.Polygon.fromCircle(geometry);
                    } 
                    geometry.transform(self.rocketMap.getProjectionCode(), 'EPSG:4326');
                    if (typeof self.callback === 'function') {
                        var wktParser = new window.ol.format.WKT();
                        var extent = geometry.getExtent();
                        self.callback('drawend', {
                            from: self.rocketMap,
                            wkt: wktParser.writeGeometry(geometry),
                            center:window.ol.extent.getCenter(extent),
                            measure: currentMeasure
                        });
                    }

                    self.deactivate();
                }

            );

        }


        /**
         * Creates a new help tooltip
         */
        function createHelpTooltip(map) {

            if (helpTooltipElement) {
                helpTooltipElement.parentNode.removeChild(helpTooltipElement);
            }
            helpTooltipElement = document.createElement('div');
            helpTooltipElement.className = 'ol-tooltip hidden';
            helpTooltip = new window.ol.Overlay({
                element: helpTooltipElement,
                offset: [15, 0],
                positioning: 'center-left'
            });
            
            map.addOverlay(helpTooltip);

        }


        /**
         * Creates a new measure tooltip
         * 
         * @param {Object} map
         * @param {String} id
         */
        function createMeasureTooltip(map) {
            if (measureTooltipElement) {
                measureTooltipElement.parentNode.removeChild(measureTooltipElement);
            }
            measureTooltipElement = document.createElement('div');
            measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
            measureTooltip = new window.ol.Overlay({
                element: measureTooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            map.addOverlay(measureTooltip);
        }


    };
})(window);

