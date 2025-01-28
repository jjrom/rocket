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
        .controller('ViewController', [ViewController]);

    function ViewController() {}

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('view', {
            templateUrl: "app/components/view/view.html",
            bindings: {

                /*
                 * View object
                 */
                view: '<'
                
            },
            controller: 'ViewController'
        });

})();
