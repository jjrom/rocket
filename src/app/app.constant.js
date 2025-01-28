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

    var env = {};
    
    if (window) {  
        Object.assign(env, window.__env);
        delete window.__env;
    }

    // Merge default translations with the ones from config
    window.__translations = window.__translations || {};
    env.translations = env.translations || {};
    for (var lang in env.translations) {
        if (!window.__translations[lang]) {
            window.__translations[lang] = {};
        }
        for (var item in env.translations[lang]) {
            window.__translations[lang][item] = env.translations[lang][item];
        }
    }
    Object.assign(env.translations, window.__translations);
    delete window.__translations;

    // Check gazetteer configuration
    if (env.planets) {

        for (var planet in env.planets) {
            
            // If gazetteer url is relative, prefix with first endPoint url
            if (env.planets[planet].gazetteer && env.planets[planet].gazetteer.url && env.planets[planet].gazetteer.url.substr(0, 1) === '/') {
                if (env.endPoints && env.endPoints.length > 0) {
                    env.planets[planet].gazetteer.url = env.endPoints[0].url + env.planets[planet].gazetteer.url;
                }
            }

            // Set bing key
            if (env.planets[planet].BING_KEY) {
                for (var i = env.planets[planet].layers.length; i--;) {
                    if (env.planets[planet].layers[i].type === 'bing') {
                        env.planets[planet].layers[i].options.key = env.planets[planet].BING_KEY;
                    }
                }
            }
    
        }

    }

    var r = document.querySelector(':root');

    // Set --map-bottom-container-header-height to 0px if display.bottomContainer = false
    if ( !env.display.bottomContainer ) {
        r.style.setProperty('--map-bottom-container-header-height', '0px');
    }

    // Set header/map synergy
    if ( !env.header.display ) {
        r.style.setProperty('--header-height', '0px');
    }  

    if ( env.header.bgcolor ) {
        r.style.setProperty('--header-bgcolor', env.header.bgcolor);
        if ( env.header.bgcolor.startsWith('rgba') ) {
            r.style.setProperty('--map-top', '0px');
        }
    }

    // Map footer
    if ( env.map.footer ) {
        if (env.map.footer.bgcolor) {
            r.style.setProperty('--map-footer-bgcolor', env.map.footer.bgcolor);
        }
    }

    // Register environment in AngularJS as constant
    angular.module('rocket').constant('config', env);
    
})();
