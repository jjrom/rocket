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

    /* Services */

    angular.module('rocket')
        .factory('rocketProcesses', ['restoAPI', rocketProcesses]);

    function rocketProcesses(restoAPI) {

        var service = {
            getProcesses: getProcesses,
            getProcess: getProcess,
            getJob: getJob,
            getResults: getResults,
            executeProcess: executeProcess
        };

        /**
         * Get process from server
         * 
         * @param {string} endpoint
         * @param {string} processId
         * @param {Function} callback
         * @param {Function} error
         */
        function getProcess(endpoint, processId, callback, error) {

            var url = [endpoint, 'processes', processId].join('/');
            return restoAPI.getResource(url, null, {
                useCache:true,
                cacheKey:url
            })
                .then(
                    (result) => {
                        if (result.status === 200) {
                            if (typeof callback === 'function') {
                                if (result.data) {
                                    result.data._endpoint = endpoint;
                                }
                                callback(result.data);
                            }
                        }
                    }
                ).catch(
                    (e) => {
                        if (typeof error === 'function') {
                            error(e);
                        }
                    }
                )

        }


        /**
         * Get processes from server
         * 
         * @param {string} endpoint 
         * @param {Function} callback
         * @param {Function} error
         */
        function getProcesses(endpoint, callback, error) {

            var url = [endpoint, 'processes'].join('/');
            return restoAPI.getResource(url, null, {
                useCache:true,
                cacheKey:url
            })
                .then(
                    (result) => {
                        if (result.status === 200) {
                            if (typeof callback === 'function') {
                                for (var i = 0, ii = result.data.processes.length; i < ii; i++) {
                                    result.data.processes[i]._endpoint = endpoint;
                                }
                                callback(result.data.processes);
                            }
                        }
                    }
                ).catch(
                    (e) => {
                        if (typeof error === 'function') {
                            error(e);
                        }
                    }
                );

        }

        /**
         * Get job from server
         * 
         * @param {string} endpoint
         * @param {string} jobId
         * @param {Function} callback$
         * @param {Function} error
         */
        function getJob(endpoint, jobId, callback, error) {

            return restoAPI.getResource([endpoint, 'jobs', jobId].join('/'))
                .then(
                    (result) => {
                        if (typeof callback === 'function') {
                            if (result.data) {
                                result.data._endpoint = endpoint;
                            }
                            callback(result.data);
                        }
                    }
                ).catch(
                    (e) => {
                        if (typeof error === 'function') {
                            error(e);
                        }
                    }
                );

        }

        /**
         * Get results from server
         *
         * @param {string} endpoint
         * @param {string} jobId
         * @param {Function} callback
         * @param {Function} error
         */
        function getResults(endpoint, jobId, callback, error) {

            return restoAPI.getResource([endpoint, 'jobs', jobId, 'results'].join('/'))
                .then(
                    (result) => {
                        if (result.status === 200) {
                            if (typeof callback === 'function') {
                                callback(result.data);
                            }
                        }
                    }
                ).catch(
                    (e) => {
                        if (typeof error === 'function') {
                            error(e);
                        }
                    }
                );

        }

        /**
         * Execute process
         * 
         * @param {string} endpoint 
         * @param {string} processId 
         * @param {object} body,
         * @param {Function} callback
         * @param {Function} error
         */
        function executeProcess(endpoint, processId, body, callback, error) {

            return restoAPI.postResource([endpoint, 'processes', processId, 'execution'].join('/'), null, body)
                .then(
                    (result) => {
                        
                        if (result.status === 200) {
                            if (typeof callback === 'function') {
                                if (result.data) {
                                    result.data._endpoint = endpoint;
                                }
                                callback(result.data);
                            }
                        }
                        else {
                            if (typeof error === 'function') {
                                error({
                                    message:result.data.ErrorMessage
                                });
                            } 
                        }
                        
                    }
                ).catch(
                    (e) => {
                        if (typeof error === 'function') {
                            error(e);
                        }
                    }
                );
        
        }

        return service;

    }

})();