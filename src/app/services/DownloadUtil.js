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
            .factory('downloadUtil', ['$timeout', downloadUtil]);

    function downloadUtil($timeout) {

        var service = {
            download:download,
            downloadAsset:downloadAsset,
            downloadAssets:downloadAssets
        };

        /**
         * Download all assets
         * 
         * @param {object} assets 
         * @param {Function} callback
         */
        function downloadAssets(assets, callback)
        {
            for (var key in assets) {
                service.downloadAsset(assets[key], callback);
            }
        };

        /**
         * Download asset
         * 
         * @param {object} asset
         * @param {Function} callback
         */
        function downloadAsset(asset, callback)
        {
            return service.download(asset.href, asset.href.split('/').pop(), callback);
        };

        /**
         * Automatically open iframe within page for download
         * (Note: add a _bearer for local downloads - see authentication)
         * 
         * @param {String} url
         * @param {Function} callback
         */
        function download(url, callback) {

            /*
             * Open the url within an an hidden frame
             * to force download browser dialog
             */
            var $frame = $('<iframe style="position:fixed;top:-1px;left:-1px;display:none;">').appendTo('body');

            /*
             * Add bearer for local resources
             * [TODO] How to deal with authentication ?
             * 
            var token = $auth.getToken();
            if (token && rocketServices.get(rocketServices.ENDPOINT).url === url.substr(0, rocketServices.get(rocketServices.ENDPOINT).url.length)) {
                url = url + (url.indexOf('?') === -1 ? '?' : '&') + '_bearer=' + token;
            }
            */

            /*
             * Add authentication bearer to input url
             */
            $frame.attr('src', url).on('load', function () {
                var content = $('body', $(this).contents()).text();
                try {
                    var result = JSON.parse(content);
                } catch (e) {
                    result = {
                        ErrorCode: 500,
                        content: content
                    };
                }
                if (typeof callback === 'function') {
                    callback(result);
                }
            });

            /*
             * Remove iframe
             */
            $timeout(function () {
                $frame.remove();
            }, 2000);

            return false;

        };

        /**
         * Download using HTML5
         * 
         * @param {String} url
         * @param {string} filename
         * @param {Function} callback
         */
        function download2(url, filename, callback) {

            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            
            // Add a to the doc for click to work.
            (document.body || document.documentElement).appendChild(a);
            if (a.click) {
                a.click(); // The click method is supported by most browsers.
            } else {
                $(a).trigger('click'); // Backup using jquery
            }
            
            // Delete the temporary link.
            a.parentNode.removeChild(a);

        }


        return service;

    };

})();