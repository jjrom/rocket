/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
/**
 * rocketmap Generic button
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    window.rocketmap.GenericButton = function () {
        
        /*
         * Reference to tool button
         */
        this.button = null;
        
        /**
         * Create a generic button
         * 
         * @param {Object} opt_options
         */
        this.GenericButtonControl = function (opt_options) {
            
            var options, genericHandler, element;
            
            options = opt_options || {};
            options.parent.button = document.createElement('button');
            options.parent.button.innerHTML = options.innerHTML;
            if (options.title) {
                options.parent.button.title = options.title;
            }
            genericHandler = function (e) {
                options.callback(options.className, {
                    from:options.rocketMap
                });
            };
            options.parent.button.addEventListener('click', genericHandler, false);
            options.parent.button.addEventListener('touchstart', genericHandler, false);
            element = document.createElement('div');
            element.className = 'ol-unselectable ol-control ' + options.className;
            element.appendChild(options.parent.button);
            window.ol.control.Control.call(this, {
                element: element,
                target: options.target
            });
            
            return true;
        };
        
        /*
         * Initialize draw control
         */
        // Deprecate OL 5
        // window.ol.inherits(this.GenericButtonControl, window.ol.control.Control);
        this.GenericButtonControl.prototype = Object.create(window.ol.control.Control.prototype);
        this.GenericButtonControl.prototype.constructor = this.GenericButtonControl;
            
    };
})(window);

