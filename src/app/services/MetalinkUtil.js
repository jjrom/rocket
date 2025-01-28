/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function() {

    'use strict';

    /* Services */

    angular.module('rocket')
            .factory('metalinkUtil', ['$window', metalinkUtil]);

    function metalinkUtil($window) {

        var service = {
            isDownloadable: isDownloadable,
            featureToMetalink:featureToMetalink,
            featuresToMetalink:featuresToMetalink
        };

        /**
         * Return true if asset is downloadable
         * 
         * @param {object} asset
         */
        function isDownloadable(asset)
        {

            asset = asset || {};
            switch(asset.type) {
                case 'OGC:WMS':
                case 'wms':
                case 'OGC:WMTS':
                case 'wmts':
                case 'text/html':
                    return false;
                default:
                    return true;
            }

        };

        /**
         * Return a metalink from feature
         * 
         * @param {Object} feature 
         */
        function featureToMetalink(feature)
        {

            if ( !feature ) {
                return null;
            }

            var metalink = _getMetalinkHeader(feature.properties.published) + _getMetalinkContent(feature.assets) + _getMetalinkFooter();

            return _blobIt(metalink, feature.id);
            
        };

        /**
         * Return a metalink from features
         * 
         * @param {array} features 
         */
        function featuresToMetalink(features)
        {

            if ( !features || features.length === 0 ) {
                return null;
            }

            var contents = [];
            for (var i = 0, ii = features.length; i < ii; i++) {
                contents.push(_getMetalinkContent(features[i].assets));
            }

            var metalink = _getMetalinkHeader() + contents.join('') + _getMetalinkFooter();

            return _blobIt(metalink);
            
        };

        /**
         * Return a blob from metalink string
         * 
         * @param {string} metalink
         * @param {string} id 
         */
        function _blobIt(metalink, id)
        {
            id = id || (new Date()).toISOString();

            return {
                content:($window.URL || $window.webkitURL).createObjectURL(new Blob([metalink], {
                    type: 'application/metalink4+xml'
                })),
                filename: id + '.meta4'
            }
        }

        /**
         * Return metalink file header
         * 
         * @param {string} published 
         */
        function _getMetalinkHeader(published) {
            //published = published || (new Date()).toISOString();
            return '<?xml version="1.0" encoding="UTF-8"?><metalink xmlns="http://www.metalinker.org/" xsi:schemaLocation="http://www.metalinker.org/schema.xsd" version="3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
        };
        
        /**
         * Return metalink file footer
         */
        function _getMetalinkFooter() {
            return '</metalink>';
        };

        /**
         * Return a string of metalink <file>
         * 
         * @param {object} assets
         * @return string
         */
        function _getMetalinkContent(assets) {

            var arr = [];
            
            for (var key in assets) {
               
                // Skip non downloadable asset
                if ( !service.isDownloadable(assets[key]) ) {
                    continue;
                }
                
                // Eventually remove leading / for directory filename
                arr.push('<file name="' + ( (assets[key].filename || key).replace(/^\//, '') ) + '"><description>' + (assets[key].title || key) + '</description><language>en</language>');
                //metalink.push('<hash type="sha-256">3d6fece8033d146d8611eab4f032df738c8c1283620fd02a1f2bfec6e27d590d</hash>');
                arr.push('<url>' + assets[key].href + '</url>');
                arr.push('</file>');
            }

            return '<files>' + arr.join('') + '</files>';

        };
          
        return service;

    };

})();