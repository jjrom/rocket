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
		.controller('ProjectionSwitcherController', [ProjectionSwitcherController]);

	function ProjectionSwitcherController() {

		var self = this;

		/*
		 * Current chart option
		 */
		self.selected = {};

		self.$onChanges = function (changeObj) {
		
			if (self.rocketMap) {
				self.projections = window.rocketmap.Proj.projections;
				self.selected.code = self.rocketMap.getProjectionCode();
			}

        };

		/**
		 * Set projection
		 */
		self.setProjection = function () {
			
			if (self.rocketMap) {
				self.rocketMap.setViewProjection({
					projection:self.selected.code
				});
			}
		}

	}

	/*
	 * Chart component
	 */
	angular.module('rocket')
		.component('projectionSwitcher', {
			templateUrl: "app/components/projectionSwitcher/projectionSwitcher.html",
			bindings: {

				/* 
				 * Input 
				 */
				rocketMap: '<'

			},
			controller: 'ProjectionSwitcherController'
		});

})();
