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

    angular.module('rocket.filters', [
        'filters.prettyjson',
        'filters.ellipsis',
        'filters.extractlocation',
        'filters.nicedate',
        'filters.trusthtml',
        'filters.bettertranslate',
        'filters.round',
        'filters.range',
        'filters.atob'
    ]);
    

    /**
     * Create ellipsis on text to avoid text overflow
     */
    angular.module('filters.prettyjson', []).filter('prettyjson', function () {
        return function (json) {
            return JSON ? JSON.stringify(json, null, '  ') : 'your browser doesnt support JSON so cant pretty print';
        };
    });

    /**
     * Create ellipsis on text to avoid text overflow
     */
    angular.module('filters.ellipsis', []).filter('ellipsis', function () {
        return function (input, size) {
            if ( !input ) {
                return '';
            }
            if (input.length > size) {
                return input.substring(0, size) + '...';
            }
            return input;
        };
    });
    
    /**
     * Extract regions/states from flat resto keywords
     */
    angular.module('filters.extractlocation', []).filter('extractlocation', ['rocketServices', extractLocation]);
    function extractLocation(rocketServices) {
        return function(keywords) {
            return rocketServices.extractLocation(keywords);
        };
    };
    
    /**
     * Transform an ISO 8601 date into a human readable date
     */
    angular.module('filters.nicedate', []).filter('nicedate', ['rocketServices', niceDate]);
    function niceDate(rocketServices) {
        return function(input, withTime) {
            return rocketServices.niceDate(input, {
                translateSpecial:true,
                withTime:withTime ? true : false
            });
        };
    };
    
    /**
     * Interpretated text as html
     */
    angular.module('filters.trusthtml', []).filter('trusthtml', ['$sce', trustHtml]);
    function trustHtml($sce) {
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    };

    /**
     * Translate with replacement
     */
    angular.module('filters.bettertranslate', []).filter('bettertranslate', ['rocketServices', betterTranslate]);
    function betterTranslate(rocketServices) {
        return function (input, addons) {
            return rocketServices.translate(input, typeof addons === 'object' ? addons : [addons]);
        };
    };
    
    /**
     * Return a rounded value limited to exp decimal digits
     */
    angular.module('filters.round', []).filter('round', ['rocketServices', round]);
    function round(rocketServices) {
        return function (input, exp) {
            return rocketServices.round(input, exp);
        };
    };

    angular.module('filters.range', []).filter('range', function () {
        return function (list, total) {
            total = parseInt(total, 10);
            for (var i = 0; i < total; i++) {
                list.push(i);
            }
            return list;
        };
    }); 

    angular.module('filters.atob', []).filter('atob', function () {
        return function (base64str) {
            return atob(base64str);
        };
    }); 
    
})();