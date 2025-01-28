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

    /**
     * Registered events
     *
     *   "drop"
     * 
     *      When:
     *           Trigger when drop
     * 
     *      Returns:
     *          obj
     *   
     *  "uploadstart"
     * 
     *      When:
     *          When an upload start
     * 
     *      Returns:
     *          boolean (true start, false end)
     * 
     */

    /* 
     * Factory to read and convert url and/or files into know layer type
     */
    angular.module('rocket')
        .factory('rocketMagicReader', ['$http', 'rocketAuthService', 'config', rocketMagicReader]);
        
    function rocketMagicReader($http, rocketAuthService, config) {

        var formatConstructors = config.services && config.services.upload ? (config.services.upload.supportedFormats || []) : [];

        var registeredEvents = {};
        
        var api = {
            process: process,
            processUrl:processUrl,
            processFiles:processFiles,
            on:on,
            un:un,
            trigger:trigger
        };

        return api;

        ////////////////////////////////////////////////

        /**
         * Register an event
         */
        function on(eventName, fct) {

            if (!registeredEvents[eventName]) {
                registeredEvents[eventName] = [];
            }

            if (registeredEvents[eventName].indexOf(fct) === -1) {
                registeredEvents[eventName].push(fct);
            }

        };

        /**
         * Unregister an event
         */
        function un(eventName, fct) {

            if (registeredEvents[eventName]) {
                var index = registeredEvents[eventName].indexOf(fct);
                if (index !== -1) {
                    registeredEvents[eventName].splice(index, 1);
                }
            }

        };

        /**
         * Trigger 'uploadstart' event
         * 
         * @param {string} name
         * @param {object} obj
         */
        function trigger(name, obj) {
            if (registeredEvents[name]) {
                for (var i = registeredEvents[name].length; i--;) {
                    registeredEvents[name][i](obj);
                }
            }

        };

        /**
         * Process input object
         * There are two cases for an input object : it's either an url or an array of files
         * 
         * @param {Object} obj
         * @param {string} projCode
         * @param {function} success
         * @param {function} error
         */
        function process(obj, projCode, success, error) {
            trigger('uploadstart', true);
            return obj.url ? processUrl(obj.url, projCode, success, error) : processFiles(obj.files, projCode, success, error);
        };

        /**
         * Process url
         * 
         * @param {string} url 
         * @param {string} projCode
         * @param {function} success
         * @param {function} error
         */
        function processUrl(url, projCode, success, error) {

            /*
             * COG case
             */
            if ( ['tif', 'tiff'].indexOf(url.split('.').pop().toLowerCase()) !== -1 ) {
                return  success({
                    type:'cog',
                    href:url
                });
            }
            
            /*
             * WMS case
             */
            if ( url.split('?').pop().toLowerCase().indexOf('request=getmap') !== -1 ) {
                return  success({
                    type:'tilewms',
                    href:url
                });
            }

            /*
             * WMTS case
             */
            if ( url.split('?').pop().toLowerCase().indexOf('request=gettile') !== -1 ) {
                return  success({
                    type:'wmts',
                    href:url
                });
            }

            return $http({
                url:url,
                method:'GET',
                headers:rocketAuthService.getAuthorizationHeaders(url),
                skipAuthorization: true,
                // Do not process data (e.g. do not transform in json)
                transformResponse: function (data) {
                    return data;
                }
            }).then(
                function (result) {
                    if (typeof success === 'function') {
                        success(handleData(result.data, url, projCode));
                    }
                },
                function (result) {
                    if (typeof error === 'function') {
                        error(result.data);
                    }
                }
            );

        };

        /**
         * Handle a single file
         * 
         * @param {File} file
         * @param {string} projCode
         * @param {function} callback
         * @param 
         */
        function handleFile(file, projCode, callback) {

            var reader = new FileReader();

            reader.onload = function (event) {
                return callback(handleData(window.atob(event.target.result.split(',').slice(1)), file.name, projCode, {
                    size:file.size,
                    mimeType:file.type,
                    lastModified:file.lastModified
                }));
            };
            
            reader.readAsDataURL(file);

        };

        /**
         * Handle data as string
         * 
         * @param {string} data 
         * @param {string} href
         * @param {string} projCode
         * @param {Object} metadata
         * @return {Object}
         */
        function handleData(data, href, projCode, metadata) {

            var features = [];

            // First check if JSON or COG
            var detected = detectType(data, href);
            if (detected) {
                return detected;
            }
            
            // Handle OpenLayers format
            for (var i = 0, ii = formatConstructors.length; i < ii; i++) {

                // Special cases handle previously
                if ( ['ShapeFile'].indexOf(formatConstructors[i]) !== -1 ) {
                    continue;
                }

                const format = new window.ol.format[formatConstructors[i]]();

                try {

                    features = format.readFeatures(data, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: projCode
                    });

                    if (features && features.length > 0) {

                        /*
                         * OpenLayers issue ? Extract time and elevation from flatCoordinates
                         * and set as Feature properties
                         */
                        if (formatConstructors[i] === 'GPX') {
                            features = correctGPX(features);
                        }

                        return {
                            type:formatConstructors[i],
                            features:features,
                            href:href,
                            metadata:metadata
                        };
                    }

                } catch (e) {
                    //console.log(e);
                }

            }
            
            return {
                type:'unknown',
                href:href
            };

        };

        /**
         * Process files
         * 
         * @param {array} files 
         * @param {string} projCode
         * @param {function} success
         * @param {function} error
         * 
         */
        function processFiles(files, projCode, success, error) {

            var validity = validateFiles(files);
            
            if (!validity.isValid) {
                return error(validity);
            }

            switch (validity.type) {

                case 'shapefile':
                    handleShapefile(files, projCode, success, error);
                    break;

                default:
                    handleFile(files[0], projCode,
                        function (result) {
                            success(result);
                        });
                    break;

            }

        };

        /**
         * Validate files
         * 
         * @param {array} files
         */
        function validateFiles(files) {

            var numberOfFiles = files ? files.length : 0;

            var validity;

            // Only one file is allowed
            if (numberOfFiles === 1) {
                validity = {
                    isValid:true,
                    type:getExtension(files[0])
                }
            }
            else if (formatConstructors.indexOf('ShapeFile') !== -1 && config.services.upload.shp && config.services.upload.shp.converter && numberOfFiles === 3) {
                validity = validateShapefile(files); 
            }
            else {
                return {
                    isValid: false,
                    numberOfFiles:numberOfFiles,
                    type: 'unknown'
                };
            }

            // Check size
            var maxSize = validity.type === 'shapefile' ? config.services.upload.shp.maxSize : config.services.upload.maxSize;

            if ( !validateSize(files, maxSize) ) {
                validity.isValid = false;
                validity.maxSizeReached = maxSize;
            }
        
            return validity;

        };

        /**
         * Return true if input files are valid shapefile i.e. an
         * array of exactly 3 files composed of one shp, one shx and one dbf files
         * 
         * @param {array} files 
         */
        function validateShapefile(files) {

            var hasShp = false;
            var hasShx = false;
            var hasDbf = false;
            var type = 'unknown';
            
            for (var i = files.length; i--;) {
                if (getExtension(files[i]) === 'shp') {
                    type = 'shapefile';
                    hasShp = true;
                }
                if (getExtension(files[i]) === 'dbf') {
                    type = 'shapefile';
                    hasDbf = true;
                }
                if (getExtension(files[i]) === 'shx') {
                    type = 'shapefile';
                    hasShx = true;
                }
            }

            return {
                isValid: hasShp && hasShx && hasDbf,
                type: type,
                hasShp: hasShp,
                hasShx: hasShx,
                hasDbf: hasDbf,
            }

        };

        /**
         * Return file extension
         * 
         * @param {string} file 
         */
        function getExtension(file) {
            return file && file.name ? file.name.split('.').pop() : null;
        };

        /**
         * Handle shapefile i.e. convert them to GeoJSON from server endpoint and return features
         * 
         * @param {array} files 
         * @param {string} projCode
         * @param {function} success 
         * @param {function} error
         */
        function handleShapefile(files, projCode, success, error) {
            
            var formData = new FormData();
            
            for (var i = 0, ii = files.length; i < ii; i++) {
                formData.append('files[]', files[i]);
            }

            $http({
                url:config.services.upload.shp.converter,
                method:'POST',
                data:formData,
                headers:{
                    'Content-Type': undefined
                },
                skipAuthorization: true
            }).then(
                function (result) {
                    if (result.data) {
                        return success(handleData(result.data, files[0].name, projCode));
                    }
                },
                function (err) {
                    if (typeof error === 'function') {
                        return error(err);
                    }
                }
            );

        }

        /**
         * Extract ele and time from GPX
         * 
         * @param {Array} features 
         */
        function correctGPX(features) {
            
            var i,ii,flatCoordinates;

            for (i = 0, ii = features.length; i <ii; i++) {
                flatCoordinates = features[i].getGeometry().getFlatCoordinates();
            }

            return features;

        }

        /**
         * First detect if data is in json - then try to detect the type
         * 
         * @param {Object} data 
         * @param {string} href
         */
        function detectType(data, href) {
            
            var json = null;

            try {
                json = JSON.parse(data);
            } catch(e) {
                return null;
            }

            if ( !json ) {
                return null;
            }

            // Discard GeoJSON because it is handle by OpenLayers reader later
            if (['FeatureCollection', 'Feature'].indexOf(json.type) !== -1) {
                return null;
            }

            // STAC endPoint
            if (json.stac_version && json.links) {
                if (href.toLowerCase().indexOf('http') !== 0) {
                    for (var i = json.links.length; i--;) {
                        if (json.links[i].rel === 'self') {
                            href = json.links[i].href;
                            break;
                        }
                    }
                }
                return {
                    type:'stac',
                    data:json,
                    href:href
                };
            }
            
            return {
                type:'unknown',
                href:href
            };

        }

        /**
         * Validate size
         * 
         * @param {array} files 
         * @param {integer} maxSize 
         */
        function validateSize(files, maxSize) {
            for (var i = files.length; i--;) {
                if (files[i].size > maxSize) {
                    return false;
                }
            }
            return true;
        }
       
    };

})();