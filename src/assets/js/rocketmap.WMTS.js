/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
/**
 * RocketMap TileWMS
 * 
 * @param {Object} window
 */
(function (window) {

	window.rocketmap = window.rocketmap || {};

	/**
	 * TileWMS 
	 * 
	 * @param {object} layerConfig
	 * @param {object} params
	 * @param {string} projCode
	 *    
	 *   layerConfig = {
	 *      id: // name of layer to add ==> mandatory
	 *      progressBarTarget: // Set to display progress bar while loading
	 *      maxResolution: // default 40000,
	 *      options:{
	 *        url:// url of layer
	 *        (layer options)
	 *      }
	 *   }
	 *
	 */
	window.rocketmap.WMTS = function (layerConfig, params, projCode) {

		var self = this;

		self.layer = null;

		/*
		 * Error message if any
		 */
		self.error = null;

		self.layerConfig = layerConfig || {};
		params = params || {};

		var options = self.layerConfig.options || {};

		/*
		 * Replace url if it is templated
		 */
		if (options.url) {

			options.url = _replaceInTemplate(options.url, $.extend(params, self.layerConfig));

			return window.rocketmap.Util.parseWMTSGetTile(options.url).then(function (result) {

				if (!result || !result.capabilities) {
					self.error = 'Unknown source';
					return self;
				}

				var unknownProjection = true;

				for (var i = result.capabilities.Contents.TileMatrixSet.length; i--;) {
					if (result.capabilities.Contents.TileMatrixSet[0].Identifier === projCode) {
						unknownProjection = false;
						break;
					}
				}

				if (unknownProjection) {
					self.layer = null;
					self.error = 'Map projection ' + projCode + ' is not available in TileMatrixSet';
					return self;
				}
				
				// If no layer defined, then get the first in GetCapabilities
				var layerName = options.layer || result.kvps.layer || result.capabilities.Contents.Layer[0].Identifier;

				self.layerConfig.capabilities = result.capabilities;

				var layerNameExists = false;
				for (var i = result.capabilities.Contents.Layer.length; i--;) {
					if (result.capabilities.Contents.Layer[i].Identifier === layerName) {
						self.layerConfig.layerCapability = _betterCapability(result.capabilities.Contents.Layer[i]);
						layerNameExists = true;
						break;
					}
				}
				
				// [BAD] Input layerName does not exist
				if ( !layerNameExists ) {
					self.layer = null;
					self.error = 'Input layer name ' + layerName + ' is not present in WMTS GetCapabilities';
					return self;
				} 

				var _sourceOptions = ol.source.WMTS.optionsFromCapabilities(result.capabilities, {
					layer: layerName,
					matrixSet: projCode,
				});
				
				if (_sourceOptions.projection && _sourceOptions.projection.worldExtent_) {
					self.layerConfig.extent = _sourceOptions.projection.worldExtent_;
				}

				var source = new ol.source.WMTS(_sourceOptions);

				self.layer = _getLayer(self.layerConfig, source, options, projCode);
				return self;


			});


		}

		return Promise.resolve(self);

	};

	/**
	 * Enhance layer capability for further use
	 */
	function _betterCapability(layerCapability) {

		if (layerCapability.Dimension) {
			for (var i = layerCapability.Dimension.length; i--;) {
				layerCapability.Dimension[i].CurrentValue = layerCapability.Dimension[i].Default;

				// A bad solution for bad WMTS service not specifying UOM of Dimension
				// e.g. https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m_202211?request=GetCapabilities&service=WMS
				if (!layerCapability.Dimension[i].UOM) {
					switch (layerCapability.Dimension[i].Identifier.toLowerCase()) {
						case 'elevation':
							layerCapability.Dimension[i].UOM = 'm';
							break;
						default:
							break;
					}
				}

				// Convert ISO8601 duration to exhaustive list of dates
				if (layerCapability.Dimension[i].UOM === 'ISO8601') {
					layerCapability.Dimension[i].Value = _ISO8601DatesToArray(layerCapability.Dimension[i].Value);
				}
			}
		}

		return layerCapability;
	}

	/**
	 * Set layer from source
	 * 
	 * @returns 
	 */
	function _getLayer(layerConfig, source, options, projCode) {

		if (layerConfig.progressBarTarget) {

			var _progressBar = new window.rocketmap.ProgressBar(layerConfig.progressBarTarget);

			source.on('tileloadstart', function () {
				_progressBar.addLoading();
			});

			source.on('tileloadend', function () {
				_progressBar.addLoaded();
			});

			source.on('tileloaderror', function () {
				_progressBar.addLoaded();
			});

		}

		var tileOptions = {
			opacity: layerConfig && layerConfig.hasOwnProperty('opacity') ? layerConfig.opacity : 1,
			visible: layerConfig && layerConfig.hasOwnProperty('visible') ? layerConfig.visible : true,
			source: source
		}

		if (layerConfig.hasOwnProperty('maxResolution')) {
			tileOptions.maxResolution = self.layerConfig.maxResolution;
		}

		if (layerConfig.hasOwnProperty('extent')) {
			tileOptions.extent = window.ol.extent.applyTransform(layerConfig.extent, window.ol.proj.getTransform('EPSG:4326', projCode));
		}

		var layer = new window.ol.layer.Tile(tileOptions);

		if (layer) {

			// Set maxZoom
			if (options.maxZoom) {
				layer.setMaxZoom(options.maxZoom);
			}

		}

		return layer;

	}

	/**
	 * Replace all occurences of a string
	 *
	 *  Example :
	 *
	 *      replaceInTemplate('Hello. My name is {:name:}. I live in {:location:}', {name:'Jérôme', location:'Toulouse'});
	 *
	 *  Will return
	 *
	 *      Hello. My name is Jérôme. I live in Toulouse
	 *
	 * [IMPORTANT]
	 *
	 *      {:xxx:} value without a xxx pair defined in pairs is replace by empty string
	 *      In the previous example, if 'name' => 'Jérôme' is not provided, the return sentence
	 *      would be
	 *
	 *      Hello. My name is . I live in Toulouse
	 * @param {String} str 
	 * @param {Object} obj 
	 */

	function _replaceInTemplate(str, obj) {

		if (!str) {
			return str;
		}

		obj = obj || {};

		return str.replace(/{\:[^\\:}]*\:}/gi, function (m, key, value) {
			return obj[m.substring(2, m.length - 2)] || '';
		});

	};


	/**
	 * Convert an array of ISO8601 to a list of all possible dates
	 * 
	 * @param {array} arr 
	 */
	function _ISO8601DatesToArray(arr) {
		var allDates = [];
		for (var i = 0, ii = arr.length; i < ii; i++) {

			var bounds = arr[i].split('/');

			// Not a range
			if (bounds.length === 1) {
				allDates.push(arr[i]);
			}

			// Range without a step - assumes its 1D
			else if (bounds.length === 2) {
				bounds.push('P1D');
			}

			var start = new Date(bounds[0]);
			var current = new Date(bounds[0]);
			var end = new Date(bounds[1]);
			var seconds = _parseDurationString(bounds[2]);
			
			allDates.push(bounds[0]);

			// Avoid infinite loop...
			if (start < end) {
				
				while (current < end) {
					current.setSeconds(current.getSeconds() + seconds);
					allDates.push(current.toISOString());
				}

			}

		}

		return allDates;
	}

	/**
	 * Parse a duration string (e.g. "P1D") and returns in seconds
	 * 
	 * @param {string} durationString 
	 * @returns integer 
	 */
	function _parseDurationString(durationString) {

		if (durationString === 'PT1H') {
			return 3600;
		}
		var stringPattern = /^P(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d{1,3})?)S)?$/;
		var stringParts = stringPattern.exec(durationString);
		if (stringParts) {
			return (
				(
					(
						(stringParts[1] === undefined ? 0 : stringParts[1] * 1)  /* Days */
						* 24 + (stringParts[2] === undefined ? 0 : stringParts[2] * 1) /* Hours */
					)
					* 60 + (stringParts[3] === undefined ? 0 : stringParts[3] * 1) /* Minutes */
				)
				* 60 + (stringParts[4] === undefined ? 0 : stringParts[4] * 1) /* Seconds */
			);
		}
		return 0;
		
	}

})(window);
