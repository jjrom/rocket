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
     * Util
     */
    window.rocketmap.Util = {

        /**
         * Nasty hack - should be called externally to set Simple Map Service url
         */
        SMS_SERVICE: null,

        /**
         * Nasty hack - should be called externally to set Simple Map Service planet
         */
        SMS_PLANET: null,

        /**
         * Nasty hack - can be changed in config to split dateline (no need for resto servers)
         */
        CORRECT_WRAP_DATELINE: false,

        /**
         * Convert a bbox into a WKT polygon
         * 
         * @param {array} bbox 
         * @returns string
         */
        BBOXToWKT: function(bbox) {

            bbox[0] = Math.max(bbox[0], -180);
            bbox[1] = Math.max(bbox[1], -90);
            bbox[2] = Math.min(bbox[2], 180);
            bbox[3] = Math.min(bbox[3], 90);

            return 'POLYGON((' + [
                    [bbox[0], bbox[1]].join(' '),
                    [bbox[0], bbox[3]].join(' '),
                    [bbox[2], bbox[3]].join(' '),
                    [bbox[2], bbox[1]].join(' '),
                    [bbox[0], bbox[1]].join(' ')
                ].join(',') + '))';

        },

        /**
         * Convert layer to GeoJSON FeatureCollection
         * 
         * @param {obj} olLayer 
         * @param {string} projCode
         */
        layerToGeoJSON: function (olLayer, projCode) {

            return {
                type: 'FeatureCollection',
                context: olLayer.get('context'),
                links: olLayer.get('links'),
                features: window.rocketmap.Util.featuresToGeoJSON(olLayer.getSource().getFeatures(), projCode)
            }

        },

        /**
         * Convert an array of OpenLayers features to GeoJSON
         * 
         * @param {obj} feature 
         * @param {string} projCode
         */
        featuresToGeoJSON: function (olFeatures, projCode) {
            var features = [];
            if (olFeatures) {
                for (var i = 0, ii = olFeatures.length; i < ii; i++) {
                    var feature = window.rocketmap.Util.featureToGeoJSON(olFeatures[i], projCode);
                    if (feature) {
                        features.push(feature);
                    }
                }
            }
            return features;
        },

        /**
         * Convert an OpenLayers feature to GeoJSON
         * 
         * @param {obj} feature 
         * @param {string} projCode
         */
        featureToGeoJSON: function (olFeature, projCode) {

            var feature = null;

            if (!olFeature) {
                return feature;
            }
            try {

                // Generate an id from ol_uid
                if (!olFeature.getId()) {
                    olFeature.setId(olFeature.ol_uid);
                }
                feature = window.rocketmap.Util.adaptFeature(JSON.parse((new window.ol.format.GeoJSON()).writeFeature(olFeature, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: projCode
                })));

            } catch (e) {
                feature = null;
            }

            return feature;

        },

        /**
         * Convert a GeoJSON FeatureCollection to olFeatures array
         * 
         * @param {obj} featureCollection 
         * @param {string} projCode
         */
        geoJSONToOlFeatures: function (featureCollection, projCode) {

            var olFeatures = [];

            try {

                var format = new window.ol.format.GeoJSON({
                    defaultDataProjection: "EPSG:4326"
                });

                olFeatures = format.readFeatures(JSON.stringify(featureCollection), {
                    featureProjection: projCode
                });

            } catch (e) {
                console.log(e);
            }

            return olFeatures;

        },

        /**
         * Return a feature with the following modifications:
         * 
         *  - geometry rewrited to avoid -180/+180 meridian crossing issue
         *  - add properties.quiclook from assets['thumbnail]
         * 
         * @param {object} geojson 
         */
        adaptFeature: function (geojson) {

            geojson.properties = geojson.properties || {};

            /*
             * Rewrite feature geometry to avoid awkward drawing
             * when crossing the -180/+180 meridian
             */
            if (geojson.geometry && window.rocketmap.Util.CORRECT_WRAP_DATELINE) {
                geojson.geometry = window.rocketmap.Util.correctWrapDateLine(geojson.geometry);
            }

            /*
             * Update properties for OpenSearch compatibility
             *
             *  - set properties.quicklook from assets['thumbnail] -> Why ? Easier to display quicklook
             */
            if (geojson.assets) {
                for (var key in geojson.assets) {

                    // [STAC] support new "roles" array and old "role" string
                    if (geojson.assets[key].role === 'thumbnail' || (geojson.assets[key].roles && geojson.assets[key].roles.indexOf('thumbnail') !== -1)) {
                        geojson.properties.quicklook = geojson.assets[key].href;
                        break;
                    }
                }
            }

            /* 
             * Remove special links to a dedicated resto:links
             */
            if (geojson.links) {
                var restoLinks = [];
                var i = geojson.links.length;
                while (i--) {
                    if (['contents', 'example'].indexOf(geojson.links[i].rel) !== -1) {
                        restoLinks.push(geojson.links[i]);
                        geojson.links.splice(i, 1);
                    }
                }
                if ( restoLinks.length > 0) {
                    geojson.properties['resto:links'] = restoLinks;
                }
            }

            // Convert old datetime allowing a range of date
            if (geojson.properties.datetime) {
                var dates = geojson.properties.datetime.split('/');
                if (dates.length == 2) {
                    geojson.properties.start_datetime = dates[0];
                    geojson.properties.end_datetime = dates[1];
                    geojson.properties.datetime = null;
                }
            }

            // Compute bbox
            if (!geojson.bbox) {
                geojson.bbox = window.rocketmap.Util.getGeoJSONBBOX(geojson);
            }

            // Ultimately add quicklook using SMS
            if (window.rocketmap.Util.SMS_SERVICE && !geojson.properties.quicklook) {
                try {
                    geojson.properties.quicklook = window.rocketmap.Util.getSMSQuicklook(geojson);
                    geojson.properties['rocket:notRealQuicklook'] = true;
                } catch (error) {}
            }

            return geojson;

        },

        /**
         * Reduce an input feature geometry to its extent
         * 
         * @param {array} olFeatures 
         * @param {Object} options
         * 
         * @return string
         */
        featuresToReduceWKT: function (olFeatures, options) {

            var _features = [],
                geometries,
                geometry,
                extents,
                polygons;

            for (var i = olFeatures.length; i--;) {
                geometry = olFeatures[i].getGeometry();
                switch (geometry.getType()) {
                    case 'Point':
                    case 'LineString':
                    case 'Polygon':
                        geometries = [geometry];
                        break;
                    case 'MultiLineString':
                        geometries = geometry.getLineStrings();
                        break;
                    case 'MultiPolygon':
                        geometries = geometry.getPolygons();
                        break;
                    default:
                        geometries = geometry.getPoints();
                }

                extents = window.rocketmap.Util.geometriesToExtents(geometries);
                polygons = [];
                for (var l = extents.length; l--;) {
                    polygons.push(window.ol.geom.Polygon.fromExtent(extents[l]));
                }

                _features.push(new window.ol.Feature({
                    geometry: new window.ol.geom.MultiPolygon(polygons)
                }));

            }

            return (new window.ol.format.WKT()).writeFeatures(_features, options);

        },

        /**
         * Return an array of extents from an array of geometries
         * Intersected extent are merged into one
         * 
         * @param {array} geometries 
         */
        geometriesToExtents(geometries) {
            var extents = [];
            for (var j = geometries.length; j--;) {
                extents.push(geometries[j].getExtent());
            }

            var idx = extents.length - 1;

            while (idx > 0) {
                for (var k = 0; k < idx; k++) {
                    if (extents[k] && extents[idx] && (window.ol.extent.intersects(extents[idx], extents[k]) || window.ol.extent.containsExtent(extents[idx], extents[k]) || window.ol.extent.containsExtent(extents[k], extents[idx]))) {
                        extents[idx] = window.ol.extent.extend(extents[idx], extents[k]);
                        extents.splice(k, 1);
                    }
                }
                idx = idx - 1;
            }
            return extents;
        },

        /**
         * Extract curated _rocket object from layerConfig
         * 
         * @param {Object} layerConfig 
         */
        extractRocketLayerConfig: function (layerConfig) {

            var _rocket = {};

            // Read all configuration parameters - excluding 'options'
            for (var key in layerConfig) {
                if (key === 'options') {
                    continue;
                }
                _rocket[key] === layerConfig[key];
            }

            return _rocket;

        },

        /**
         * Return true if webgl is available
         * 
         * @returns {Boolean}
         */
        hasWebGL: function () {
            try {
                var canvas = document.createElement('canvas');
                return !!window.WebGLRenderingContext && (
                    canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
                return false;
            }
        },

        /**
         * (From https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Util.js)
         * 
         * Return a layerDescription from a WMS GetMap url i.e. 
         *  {
         *      url: base WMS url endpoint (i.e. without request=GetMap and without GetMap parameters)
         *      version: WMS version extracted from WMS GetMap url
         *      format:WMS format extracted from WMS GetMap url
         *      srs: WMS srs extracted from WMS GetMap url
         *      bbox : WMS bbox extracted from WMS GetMap url
         *      layers: WMS layers extracted from WMS GetMap url
         *      preview: GetMap url
         *  }
         *  
         *  If input url is not a GetMap url, then url is returned as is :
         *  {
         *      url: input url
         *  }
         *  
         * @param {String} url
         */
        parseWMSGetMap: function (url) {

            /*
             * Default - returns url within an object
             */
            var o = {
                url: url
            };

            if (!url) {
                return o;
            }

            var kvps = this.extractKVP(url, true);

            /*
             * If url is not a GetMap request then returns input url
             * within object
             */
            if (!kvps["request"] || kvps["request"].toLowerCase() !== "getmap") {
                return o;
            }

            /*
             * Extract interesting parts from WMS GetMap url i.e.
             * LAYERS, VERSION, SRS and BBOX
             * 
             * Complete baseUrl with non GetMap parameters i.e.
             * constructs baseUrl from baseUrl plus all kvp url parameters
             * minus the specific parameters
             * 
             *      LAYERS=
             *      FORMAT=
             *      TRANSITIONEFFECT=
             *      TRANSPARENT=
             *      VERSION=
             *      REQUEST=
             *      STYLES=
             *      SRS=
             *      BBOX=
             *      WIDTH=
             *      HEIGHT=
             */
            var baseUrl = this.extractBaseUrl(url, ['layers', 'format', 'transparent', 'transitioneffect', 'styles', 'version', 'request', 'styles', 'srs', 'crs', 'bbox', 'width', 'height']);
            var bbox = kvps["bbox"].split(',').map(parseFloat);
            // EPSG:4326 order change between WMS 1.1 and 1.3
            if (kvps["crs"] === 'EPSG:4326') {
                bbox = [bbox[1], bbox[0], bbox[3], bbox[2]];
            }
            $.extend(o, {
                url: baseUrl,
                preview: this.extractBaseUrl(url, ['width', 'height']) + 'width=125&height=125',
                legend: baseUrl + 'layer=' + kvps["layers"] + '&version=1.1.1&service=WMS&request=GetLegendGraphic&format=' + (kvps["format"] || "image/png"),
                layers: kvps["layers"],
                version: kvps["version"],
                format: kvps["format"] || "image/jpeg",
                bbox: bbox,
                srs: kvps["srs"] || kvps["crs"]
            });

            return o;

        },

        /**
         * Return a layerDescription from a WTMS GetTile url i.e. 
         *  {
         *      url: base WMTS url endpoint (i.e. without request=GetTile and without GetTile parameters)
         *      version: WMTS version extracted from url
         *      layer: WMTS layer extracted from url
         *      preview: GetTile url
         *      
         *  }
         *  
         *  If input url is not a GetTile url, then url is returned as is :
         *  {
         *      url: input url
         *  }
         *
         *  WMTS GetTile url example
         * 
         *      http://wmts.marine.copernicus.eu/teroWmts/
         *          ?service=WMTS
         *          &version=1.0.0
         *          &request=GetTile
         *          &tilematrixset={TileMatrixSet}
         *          &style={Style}
         *          &tilematrix={TileMatrix}
         *          &tilerow={TileRow}
         *          &tilecol={TileCol}
         *          &layer=GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m_202211/thetao
         *          &elevation=-5727.9169921875
         *          &time=2024-04-03T00:00:00Z
         * 
         * @param {String} url
         *
         */
        parseWMTSGetTile(url) {

            /*
             * Default - returns url within an object
             */
            var o = {
                url: url
            };

            if ( !url ) {
                return Promise.resolve(o);
            }

            const parser = new ol.format.WMTSCapabilities();

            var kvps = this.extractKVP(url, true);
            var baseUrl = this.extractBaseUrl(url);
            if (baseUrl.charAt(baseUrl.length - 1) == '?') {
                baseUrl = baseUrl.substr(0, baseUrl.length - 1);
            }
            return fetch(baseUrl + '?request=GetCapabilities&service=WMTS')
                .then(function (response) {
                    return response.text();
                })
                .then(function (text) {
                    const result = parser.read(text);
                    return {
                        capabilities:parser.read(text),
                        kvps:kvps
                    }
                });
        },

        /**
         * Return differences from two associative arrays
         * 
         * @param {Object} a
         * @param {Object} b
         */
        differences: function (a, b) {
            var dif = {
                count: 0,
                differences: {}
            };
            for (var key in a) { // In a and not in b
                if (!b[key]) {
                    dif['count']++;
                    dif['differences'][key] = a[key];
                }
            }
            for (var key in a) { // in a and b but different values
                if (a[key] && b[key] && a[key] !== b[key]) {
                    dif['count']++;
                    dif['differences'][key] = b[key];
                }
            }
            for (key in b) { //in b and not in a
                if (!a[key]) {
                    dif['count']++;
                    dif['differences'][key] = b[key];
                }
            }
            return dif;
        },

        /**
         * (From https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Util.js)
         * 
         * Extract Key/Value pair from an url like string
         * (e.g. &lon=123.5&lat=2.3&zoom=5)
         * 
         * @param {String} str
         * @param {boolean} lowerCasedKey
         * @param {boolean} removeNull
         */
        extractKVP: function (str, lowerCasedKey, removeNull) {
            var c = {};
            str = str || "";
            str.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                if (value === undefined || value === "") {
                    if (!removeNull) {
                        c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = true;
                    }
                }
                else {
                    c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = decodeURIComponent(value);
                }
            });
            return c;
        },

        /**
         * (From https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Util.js)
         * 
         * Return base url (i.e. url without parameters) from an input url
         * E.g. extractBaseUrl("http://myserver.com/test?foo=bar") will return "http://myserver.com/test?"
         * 
         * @param {String} url
         * @param {Array} arr : if arr is not specified remove all url parameters
         *                      otherwiser only remove parameters set in arr
         */
        extractBaseUrl: function (url, arr) {

            var baseUrl;

            if (!url) {
                return null;
            }

            /*
             * Extract base url i.e. everything befor '?'
             */
            baseUrl = url.match(/.+\?/);
            if ( !baseUrl ) {
                return url;
            }
            baseUrl = baseUrl[0];

            if (!arr || arr.length === 0) {
                return baseUrl;
            }

            var addToBaseUrl, key, i, l, kvps = this.extractKVP(url, true);

            for (key in kvps) {
                addToBaseUrl = true;
                for (i = 0, l = arr.length; i < l; i++) {
                    if (key === arr[i]) {
                        addToBaseUrl = false;
                        break;
                    }
                }
                if (addToBaseUrl) {
                    baseUrl += encodeURIComponent(key) + "=" + encodeURIComponent(kvps[key]) + "&";
                }
            }

            return baseUrl;

        },

        /**
         * Return an array of features from WKT string
         * 
         * @param {String} wkt
         * @param {String} targetEPSG
         * @returns array
         */
        readWKT: function (wkt, targetEPSG) {
            //TODO wkt = "MULTILINESTRING((-94.5077 47.4566,-94.3265 47.4056),(-94.0941 47.4328,-93.9364 47.3035,-93.7931 47.3144,-93.8 47.2182,-93.6349 47.2591,-93.4665 47.1953,-93.2854 47.0128,-93.4431 46.739,-93.615 46.6838,-93.7174 46.5534,-94.0402 46.5739,-94.4084 46.2289,-94.3685 45.8409,-94.1966 45.6764,-94.142 45.4982,-93.4373 45.2202,-93.3196 45.1488,-93.2035 44.9011,-93.0905 44.9495,-93.0101 44.801,-92.1027 44.4368,-91.8172 44.1625,-91.2952 43.9189,-91.248 43.4627,-91.0867 43.3172,-91.1679 43.1603,-91.0797 42.7919,-90.7031 42.6552,-90.6421 42.4756,-90.1698 42.1163,-90.1886 41.8347,-90.3464 41.6053,-91.0548 41.3828,-91.0941 41.2108,-90.9687 41.116,-90.9491 40.9821,-91.1531 40.6724,-91.401 40.5812,-91.3737 40.403,-91.473 40.358,-91.519 40.1749,-91.3751 39.7356,-90.7741 39.2789,-90.6266 38.8903,-90.4284 38.9674,-90.1322 38.8187),(-95.1799 47.2164,-95.2582 47.331,-95.1489 47.4502,-94.8346 47.4994,-94.6371 47.44))";
            var format = new window.ol.format.WKT(),
                feature = format.readFeature(wkt);

            /*
             * Transform to given projection
             */
            if (targetEPSG && feature.getGeometry()) {
                feature.getGeometry().transform('EPSG:4326', targetEPSG);
            }

            return [feature];
        },

        /**
         * Return the bounding box of input WKT 
         * Eventually add a buffer if extent size is null
         * 
         * @param {String} wkt
         * @param {float} buffer
         * @returns {String}
         */
        toBBOX: function (wkt, buffer) {

            buffer = buffer || 0;

            var feature = this.readWKT(wkt)[0];

            if (!feature || !feature.getGeometry()) {
                return null;
            }

            var extent = feature.getGeometry().getExtent();
            if (extent[0] === extent[2] || extent[1] === extent[3]) {
                return [
                    extent[0] - buffer,
                    extent[1] - buffer,
                    extent[2] + buffer,
                    extent[3] + buffer
                ];
            }

            return extent;

        },

        /**
         * Transform input projection coordinate to EPSG:4326
         * 
         * @param {array} coordinate
         * @param {string} projCode
         * @param {integer} precision (i.e. number of decimals returned)
         * @returns {array}
         */
        toLonLat: function (coordinate, projCode, precision) {
            var rawLonLat = window.ol.proj.transform(coordinate, projCode, 'EPSG:4326');
            if (precision) {
                return [window.rocketmap.Util.round(window.rocketmap.Util.correctLongitude(rawLonLat[0]), precision), window.rocketmap.Util.round(rawLonLat[1], precision)];
            }
            return [window.rocketmap.Util.correctLongitude(rawLonLat[0]), rawLonLat[1]];
        },

        /**
         * Create a style from config 
         * 
         * Eventually use complement color if invert is set to true
         * 
         * @param {Object} options
         * @param {boolean} invert
         * @returns {window.ol.style.Style}
         */
        createStyle: function (options, invert) {

            // OL style - leave untouched
            if (options.fct) {
                return options.fct;
            }

            var styleOptions = {};

            if (options.fill) {
                if (options.fill.color && invert) {
                    options.fill.color = window.rocketmap.Util.colorComplement(options.fill.color);
                }
                if (options.fill.color) {
                    styleOptions.fill = new window.ol.style.Fill(options.fill);
                }
            }

            if (options.stroke) {
                if (options.stroke.color && invert) {
                    options.stroke.color = window.rocketmap.Util.colorComplement(options.stroke.color);
                }
                styleOptions.stroke = new window.ol.style.Stroke(options.stroke);
            }

            if (options.circle) {
                styleOptions.image = new window.ol.style.Circle({
                    radius: options.circle.radius || 10,
                    fill: styleOptions.fill ? styleOptions.fill : new window.ol.style.Fill({
                        color: 'orange'
                    }),
                    stroke: styleOptions.stroke ? styleOptions.stroke : new window.ol.style.Stroke({
                        width: 3
                    })
                });
            }

            if (options.icon) {
                styleOptions.image = new window.ol.style.Icon(options.icon);
            }

            if (options.regularShape) {
                styleOptions.image = new window.ol.style.RegularShape(options.regularShape);
            }

            if (options.zIndex) {
                styleOptions.zIndex = options.zIndex;
            }

            if (options.text) {
                if (options.text.fill) {
                    options.text.fill = new window.ol.style.Fill(options.text.fill);
                }
                if (options.text.stroke) {
                    options.text.stroke = new window.ol.style.Stroke(options.text.stroke);
                }
                styleOptions.text = new ol.style.Text(options.text);
            }

            return new window.ol.style.Style(styleOptions);

        },

        /**
         * Compute centroid radius based on number of objects
         * 
         * @param {integer} resolution
         */
        calculateCentroidsRadius: function (resolution) {
            this._maxFeatureCount = 0;
            var features = this.resultsCentroids.getSource().getFeatures(), feature;
            for (var i = features.length - 1; i >= 0; --i) {
                feature = features[i];
                var originalFeatures = feature.get('features'),
                    extent = window.ol.extent.createEmpty();
                for (var j = 0, jj = originalFeatures.length; j < jj; ++j) {
                    window.ol.extent.extend(extent, originalFeatures[j].getGeometry().getExtent());
                }
                this._maxFeatureCount = Math.max(this._maxFeatureCount, jj);
                feature.set('radius', (0.5 * (window.ol.extent.getWidth(extent) + window.ol.extent.getHeight(extent)) / resolution) + 10);
            }
        },

        /**
         * Return centroids layer style function
         *
         * @param {ol.Feature} feature
         * @param {integer} resolution
         */
        getClusterStyle: function (feature, resolution) {
            if (resolution !== self._currentResolution) {
                self.calculateCentroidsRadius(resolution);
                self.currentResolution = resolution;
            }
            var size = feature.get('features').length;
            var fillColor = self.layersConfig.features && self.layersConfig.features.default ? self.layersConfig.features.default.fillColor : null;
            var invert = self.layersConfig.features && self.layersConfig.features.default ? self.layersConfig.features.default.invert : false;
            return [
                new window.ol.style.Style({
                    image: new window.ol.style.Circle({
                        radius: feature.get('radius'),
                        fill: new window.ol.style.Fill({
                            color: invert ? window.rocketmap.Util.colorComplement(fillColor) : fillColor
                        })
                    }),
                    text: new window.ol.style.Text({
                        text: size.toString(),
                        font: Math.max(10, (feature.get('radius') - 5)) + 'px sans-serif',
                        fill: new window.ol.style.Fill({
                            color: '#fff'
                        })
                    })
                })];
        },

        /**
         * Return the CSS colour complement
         * 
         * @param {string} csSColor
         */
        colorComplement: function (cssColor) {

            if (!cssColor || cssColor === 'transparent') {
                return null;
            }

            var opacity = 1;

            // Convert rgb/rgba to hex
            if (cssColor.substr(0, 4) !== '#') {
                var rgba = cssColor.split('(')[1].split(')')[0].split(',').map(function (v) {
                    return parseFloat(v.trim());
                });
                opacity = rgba.length === 4 ? rgba[3] : opacity;
                cssColor = this.rgbToHex(rgba[0], rgba[1], rgba[2]);
            }

            var rgb = this.hexToRgb('#' + (('000000' + (('0xffffff' ^ ('0x' + cssColor.substr(1))).toString(16))).slice(-6)));
            return 'rgba(' + [rgb.r, rgb.g, rgb.b, opacity].join(',') + ')';
        },

        /**
         * Return a longitude strictly between -180 and 180 degrees
         * 
         * @param {float} longitude
         */
        correctLongitude: function (longitude) {

            if (longitude >= -180 && longitude <= 180) {
                return longitude;
            }
            var radians = (longitude * Math.PI) / 180.0;
            return Math.atan2(Math.sin(radians), Math.cos(radians)) * (180.0 / Math.PI);

        },

        /**
         * Correct input polygon WKT from -180/180 crossing problem
         * 
         * @param {array} geometry
         */
        correctWrapDateLine: function (geometry) {

            // Only support Polygon
            if (!geometry || geometry.type !== 'Polygon') {
                return geometry;
            }

            var add360, lonPrev, latPrev, lon;

            /*
             * Multipolygon case
             */
            for (var i = 0, ii = geometry['coordinates'].length; i < ii; i++) {

                add360 = false;
                lonPrev = geometry['coordinates'][i][0][0];
                latPrev = geometry['coordinates'][i][0][1];

                /*
                * If Delta(lon(i) - lon(i - 1)) is greater than 180 degrees then add 360 to lon
                */
                for (var j = 1, jj = geometry['coordinates'][i].length; j < jj; j++) {
                    lon = geometry['coordinates'][i][j][0];
                    if (lon - lonPrev >= 180) {
                        lon = lon - 360;
                        add360 = true;
                    }
                    else if (lon - lonPrev <= -180) {
                        lon = lon + 360;
                        add360 = true;
                    }
                    lonPrev = lon;
                    latPrev = geometry['coordinates'][i][j][1];
                    geometry['coordinates'][i][j] = [lon, geometry['coordinates'][i][j][1]];
                }

                if (add360) {
                    for (var j = 0, jj = geometry['coordinates'][i].length; j < jj; j++) {
                        geometry['coordinates'][i][j] = [(geometry['coordinates'][i][j][0] + 360) % 360, geometry['coordinates'][i][j][1]];
                    }
                }
            }

            return geometry;
        },

        /**
         * Return a rounded value limited to exp decimal digits
         * 
         * @param {float} value
         * @param {integer} exp
         * @returns {Number}
         */
        round: function (value, exp) {
            if (typeof exp === 'undefined' || +exp === 0)
                return Math.round(value);

            value = +value;
            exp = +exp;

            if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
                return NaN;

            // Shift
            value = value.toString().split('e');
            value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

            // Shift back
            value = value.toString().split('e');
            return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
        },

        /**
         * Convert RGB to Hexadecimal
         * 
         * @param {integer} r
         * @param {integer} g 
         * @param {integer} b 
         * @return {string}
         */
        rgbToHex: function (r, g, b) {
            var componentToHex = function (c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            };
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        },

        /**
         * Convert Hexadecimal to RGB
         * 
         * @param {string} hex
         * @return {object}
         */
        hexToRgb: function (hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        /**
         * Return SMS quicklook url from geojson feature
         * 
         * @param {object} geojson
         * @return {string}
         */
        getSMSQuicklook: function (geojson) {

            var params = [
                'w=' + window.rocketmap.Util.SMS_SERVICE.width,
                'h=' + window.rocketmap.Util.SMS_SERVICE.height,
                'planet=' + (geojson.properties && geojson.properties['ssys:targets'] ? geojson.properties['ssys:targets'][0].toLowerCase() : window.rocketmap.Util.SMS_PLANET),
                'bbox=' + geojson.bbox.join(',')
            ];

            if (window.rocketmap.Util.SMS_SERVICE.outline && geojson.geometry) {
                var base = 'ocolor:' + encodeURIComponent(window.rocketmap.Util.SMS_SERVICE.outline) + '|coords:';
                switch (geojson.geometry.type) {
                    case 'Polygon':
                        // Limit polygon size to 50 vertices to avoir HTTP 414 URI Too large
                        if (geojson.geometry.coordinates[0].length < 50) {
                            params.push('polygon=' + base + geojson.geometry.coordinates[0].join(';'));
                        }
                        break;
                }
            }

            return window.rocketmap.Util.SMS_SERVICE.url + '?' + params.join('&');
        },

        /**
         * Return bbox from GeoJSON
         * 
         * @param {object} geojson 
         */
        getGeoJSONBBOX: function (geojson) {

            if (!geojson) {
                return null;
            }

            if (geojson.bbox) {
                return geojson.bbox;
            }

            // No bbox - compute from geometry
            try {

                var format = new window.ol.format.GeoJSON({
                    defaultDataProjection: "EPSG:4326"
                });

                var vector = new window.ol.source.Vector({
                    features: format.readFeatures(geojson, {
                        featureProjection: 'EPSG:4326'
                    })
                });

                return vector.getExtent();

            } catch (e) {
                return null;
            }

        },

        /**
         * Return true if feature contains extent
         * 
         * @param {OLFeature} olFeature
         * @param {array} extent
         * @returns {boolean}
         */
        featureContainsExtent: function (olFeature, extent) {

            if (!olFeature || !olFeature.getGeometry) {
                return false;
            }

            return window.ol.extent.containsExtent(olFeature.getGeometry().getExtent(), extent);

        },


        /**
         * Convert a geometry to a wkt
         * 
         * @param {OLGeometry} geom
         * @param {string} projCode
         * @returns 
         */
        geometryToWKT: function(geom, projCode) {
            return new window.ol.format.WKT().writeGeometry(geom, {
                dataProjection: 'EPSG:4326',
                featureProjection: projCode
            });
        },

        /**
         * Convert a wkt to an ol geometry
         * 
         * @param {string} wkt
         * @param {string} projCode
         * @returns 
         */
        WKTToGeometry: function(wkt, projCode) {
            return new window.ol.format.WKT().readGeometry(wkt, {
                dataProjection: 'EPSG:4326',
                featureProjection: projCode
            });
        },

        /**
         * Nice display of geometry title with length and area
         * 
         * @param {OlGeometry} geom
         * @param {string} projCode
         *
         */
        geometryToName: function (geom, projCode) {
            if (geom instanceof window.ol.geom.Polygon) {
                return 'Polygon [' + window.rocketmap.Util.formatArea(geom) + ']';
            } else if (geom instanceof window.ol.geom.LineString) {
                return 'LineString [' + window.rocketmap.Util.formatLength(geom) + ']';
            } else if (geom instanceof window.ol.geom.Point) {
                var wkt = window.rocketmap.Util.geometryToWKT(geom, projCode);
                var lonLat = wkt.substring(6, wkt.length - 1).split(' ');
                return window.rocketmap.Util.dms(lonLat[1].trim(), false) + ', ' + window.rocketmap.Util.dms(lonLat[0].trim(), true);
            }
            return 'geometry';
        },

        /**
         * Format length output.
         * @param {LineString} line The line.
         * @return {string} The formatted length.
         */
        formatLength: function (line) {
            var length = window.ol.sphere.getLength(line);
            var output;
            if (length > 100) {
                output = (Math.round(length / 1000 * 100) / 100) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            return output;
        },


        /**
         * Format area output.
         * @param {Polygon} polygon The polygon.
         * @return {string} Formatted area.
         */
        formatArea: function (polygon) {
            var area = window.ol.sphere.getArea(polygon);
            var output;
            if (area > 10000) {
                output = (Math.round(area / 1000000 * 100) / 100) +
                    ' ' + 'km²';
            } else {
                output = (Math.round(area * 100) / 100) +
                    ' ' + 'm²';
            }
            return output;
        },

        /**
         * Convert decimal degree to HMS
         * 
         * @param {float} D
         * @param {boolean} lng
         * @returns {undefined}
         */
        dms: function(D, lng) {
            var result = {
                dir: D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
                deg: 0 | (D < 0 ? D = -D : D),
                min: 0 | D % 1 * 60,
                sec: (0 | D * 60 % 1 * 6000) / 100
            };
            return result['deg'] + "&#176;" + result['min'] + "'" + result['sec'] + "&#34;" + result['dir'];
        }

    };

})(window);
