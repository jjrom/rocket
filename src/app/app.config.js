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
            .config(['$translateProvider', '$authProvider', '$compileProvider', 'growlProvider', 'CacheFactoryProvider', 'config', RocketConfig]);

    function RocketConfig($translateProvider, $authProvider, $compileProvider, growlProvider, CacheFactoryProvider, config) {
        
        /*
         * Production - remove debugInfo
         */
        $compileProvider.debugInfoEnabled(config.debug);
        
        /*
         * Use to download generated blob file (e.g. metalink file for assets download) 
         */
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(|https?|ftp|mailto|blob|):/);

        /*
         * Store to localStorage
         */
        angular.extend(CacheFactoryProvider.defaults, { 
            storageMode: 'localStorage'
        });

        /*
         * Internationalization
         * (See app/i18n/{lang}.js)
         * 
         * if "detectLanguage" parameter is set to true
         * then language is detected from browser.
         * 
         * If not available, fallback to the first available language
         * (usually english)
         */
        var availableLanguages = [];
        for (var key in config.translations) {
            $translateProvider.translations(key, config.translations[key]);
            availableLanguages.push(key);
        }
        $translateProvider.useSanitizeValueStrategy('escape');
        $translateProvider.registerAvailableLanguageKeys(availableLanguages);
        if (config.detectLanguage) {
            $translateProvider.determinePreferredLanguage().fallbackLanguage(availableLanguages[0]);
        }
        else {
            $translateProvider.preferredLanguage(availableLanguages[0]);
        }
        
        /*
         * Authentication configuration with support of external providers
         */
        if (config.auth) {

            /*
             * [IMPORTANT] Do not add token to every http requests - this is done on per request
             */
            //$authProvider.httpInterceptor = function() { return false; };

            /* Not used 
            $authProvider.baseUrl = '';
            $authProvider.loginUrl = config.auth.endPoint + '/auth';
            $authProvider.loginRedirect = null;
            */
            
            if (['both', 'external'].indexOf(config.auth.strategy) !== -1)
            {
                var redirectUri = window.location.origin + '/signin';
                var token = function() {
                    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
                };
                for (var key in config.auth.providers) {
                    switch (key) {
                        case 'google':
                            $authProvider.google({
                                url: config.auth.endPoint + '/auth/google',
                                redirectUri:redirectUri,
                                clientId: config.auth.providers[key]['clientId'],
                                /*requiredUrlParams:['scope', 'state'],
                                state:token()*/
                            });
                            break;
                        case 'linkedin':
                            $authProvider.linkedin({
                                url: config.auth.endPoint + '/auth/linkedin',
                                redirectUri:redirectUri,
                                clientId: config.auth.providers[key]['clientId'],
                                requiredUrlParams:['state'],
                                state:token()
                            });
                            break;
                        default:
                            var requiredUrlParams = config.auth.providers[key]['requiredUrlParams'] ? config.auth.providers[key]['requiredUrlParams'] : [];
                            requiredUrlParams.push('state');
                            $authProvider.oauth2({
                                name: key,
                                url: config.auth.endPoint + '/auth/' + key,
                                redirectUri:redirectUri,
                                clientId: config.auth.providers[key]['clientId'],
                                authorizationEndpoint: config.auth.providers[key]['authorizeUrl'],
                                scope:config.auth.providers[key]['scope'] || null,
                                requiredUrlParams: requiredUrlParams,
                                state:token()
                            });
                    }
                }
            }

        }
        
        /*
         * Alert message positioning
         */
        growlProvider.globalTimeToLive({
            success: 4000,
            error: 4000,
            warning: 4000,
            info: 4000
        });
        growlProvider.globalPosition('bottom-right');
        growlProvider.globalDisableIcons(true);
        growlProvider.globalDisableCountDown(true);

        /*
         * ChartJS plugin
         */
        if (Chart) {

            console.log('[INFO] Initialize Chart plugins');

            /*
             * To display vertical lines after draw, add verticalLines config to chart:
             *
             *      verticalLines = {
             *          options:{
             *              label:'Mon label',
             *              scaleY:'value_0'
             *          },
             *          labels:[
             *              0,
             *              '2014-01-12T12:34:00Z'
             *          ]
             *      }
             */
            const verticalLinePlugin = {
                getLinePosition: function (chart, pointLabel) {
                    var pointIndex = -1;
                    if (typeof pointLabel === 'number') {
                        pointIndex = pointLabel;
                    }
                    // Get pointIndex from labels array
                    else {
                        if (chart.data && chart.data.labels) {
                            for (var i = 0, ii = chart.data.labels.length; i < ii; i++) {
                                if (chart.data.labels[i] === pointLabel) {
                                    pointIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    const meta = chart.getDatasetMeta(0);
                    const data = meta.data;
                    return pointIndex >= 0 && data[pointIndex] ? data[pointIndex]._model.x : null;
                },
                renderVerticalLine: function (chartInstance, pointLabel, options) {
                    options = options || {};
                    var _options = {
                        strokeStyle: options.strokeStyle || '#ff0000',
                        fillStyle: options.fillStyle || '#ff0000',
                        textAlign: options.textAlign || 'center',
                        label: options.label || '',
                        scaleY: options.scaleY || 'value_0'
                    };
                    const lineLeftOffset = this.getLinePosition(chartInstance, pointLabel);
                    if (lineLeftOffset == null) {
                        return
                    }

                    // Compute non datetime scale
                    const scale = chartInstance.scales[_options.scaleY];
                    const context = chartInstance.chart.ctx;
              
                    // render vertical line
                    context.beginPath();
                    context.strokeStyle = _options.strokeStyle;
                    context.moveTo(lineLeftOffset, scale.top);
                    context.lineTo(lineLeftOffset, scale.bottom);
                    context.stroke();
              
                    // write label
                    context.fillStyle = _options.fillStyle;
                    context.textAlign = _options.textAlign;
                    context.fillText(_options.label || '', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);
                },
              
                afterDatasetsDraw: function (chart, easing) {
                    if (chart.config.verticalLines) {
                        chart.config.verticalLines.labels.forEach(pointLabel => this.renderVerticalLine(chart, pointLabel, chart.config.verticalLines.options));
                    }
                }
            };
              
            Chart.plugins.register(verticalLinePlugin);
        }

    }

})();