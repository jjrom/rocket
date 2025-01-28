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
	window.rocketmap.TileWMS = function (layerConfig, params, projCode) {

		var self = this;

		self.layer = null;

		/*
		 * Error message if any
		 */
		self.error = null;

		self.layerConfig = layerConfig || {};
		params = params || {};

		var options = self.layerConfig.options || {};
		if (self.layerConfig.tileMatrix) {
			options.maxZoom = self.layerConfig.tileMatrix;
		}

		/*
		 * Layer id is mandatory
		 */
		if (!self.layerConfig.id) {
			self.error = 'Layer id is mandatory';
			return Promise.resolve(self);
		}

		/*
		 * Replace url if it is templated
		 */
		if (options.url) {

			options.url = _replaceInTemplate(options.url, $.extend(params, self.layerConfig));

			/*
			 * TileWMS special case - eventually extract parameters from GetMap url
			 * !!! IMPORTANT DO NOT RECOMPUTE IF parsedWMS IS ALREADY PRESENT
			 */
			if (self.layerConfig.type.toLowerCase() === 'tilewms' && !self.layerConfig.parsedWMS) {

				var parsedWMS = window.rocketmap.Util.parseWMSGetMap(options.url);

				options.url = parsedWMS.url;

				self.layerConfig.parsedWMS = parsedWMS;

				/*
				 * Update self.layerConfig options
				 */
				if (!options.params) {
					options.params = {
						LAYERS: parsedWMS.layers,
						FORMAT: parsedWMS.format
					};
				}

			}

		}

		/*
		 * Get source
		 */
		var source = _getTileLayerSource(self.layerConfig.type, options, projCode);
		
		if ( !source ) {
			self.error = 'Unknown source';
			return Promise.resolve(self);
		}

		/*
		 * Promise on the view to get the projection and set the extent
		 */
		if (self.layerConfig.type === 'cog') {
			return Promise.resolve(source.getView()).then( function(view) {
				if (view && view.projection && view.projection.getCode() !== projCode) {
					self.layer = null;
					self.error = 'Projection ' + view.projection.getCode() + ' differs from map projection';
				}
				else {
					self.layer = _getLayer(layerConfig, source, options, projCode);
				}
				return self;
			});
		}
		else {
			return Promise.resolve(self).then( function() {
				self.layer = _getLayer(layerConfig, source, options, projCode);
				return self;
			});
		}
		
	};

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
		
		var layer = layerConfig.type === 'cog' ? new window.ol.layer.WebGLTile(tileOptions) : new window.ol.layer.Tile(tileOptions);

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
	 * Get TileLayer source from input configuration
	 *
	 * @param {string} type
	 * @param {Object} options
	 * @param {string} mapProj
	 */
	function _getTileLayerSource(type, options, mapProj) {

		var source;

		switch (type.toLowerCase()) {
			case "bing":
				source = new window.ol.source.BingMaps(options);
				break;
			case "stamen":
				source = new window.ol.source.StadiaMaps(options);
				break;
			case "osm":
				source = new window.ol.source.OSM(options);
				break;
			case "xyz":
				source = new window.ol.source.XYZ($.extend(options, {
						projection:options.projection || mapProj
					})
				);
				break;
			case "tilewms":
				source = new window.ol.source.TileWMS($.extend(options, {
						projection:options.projection || mapProj
					})
				);
				break;
			case "cog":
				source = new window.ol.source.GeoTIFF({
					sources: options.sources || [
						{
							url: options.url,
							nodata: options.nodata || 0
						}
					]
				});
				break;
			default:
				break;
		};

		return source;

	};

})(window);
