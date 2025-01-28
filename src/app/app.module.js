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
    
    angular.module('rocket', [
        /*
         * Angular modules
         */
        'ngTouch',
        'ngAnimate',
        /*
         * 3rd Party modules
         */
        'ui.router',
        'pascalprecht.translate',
        'satellizer',
        'angular-growl',
        'ngDialog',
        'angucomplete-alt',
        'mdMarkdownIt',
        'angular-cache',
        'chart.js',
        'rzSlider',
        'schemaForm',
        /*'tooltips',*/
        /*'angular-tour',*/
        /*'pathgather.popeye',*/
        /*'pageslide-directive',*/
        /*'vs-repeat',*/
        /*'xeditable',*/
        /*
         * rocket modules
         */
        'rocket',
        'rocket.filters',
        'rocket.templates'
    ]);
    
})();