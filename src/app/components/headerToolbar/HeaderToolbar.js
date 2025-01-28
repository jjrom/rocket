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
        .controller('HeaderToolbar', ['$window', '$location', '$state', 'rocketCache', 'rocketHolder', 'rocketServices', 'rocketSearchService', 'config', HeaderToolbar]);

    function HeaderToolbar($window, $location, $state, rocketCache, rocketHolder, rocketServices, rocketSearchService, config) {

        var self = this,
            _ep = null;

        /*
         * Add home button if home is allowed in display 
         */
        self.watch = {
            hasHome:config.homePage,
            hasSearch:config.header.hasSearch,
            suggestUrl: null,
            gazetteer: null,
            processesEndPoints:config.processesEndPoints
        };

        /*
         * Hack to replace ui-sref-active issue
         * (see https://stackoverflow.com/questions/22219315/angular-ui-router-ui-sref-active-and-nested-states)
         */
        self.$state = $state;

        /*
         * Set up config
         */
        self.config = {
            hasSignIn: config.auth.strategy !== 'none' ? true : false,
            defaultRoute: config.defaultRoute,
            display:config.display
        };

        /*
         * Set header remote
         */
        self.setSearchToolbarRemote = function (remote) {
            
            if (self.onReady) {
                self.onReady({
                    remote: {
                        searchToolbar: remote
                    }
                });
            }

        };

        /*
         * Initialize
         */
        self.$onInit = function () {

            self.profile = rocketCache.get(rocketCache.PROFILE);
            var cart = rocketCache.get(rocketCache.CART) || {};
            self.cartSize = (cart.items || []).length;

            var jobs = rocketCache.get(rocketCache.JOBS) || [];
            self.jobsSize = jobs.length;

            _setUrls();
            rocketCache.on('updatecache', _updateCache);
            rocketSearchService.on('addendpoint', _setUrls);
            rocketSearchService.on('removeendpoint', _setUrls);
        };

        /*
         * Watch changes
         */
        self.$onChanges = function (changesObj) {};

        /*
         * Destroy
         */
        self.$onDestroy = function () {
            rocketCache.un('updatecache', _updateCache);
            rocketSearchService.un('addendpoint', _setUrls);
            rocketSearchService.un('removeendpoint', _setUrls);
        };

        /**
         * Open external link
         * @param {string} url
         */
        self.openExternalLink = function (url) {
            $window.open(url, "_blank");
        };

        /**
         * Show panel
         * 
         * @param {string} targetTab
         */
        self.showPanel = function(targetTab) {
            if (targetTab === self.panelActiveTab) {
                self.panelActiveTab = null;
                self.hidePanel();
            }
            else {
                self.panelActiveTab = targetTab;
                self.profilePanel = true;
            }
        };

        /**
         * Hide panel
         */
        self.hidePanel = function() {
            self.panelActiveTab = null;
            self.profilePanel = false;
        };

        /**
         * Return location 
         * @param {string} target 
         */
        self.get$locationParams = function(target) {
            
            var params = {};

            /*
             * These parameters are set in all routes
             */
            for (var key in ['u', 'uk']) {
                if ($location.search()[key]) {
                    params[key] = $location.search()[key]
                }
            }

            switch (target) {
                case 'map':
                    return rocketHolder.previousState && rocketHolder.previousState.from === 'map' ? $.extend(params, rocketHolder.previousState.params) : params
                default:
                    return params
            }
        }

        /**
         * Add filters q
         * 
         * @param {Object} catalog
         */
         self.addQFilter = function (catalog) {
            
            if ( !catalog ) {
                return;
            }
            
            /*
             * Eventually convert catalog to object
             */
            if (typeof catalog === 'string') {
                catalog = {
                    id:catalog
                }
            }

            /*
             * Compute keywords from keyword
             */
            var filters = $.extend(rocketSearchService.qToFilters(catalog.id), {
                next:null,
                prev:null
            });

            /*
             * The catalog is not a geo catalog - so keep aoi if exist !
             */
            if (rocketServices.keywordTypes.political.concat(rocketServices.keywordTypes.physical).indexOf(keyword.type) === -1) {
                $.extend(filters, rocketSearchService.getSpatialFilters());
            }

            /*
             * Set filters
             */
            rocketSearchService.addFilters(filters, {
                append: false
            });

            /*
             * Search if there is a valid endpoint
             */
            if (_ep && _ep.defaultSearchLink) {
                rocketSearchService.search({}, self.rocketMap);
            }
            
        };

        /**
         * Called when a location is selected 
         * 
         * @param {object} location // JSON {wkt://, properties://} or null to clear aoi layer
         * @param {object} options // {center: //True to center}
         * @param {object} evt // Stop click propagation
         */
         self.setLocation = function (location, options, evt) {
            
            if (evt) {
                evt.stopPropagation();
            }

            // Clean search filters
            if ( !location ) {
                rocketSearchService.addFilters({
                    name:null,
                    intersects:null,
                    bbox:null,
                    __name:null
                },
                {
                    append:true
                });
            }

            if (self.onSelectLocation) {
                self.onSelectLocation({
                    location: location,
                    options
                });
            }

        };

        /**
         * Set search urls
         */
        function _setUrls() {

            var gazetteer = config.defaultPlanet && config.planets && config.planets[config.defaultPlanet.toLowerCase()] ? config.planets[config.defaultPlanet.toLowerCase()].gazetteer : null;
            
            _ep = rocketSearchService.endPoints && rocketSearchService.endPoints[0] ? rocketSearchService.endPoints[0] : null;

            if ( !_ep ) {
                self.watch.suggestUrl = null;
                self.watch.gazetteer = gazetteer;
            }
            else {
                self.watch.suggestUrl = _ep.url + '/catalogs';
                self.watch.gazetteer = _ep.data && _ep.data.planet && config.planets && config.planets[_ep.data.planet.toLowerCase()] ? config.planets[_ep.data.planet.toLowerCase()].gazetteer : gazetteer;
            }

        };

        /**
         * Called when cache is updated - use to get profile
         * @param {object} obj 
         */
        function _updateCache(obj) {
            if (obj) {
                switch (obj.key) {
                    case rocketCache.PROFILE:
                        self.profile = obj.value;
                        break;
                    case rocketCache.CART:
                        self.cartSize = (obj.value.items || []).length;
                        break;
                    case rocketCache.JOBS:
                        self.jobsSize = (obj.value || []).length;
                        break;
                    case rocketCache.PROCESSES_ENDPOINTS:
                        self.watch.processesEndPoints = obj.value;
                        break;
                }
            }
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('headerToolbar', {
            templateUrl: ['$element', '$attrs', 'config', function ($element, $attrs, config) {
                var template = $attrs.template || config.header.templateUrl || 'default';
                var templates = {
                    default: 'app/components/headerToolbar/headerToolbar.html'
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * Callback function to return remote control to this component
                 */
                onReady: '&',

                /*
                 * Called when location is selected in gazetteer
                 */
                onSelectLocation:'&',

                /*
                 * Class 'fixed' or 'absolute'
                 */
                fixed:'<',

                /*
                 * Opaque means has header-mask
                 */
                opaque:'<',

                /*
                 * True to have signin button
                 */
                noSignIn:'<',

                /*
                 * Reference to rocketMap
                 */
                rocketMap: '<'

            },
            controller: 'HeaderToolbar'
        });

})();