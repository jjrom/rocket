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
        .controller('PlasticAgeComponent', [PlasticAgeComponent]);

    function PlasticAgeComponent() {

        var self = this;

        self.datasetOverride = [{
            backgroundColor: '#FFDC00',
            borderColor: '#FFDC00',
            pointBackgroundColor:'#FFDC00',
            pointBorderColor:'#FFDC00',
            pointRadius: 0,
            spanGaps:true
        }];

        self.options = {
            animation:{
                duration:0
            },
            scales: {
                xAxes: [{
                    type:'linear',
                    display: true,
                    ticks: {
                        min: 0,
                        max: 750
                    },
                    position: 'bottom',
                    gridLines: {
                        display:false
                    },
                    scaleLabel: {
                        display: true,
                        fontSize: 14,
                        fontColor: '#ffffff',
                        labelString: 'Age of plastic in days'
                    }
                }],
                yAxes: [{
                    display: false,
                    position: 'left',
                    gridLines: {
                        display:false
                    },
                    scaleLabel: {
                        display: false,
                        fontSize: 14,
                        fontColor: '#ffffff',
                        labelString: 'Number of tracks'
                    }
                }]
            }
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('plasticAge', {
            templateUrl: 'app/addons/plastic/plasticAge/plasticAge.html',
            bindings: {

                /*
                 * rocket Map
                 */
                rocketMap: '<',

                /* 
				 * Input 
				 */
				asset: '<'

            },
            controller: 'PlasticAgeComponent'
        });

})();