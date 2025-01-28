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
        .factory('restoGazetteerAPI', ['$http', '$q', 'rocketServices', restoGazetteerAPI]);

    function restoGazetteerAPI($http, $q, rocketServices) {

        var api = {
            get:get,
            search: search,
            reverse: reverse
        };

        return api;

        ////////////


        /**
         * Get location
         *
         * @param {Object} gazetteer
         * @param {String} geouid
         *
         */
        function get(gazetteer, geouid) {

            var canceller = $q.defer();
            gazetteer = gazetteer || {};

            if ( !gazetteer.url ) {
                return $q.defer().reject().promise;
            }

            var searchParams = URLToArray(gazetteer.url) || {};
            var request = $http({
                url: gazetteer.url.split('?')[0] + '/location/' + geouid,
                method: 'GET',
                params: searchParams,
                timeout: canceller.promise,
                skipAuthorization: true
            })
            
            var promise = request.then(
                (result) => {
                    if (result.data) {
                        if (result.data.found) {
                            result.data = updateToponym(result.data);
                        }
                        else {
                            result.data = {};
                        }
                    }
                    return result;
                }
            );

            promise.cancel = () => {
                canceller.resolve();
            }

            // Since we're creating functions and passing them out of scope,
            // we're creating object references that may be hard to garbage
            // collect. As such, we can perform some clean-up once we know
            // that the requests has finished.
            promise.finally(
                function() {
                    promise.cancel = angular.noop;
                    canceller = request = promise = null;
                }
            );

            return promise;

        }


        /**
         * Search location
         *
         * @param {Object} gazetteer
         * @param {Object} params
         *
         */
        function search(gazetteer, params) {

            var canceller = $q.defer();

            gazetteer = gazetteer || {};
            params = params || {};

            if (params.q) {

                // Split on country prefix
                var countryAndToponym = params.q.split(':');

                if (countryAndToponym.length == 2) {
                    params.q = countryAndToponym[1] + ',' + countryAndToponym[0];
                }

            }

            if ( !gazetteer.url ) {
                return $q.defer().promise;
            }

            var searchParams = URLToArray(gazetteer.url) || {};
            if (params['limit']) {
                searchParams['limit'] = params['limit'];
            }
            var promise = $http({
                url: gazetteer.url.split('?')[0] + '/search/' + params['q'],
                method: 'GET',
                params: searchParams,
                timeout: canceller.promise,
                skipAuthorization: true
            }).then(
                (result) => {
                    if (result.data) {
                        var betterToponyms = [];
                        for (var i = 0, ii = result.data.hits.hits.length; i < ii; i++) {
                            var betterToponym = updateToponym(result.data.hits.hits[i]);
                            if (betterToponym) {
                                betterToponyms.push(betterToponym);
                            }
                        }
                        result.data.results = betterToponyms;
                    }
                    return result;
                }
            );

            promise.cancel = () => {
                canceller.resolve();
            }

            return promise;

        }

        /**
         * Reverse location
         *
         * @param {Object} gazetteer
         * @param {Object} params
         *
         */
        function reverse(gazetteer, params) {

            var canceller = $q.defer();

            gazetteer = gazetteer || {};
            params = params || {};

            if ( !gazetteer.url ) {
                return $q.defer().promise;
            }

            var searchParams = URLToArray(gazetteer.url) || {};
            if (params.discard_class) {
                searchParams.discard_class = params.discard_class;
            }
            var request = $http({
                url: gazetteer.url.split('?')[0] + '/reverse/POINT(' + params['lon'] + '%20' + params['lat'] + ')',
                method: 'GET',
                params: searchParams,
                timeout:canceller.promise,
                skipAuthorization: true
            })
            
            var promise = request.then(
                (result) => {

                    var locations = [];
                    
                    if (result.data && result.data.hits && result.data.hits.hits) {
                        
                        // Use an associative array then back to array to avoid several entry with the same name but different geonameid in egg
                        // See for instance "Lagoa dos Patos" in Brazil
                        var assocLocations = [];

                        // Always push first result if not in discard class
                        if (result.data.hits.hits[0]) {
                            
                            if ( !gazetteer.reverseDiscardClass || gazetteer.reverseDiscardClass.indexOf(result.data.hits.hits[0]._source.feature_class) === -1) {
                                var wkt = result.data.hits.hits[0]._source.wkt;
                                if (!wkt && result.data.hits.hits[0]._source.coordinates) {
                                    var coordinates = result.data.hits.hits[0]._source.coordinates.split(',');
                                    wkt = 'POINT(' + coordinates[1].trim() + ' ' + coordinates[0].trim() + ')';
                                }
                                assocLocations[result.data.hits.hits[0]._source.name] = {
                                    geouid: result.data.hits.hits[0]._id,
                                    wkt: wkt
                                }
                            } 
                            
                        }

                        for (var i = 1, ii = result.data.hits.hits.length; i < ii; i++) {
                            if (result.data.hits.hits[i]._source.wkt) {
                                if ( !gazetteer.reverseDiscardClass || gazetteer.reverseDiscardClass.indexOf(result.data.hits.hits[i]._source.feature_class) === -1) {
                                    assocLocations[result.data.hits.hits[i]._source.name] = {
                                        geouid: result.data.hits.hits[i]._id,
                                        wkt: result.data.hits.hits[i]._source.wkt
                                    }
                                }
                            }
                        }

                        for (var key in assocLocations) {
                            locations.push({
                                name: key,
                                geouid: assocLocations[key].geouid,
                                wkt: assocLocations[key].wkt
                            });
                        }
                       
                    }
                    
                    return locations;

                }
            );

            promise.cancel = () => {
                canceller.resolve();
            }

            // Since we're creating functions and passing them out of scope,
            // we're creating object references that may be hard to garbage
            // collect. As such, we can perform some clean-up once we know
            // that the requests has finished.
            promise.finally(
                function() {
                    promise.cancel = angular.noop;
                    canceller = request = promise = null;
                }
            );

            return promise;

        }

        /**
         * Convert egg toponym to snapplanet format
         * 
         *      "_id": "10394901",
         *      "_source": {
         *		    {
         *            "_id": "10394901",
         *		      "timezone" : "Europe/Zurich",
         *		      "elevation" : "",
         *		      "name" : "Gerra Piano, Paese",
         *		      "modification_date" : "2018-09-15",
         *		      "geonameid" : "10394901",
         *		      "feature_class" : "S",
         *		      "admin3_code" : "5113",
         *		      "admin2_code" : "2104",
         *		      "coordinates" : "46.1744,8.91189",
         *		      "cc2" : "",
         *		      "country_code3" : "CHE",
         *		      "country_code2" : "CH",
         *		      "feature_code" : "BUSTP",
         *		      "dem" : "211",
         *		      "admin1_code" : "TI",
         *		      "asciiname" : "Gerra Piano, Paese",
         *		      "alternativenames" : [
         *		        "Gerra Piano",
         *		        " Paese",
         *		        "Gerra Piano  Paese"
         *		      ],
         *		      "admin4_code" : "",
         *		      "population" : "0"
         *		    }
         *      }
         * 
         * @param {object} result
         */
        function updateToponym(result) {

            var toponym = result._source || {};
            toponym._id = result._id;

            // Special case for continent :)
            if (['CONT', 'RGN', 'AREA'].indexOf(toponym.feature_code) !== -1) {
                toponym['description'] = rocketServices.translate('geoname:' + toponym.feature_code);
            }
            // Type
            else if (['A', 'P'].indexOf(toponym.feature_class) !== -1) {
                toponym['description'] = rocketServices.translate('geoname:' + toponym.feature_code);
            }
            else if (toponym.feature_class) {
                toponym['description'] = rocketServices.translate('geoname:' + toponym.feature_class);
            }

            toponym['name'] = toponym.name + (toponym.country_code2 && toponym.feature_code && toponym.feature_code.substr(0, 3) !== 'PCL' ? ', ' + rocketServices.translate('country:' + toponym.country_code2) : '');
            
            // Get flag from country code
            if (toponym.country_code2) {
                toponym['flag'] = 'assets/img/flags/svg/' + toponym.country_code2.toLowerCase() + '.svg';
            }
            
            if (!toponym.wkt && toponym.coordinates) {
                var coordinates = toponym.coordinates.split(',');
                toponym.wkt = 'POINT(' + coordinates[1].trim() + ' ' + coordinates[0].trim() + ')';
            }

            return toponym;

        }

        function URLToArray(url) {

            var request = {};
            var idx = url.indexOf('?');
            if (idx === -1) {
                return request;
            }
            var pairs = url.substring(idx + 1).split('&');

            for (var i = 0; i < pairs.length; i++) {
                if (!pairs[i])
                    continue;
                var pair = pairs[i].split('=');
                request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
            return request;
        }

    }

})();
