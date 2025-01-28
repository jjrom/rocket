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
     * AWS S3 util
     */
    angular.module('rocket')
        .factory('s3Util', ['rocketCache', s3Util]);

    function s3Util(rocketCache) {

        var api = {
            clearConfig: clearConfig,
            storeConfig: storeConfig,
            getConfig: getConfig,
            getS3Instance: getS3Instance,
            getBucketRequestPayment: getBucketRequestPayment,
            getSignedUrl: getSignedUrl
        };

        return api;

        ////////////

        /**
         * Get S3 configuration from localStorage
         */
        function getConfig() {
            var config = rocketCache.get(rocketCache.S3) || {};
            config.region = config.region || 'eu-central-1';
            config.RequestPayer = config.RequestPayer || 'requester';
            return rocketCache.get(rocketCache.S3) || {};
        }

        /**
         * Clear S3 configuration from localStorage
         */
        function clearConfig() {
            return storeConfig({});
        }

        /**
         * Store S3 configuration in localStorage
         * 
         * @param {Object} config
         */
        function storeConfig(config) {
            return rocketCache.put(rocketCache.S3, config);
        }

        /**
         * Returns an s3 instance
         * 
         * @returns Object
         */
        function getS3Instance(params) {
            params = params || {};
            var s3Config = getConfig();
            return new window.AWS.S3({
                accessKeyId: params.accessKeyId || s3Config.accessKeyId,
                secretAccessKey: params.secretAccessKey || s3Config.secretAccessKey,
                region: params.region || s3Config.region,
                signatureVersion: 'v4'
            });
        }

        /**
         * [WARNING] Unusable because returns 403 for anyone else of the bucket owner
         * 
         * @param {Object} s3
         * @param {Object} params
         * @param {function} callback
         * @param {function} error
         */
        function getBucketRequestPayment(s3, params, callback, error) {
            s3.getBucketRequestPayment({
                Bucket: getRequestParams(params).Bucket
            }, function (err, data) {
                if (err) {
                    return error(err);
                }
                return callback(data);
            });

        }

        /**
         * Returns a signed url for download
         * 
         * @param {Object} s3 
         * @param {Object} params
         * @param {function} callback
         * @param {function} error
         * 
         */
        function getSignedUrl(s3, params, callback, error) {
            s3.getSignedUrl('getObject', getRequestParams(params), function (err, url) {
                if (err) {
                    error(err);
                }
                else {
                    callback(url);
                }

            });
        }

        /**
         * Convert s3Url to bucketName and Key
         * 
         * @param {string} s3Url e.g. s3://sentinel-s2-l1c/tiles/31/T/DG/2022/5/17/0/B1.jp2
         * @param {Object} params
         */
        function getRequestParams(params) {

            params = params || {};

            if (params.s3Url && params.s3Url.indexOf('s3://') === 0) {
                var s3UrlExploded = params.s3Url.substring('s3://'.length).split('/');
                params.Bucket = s3UrlExploded[0];
                params.Key = s3UrlExploded.slice(1).join('/');
            }

            return {
                Bucket: params.Bucket,
                Key: params.Key,
                Expires: params.Expires || 60 * 60,
                RequestPayer: params.RequestPayer || null
            }

        }

    }

})();