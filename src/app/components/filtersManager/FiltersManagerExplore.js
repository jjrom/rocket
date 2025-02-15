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
        .controller('FiltersManagerController', ['$scope', '$timeout', 'rocketCache', 'rocketServices', 'rocketSearchService', 'config', FiltersManagerController]);

    function FiltersManagerController($scope, $timeout, rocketCache, rocketServices, rocketSearchService, config) {

        var self = this;

        /*
         * Keep reference to last collections to avoid multiple computation
         * of summaries / themes
         */
        var _lastCollections = null;

        /*
         * The list of selected filters
         */
        self.filters = {};

        /*
         * Sliders (e.g. eo:cloud_cover)
         */
        self.sliders = {
            'eo:cloud_cover':{
                min: 0,
                max: 100,
                options: {
                    step: 5,
                    floor:0,
                    ceil:100,
                    showTicks: false,
                    noSwitching: true,
                    translate: function(value) {
                        return value + '%';
                    },
                    onEnd: function(sliderId, modelValue, highValue, pointerType) {
                        var newValue = '[' + modelValue + ',' + highValue + ']';
                        if (self.filters['eo:cloud_cover'] && self.filters['eo:cloud_cover'] === newValue) {
                            return;
                        }
                        self.setFilter(['eo:cloud_cover'], modelValue === 0 && highValue === 100 ? null : newValue);
                    }
            
                }
            }
        };

        /*
         * The list of all available filters (one key per filter)
         * It is computed per selected collection
         */
        self.summaries = {};

        /*
         * Loading indicator during search
         */
        self.watch = {
            isLoading: false,
            shouldRefresh: false
        };

        /*
         * Can save view ?
         */
        self.displayViews = config.display.views;

        /*
         * Display collections list as block
         */
        self.collectionsListAsBlock = config.display.collectionsListAsBlock;

        /*
         * Initialize events
         */
        self.$onInit = function () {
            self.profile = rocketCache.get(rocketCache.PROFILE);
            rocketSearchService.on('searchstart', _searchStart);
            rocketSearchService.on('searchend', _searchEnd);
            rocketSearchService.on('updatefilters', _updateFilters);
            rocketCache.on('updatecache', _updateCache);

            // Awfull hack
            $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
            });
        };

        /*
         * Destroy events
         */
        self.$onDestroy = function () {
            rocketSearchService.un('searchstart', _searchStart);
            rocketSearchService.un('searchend', _searchEnd);
            rocketSearchService.un('updatefilters', _updateFilters);
            rocketCache.un('updatecache', _updateCache);
        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {

            /*
             * Initialize endPoint and filters
             */
            if (changesObj.endPoint) {
                _updateFilters();
                if (self.filters['eo:cloud_cover']) {
                    var cloudCovers = self.filters['eo:cloud_cover'].replace(/\[|\]/g,'').split(',');
                    self.sliders['eo:cloud_cover'].min = parseInt(cloudCovers[0]);
                    self.sliders['eo:cloud_cover'].max = parseInt(cloudCovers[1]);
                }
            }

        };

        /**
         * Switch theme
         * 
         * @param {string} prefix
         * @param {string} value
         */
        self.switchTheme = function (prefix, value) {

            var fullName = prefix + ':' + value;
            self.filters.__theme = self.filters.__theme && self.filters.__theme === fullName ? null : fullName;

            // Get collections accordingly
            self.filters.collections = self.filters.__theme && self.themes[prefix] && self.themes[prefix][value] ? self.themes[prefix][value].join(',') : null;

            _updateCollectionsFilters();
        };

        /**
         * Switch collection - nullify every non generic filters
         * 
         * @param {string} collectionId
         */
        self.switchCollection = function (collectionId) {
            console.log(self.filters.collections);
            /*if (self.filters.collections && self.filters.collections === collectionId) {
                collectionId = null;
            }

            // Nullify theme and add a human readable collection name
            self.filters.__theme = null;

            self.filters.collections = collectionId;
            self.filters.__collection = collectionId;
            if (self.endPoint && self.endPoint.collections && self.endPoint.collections.collections) {
                for (var i = self.endPoint.collections.collections.length; i--;) {
                    if (self.endPoint.collections.collections[i].id === collectionId) {
                        self.filters.__collection = self.endPoint.collections.collections[i].title || collectionId;
                        break;
                    }
                }
            }

            _updateCollectionsFilters();*/

        };

        /**
         * Return class status (i.e. 'positive', 'negative' or '')
         *
         * @param {string} name
         * @param {string} value
         * @param {string} operation
         */
        self.getStatus = function (name, value, operation) {

            /*
             * Special case for _q which is a list of space separated keywords
             */
            if (self.filters[name]) {
                var values = self.filters[name].split(_getDelimiter(name, operation));
                for (var i = 0, ii = values.length; i < ii; i++) {
                    if (values[i] === value) {
                        return 'positive';
                    }
                    else if (values[i] === '-' + value) {
                        return 'negative';
                    }
                }
            }
            return null;
        };

        /**
         * Set filter name/value
         *
         * @param {string} name
         * @param {string} value
         * @param {object} options
         */
        self.setFilter = function (name, value, options) {

            var addValue = true,
                values,
                filter = {};

            options = options || {};

            /*
             * Super easy case
             */
            if (!self.filters[name]) {
                self.filters[name] = value;
            }

            /*
             * With operation set you can select multiple values
             */
            else if (options.operation) {

                var delimiter = _getDelimiter(name, options.operation),

                    values = self.filters[name].split(delimiter);

                for (var i = 0, ii = values.length; i < ii; i++) {

                    if (values[i] === value || values[i].substr(1) === value) {

                        // Negate
                        if (config.negateFilters && options.negate && values[i].substr(0, 1) !== '-') {
                            values.splice(i, 1);
                            values.push('-' + value);
                        }
                        else {
                            values.splice(i, 1);
                        }
                        self.filters[name] = values.length > 0 ? values.join(delimiter) : null;
                        addValue = false;
                        break;

                    }

                }

                if (addValue) {
                    self.filters[name] = self.filters[name] + delimiter + value;
                }

            }

            /*
             * Special case for 'q'
             */
            else if (name === 'q') {

                var values = self.filters['q'].split(' ');
                for (var i = 0, ii = values.length; i < ii; i++) {
                    if (values[i].split(':')[0] === value.split(':')[0] || values[i].split(':')[0].substr(1) === value.split(':')[0]) {
                        if (values[i].split(':')[1] === value.split(':')[1]) {
                            if (config.negateFilters && options.negate && values[i].split(':')[0].substr(0, 1) !== '-') {
                                value = '-' + value;
                                addValue = true;
                            }
                            else {
                                addValue = false;
                            }
                        }
                        values.splice(i, 1);
                        break;
                    }
                }
                self.filters[name] = (values.length > 0 ? values.join(' ') : '') + (addValue ? ' ' + value : '');

            }

            else if (self.filters[name] !== value) {
                self.filters[name] = value;
            }

            else {
                self.filters[name] = null;
            }

            /*
             * [IMPORTANT] Add filters to commonFilters not endPoint !
             */
            filter[name] = self.filters[name];

            rocketSearchService.addFilters(filter, {
                //url:self.endPoint.url,
                append: true
            });

            return true;

        };

        /**
         * Trigger a search
         */
        self.search = function (evt) {

            if (evt) {
                evt.stopPropagation();
            }

            rocketSearchService.search({}, self.rocketMap);

        };

        /**
         * Add dates to common filters
         * 
         * @param {object} dates // e.g. {start: "2020-04-07T00:00:00Z", end: "2020-04-24T23:59:59Z"}
         */
        self.setDates = function (dates) {

            // Set filters nullify next/prev
            rocketSearchService.addFilters(
                $.extend({
                    next: null,
                    prev: null
                }, dates || {}),
                {
                    append: true
                }
            );

        };

        /**
         * Show/hide catalogSaver panel
         * 
         * @param {boolean} bool 
         */
        self.setCatalogSaverVisible = function (bool) {
            self.catalogSaverVisible = bool;
        };


        /**
         * Compute themes from enPoint
         */
        function _getThemes() {

            if (!self.endPoint || !self.endPoint.collections || !self.endPoint.collections.collections) {
                return null;
            }

            var themes = {};
            var isEmpty = true;

            for (var i = 0, ii = self.endPoint.collections.collections.length; i < ii; i++) {
                var collection = self.endPoint.collections.collections[i];
                if (collection.keywords) {
                    for (var j = 0, jj = collection.keywords.length; j < jj; j++) {
                        var splitted = collection.keywords[j].split(':');
                        if (splitted.length > 1) {
                            isEmpty = false;
                            if (!themes[splitted[0]]) {
                                themes[splitted[0]] = {};
                            }
                            if (!themes[splitted[0]][splitted[1]]) {
                                themes[splitted[0]][splitted[1]] = [];
                            }
                            themes[splitted[0]][splitted[1]].push(collection.id);
                        }
                    }
                }
            }

            if (isEmpty) {
                return null;
            }

            /* 
             * Sort
             */
            for (var key in themes) {
                themes[key] = _sortObjKeysAlphabetically(themes[key]);
            }

            return themes;

        }

        /**
         * Compute summaries
         * 
         * @param {string} collectionsStr
         */
        function _getSummaries(collectionsStr) {

            if (!self.endPoint || !self.endPoint.collections || !self.endPoint.collections.collections) {
                return {};
            }

            var collectionNames = collectionsStr ? collectionsStr.split(',') : null;
            var summaries = {};

            for (var i = 0, ii = self.endPoint.collections.collections.length; i < ii; i++) {

                var collection = self.endPoint.collections.collections[i];

                // Only keep required collection(s)
                if (collectionNames && !collectionNames.includes(collection.id)) {
                    continue;
                }

                // Discard bad collection
                if (!collection.summaries) {
                    continue;
                }

                // [STAC][1.0.0-rc.3] Convert new summaries to old resto summaries
                var betterSummaries = _makeBetterSummaries(collection.summaries);
                for (var key in betterSummaries) {

                    // Easy
                    if (!summaries[key]) {
                        summaries[key] = [];
                    }

                    var add;

                    // Parse all summary entries
                    for (var j = 0, jj = betterSummaries[key].length; j < jj; j++) {

                        add = true;

                        for (var k = 0, kk = summaries[key].length; k < kk; k++) {

                            // This entry already exist => increment counter
                            if (summaries[key][k].hasOwnProperty('count') && (summaries[key][k].const === betterSummaries[key][j].const)) {
                                summaries[key][k].count += betterSummaries[key][j].count;
                                add = false;
                                break;
                            }

                        }

                        if (add) {

                            // Alphabetical order based on id
                            summaries[key].push(betterSummaries[key][j]);
                        }

                    }

                }

            }

            // Sort summaries per const property
            for (var key in summaries) {

                summaries[key].sort(function (a, b) {
                    if (a.const < b.const) {
                        return -1;
                    }
                    if (a.const > b.const) {
                        return 1;
                    }
                    return 0;
                });

            }

            return summaries;

        };

        /**
         * Systematically Convert a STAC summaries to a JSON Schema STAC 1.0.0-rc.3 
         * 
         * STAC 1.0.0-rc.3 summaries 
         * 
         *      "instruments": {
         *          "type": "string",
         *          "oneOf": [
         *              {
         *                  "const": "msi",
         *                  "title": "MSI",
         *                  "count": 6613431
         *              },
         *              {
         *                  "const": "PX",
         *                  "title": "PX",
         *                  "count": 500
         *              }
         *          ]
         *      }
         * 
         * @param {object} stacSummaries 
         */
        function _makeBetterSummaries(stacSummaries) {

            var title, summary, betterSummaries = {};

            for (var key in stacSummaries) {

                betterSummaries[key] = [];

                // Array case
                if (Array.isArray(stacSummaries[key])) {
                    for (var i = 0, ii = stacSummaries[key].length; i < ii; i++) {

                        // Object case - leave untouched
                        if (typeof stacSummaries[key][i] === 'object') {
                            betterSummaries[key] = JSON.parse(JSON.stringify(stacSummaries[key]));
                        }
                        else {
                            betterSummaries[key].push({
                                const: stacSummaries[key][i],
                                title: stacSummaries[key][i]
                            });
                        }

                    }
                }

                // JSON Schema one element case
                else if (stacSummaries[key]['const']) {
                    summary = JSON.parse(JSON.stringify(stacSummaries[key]));
                    title = stacSummaries[key]['title'] || stacSummaries[key]['const'];
                    summary['title'] = _translate(title, key);
                    betterSummaries[key].push(summary);
                }
                // JSON Schema multi elements case
                else if (stacSummaries[key]['oneOf']) {
                    for (var i = 0, ii = stacSummaries[key]['oneOf'].length; i < ii; i++) {
                        summary = JSON.parse(JSON.stringify(stacSummaries[key]['oneOf'][i]));
                        title = stacSummaries[key]['oneOf'][i]['title'] || stacSummaries[key]['oneOf'][i]['const'];
                        summary['title'] = _translate(title, key);
                        betterSummaries[key].push(summary);
                    }
                }

                // Untouched - Range case
                else {
                    betterSummaries[key] = JSON.parse(JSON.stringify(stacSummaries[key]));
                }

            }

            // Sort result
            for (var key in betterSummaries) {
                if (Array.isArray(betterSummaries[key])) {
                    betterSummaries[key].sort(function (a, b) {
                        if (a.const < b.const) {
                            return -1;
                        }
                        if (a.const > b.const) {
                            return 1;
                        }
                        return 0;
                    });
                }
            }

            return betterSummaries;

        }

        function _updateCollectionsFilters() {

            self.summaries = _getSummaries(self.filters.collections);

            // Keep last collections
            _lastCollections = self.filters.collections;

            /*
             * Nullify selected filters that are not in the current summaries (except special tags and geo tags)
             */
            rocketSearchService.addFilters(_nullifyUnknownFilters(), {
                // [IMPORTANT] Add to commonFilters not endPoint !
                //url:self.endPoint.url,
                append: true
            });

        }

        /**
         * Set search button inactive
         */
        function _searchStart() {
            self.watch.shouldRefresh = false;
            self.watch.isLoading = true;
        };

        function _searchEnd() {
            self.watch.shouldRefresh = false;
            self.watch.isLoading = false;
        };

        function _sortObjKeysAlphabetically(obj) {
            var ordered = {};
            Object.keys(obj).sort().forEach(function (key) {
                ordered[key] = obj[key];
            });
            return ordered;
        }

        /**
         * resto special translation case
         * 
         * @param {string} title 
         * @param {string} key 
         */
        function _translate(title, key) {
            if (['season', 'month'].indexOf(key) !== -1) {
                return rocketServices.translate(key + ':' + title.toLowerCase());
            }
            return title;
        };

        /**
         * Update local filters if different i.e. if updated from outside of the component
         * 
         * @param {object} obj
         */
        function _updateFilters(obj) {

            if (!self.endPoint) {
                return;
            }

            self.filters = rocketSearchService.getFilters(self.endPoint.url);
            
            self.dates = {
                start: self.filters.start,
                end: self.filters.end
            };

            // Only update summaries and themes if collections change
            if (self.filters.collections !== _lastCollections) {
                self.summaries = _getSummaries(self.filters.collections);
                self.themes = _getThemes();
            }

            // Hack to compute filters.collections back from resto server context.query.appliedFilters.ck 
            if (obj && obj.filters && obj.filters.__theme && !obj.filters.collections) {
                var prefixAndValue = obj.filters.__theme.split(':');
                if (prefixAndValue.length === 2) {
                    self.filters.collections = self.themes[prefixAndValue[0]] && self.themes[prefixAndValue[0]][prefixAndValue[1]] ? self.themes[prefixAndValue[0]][prefixAndValue[1]].join(',') : null;
                }
            }

            // Tell user that he should refresh
            self.watch.shouldRefresh = true;

        };

        /**
         * Nullify filters that are selected but no more in current summary
         */
        function _nullifyUnknownFilters() {
            
            var i, ii, filters = {};

            var keep = ['__theme', '__collection', 'collections', 'intersects', 'bbox', 'name', '__name'];

            for (var key in self.filters) {

                // Key is not in summary - remove
                if ( !self.summaries[key] ) {
                    filters[key] = null;
                    continue;
                }

                // Key is in summary with a value - keep it
                for (i = 0, ii = self.summaries[key].length; i < ii; i++) {
                    if (self.summaries[key][i].const === self.filters[key]) {
                        filters[key] = self.filters[key];
                        break;
                    }
                    filters[key] = null;
                }

            }
            
            // Always keep input filters
            for (i = 0, ii = keep.length; i < ii; i++) {
                filters[keep[i]] = self.filters[keep[i]];
            }
            
            return filters;

        };

        /**
         * Return AND/OR delimiter
         * 
         * @param {string} key
         * @param {string} operation
         */
        function _getDelimiter(key, operation) {
            return key === 'q' || !operation ? ' ' : (operation === 'AND' ? ',' : '|');
        };

        /**
         * Called when cache is updated - use to get profile
         * @param {object} obj 
         */
        function _updateCache(obj) {
            if (obj && obj.key === rocketCache.PROFILE) {
                self.profile = obj.value;
            }
        }

    };

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('filtersManager', {
            templateUrl: ['$element', '$attrs', function ($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default: 'app/components/filtersManager/filtersManager.html',
                    explore: 'app/components/filtersManager/filtersManagerExplore.html',
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /*
                 * EndPoint
                 */
                endPoint: '<',

                /*
                 * rocketMap
                 */
                rocketMap: '<'

            },
            controller: 'FiltersManagerController'
        });

})();