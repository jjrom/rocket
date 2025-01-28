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

	/* Chart Controller */

	angular.module('rocket')
		.controller('ChartController', ['restoAPI', 'rocketHolder', ChartController]);

	function ChartController(restoAPI, rocketHolder) {

		var self = this;

		/*
		 * Chart properties
		 */
		self.chartProperties = {
			xAxes: [],
			yAxes: [],
			types: ['line']
		};

		/*
		 * Current chart option
		 */
		self.selected = rocketHolder.chartSelection || {
			xAxis: null,
			yAxis: null,
			type: self.chartProperties.types[0]
		};

		/*
		 * Series i.e. multiple graph at the same time
		 */
		self.series = [];

		/*
		 * Options
		 */
		self.options = {};

		/**
		 * Set chart data
		 */
		self.setChartData = function () {

			var labels = [];
			var data = [];

			if (self.selected.xAxis && self.selected.yAxis) {

				for (var i = self.measurements.length; i--;) {

					var measurement =  $.extend({
						datetime:self.measurements[i].datetime
					}, self.measurements[i].measurement);

					if (measurement[self.selected.xAxis.id] && measurement[self.selected.yAxis.id]) {

						if (self.selected.type === 'scatter') {
							data.push({
								x: measurement[self.selected.xAxis.id],
								y: measurement[self.selected.yAxis.id]
							});
						}
						else {
							labels.push(measurement[self.selected.xAxis.id]);
							data.push(measurement[self.selected.yAxis.id]);
						}

					}

				}

				// Set chart options
				_setChartOptions({
					xId: self.selected.xAxis.id,
					yId: self.selected.yAxis.id
				});

			}

			if (self.selected.type !== 'scatter') {
				self.labels = labels;
			}

			// Update hiliteLabel
			if (self.verticalLines) {
				self.verticalLines.options.scaleY = self.selected.yAxis.id;
			}

			self.data = [data];

			// Store

		}

		/**
		 * Call parent onSelect function to returns clicked point label and data
		 * 
		 * @param {Array} points 
		 * @param {Event} evt 
		 */
		self.onClick = function (points, evt) {
			if (points && points.length > 0 && self.onSelect) {
				self.onSelect({
                    label: self.labels[points[0]._index],
					value:self.data[points[0]._index]
                });
			}
		};

		self.onHover = function (points) {
			/*
			if (points.length > 0) {
				console.log('Point', points[0].value);
			} else {
				console.log('No point');
			}*/
		};

		/*
		 * Track changes
		 */
		self.$onChanges = function (changesObj) {

			if (changesObj.asset && changesObj.asset.currentValue) {
				_getData(changesObj.asset.currentValue.href);
			}

			if (changesObj.measurements && changesObj.measurements.currentValue) {
				_setChartForm();
				self.setChartData();
			}

			if (changesObj.hiliteLabel && changesObj.hiliteLabel.currentValue) {

				self.verticalLines = {
					options:{
						label: self.hiliteLabel,
						scaleY: self.selected && self.selected.yAxis ? self.selected.yAxis.id : 'value_0'
					},
					labels:[self.hiliteLabel]
				}
			}

		};

		/**
		 * Get chart options
		 * 
		 * @param {Object} params
		 */
		function _setChartOptions(params) {

			params = params || {};

			self.options = {
				animation:{
					duration:0
				},
				maintainAspectRatio: false,
				scales: {
					xAxes: [{
						id: params.xId,
						type: self.selected.type === 'scatter' ? 'linear' : 'time',
						display: true,
						position: 'bottom',
						scaleLabel: {
							display: true,
							fontSize: 16,
							labelString: params.xLabel || params.xId
						}
					}],
					yAxes: [{
						id: params.yId,
						type: 'linear',
						display: true,
						position: 'left',
						scaleLabel: {
							display: true,
							fontSize: 16,
							labelString: params.yLabel || params.yId
						}
					}]
				}
			};

			self.series = [params.yId];

		}

		/**
		 * Retrieve measurement from url
		 * 
		 * @param {string} url 
		 */
		function _getData(url) {
			restoAPI.getResource(url)
				.then(
					(result) => {
						if (result.status === 200) {
							self.measurements = result.data.measurements || [];
							_setChartForm();
							self.setChartData();
						}
					}
				);
		}

		/**
		 * Set chart x and y forms
		 * 
		 *  {
		 * 		measurements:[
		 * 			{
		 * 				id://,
		 * 				datetime://,
		 * 				measurement:{
		 * 					xxx://,
		 * 					yyy://
		 * 				}
		 * 
		 * 			}
		 * 		]
		 *  }
		 * 
		 */
		function _setChartForm() {

			// Reset selected
			var selected = self.selected;

			// Reset chart form
			self.chartProperties.xAxes = [];
			self.chartProperties.yAxes = [];

			if ( !self.measurements || self.measurements.length === 0) {
				return false;
			}
			
			var measurement = {}

			// Get yAxis from first non null measurement
			for (var i = 0, ii = self.measurements.length; i < ii; i++) {
				if (self.measurements[i].measurement && Object.keys(self.measurements[i].measurement).length !== 0) {
					measurement = $.extend({
						datetime:self.measurements[i].datetime
					}, self.measurements[i].measurement);
					break;
				}
			}

			var _defaultYAxisId = 'value_0';

			for (var key in measurement) {

				var axis = {
					id: key,
					label: key,
					type: key === 'datetime' ? 'date' : typeof measurement[key]
				};
				
				// Default xAxis is datetime
				if (key === 'datetime') {
					self.chartProperties.xAxes = [axis];
					selected.xAxis = axis;
				}
				// yAxis
				else {
					self.chartProperties.yAxes.push(axis);
					if ( !selected.yAxis && axis.id === _defaultYAxisId ) {
						selected.yAxis = axis;
					}
					else if (selected.yAxis && selected.yAxis.id === axis.id) {
						selected.yAxis = axis;
					}
				}

			}

			// Store in rocketHolder
			self.selected = selected;
			rocketHolder.chartSelection = self.selected;

		}

	}

	/*
	 * Chart component
	 */
	angular.module('rocket')
		.component('rocketChart', {
			templateUrl: "app/components/chart/chart.html",
			bindings: {

				/*
				 * Called when clicking on close
				 */
				onClose: '&',

				/*
				 * Return selected (clicked) value
				 */
				onSelect: '&',

				/*
				 * Measurements
				 */
				measurements: '<',

				/*
				 * Hilite label
				 */
				hiliteLabel: '<',

				/*
				 * Input close classes
				 */
				closeClass: '<',

				/* 
				 * Input 
				 */
				asset: '<'

			},
			controller: 'ChartController'
		});

})();
