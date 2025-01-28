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
        .controller('CatalogSaverController', ['rocketServices', 'rocketViews', CatalogSaverController]);

    function CatalogSaverController(rocketServices, rocketViews) {

        var self = this;

        self.savedView = {
            isPublic:false
        };

        /*
         * Initialize endpoint
         */
        self.$onInit = function () {
            _setSearch(self.filters);
            rocketServices.focus('save-view-title');

        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.filters && changesObj.filters.currentValue) {
                _setSearch(self.filters);
            }
        };

        /**
         * Save view as catalog
         */
        self.saveView = function (evt) {

            if (evt) {
                evt.stopPropagation();
            }
            
            var params = {
                title: self.savedView.title,
                description: self.savedView.description,
                public: self.savedView.isPublic,
                search: self.search
            };

            self.isLoading = true;
            rocketViews.addView(params).then(
                (result) => {

                    if (result.status === 200) {
                        rocketServices.success(rocketServices.translate('search.saveView.created', [params.title]));
                    }
                    else {
                        rocketServices.success(rocketServices.translate('search.saveView.error'));
                    }
                }
            ).finally(
                () => {
                    self.isLoading = false;
                    self.savedView = {
                        status: params.public ? 'public' : 'private'
                    };
                    if (self.onClose) {
                        self.onClose();
                    }
                }
            );

        };

        /**
         * Set search, title and description
         * 
         * @param {object} filters 
         */
        function _setSearch(filters) {

            var search = {};
            
            for (var key in filters) {

                if (filters[key] !== null && key !== '__ep') {

                    // Special case for bbox => convert array to string
                    search[key] = key === 'bbox' ? filters[key].join(',') : filters[key];

                }
            }

            // Hack for ck vs collections
            if (search.__theme) {
                search.ck = search.__theme;
                delete search.collections;
                delete search.__theme;
            }

            self.search = search;

            // Compute title and description
            var collection = search.ck || search['__collection'] || search['collections'];
            self.savedView.title = (collection ? '[' + collection + '] ' : '') + (search['__name'] || '');

            var description = [];
            for (var key in search) {
                if (['ck', '__collection', 'collections', '__name', 'name', 'limit', 'next', 'prev', 'intersects', 'bbox'].indexOf(key) === -1) {
                    description.push('#' + key + ':' + search[key]);
                }
            }
            self.savedView.description = description.join(', ');
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('catalogSaver', {
            templateUrl: "app/components/catalogSaver/catalogSaver.html",
            bindings: {

                /*
                 * Filters
                 */
                filters: '<',

                /*
                 * On close
                 */
                onClose: '&'

            },
            controller: 'CatalogSaverController'
        });

})();
