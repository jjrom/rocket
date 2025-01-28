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
            .factory('rocketViews', ['restoAPI', 'rocketCache', 'rocketAuthService', rocketViews]);

    function rocketViews(restoAPI, rocketCache, rocketAuthService) {

        var isInitialized = false;

        var service = {
            addView:addView,
            getViews: getViews,
            removeView: removeView
        };

        /**
         * Add a view
         * 
         * @param {object} params
         */
        function addView(params) {

            return restoAPI.createView(rocketAuthService.getAuthEndPoint() + '/views', params).then(
                (result) => {
                    if (result.status === 200) {
                        // [Important] Update views in cache
                        var views = rocketCache.get(rocketCache.VIEWS) || [];
                        views.push(result.data.view);
                        rocketCache.put(rocketCache.VIEWS, views);
                    }
                    else {
                        rocketServices.success(rocketServices.translate('search.saveView.error'));
                    }
                    return result;
                }
            ).catch(
                (error) => {
                    return error;
                }
            );

        }
        
        /**
         * Get views from server
         * 
         * @param {Function} callback
         */
        function getViews(callback) {
            
            if ( !isInitialized ) {

                var views = [];
                return restoAPI.getResource(rocketAuthService.getAuthEndPoint() + '/views', {
                    oo:true
                })
                    .then(
                        (result) => {
                            if (result.status === 200) {
                                views = result.data.views;
                            }
                        }
                    ).catch(
                        (error) => {
                            views = [];
                        }
                    ).finally(function() {

                        isInitialized = true;

                        rocketCache.put(rocketCache.VIEWS, views);
                        if (typeof callback === 'function') {
                            callback(views);
                        }

                    });
            }

            else {
                if (typeof callback === 'function') {
                    callback(rocketCache.get(rocketCache.VIEWS));
                }
            }

        };

        /**
         * Remove view
         * 
         * @param {string} viewId
         * @param {Function} callback
         */
        function removeView(viewId, callback) {

            var views = rocketCache.get(rocketCache.VIEWS);

            return restoAPI.deleteView(rocketAuthService.getAuthEndPoint() + '/views/' + viewId)
                .then(
                    (result) => {
                        if (result.status === 200) {
                            for (var i = 0, ii = views.length; i < ii; i++) {
                                if (views[i].id === viewId) {
                                    views.splice(i, 1);
                                    break;
                                }
                            }
                            rocketCache.put(rocketCache.VIEWS, views);
                        }
                    }
                ).catch(
                    (error) => {}
                ).finally(
                    () => {
                        if (typeof callback === 'function') {
                            callback(views);
                        }
                    }
                );
        }

        return service;

    };

})();