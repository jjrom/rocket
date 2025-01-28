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
        .controller('HomeController', ['$scope', 'rocketHolder', 'rocketServices', 'rocketSearchService', 'stacUtil', 'config', HomeController]);

    function HomeController($scope, rocketHolder, rocketServices, rocketSearchService, stacUtil, config) {

        /* 
         * Event registration
         */
        rocketSearchService.on('addendpoint', _addEndPoint);
        rocketSearchService.on('initaddendpoint', _initAddEndPoint);

        $scope.display = {
            header:config.header.display
        };
        
        /*
         * Can change catalog ?
         */
        $scope.changeCatalog = config.display && config.display.changeCatalog;

        /*
         * What is it ?
         */
        $scope.whatisit = config.display && config.display.whatisit;

        /*
         * True when endpoint is loading
         */
        $scope.endPointIsLoading = true;

        /*
         * Events unregistration when destroying component
         */
        $scope.$on("$destroy", function () {
            rocketSearchService.un('addendpoint', _addEndPoint);
            rocketSearchService.un('initaddendpoint', _initAddEndPoint);
        });

        /*
         * <meta-suggest> configuration object
         */
        $scope.metaSuggest = {

            suggestUrl: null,

            gazetteer: null,

            /**
             * Search on keyword
             * 
             * @param {Object} keyword 
             */
            onSelectKeyword: function(keyword) {

                // Store search
                rocketHolder._search = {
                    filters:rocketSearchService.qToFilters(typeof keyword === 'string' ? keyword : keyword.id)
                };

                // Go to map page and force search with "s" parameter
                return rocketServices.go('map', {}, {
                    reload: true
                });

            },

            /**
             * Search on location
             * 
             * @param {object} location 
             */
            onSelectLocation: function(location) {
                
                // Store location for map controller
                rocketHolder._search= {
                    location:location
                };

                return rocketServices.go('map', {}, {
                    reload: true
                });
                
            }

        };

        /**
         * Search on collection
         * 
         * @param {Object} collection 
         */
        $scope.searchCollection = function(collection) {
            
            /*
             * Prepare filters on collection
             */
            var filters = {
                collections: collection.id,
                __collection: collection.title || collection.id,
                __theme:null
            }

            /*
             * Force search on collection spatial extent if set
             */
            if ( collection.extent && collection.extent.spatial && Array.isArray(collection.extent.spatial.bbox && collection.extent.spatial.bbox[0] ) ) {
                filters.bbox = collection.extent.spatial.bbox[0].join(',')
            }
            
            /*
             * Store search in rocketHolder
             */
            rocketHolder._search= {
                removeAOI:true,
                filters:filters
            };

            return rocketServices.go('map', {}, {
                reload:true
            });
                    
        }

        /**
         * Return collection preview url if set - null otherwise
         * 
         * @param {Object} collection 
         * @return {String}
         */
        $scope.getPreview = function(collection) {
            var previewLinks = rocketServices.getLinks(collection.links, 'preview');
            return previewLinks && previewLinks[0] ? previewLinks[0].href : null;
        }

        /**
         * Scroll to div
         * 
         * @param {string} id 
         */
        $scope.scrollTo = function(id) {
            var element = document.getElementById(id);
            element.scrollIntoView({
                behavior: 'smooth'
            });
        }

        /*
         * Initialize endPoint
         * 
         */
        function _addEndPoint(ep) {
            $scope.masterEndPoint = ep;
            if (!rocketHolder.mapContext) {
                $scope.$parent.mainController.setMapContext(ep && ep.data && ep.data.planet ? ep.data.planet : config.defaultPlanet);
            }
            $scope.metaSuggest.gazetteer = rocketHolder.mapContext.planetInfo.gazetteer;
            if (ep && ep.collections) {
                _updateCollections(ep.collections);
            }
            $scope.endPointIsLoading = false;
        }

        /*
         * Called when addEndPoint function is called
         * 
         */
        function _initAddEndPoint() {
            $scope.endPointIsLoading = true;
        }

        /*
         * Update local collections
         */
        function _updateCollections(collections) {
            if ( !collections.collections ) {
                $scope.collections = [];
            }
            else {

                // Reorder collections by config.collectionsOrder
                collections.collections.sort(function (a, b) {

                    if (a.summaries && b.summaries && a.summaries.collection && b.summaries.collection) {

                        // Order by count
                        if (config.collectionsOrder === 'count' && a.summaries.collection.hasOwnProperty('count') && b.summaries.collection.hasOwnProperty('count')) {
                            return a.summaries.collection.count > b.summaries.collection.count ? -1 : 1;
                        }

                    }
                    return 0;
                });

                $scope.collections = collections.collections;
            }
           
        }
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /*
         * Load initial endPoint
         */
        _addEndPoint(rocketSearchService.endPoints[0]);

    }

})();