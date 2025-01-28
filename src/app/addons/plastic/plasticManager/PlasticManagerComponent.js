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
        .controller('PlasticManagerComponent', ['$timeout', 'rocketHolder', 'rocketCache', 'rocketServices', 'restoGazetteerAPI', 'restoAPI', 'config', PlasticManagerComponent]);

    function PlasticManagerComponent($timeout, rocketHolder, rocketCache, rocketServices, restoGazetteerAPI, restoAPI, config) {

        var self = this;

        var PLASTIC_HISTORICAL_LOCATIONS_KEY = '_plasticHistoricalLocations';
        var _zoomFirstTime = true;
        var _blur = 1;
        var _radius = 5;

        var dates = [];
        for (var i = 0, ii = config.plastic.dates.length; i < ii; i++) {
            dates.push(new Date(config.plastic.dates[i] + 'T03:00:00Z'));
        }
        var _endOfTime = config.plastic.defaultDate ? config.plastic.defaultDate + 'T03:00:00Z' : dates[Math.round(dates.length / 2)].toISOString();
        var _startOfTime = new Date(_endOfTime);
        _startOfTime.setMonth(_startOfTime.getMonth() - 1);
        

        self.watch = {
            apiIsRunning: false,
            animateIsRunning: false,
            animationSpeed:1000,
            animationIsBackward:false,
            speedFactor:1,
            currentAction: null,
            datetime: _endOfTime,
            drawToolbox: false,
            endOfTime: _endOfTime,
            startOfTime: _startOfTime.toISOString(),
            gazetteerIsLoading: false,
            property: 'total_normalized_log',
            historicalLocations: rocketCache.get(PLASTIC_HISTORICAL_LOCATIONS_KEY) || [],
            locationLayer: null,
            showTracks: true,
            showHistory: true,
            showPanel:true,
            statistics: null,
            whatif: {
                location: 'Europe',
                reduction:{
                    coastal: 'none',
                    rivers: 'none'
                }
            }
        };

        self.timeSlider = {
            value: new Date(self.watch.endOfTime),
            options: {
                stepsArray: dates,
                showTicks: false,
                hideLimitLabels: true,
                //showSelectionBar: true,
                draggableRangeOnly: true,
                translate: function (date) {
                    if (date != null) {
                        return date.toDateString();
                    }
                    return '';
                },
                onChange: function (sliderId, modelValue, highValue, pointerType) {
                    var newDatetime = modelValue.toISOString();
                    if (newDatetime !== self.watch.endOfTime) {
                        _updateTimeRange(newDatetime);
                    }

                },
                onEnd: function (sliderId, modelValue, highValue, pointerType) {
                    var newDatetime = modelValue.toISOString();
                    if (newDatetime !== self.watch.datetime) {
                        self.watch.datetime = newDatetime;
                        _getData(self.watch.currentAction);
                        _updateMax();
                    }

                }
            }
        };

        /*
         * Initialization
         */
        self.$onInit = function () {
            if (self.rocketMap) {
                self.rocketMap.on('addlayer', _mapEventaddlayer);
                self.rocketMap.on('removelayer', _mapEventremovelayer);
            }
        }

        /*
         * Destroy
         */
        self.$onDestroy = function () {
            if (self.rocketMap) {
                self.rocketMap.un('addlayer', _mapEventaddlayer);
                self.rocketMap.un('removelayer', _mapEventremovelayer);
            }
        }

        self.showHideHistory = function () {
            self.watch.showHistory = !self.watch.showHistory;
        }

        self.showHidePanel = function() {
            self.watch.showPanel = !self.watch.showPanel;
        }

        /**
         * Round value with precision digit
         * @param {float} value 
         * @param {integer} precision 
         * @returns integer
         */
        self.round = function (value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(value * multiplier) / multiplier;
        }

        /**
         * Auto load animation
         */
        self.startAnimation = function(direction) {
            self.watch.animateIsRunning = true;
            self.watch.animationDirection = direction || 'forward';
            _animate();
        }

        /**
         * Auto load animation
         */
        self.stopAnimation = function() {
            self.watch.animateIsRunning = false;
        }

        self.setSpeedFactor = function(factor) {
            self.watch.speedFactor = factor;
        }

        /*
         * Set location and zoom on it
         */
        self.setLocation = function (location) {
            if (self.rocketMap && location) {
                self.rocketMap.addAOILayer({
                    title: location.title,
                    wkt: location.wkt
                }, {
                    center: true
                });
            }

            // Trigger action
            if (!self.watch.apiIsRunning) {
                self.watch.currentAction = self.watch.currentAction || 'origin';
                _getData(self.watch.currentAction);
            }

        }

        /*
         * Clear location
         */
        self.clearLocation = function () {
            if (self.rocketMap) {
                var aoiLayer = self.rocketMap.getLayerByRocketId(self.rocketMap.AOI_LAYER_ID);
                if (aoiLayer) {
                    self.rocketMap.removeLayer(aoiLayer);
                }
            }
        }

        /**
         * Toggle draw
         */
        self.toggleDraw = function (type) {
            if (self.rocketMap) {
                if (self.watch.drawToolbox || !type) {
                    self.rocketMap.toggleDraw(null);
                    self.watch.drawToolbox = false;
                }
                else {
                    self.watch.drawToolbox = type;
                    self.rocketMap.toggleDraw(type);
                }
            }
        };

        /**
         * Get origin of plastic arriving at location
         */
        self.getOrigin = function () {
            return _getData('origin');
        };

        /**
         * Get destination of plastic leaving location
         */
        self.getDestination = function () {
            return _getData('destination');
        };

        /**
         * Get destination of plastic leaving location
         */
        self.getTracks = function () {
            return _getData('tracks');
        };

        /**
         * Execute What if scenario
         */
        self.onWhatIf = function () {
            _displayResult();
        };

        self.switchAnimationDirection = function() {
            self.watch.animationIsBackward = !self.watch.animationIsBackward;
        }

        /**
         * Animate
         */
        function _animate() {
            // Get next date
            self.timeSlider.value = dates[_getNextDateIndex(self.timeSlider.value)];
            self.watch.datetime = self.timeSlider.value.toISOString();
            _updateTimeRange(self.watch.datetime);
            _getData(self.watch.currentAction, function() {
                if (self.watch.animateIsRunning) {
                    $timeout(function(){
                        _animate();
                    }, self.watch.animationSpeed / self.watch.speedFactor);
                }
            });
        }

        function _updateTimeRange(iso8601) {
            self.watch.endOfTime = iso8601;
            _startOfTime = new Date(iso8601);
            _startOfTime.setMonth(_startOfTime.getMonth() - 1);
            self.watch.startOfTime = _startOfTime.toISOString();
        }

        /**
         * Get trajectory points from origin or to destination
         * 
         * @param {string} action  - action is "origin", "destination" or "tracks"
         * @param {function} callback
         */
        function _getData(action, callback) {

            if (self.watch.apiIsRunning) {
                return rocketServices.error('Process ongoing !');
            }

            if (!self.watch.locationLayer || !self.watch.locationLayer.get('_rocket').wkt) {
                return rocketServices.error('You must set a location first !');
            }

            self.watch.apiIsRunning = true;
            self.timeSlider.options.disabled = true;

            self.watch.currentAction = action;

            var url = [config.plastic.endPoint, action].join('/');

            var params = {
                intersects: self.watch.locationLayer.get('_rocket').wkt,
                datetime: self.watch.datetime,
                traj: action === 'origin' ? false : self.watch.showTracks
            }
            var kvps = [];
            for (var key in params) {
                kvps.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }

            return restoAPI.getResource(url, params,
                {
                    useCache: true,
                    cacheKey: url + '?' + kvps.join('&')
                })
                .then(
                    (result) => {
                        if (result.status === 200) {
                            self.watch.apiIsRunning = false;
                            self.timeSlider.options.disabled = false;
                            self.pointsAndTracks = _splitResult(result.data);
                            _displayResult();
                            if (typeof callback === 'function') {
                                callback();
                            }
                        }
                    }
                ).catch(
                    (e) => {
                        self.watch.apiIsRunning = false;
                        self.timeSlider.options.disabled = false;
                        console.log(e);
                    }
                );

        }

        /**
         * Split merged FeatureCollection with both points and tracks to two separate FeatureCollection
         * @param {object} data : API FeatureCollection containing both points and tracks 
         */
        function _splitResult(data) {

            var tracks = {
                type: 'FeatureCollection',
                context: data.context,
                numberReturned: data.numberReturned,
                properties: data.properties,
                features: []
            };

            for (var i = 0, ii = data.features.length; i < ii; i++) {
                if (data.features[i].properties.trajectories) {
                    var geometry = data.features[i].properties.trajectories;
                    //delete data.features[i].properties.trajectories;
                    tracks.features.push({
                        type: 'Feature',
                        geometry: geometry,
                        properties: data.features[i].properties
                    });
                }
            }

            return {
                points: data,
                tracks: tracks
            };

        }


        /**
         * Display result (origin or destination) has heatmap layer 
         */
        function _displayResult() {

            if ( !self.pointsAndTracks ) {
                return;
            }
            
            // Empty result
            if (self.pointsAndTracks.points.features.length === 0) {
                self.watch.statistics = null;
            }
            else {
                _computeStatistics();
            }
            

            // Which normalization to show
            if (self.watch.whatif.reduction.coastal !== 'none' || self.watch.whatif.reduction.rivers !== 'none') {
                self.watch.property = 'total_whatif_normalized_log';
            }

            // Points as heatmap
            var features = window.rocketmap.Util.geoJSONToOlFeatures(self.pointsAndTracks.points, self.rocketMap.getProjectionCode());
            var tmpLayer = self.rocketMap.getLayerByRocketId('_plasticHeatmap');
            if (tmpLayer) {
                _updateVectorLayer(tmpLayer, features, _zoomFirstTime);
            }
            else {
                self.rocketMap.addLayer(
                    {
                        id: '_plasticHeatmap',
                        title: 'Plastic density map',
                        type: 'GeoJSON',
                        display: 'heatmap',
                        ol: {
                            blur: parseInt(_blur, 10),
                            radius: parseInt(_radius, 10),
                            weight: function (feature) {
                                return feature.getProperties()[self.watch.property];
                            }
                        },
                        isHoverable: true,
                        features: features
                    },
                    {
                        center: _zoomFirstTime
                    }
                );
            }
            
            _zoomFirstTime = false;

            var tracksFeatures = window.rocketmap.Util.geoJSONToOlFeatures(self.pointsAndTracks.tracks, self.rocketMap.getProjectionCode());
            
            tmpLayer = self.rocketMap.getLayerByRocketId('_plasticTracks');
            if (tmpLayer) {
                _updateVectorLayer(tmpLayer, tracksFeatures, _zoomFirstTime)
            }
            else {
                self.rocketMap.addLayer(
                    {
                        id: '_plasticTracks',
                        title: 'Plastic tracks',
                        type: 'GeoJSON',
                        visible: tracksFeatures.length > 0,
                        style: function (feature, resolution) {
                            var ageInDays_normalized_log = feature.getProperties().ageInDays_normalized_log;
                            return [
                                new window.ol.style.Style({
                                    stroke: new window.ol.style.Stroke({
                                        width: 1,
                                        color: (function (ageInDays_normalized_log) {
                                            if (ageInDays_normalized_log < 0.2) {
                                                return 'rgba(80, 242, 218, 0.4)';
                                            }
                                            else if (ageInDays_normalized_log >= 0.2 && ageInDays_normalized_log < 0.4) {
                                                return 'rgba(61, 153, 112, 0.5)';
                                            }
                                            else if (ageInDays_normalized_log >= 0.4 && ageInDays_normalized_log < 0.6) {
                                                return 'rgba(153, 144, 61, 0.6)';
                                            }
                                            else if (ageInDays_normalized_log >= 0.6 && ageInDays_normalized_log < 0.8) {
                                                return 'rgba(227, 146, 25, 0.7)';
                                            }
                                            else if (ageInDays_normalized_log >= 0.8) {
                                                return 'rgba(242, 93, 80, 0.8)';
                                            }
                                        })(ageInDays_normalized_log)
                                    })
                                })
                            ]
                        },
                        features: tracksFeatures
                    }
                );
            }
            
        }

        /**
         * Update existing vector layer with input features
         * 
         * @param {olLayer} layer 
         * @param {olFeatures} features 
         * @param {boolean} center 
         */
        function _updateVectorLayer(layer, features, center) {
            var source = layer.getSource();
            source.clear();
            source.addFeatures(features);
            source.changed();
            if (center) {
                self.rocketMap.zoomTo(layer, {
                    padding: [100, 100, 100, 100]
                });
            }
        }


        /**
         * Get location centroid most probable location name
         * 
         * @returns 
         */
        function _reverseLocation(olLayer) {

            var lonLat = null;
            var extent = olLayer.getSource().getExtent();
            if (extent) {
                lonLat = window.ol.proj.toLonLat(window.ol.extent.getCenter(extent), self.rocketMap.getProjectionCode());
            }

            if (!lonLat) {
                return;
            }

            var _rocket = olLayer.get('_rocket');

            /*
             * Perform a reverse location if gazetteer is present
             */
            self.watch.gazetteerIsLoading = true;


            if (!rocketHolder.mapContext || !rocketHolder.mapContext.planetInfo.gazetteer || !rocketHolder.mapContext.planetInfo.gazetteer.url) {
                self.watch.gazetteerIsLoading = false;
                return;
            }

            restoGazetteerAPI.reverse(
                rocketHolder.mapContext.planetInfo.gazetteer,
                {
                    lon: lonLat[0],
                    lat: lonLat[1],
                    discard_class: 'S'
                }
            )
                .then(function (locations) {
                    $timeout(function () {
                        self.watch.gazetteerIsLoading = false;
                        _rocket.title = locations && locations[0] ? locations[0].name : lonLat.join(',');
                        olLayer.set('_rocket', _rocket);
                        _locationToCache(olLayer);
                    });
                })
                .catch(function (error) {
                    $timeout(function () {
                        self.watch.gazetteerIsLoading = false;
                        _rocket.title = lonLat.join(',');
                        olLayer.set('_rocket', _rocket);
                        _locationToCache(olLayer);
                    });
                });

        }

        /**
         * Store location to cache for history
         */

        function _locationToCache(olLayer) {

            self.watch.locationLayer = olLayer;
            _zoomFirstTime = true;

            var _rocket = olLayer.get('_rocket');

            for (var i = self.watch.historicalLocations.length; i--;) {
                if (self.watch.historicalLocations[i].wkt === _rocket.wkt) {
                    return;
                }
            }
            self.watch.historicalLocations.unshift({
                title: _rocket.title,
                wkt: _rocket.wkt
            });
            rocketCache.put(PLASTIC_HISTORICAL_LOCATIONS_KEY, self.watch.historicalLocations);

            // Trigger action
            if (!self.watch.apiIsRunning) {
                self.watch.currentAction = self.watch.currentAction || 'origin';
                _getData(self.watch.currentAction);
            }

        }

        function _computeWhatIf() {

            var ranges = {};

            /*
             * Recompute locally leb2019 and mei2021 values
             *
             * [IMPORTANT] If currentAction is "destination" then decrease all values since all particles are emitted from the
             * emitter
             */
            for (var i = self.pointsAndTracks.points.features.length; i--;) {

                if (self.watch.currentAction === 'destination' || self.pointsAndTracks.points.features[i].properties.locatedIn === self.watch.whatif.location) {
                    self.pointsAndTracks.points.features[i].properties.leb2019_whatif = self.pointsAndTracks.points.features[i].properties.leb2019 * ((100 - (self.watch.whatif.reduction.coastal === 'none' ? 0 : self.watch.whatif.reduction.coastal)) / 100)
                    self.pointsAndTracks.points.features[i].properties.mei2021_whatif = self.pointsAndTracks.points.features[i].properties.mei2021 * ((100 - (self.watch.whatif.reduction.rivers === 'none' ? 0 : self.watch.whatif.reduction.rivers)) / 100)
                }
                else {
                    self.pointsAndTracks.points.features[i].properties.leb2019_whatif = self.pointsAndTracks.points.features[i].properties.leb2019;
                    self.pointsAndTracks.points.features[i].properties.mei2021_whatif = self.pointsAndTracks.points.features[i].properties.mei2021;
                }

                self.pointsAndTracks.points.features[i].properties.total_whatif = self.pointsAndTracks.points.features[i].properties.leb2019_whatif + self.pointsAndTracks.points.features[i].properties.mei2021_whatif;
                self.pointsAndTracks.points.features[i].properties.total_whatif_difference = (self.pointsAndTracks.points.features[i].properties.leb2019 + self.pointsAndTracks.points.features[i].properties.mei2021) - self.pointsAndTracks.points.features[i].properties.total_whatif;

                // Recompute min/max ranges
                for (var key of ['leb2019_whatif', 'mei2021_whatif', 'total_whatif', 'total_whatif_difference'].values()) {
                    if (!ranges.hasOwnProperty(key)) {
                        ranges[key] = {
                            max: self.pointsAndTracks.points.features[i].properties[key],
                            min: self.pointsAndTracks.points.features[i].properties[key],
                            total: self.pointsAndTracks.points.features[i].properties[key]
                        }
                    }
                    else {
                        if (self.pointsAndTracks.points.features[i].properties[key] > ranges[key].max) {
                            ranges[key].max = self.pointsAndTracks.points.features[i].properties[key];
                        }
                        if (self.pointsAndTracks.points.features[i].properties[key] < ranges[key].min) {
                            ranges[key].min = self.pointsAndTracks.points.features[i].properties[key];
                        }
                        ranges[key].total += self.pointsAndTracks.points.features[i].properties[key]
                    }
                }

            }

            /*
             * Then recompute global statistics
             */
            for (var i = self.pointsAndTracks.points.features.length; i--;) {
                for (var key in ranges) {
                    self.pointsAndTracks.points.features[i].properties[key + '_normalized'] = (self.pointsAndTracks.points.features[i].properties[key] - ranges[key].min) / (ranges[key].max - ranges[key].min);
                    self.pointsAndTracks.points.features[i].properties[key + '_normalized_log'] = (Math.log(self.pointsAndTracks.points.features[i].properties[key] + 1) - Math.log(ranges[key].min + 1)) / (Math.log(ranges[key].max + 1) - Math.log(ranges[key].min + 1));
                }
            }

            self.pointsAndTracks.points.properties = { ...self.pointsAndTracks.points.properties, ...ranges };

        };

        /**
         * Compute statistics from data FeatureCollection
         * 
         * Data is a GeoJSON FeatureCollection with
         * 
         * "properties": {
         *      "leb2019": {
         *        "max": 3977724.2,
         *        "min": 0,
         *        "total": 18220049.7171473
         *      },
         *      "mei2021": {
         *        "max": 16.383417,
         *        "min": 0,
         *        "total": 47.059361823
         *      },
         *      "total": {
         *        "max": 3977724.2,
         *        "min": 0.5451158,
         *        "total": 18220096.7765091
         *      },
         *      "ageInDays": {
         *        "max": 132,
         *        "min": 5
         *      }
         *  },     
         * 
         */
        function _computeStatistics() {

            // First compute What if scenario
            _computeWhatIf();

            var coastalKey = 'leb2019';
            var riversKey = 'mei2021';
            var coastalValue = (self.pointsAndTracks.points.properties[coastalKey].total);
            var riversValue = self.pointsAndTracks.points.properties[riversKey].total;
            var original = {
                coastal:coastalValue,
                rivers:riversValue
            };
            var whatif = {
                coastal:coastalValue,
                rivers:riversValue
            };

            // What if is valid
            if (self.watch.whatif.reduction.coastal !== 'none') {
                coastalKey = 'leb2019_whatif';
                whatif.coastal = self.pointsAndTracks.points.properties[coastalKey].total;
                whatif.coastal_diff_percentage = Math.round(((whatif.coastal * 100) / coastalValue) - 100);
                coastalValue = self.pointsAndTracks.points.properties[coastalKey].total;
            }
            if (self.watch.whatif.reduction.rivers != 'none') {
                riversKey = 'mei2021_whatif';
                whatif.rivers = self.pointsAndTracks.points.properties[riversKey].total;
                whatif.rivers_diff_percentage = Math.round(((whatif.rivers * 100) / riversValue) - 100);
                riversValue = self.pointsAndTracks.points.properties[riversKey].total;
            }

            var coastalPercentage = Math.ceil((coastalValue / (coastalValue + self.pointsAndTracks.points.properties[riversKey].total)) * 100);

            // Compute Whatif total difference
            whatif.total_diff = self.round(original.coastal + original.rivers - (whatif.coastal + whatif.rivers), original.coastal + original.rivers - (whatif.coastal + whatif.rivers) < 1 ? 1 : 0);
            whatif.total_diff_percentage = Math.round((((whatif.coastal + whatif.rivers) * 100) / (original.coastal + original.rivers)) - 100);
            
            var locations = {};
            var ages = [];
            var ageInDays = {
                label:['Age in days'],
                data:[[]]
            };

            for (var i = self.pointsAndTracks.points.features.length; i--;) {
                var locatedIn = self.pointsAndTracks.points.features[i].properties.locatedIn;
                if (locatedIn) {
                    if (!locations[locatedIn]) {
                        locations[locatedIn] = {
                            coastal: self.pointsAndTracks.points.features[i].properties[coastalKey],
                            rivers: self.pointsAndTracks.points.features[i].properties[riversKey]
                        };
                    }
                    else {
                        locations[locatedIn].coastal += self.pointsAndTracks.points.features[i].properties[coastalKey];
                        locations[locatedIn].rivers += self.pointsAndTracks.points.features[i].properties[riversKey];
                    }
                }

                var ageAdded = false;
                // Nothing is older to 2 years
                var correctedAID = Math.min(self.pointsAndTracks.points.features[i].properties.ageInDays, 730);
                for (var j = 0, jj = ages.length; j < jj; j++) {    
                    if (ages[j]['ageInDays'] === correctedAID) {
                        ages[j]['number'] += 1;
                        ageAdded = true;
                        break;
                    }
                }
                if (!ageAdded) {
                    ages.push({
                        ageInDays: correctedAID,
                        number: 1
                    });
                }

            }

            ages.sort(function (a, b) {
                return a.ageInDays < b.ageInDays ? -1 : 1;
            });
            for (var i = 0, ii = ages.length; i < ii; i++) {
                ageInDays.data[0].push({
                    x:ages[i]['ageInDays'],
                    y:ages[i]['number']
                });
            }

            for (var key in locations) {
                locations[key].percentage = Math.ceil(((locations[key].coastal + locations[key].rivers) / (coastalValue + self.pointsAndTracks.points.properties[riversKey].total)) * 100)
            }

            self.watch.statistics = {
                coastal: {
                    value: self.round(coastalValue, coastalValue < 1 ? 1 : 0),
                    percentage: coastalPercentage
                },
                rivers: {
                    value: self.round(riversValue, riversValue < 1 ? 1 : 0),
                    percentage: 100 - coastalPercentage
                },
                whatif:whatif,
                locations: locations,
                ageInDays: ageInDays
            }

        }

        /**
         * Get the next date index from dates array returning to 0
         */
        function _getNextDateIndex(date) {
            for (var i = 0, ii = dates.length; i < ii; i++) {
                if (date === dates[i]) {
                    if (self.watch.animationIsBackward) {
                        return i > 0 ? i - 1 : ii - 1;
                    }
                    else {
                        return i < (ii - 1) ? i + 1 : 0;
                    }
                    
                }
            }
            return 0;
        }

        function _updateMax() {

            console.log('TODO _updateMax');
            return;
            if ( !self.rocketMap ) {
                return;
            }

            var maxLayer = self.rocketMap.getLayerByRocketId(self.rocketMap.AOI_LAYER_ID);
            if ( !maxLayer ) {
                return;
            }
            
            const features = maxLayer.getSource().getFeatures();

            features.forEach(feature => {
                const geometry = feature.getGeometry();
                const type = geometry.getType();

                if (type === 'Point') {
                    const newCoordinates = [
                        (Math.random() - 0.5) * 360,
                        (Math.random() - 0.5) * 180
                    ];
                    geometry.setCoordinates(ol.proj.fromLonLat(newCoordinates));
                } else if (type === 'LineString') {
                    const newCoordinates = [
                        [(Math.random() - 0.5) * 360, (Math.random() - 0.5) * 180],
                        [(Math.random() - 0.5) * 360, (Math.random() - 0.5) * 180]
                    ].map(coords => ol.proj.fromLonLat(coords));
                    geometry.setCoordinates(newCoordinates);
                }
            });

            // Refresh the source to update the layer
            geojsonSource.changed();
        }
   
        /**
         * Map event : addlayer
         * 
         * @param {Object} olLayer 
         */
        function _mapEventaddlayer(olLayer, params) {
            if (olLayer && olLayer.get('_rocket') && olLayer.get('_rocket').id === self.rocketMap.AOI_LAYER_ID) {
                if (olLayer.get('_rocket').properties && olLayer.get('_rocket').properties._from === 'draw') {
                    self.watch.drawToolbox = false;
                    self.watch.showHistory = false;
                    _reverseLocation(olLayer);
                }
                else {
                    _locationToCache(olLayer);
                }
            }
        }

        /**
         * Map event : removelayer
         * 
         * @param {string} layerId 
         */
        function _mapEventremovelayer(layerId) {
            if (layerId === self.rocketMap.AOI_LAYER_ID) {
                self.watch.locationLayer = null;
            }
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('plasticManager', {
            templateUrl: 'app/addons/plastic/plasticManager/plasticManager.html',
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<'

            },
            controller: 'PlasticManagerComponent'
        });

})();