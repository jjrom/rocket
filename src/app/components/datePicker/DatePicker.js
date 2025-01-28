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
        .controller('DatePicker', ['$timeout', DatePicker]);

    function DatePicker($timeout) {

        var self = this;

        /*
         * Temporal extent [start, end]
         */
        self.dates = {
            start: null,
            end: null
        };

        /*
         * Track changes
         */
        self.$onChanges = function (changesObj) {

            if (changesObj.defaultDates && changesObj.defaultDates.currentValue) {
                self.dates = changesObj.defaultDates.currentValue;
                if (self._flatpickr) {
                    self._flatpickr.setDate(_getDefaultDate());
                }
            }

            if (changesObj.inline && changesObj.inline.hasOwnProperty('currentValue')) {
                self.inline = changesObj.inline.currentValue;
                if (self.inline) {
                    self.toggle();
                    _setOption('minDate', self.minDate ? self.minDate.split('T')[0] : null);
                    _setOption('maxDate',  self.maxDate ? self.maxDate.split('T')[0] : null);
                }
            }

            if (changesObj.minDate && changesObj.minDate.hasOwnProperty('currentValue')) {
                _setOption('minDate', self.minDate ? self.minDate.split('T')[0] : null);
            }

            if (changesObj.maxDate && changesObj.maxDate.hasOwnProperty('currentValue')) {
                _setOption('maxDate', self.maxDate ? self.maxDate.split('T')[0] : null);
            }

        };

        /**
         * Set dates
         * 
         * @param {object} dates
         */
        self.setDates = function(dates) {
            $timeout(function() {
                self.dates = dates;
                if (self.onSelect) {
                    self.onSelect({
                        dates:self.dates
                    });
                }
            });  
        };

        /*
         * Toggle flatpickr on.off
         */
        self.toggle = function (evt) {
            self._flatpickr = _new();
            self._flatpickr.setDate(_getDefaultDate());
            self._flatpickr.open();

            if (evt) {
                evt.stopPropagation();
            }

        }

        /**
         * Clear dates
         */
        self.clear = function (evt) {
            
            if (!self._flatpickr || !self._flatpickr.clear) {
                self._flatpickr = _new();
            }
            
            self._flatpickr.clear();

            if (evt) {
                evt.stopPropagation();
            }
    
        }

        /*
         * Get new flatpickr object
         */
        function _new() {
            return new flatpickr($('#datePickr')[0], {
                dateFormat: 'Y-m-d',
                mode: 'range',
                inline:self.inline,
                clickOpens: false,
                closeOnSelect: true,
                allowInput: false,
                defaultDate: _getDefaultDate(),
                onChange: function (selectedDates, dateStr, instance) {

                    var oldStart = self.dates.start,
                        oldEnd = self.dates.end,
                        _dates = [];

                    /* Clear */
                    if (selectedDates.length === 0) {
                        _dates = [null, null];
                    }
                    else if (selectedDates.length === 1) {
                        return false;
                    }
                    else {
                        _dates = dateStr.split('/');
                        if (_dates.length === 1) {
                            _dates.push(_dates[0]);
                        }
                    }

                    /*
                     * Store new dates
                     */
                    self.setDates({
                        start:_dates[0] ? _dates[0] + 'T00:00:00Z' : null,
                        end:_dates[1] ? _dates[1] + 'T23:59:59Z' : null
                    });

                    /*
                     * Close flatpickr
                     */
                    self._flatpickr.close();

                }
            });

        }

        /**
         * Set default date from filters
         */
        function _getDefaultDate() {
            var start = null;
            if (self.dates) {
                if (self.dates.start) {
                    start = self.dates.start.split('T')[0];
                }
                if (self.dates.end) {
                    return (start ? start : '') + '/' + self.dates.end.split('T')[0];
                }
            }

            return start;
        }

        /**
         * Set option value
         *
         * @param {string} option
         * @param {string} value
         */
         function _setOption(option, value) {
            if (self._flatpickr) {
                self._flatpickr.set(option, value);
            }
        };

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('datePicker', {
            templateUrl:['$timeout', '$attrs', function($element, $attrs) {
                var template = $attrs.template || 'default';
                var templates = {
                    default:'app/components/datePicker/datePicker.html',
                    inline:'app/components/datePicker/datePickerInline.html'
                };
                return templates.hasOwnProperty(template) ? templates[template] : template;
            }],
            bindings: {

                /* 
                 * HTML template - either 'default' or 'inline'.
                 */
                template: '@',

                /*
                 * Callback function when interval is selected
                 */
                onSelect: '&',

                /*
                 * True to always display
                 */
                inline: '<',

                /*
                 * Input dates
                 */
                defaultDates: '<',

                /*
                 * Minimum date allowed
                 */
                minDate: '<',

                /*
                 * Maximum date allowed
                 */
                maxDate: '<'


            },
            controller: 'DatePicker'
        });

})();