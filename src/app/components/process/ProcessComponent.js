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

    angular.module('rocket').controller('ProcessController', ['rocketServices', 'rocketCache', 'rocketProcesses', ProcessController]);

    function ProcessController(rocketServices, rocketCache, rocketProcesses) {

        var self = this;

        self.form = [
            "*"
        ];

        self.model = {};

        /*
         * Watch changes in parent
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.process && changesObj.process.currentValue) {
                self.model = {};
                _prepareForms(self.process.inputs);
            }
        };

        self.onSubmit = function (form) {

            // First we broadcast an event so all fields validate themselves
            //$scope.$broadcast('schemaFormValidate');

            // Then we check if the form is valid
            if (form.$valid) {
                var body = {
                    inputs: self.model
                }
                rocketProcesses.executeProcess(self.process._endpoint, self.process.id, body,
                    function(job) {
                        var jobs = rocketCache.get(rocketCache.JOBS) || [];
                        jobs.unshift(job);
                        rocketCache.put(rocketCache.JOBS, jobs);
                        rocketServices.success(rocketServices.translate('job.launch.success', [job.jobID]));
                    },
                    function(error) {
                        rocketServices.error(error.message);
                    });
            }
            else {
                console.log('pas valid');
            }
        }

        /**
         * Called by child form 
         * 
         * @param {object} event 
         * @param {object} form 
         */
        self.handleFormClick = function (event, form) {

            var value;
            switch (form.format) {
                case 'ogc-bbox':
                    value = '-180,-90,180,90';
                    break;

                case 'geojson-geometry':
                    value = 'TODO ' + form.format;
                    break;

                case 'geojson-feature':
                    value = 'TODO ' + form.format;
                    break;

                case 'geojson-feature-collection':
                    value = 'TODO ' + form.format;
                    break;
            }

            if (form && form.key && form.key[0]) {
                var element = document.getElementById(form.key[0]);
                if (element) {
                    element.value = value;
                }
            }

        }

        function _prepareForms(inputs) {

            var schema = {
                type: 'object',
                properties: {}
            }
            for (var key in inputs) {
                if (inputs[key].schema) {
                    schema.properties[key] = inputs[key].schema;
                    schema.properties[key]['title'] = schema.properties[key]['title'];
                    schema.properties[key]['description'] = schema.properties[key]['description'];
                }
            }

            self.schema = schema;
        }

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('process', {
            templateUrl: "app/components/process/process.html",
            bindings: {

                /*
                 * Process object
                 */
                process: '<'

            },
            controller: 'ProcessController'
        });

})();
