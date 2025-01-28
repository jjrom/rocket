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
            .factory('rocketCatalogTree', ['restoAPI', 'rocketHolder', 'rocketServices', 'config', rocketCatalogTree]);

    function rocketCatalogTree(restoAPI, rocketHolder, rocketServices, config) {

        /**
         * Update current catalog tree from stacInfo
         * 
         * @param {Object} child
         * @param {Object} stacInfo
         * @param {array} parents
         */
        function getTree(child, stacInfo, currentParents) {
            child = child || {};

            if ( !child.href || !stacInfo ) {
                return null;
            }
            
            var parents = [],
                childs = [],
                skos = {
                    narrower:[],
                    broader:[],
                    related:[]
                },
                isLeaf = false,
                id = stacInfo.id,
                context = null;

            // Special casse for FeatureCollection
            if ( stacInfo.type === 'FeatureCollection' ) {
                childs = getChildsFromFeatureCollection(stacInfo);
                id = child.title || id;
                isLeaf = true;
                context = stacInfo.context;
            }

            else {

                // Limit number of links if set in config
                var limit = stacInfo.links.length;

                if ( config.numberOfLinksLimit && config.numberOfLinksLimit > -1 ) {
                    limit = Math.min(limit, config.numberOfLinksLimit); 
                }

                for (var i = 0, ii = limit; i < ii; i++) {
                    
                    // Discard invalid links
                    if ( !stacInfo.links[i].href ) {
                        continue;
                    }

                    // Convert relative links to absolute links
                    stacInfo.links[i].href = rocketServices.makeAbsoluteUrl(child.href, stacInfo.links[i].href);
                    
                    // Compute title from id then href
                    if ( ! stacInfo.links[i].title ) {
                        stacInfo.links[i].title = stacInfo.links[i].id || getTitleFromUrl(stacInfo.links[i].href);
                    }
                    // [HACK] Translate months 
                    else if (stacInfo.id === 'month') {
                        stacInfo.links[i].title = rocketServices.translate('month:' + stacInfo.links[i].title);
                    }
                    switch (stacInfo.links[i].rel) {

                        // Under "items" their should be a FeatureCollection and not a catalog
                        case 'items':
                        case 'child':
                            childs.push(stacInfo.links[i]);
                            break;

                        // SKOS
                        case 'broader':
                            skos.broader.push(stacInfo.links[i]);
                            break;

                        case 'narrower':
                            skos.narrower.push(stacInfo.links[i]);
                            break;

                        case 'related':
                            skos.related.push(stacInfo.links[i]);
                            break;

                        /* [WFS3 => STAC] Convert rel="data" to rel="child"
                        case 'data':
                            stacInfo.links[i].rel = 'child';
                            childs.push(stacInfo.links[i]);
                            break;
                        */
                        case 'item':
                            //getFeatureFromHref(stacInfo.links[i].href, stacInfo.links[i].title);
                            rocketHolder.features[stacInfo.links[i].href] = {
                                id:stacInfo.links[i].id,
                                properties:{
                                    title:stacInfo.links[i].title || stacInfo.links[i].id
                                },
                                _href:stacInfo.links[i].href
                            }
                            childs.push(stacInfo.links[i]);
                            isLeaf = true;
                            break;

                        default:
                            break;
                    }
                    
                }
            }

            // Update parents
            if (currentParents) {
                for (var i = 0, ii = currentParents.length; i < ii; i++) {
                    if (currentParents[i].href === child.href) {
                        break;
                    }
                    parents.push(currentParents[i]);
                }
            }

            // Always add self
            parents.push({
                id:id,
                href:child.href,
                title:child.title,
                isLeaf:isLeaf,
                matched:child.hasOwnProperty('matched') ? child.matched : null,
                geouid:child.hasOwnProperty('geouid') ? child.geouid : null
            });
            
            return {
                id:id,
                description:stacInfo.description,
                parents:parents,
                childs:childs,
                skos:skos,
                isLeaf:isLeaf,
                context:context
            };
            
        };

        /**
         * Set item from FeatureCollection
         * 
         * @param {array} featureCollection
         */
        function getChildsFromFeatureCollection(featureCollection) {
            
            var childs = [];

            for (var i = 0, ii = featureCollection.features.length; i < ii; i++) {
                var selfLinks = rocketServices.getLinks(featureCollection.features[i].links, 'self');
                var selfHref = selfLinks.length > 0 ? selfLinks[0].href : null;
                childs.push({
                    rel:'item',
                    title:featureCollection.features[i].id,
                    href:selfHref
                });
                if (selfHref) {
                    if ( ! rocketHolder.features ) {
                        rocketHolder.features = {};
                    }
                    rocketHolder.features[selfHref] = featureCollection.features[i];
                }
                
            }
            
            return childs;

        };

        /**
         * Get feature from href if not exist in cache
         * 
         * @param {string} href 
         * @param {string} featureId
         */
        function getFeatureFromHref(href, featureId) {

            restoAPI.getFeature(href,
            function (data) {
                if ( !rocketHolder.features ) {
                    rocketHolder.features = {};
                }
                rocketHolder.features[href] = data;
            },
            function () {}
            );
            
        }

        return {
            getTree:getTree,
            getChildsFromFeatureCollection:getChildsFromFeatureCollection
        }

        /**
         * Get title from href 
         * 
         * @param {string} href
         */
        function getTitleFromUrl(href)
        {

            if ( !href ) {
                return null;
            }

            // Always remove everything after ? i url
            var exploded = href.split('?')[0].split('/');
            var lastPart = exploded[exploded.length - 1];

            // Returns last part
            if ( !['catalog.json', 'collection.json'].includes(lastPart) ) {
                return lastPart;
            }

            if ( exploded.length > 1 ) {
                return exploded[exploded.length - 2];
            }

            return null;

        }

    }

})();