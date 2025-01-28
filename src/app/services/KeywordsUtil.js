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
        .factory('keywordsUtil', ['rocketServices', keywordsUtil]);

    function keywordsUtil(rocketServices) {

        var api = {
            rebuild:rebuild
        };

        return api;

        ////////////

        /**
         * Convert keywords
         * 
         * @param {array} keywords
         * @returns {array}
         */
        function rebuild(keywords) {

            if (!keywords) {
                return [];
            }

            /*
             * From http://stackoverflow.com/questions/21342596/tree-structure-from-adjacency-list
             */
            var makeTree = (function () {
                var defaultClone = function (record) {
                    var newRecord = JSON.parse(JSON.stringify(record));
                    delete newRecord.parentId;
                    return newRecord;
                };
                return function (flat, clone) {
                    return flat.reduce(function (data, record) {
                        var oldRecord = data.catalog[record.id];
                        var newRecord = (clone || defaultClone)(record);
                        if (oldRecord && oldRecord.children) {
                            newRecord.children = oldRecord.children;
                        }
                        data.catalog[record.id] = newRecord;
                        if (record.parentId) {
                            var parentId = data.catalog[record.parentId] = (data.catalog[record.parentId] || { id: record.parentId });
                            parentId.children = parentId.children || {};
                            parentId.children[newRecord['name']] = newRecord;
                        } else {
                            data.tree[newRecord['name']] = newRecord;
                        }
                        return data;
                    }, { catalog: {}, tree: {} }).tree;
                };
            })();

            /**
             * Convert keyword tree to structured list
             * 
             * @param {Object} keywords
             * @returns {Array}
             */
            function structure(keywords) {
                var structuredKeywords = {};
                for (var i in keywords) {
                    var type = keywords[i]['type'];
                    if (type.indexOf('landcover:') === 0) {
                        type = 'landcover';
                    }
                    if (!structuredKeywords[type]) {
                        structuredKeywords[type] = {};
                    }
                    structuredKeywords[type][keywords[i]['name']] = keywords[i];
                }
                return structuredKeywords;
            };

            /**
             * Concat all physical keywords within a single physical type
             * 
             * @param {array} keywords
             * @returns {array}
             */
            function buildPhysicalKeywords(keywords) {
                var physical = {};

                for (var i = rocketServices.keywordTypes.physical.length; i--;) {
                    if (keywords[rocketServices.keywordTypes.physical[i]]) {
                        for (var key in keywords[rocketServices.keywordTypes.physical[i]]) {
                            physical[key] = keywords[rocketServices.keywordTypes.physical[i]][key];
                        }
                    }
                }
                return physical;
            };

            /**
             * Return true if input object contains no element
             * 
             * @param {object} obj
             * @returns boolean
             */
            function isEmpty(obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key))
                        return false;
                }
                return true;
            };
            
            var rebuiltKeywords = structure(makeTree(keywords));

            /*
             * resto doesn't translate location and season names
             *
            for (var name in rebuiltKeywords.location) {
                rebuiltKeywords.location[translate(name)] = rebuiltKeywords.location[name];
                delete rebuiltKeywords.location[name];
            }
            for (var name in rebuiltKeywords.season) {
                rebuiltKeywords.season[translate(name)] = rebuiltKeywords.season[name];
                delete rebuiltKeywords.season[name];
            }*/

            /*
             * Merge physicals keywords
             */
            rebuiltKeywords.physical = buildPhysicalKeywords(rebuiltKeywords);

            /*
             * Remove empty keys
             */
            var cleanRebuiltKeywords = {};
            for (var key in rebuiltKeywords) {
                if (!isEmpty(rebuiltKeywords[key])) {
                    cleanRebuiltKeywords[key] = rebuiltKeywords[key];
                }
            }
            return cleanRebuiltKeywords;

        };

    }

})();