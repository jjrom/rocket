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
        .controller('SummariesBrowserComponent', ['rocketServices', SummariesBrowserComponent]);

    function SummariesBrowserComponent(rocketServices) {

        var self = this;

        self.summaries = {};

        /*
         * Watch changes in parent
         */
        self.$onChanges = function (changesObj) {

            if (changesObj.collection && changesObj.collection.currentValue) {
                self.summaries = _getSummaries(self.collection);
            }

        };

        /**
         * Compute summaries
         * 
         * @param {object} collection
         */
        function _getSummaries(collection) {
            
            var summaries = {};

            // [STAC][1.0.0-rc.3] Convert new summaries to old resto summaries
            var betterSummaries = _makeBetterSummaries(collection.summaries);
            for (var key in betterSummaries) {

                // Easy
                if (!summaries[key]) {
                    summaries[key] = [];
                }

                var add;

                // Parse all summary entries
                if (Array.isArray(betterSummaries[key])) {

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
                else {
                    summaries[key] = betterSummaries[key];
                }

            }

            // Sort summaries per const property
            for (var key in summaries) {

                if (Array.isArray(betterSummaries[key])) {
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

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('summariesBrowser', {
            templateUrl: 'app/components/summariesBrowser/summariesBrowser.html',
            bindings: {

                /*
                 * Input STAC collection summaries
                 * (see https://github.com/radiantearth/stac-spec/blob/master/collection-spec/collection-spec.md#summaries)
                 */
                collection: '<'

            },
            controller: 'SummariesBrowserComponent'
        });

})();