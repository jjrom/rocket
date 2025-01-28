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
        .controller('ProcessesManagerController', ['rocketProcesses', ProcessesManagerController]);

    function ProcessesManagerController(rocketProcesses) {

        var self = this;

        /*
         * Initialize
         */
        self.$onInit = function () { };

        /*
         * Processes are retrieved from OGC API Processes endPoint
         * activeProcess is the current selected process
         */
        self.processes = {};
        self.activeProcess = null;

        /* 
         * Change endPoint
         */
        self.setEndPoint = function(endPoint) {
            self.endPoint = endPoint;
            self.isLoading = true;
            self.processes = {};
            self.activeProcess = null;
            rocketProcesses.getProcesses(endPoint.url,
                function (data) {
                    self.isLoading = false;
                    self.processes = data;
                },
                function (error) {
                    self.isLoading = false;
                    console.log(error);
                }
            );
        }

        /*
         * Watch changes in parent
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.endPoint && changesObj.endPoint.currentValue) {
                self.setEndPoint(self.endPoint);
            }
        };

        /*
         * Select process
         */
        self.selectProcess = function (process) {
            self.isLoading = true;
            rocketProcesses.getProcess(process._endpoint, process.id,
                function (data) {
                    self.isLoading = false;
                    self.activeProcess = data;
                },
                function (error) {
                    self.isLoading = false;
                    console.log(error);
                });
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('processesManager', {
            templateUrl: "app/components/processesManager/processesManager.html",
            bindings: {

                /*
                 * Reference to rocketMap
                 */
                rocketMap: '<',

                /*
                 * Reference to OGC API Processes endpoint
                 */
                endPoint: '<',

                /*
                 * True to allow user to change OGC API Processes endpoint
                 */
                canChangeOapip: '<'

            },
            controller: 'ProcessesManagerController'
        });

})();
