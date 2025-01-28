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
		.controller('NorthSouthSwitcherController', ['rocketHolder', NorthSouthSwitcherController]);

	function NorthSouthSwitcherController(rocketHolder) {

		var self = this;

		self.bounds = [-75, 75];

		self.codes = {
			default: rocketHolder.mapContext && rocketHolder.mapContext.planetInfo ? rocketHolder.mapContext.planetInfo.defaultProjCode : null,
			north: 'ESRI:102018',
			south: 'ESRI:102021'
		};

		self.switcher = {
			north: false,
			south: false
		}

		self.currentProjection = {
			code:self.codes.default
		};

		self.$onChanges = function (changeObj) {

			if (self.rocketMap) {
				self.projections = window.rocketmap.Proj.projections;
				self.rocketMap.on('addlayer', _mapEventaddlayer);
				self.rocketMap.on('moveend', _mapEventmoveend);
			}

			_mapEventmoveend();

		};


		/*
		 * Remove map listener on destroy
		 */
		self.$onDestroy = function () {
			if (self.rocketMap) {
				self.rocketMap.un('moveend', _mapEventmoveend);
				self.rocketMap.un('addlayer', _mapEventaddlayer);
			}
		};


		/**
		 * Swith to input projection code
		 */
		self.switchTo = function (code) {
			if (code && self.rocketMap) {
				self.rocketMap.setViewProjection({
					projection: code
				});
				self.currentProjection.code = code;
				_mapEventmoveend();
			}
		}

		/**
		 * Return image url for northern, southern and equatorial
		 * @param {string} what 
		 * @returns 
		 */
		self.getImage = function(what) {
			if (rocketHolder.mapContext) {
				return 'assets/img/' + rocketHolder.mapContext.planetInfo.planet + '_' + what + '.png';
			}
			return null;
		}
		
		/**
		 * Map event : moveend
		 * 
		 * @param {array} obj 
		 */
		function _mapEventmoveend(obj) {

			var geoExtent = self.rocketMap.getGeoExtent();
			
			switch (self.currentProjection.code) {

				case self.codes.north:
					self.switcher.north = false;
					self.switcher.south = true;
					break;

				case self.codes.south:
					self.switcher.north = true;
					self.switcher.south = false;
					break;
				
				default:
					self.switcher.north = geoExtent[3] >= self.bounds[1] ? true : false;
					self.switcher.south = geoExtent[1] <= self.bounds[0] ? true : false;
			}
			
		}

		/**
         * Map event : addlayer
         * 
         * @param {Object} olLayer
         * @param {Object} params
         */
        function _mapEventaddlayer(olLayer, params) {
            if (rocketHolder.mapContext && rocketHolder.mapContext.planetInfo) {
				self.codes.default = rocketHolder.mapContext.planetInfo.defaultProjCode;
				if ( !self.currentProjection.code ) {
					self.currentProjection.code = self.codes.default; 
				}
			}
        }

	}

	/*
	 * Chart component
	 */
	angular.module('rocket')
		.component('northSouthSwitcher', {
			templateUrl: "app/components/northSouthSwitcher/northSouthSwitcher.html",
			bindings: {

				/* 
				 * Input 
				 */
				rocketMap: '<'

			},
			controller: 'NorthSouthSwitcherController'
		});

})();
