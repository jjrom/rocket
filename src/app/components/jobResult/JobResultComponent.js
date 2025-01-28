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
        .controller('JobResultController', ['rocketProcesses', 'rocketCache', JobResultController]);

    function JobResultController(rocketProcesses, rocketCache) {

        var self = this;

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {
            if (changesObj.job && changesObj.job.currentValue) {
                self.results = null;
                self.getResults(self.job);
            }
        };

        /**
         * Retrieve job results
         * 
         * @param {object} job 
         */
        self.getResults = function(job) {
            self.loadingIndicator = true;
            rocketProcesses.getResults(job._endpoint, job.jobID,
                function(results) {
                    self.results = results;
                    self.loadingIndicator = false;
                },
                function(error){
                    console.log(error);
                    self.loadingIndicator = false;
                }
            );
        }

        //////////////////////////////

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('jobResult', {
            templateUrl: "app/components/jobResult/jobResult.html",
            bindings: {
                job: '<'
            },
            controller: 'JobResultController'
        });

})();
