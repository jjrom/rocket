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
        .controller('JobsController', ['rocketServices', 'rocketProcesses', 'rocketCache', JobsController]);

    function JobsController(rocketServices, rocketProcesses, rocketCache) {

        var self = this;

        self.activeJob = null;
        self.jobs = rocketCache.get(rocketCache.JOBS) || [];

        /*
         * Register event
         */
        self.$onInit = function () {
            rocketCache.on('updatecache', _updateCache);
            _updateJobs();
        };

        /*
         * Destroy event
         */
        self.$onDestroy = function () {
            rocketCache.un('updatecache', _updateCache);
        };
        
        self.setActiveJob = function(job) {
            if (['successful', 'failed'].indexOf(job.status) === -1) {
                rocketServices.error('job.results.not.yet');
                return;
            }

            if (self.activeJob && self.activeJob.jobID === job.jobID) {
                self.activeJob = null;
            }
            else {
                self.activeJob = job;
            }
        };

        self.remove = function (job, event) {

            if (event) {
                event.preventDefault();
                event.stopPropagation();    
            }
                
            if ( confirm(rocketServices.translate('job.remove.confirm')) ) {
                var newJobs = [];
                for (var i = 0, ii = self.jobs.length; i < ii; i++) {
                    if (self.jobs[i].jobID !== job.jobID) {
                        newJobs.push(self.jobs[i]);
                    }
                }
                rocketCache.put(rocketCache.JOBS, newJobs);
            }
            
        }
        //////////////////////////////
        
        /**
         * Called when cache is updated
         * 
         * @param {object} obj 
         */
        function _updateCache(obj) {
            if (obj && obj.key === rocketCache.JOBS) {
                self.jobs = rocketCache.get(rocketCache.JOBS);
            }
        }

        /**
         * Update jobs status
         */
        function _updateJobs() {
            for (var i = 0, ii = self.jobs.length; i < ii; i++) {
                if (['accepted', 'running'].indexOf(self.jobs[i].status) !== -1) {
                    (function(endpoint, jobID) {
                        rocketProcesses.getJob(endpoint, jobID,
                            function(job) {
                                var newJobs = [];
                                for (var j = 0, jj = self.jobs.length; j < jj; j++) {
                                    newJobs.push(self.jobs[j].jobID === job.jobID ? job : self.jobs[j]);
                                }
                                rocketCache.put(rocketCache.JOBS, newJobs);
                            },
                            function(error){
                                console.log(error);
                            }
                        );
                    })(self.jobs[i]._endpoint, self.jobs[i].jobID);
                }
            }
        }
        

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('jobs', {
            templateUrl: "app/components/jobs/jobs.html",
            bindings: {

            },
            controller: 'JobsController'
        });

})();
