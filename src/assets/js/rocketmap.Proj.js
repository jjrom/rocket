/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    /**
     * Proj
     */
    window.rocketmap.Proj = {

        /*
         * Toggled to true when register is called
         */
        _initialized: false,

        projections: {},

        /*
         * Register projections
         */
        register: function(projections) {

            if ( !projections ) {
                return;
            }
            
            // proj4js is required
            if ( ! window.proj4 ) {
                console.log('[WARNING] proj4js is not available');
                return;
            }

            if ( window.rocketmap.Proj._initialized ) {
                console.log("[WARNING] Projections already registered");
                return;
            }

            var knowProjs = ['EPSG:3857', 'EPSG:4326'];

            // Register projection definitions in proj
            for (var key in projections) {
                if (projections[key].def) {

                    window.rocketmap.Proj.projections[key] = {
                        name: projections[key].name || key,
                        def: projections[key].def,
                        extent : projections[key].extent || undefined
                    };

                    // These projections are already registered within proj
                    if ( knowProjs.indexOf(key) === -1 ) {
                        window.proj4.defs(key, projections[key].def);
                    }  

                }
            }

            // Register proj4 within OpenLayers
            window.ol.proj.proj4.register(window.proj4);

            //Next apply extent
            for (var key in projections) {
                if (knowProjs.indexOf(key) === -1 && projections[key].extent) {
                    window.ol.proj.get(key).setExtent(projections[key].extent);
                }  
            }
            window.rocketmap.Proj._initialized = true;

        }

    };

})(window);
