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

	/* Map Controller */

	angular.module('rocket')
		.controller('MapController', ['$scope', '$window', '$location', '$timeout', 'rocketServices', 'rocketHolder', 'stacUtil', 'rocketMagicReader', 'rocketSearchService', 'config', MapController]);

	function MapController($scope, $window, $location, $timeout, rocketServices, rocketHolder, stacUtil, rocketMagicReader, rocketSearchService, config) {

		/*
		 * Initialize rocketHolder.states for map page
		 */
		rocketHolder.states.map = rocketHolder.states.map || {};

		var _$locationIsInitialized = false,
			_layersConfig = rocketHolder.mapContext ? (rocketHolder.mapContext.layersConfig || rocketHolder.mapContext.defaultLayersConfig) : null,
			_defaultProjCode = rocketHolder.mapContext && rocketHolder.mapContext.planetInfo ? rocketHolder.mapContext.planetInfo.defaultProjCode : config.defaultProjCode;

		/*
		 * Daily background YYYY-MM-DD (default is yesterday to be sure to have a background)
		 */
		const yesterday = () => {
			let d = new Date();
			d.setDate(d.getDate() - 1);
			return d.toISOString().split('T')[0];
		};
		
		var _mapDefaultParams = {
			time: yesterday()
		};

		/**
		 * Initialize search filters from query parameters (i.e. 'f')
		 * (see https://stackoverflow.com/questions/8648892/how-to-convert-url-parameters-to-a-javascript-object)
		 */
		var searchFilters = {};
		try {
			if ($location.search()['f']) {
				searchFilters = JSON.parse($location.search()['f']);
				var commonFilters = {};
				for (var key in searchFilters) {
					if (key !== '__ep') {
						commonFilters[key] = searchFilters[key];
					}
				}
				rocketSearchService.addFilters(commonFilters, {
					append: false
				});
			}
		} catch (e) { };

		
		/**
		 * Open external link
		 * 
		 * @param {string} url
		 */
		$scope.openExternalLink = function (url) {
			if (url) {
				$window.open(url, '_blank');
			}
		};

		/**
		 * Logo config
		 */
		$scope.logo = {
			title: config.map.logo.title,
			icon: config.map.logo.icon,
			url: config.map.logo.url,
			inputClass: config.map.logo.inputClass,
			img: config.map.logo.img,
			imgSmall: config.map.logo.imgSmall || config.map.logo.img
		};

		$scope.display = {
            header:config.header.display
        };

		// Watch variable
		$scope.watch = {

			/*
			 * Features carousel template
			 */
			featuresCarouselTmpl: config.display.featuresCarouselTmpl,

			/*
			 * Feature carousel hilite type
			 */
			hiliteWithLine: config.display.hiliteWithLine,

			/*
			 * Brands in map ?
			 */
			brandsInMap: config.display.brandsInMap,

			/*
			 * Basemaps in map ?
			 */
			basemapsInMap: config.display.basemapsInMap,

			/*
			 * Map bottom container ?
			 */
			bottomContainer: config.display.bottomContainer,

			/*
			 * North/South switcher ?
			 */
			northSouthSwitcher: config.display.northSouthSwitcher,

			/*
			 * True to display basemaps panel
			 */
			showBasemaps: rocketHolder.states.map.showBasemaps || false,

			/*
			 * True to display explore panel
			 */
			showExplorePanel: rocketHolder.states.map.hasOwnProperty('showExplorePanel') ? rocketHolder.states.map.showExplorePanel : true,

			/*
			 * Is 3D Globe available
			 */
			isGlobeEnabled: false,

			/*
			 * WMS Get feature info tool
			 */
			getFeatureInfo: config.display.getFeatureInfo,

			/*
			 * DrawToolbox
			 */
			drawToolbox: false,

			/*
			 * Draw tools
			 */
			draw: config.display.draw,

			/*
			 * Hide mapBottomContainer on map click
			 */
			hideBottomOnMapClick: config.display.hideBottomOnMapClick || false
		};

		/**
		 * Toggle basemaps panel
		 * 
		 * @param {boolean} visible
		 */
		$scope.toggleBasemapsPanel = function (visible) {
			$scope.watch.showBasemaps = visible;
			rocketHolder.states.map.showBasemaps = $scope.watch.showBasemaps;
		}

		/**
		 * Toggle explore panel
		 * 
		 * @param {boolean} visible
		 */
		$scope.toggleExplorePanel = function (visible) {
			$scope.watch.showExplorePanel = visible;
			rocketHolder.states.map.showExplorePanel = $scope.watch.showExplorePanel;
		}

		/**
		 * Create map
		 */
		$scope.rocketMap = new window.rocketmap.Map();
		_mapEventenableglobe(false);

		/*
		 * Events registration
		 */
		$scope.rocketMap.on('initialized', _mapEventinitialized);
		$scope.rocketMap.on('moveend', _mapEventmoveend);
		$scope.rocketMap.on('selectedfeatures', _mapEventselectedfeatures);
		$scope.rocketMap.on('drawend', _mapEventdrawend);
		$scope.rocketMap.on('enableglobe', _mapEventenableglobe);
		rocketSearchService.on('updatefilters', _update$location);
		rocketSearchService.on('addendpoint', _addEndPoint);
		rocketSearchService.on('removeendpoint', _removeEndPoint);
		rocketMagicReader.on('uploadstart', _uploadStart);
		rocketMagicReader.on('drop', _drop);

		/*
		 * Events unregistration when destroying component
		 */
		$scope.$on("$destroy", function () {
			$scope.rocketMap.un('initialized', _mapEventinitialized);
			$scope.rocketMap.un('moveend', _mapEventmoveend);
			$scope.rocketMap.un('selectedfeatures', _mapEventselectedfeatures);
			$scope.rocketMap.un('drawend', _mapEventdrawend);
			$scope.rocketMap.un('enableglobe', _mapEventenableglobe);
			rocketSearchService.un('updatefilters', _update$location);
			rocketSearchService.un('addendpoint', _addEndPoint);
			rocketSearchService.un('removeendpoint', _removeEndPoint);
			rocketMagicReader.un('uploadstart', _uploadStart);
			rocketMagicReader.un('drop', _drop);

			// [IMPORTANT] Store layersConfig in mapContext
			if (rocketHolder.mapContext) {
				rocketHolder.mapContext.layersConfig = $scope.rocketMap.getLayersConfig();
			}

		});

		/*
		 * Initialize map
		 */
		$scope.rocketMap.init({
			target: 'map',
			defaultProjCode: _defaultProjCode,
			stylesConfig: config.map.stylesConfig,
			layersConfig: _layersConfig,
			interactions: {
				mouseWheelZoom: true,
				pinchRotate: false,
				shiftDragZoom: false,
				altShiftDragRotate: false,
				onFocusOnly: false
			},
			controls: {
				FullScreen: true,
				ScaleLine: true,
				MousePosition: !rocketServices.isMobileOrTablet(),
				ZoomOnMap: false,
				//ZoomOnMap: rocketServices.isMobileOrTablet() ? false : rocketServices.translate('zoomonmap.title'),
				Draw: {
					messages: {
						continuePolygonMsg: rocketServices.translate('draw.continue.polygon'),
						continueLineMsg: rocketServices.translate('draw.continue.line'),
						helpMsg: rocketServices.translate('draw.help')
					},
					maxRadius: 300000
				}
			},
			center: $location.search()['c'] && $location.search()['c'].split ? $location.search()['c'].split(',').map(parseFloat) : null,
			maxExtent: config.map.maxExtent,
			defaultExtent: config.map.defaultExtent,
			defaultParams: _mapDefaultParams,
			mapPinUseLongClick: config.map.mapPinUseLongClick,
			selectFeatureOnMap: config.map.selectFeatureOnMap,
            selectHitTolerance: config.map.selectHitTolerance,
			globeConfig: config.map.globe.enabled ? config.map.globe : null
		});

		
		//////////////////////////////////////////////////////////////
		//////////// [END] INITIALIZATION
		//////////////////////////////////////////////////////////////


		//////////////////////////////////////////////////////////////
		//////////// [START] LISTENERS
		//////////////////////////////////////////////////////////////

		/*
		 * Track browser location bar changes
		 */
		$scope.$on('$locationChangeSuccess', function (obj, _newState, _oldState) {
			
			var differences = window.rocketmap.Util.differences(window.rocketmap.Util.extractKVP(_oldState), window.rocketmap.Util.extractKVP(_newState));
			
			/*
			 * If newState only differs from oldState by c then center map on view
			 */
			if (differences && differences.differences['c']) {
				$scope.rocketMap.panTo(differences.differences['c'].split(',').map(parseFloat), {
					duration: 0
				});
			}

		});

		/**
		 * Called when an asset is selected (usually within a component)
		 * 
		 * @param {string} triggerName
		 * @param {object} asset // Attached asset
		 */
		$scope.onAssetTrigger = function (triggerName, asset) {

			switch (triggerName) {
				case 'showmeasurement':
					$scope.chartAsset = {
						data: asset
					};
					break;

				default:
					console.log('[UNKNOWN] ' + triggerName);
			}

		}

		//////////////////////////////////////////////////////////////
		//////////// [END] LISTENERS
		//////////////////////////////////////////////////////////////

		/**
		 * Create or set AOI Layer
		 * 
		 * @param {object} obj  // {wkt:"POINT..." , properties: AOI properties (e.g. name, description)}
		 * @param {object} options // Options {center: // Trueto center after update}
		 * @param {boolean} forceSearch
		 */
		$scope.setAOI = function (obj, options, forceSearch) {

			$scope.rocketMap.addAOILayer(obj, options || {}, function (aoiLayer) {

				if (aoiLayer) {

					// Update filters nullify next/prev
					rocketSearchService.addFilters(
						$.extend({
							next: null,
							prev: null
						}, rocketSearchService.getFiltersFromLayer(aoiLayer, $scope.rocketMap.getProjectionCode())),
						{
							append:false
						}
					);
					
					// Automatically perform a search if set in config or forced
					if (config.searchOnAOIChange || forceSearch) {

						// Unless there is no valid STAC API endpoint !
						if (rocketSearchService.hasSearchAPI()) {
							rocketSearchService.search({}, $scope.rocketMap);
						}
						
					}
					
				}
			});

		}

		/**
		 * Toggle draw polygon
		 */
		$scope.toggleDraw = function (type) {
			if ($scope.watch.drawToolbox || !type) {
				$scope.rocketMap.toggleDraw(null);
				$scope.watch.drawToolbox = false;
			}
			else {
				$scope.watch.drawToolbox = type;
				$scope.rocketMap.toggleDraw(type);
			}

		};

		/**
		 * Set $scope.<name> value
		 * 
		 * @param {string} name
		 * @param {any} value
		 * @param {Event} evt
		 */
		$scope.set = function (what, value, evt) {
			if (evt) {
				evt.stopPropagation();
			}
			$scope[what] = value;
		};


		//////////////////////////////////////////////////////////////
		//////////// [START] ADD LAYERS
		//////////////////////////////////////////////////////////////

		/**
		 * Process dropped files/url on map
		 */
		$scope.onDrop = function (obj) {

			rocketMagicReader.process(obj, $scope.rocketMap ? $scope.rocketMap.getProjectionCode() : _defaultProjCode,
				
				function (result) {

					// We don't know what it is
					if (result.type === 'unknown') {
						rocketMagicReader.trigger('uploadstart', false);
						return rocketServices.error(rocketServices.translate('map.add.layer.unknown', [config.services.upload.supportedFormats.join(',')]));
					}

					// STAC endPoint
					if (result.type === 'stac') {

						// Change catalog is not allowed
						if (!config.display.changeCatalog) {
							rocketMagicReader.trigger('uploadstart', false);
							return rocketServices.error(rocketServices.translate('map.add.layer.catalog.notallowed', [result.href]));
						}

						// Catalog already exist
						if (rocketSearchService.getEndPoint(result.href)) {
							rocketMagicReader.trigger('uploadstart', false);
							return rocketServices.error(rocketServices.translate('map.add.layer.existing', [result.href]));
						}
						else {

							// Ask for removing existing
							if (!confirm(rocketServices.translate('catalog.replace.all', [result.href]))) {
								rocketMagicReader.trigger('uploadstart', false);
								return false;
							}

							rocketSearchService.clear();
							rocketSearchService.addEndPoint({
								url: result.href,
								options: {
									isRemovable: true
								}
							}, function (endPoint) {

								// Feedback to user
								if (_addEndPoint(endPoint)) {
									rocketServices.success(rocketServices.translate('map.add.layer.catalog', [result.href]));
								}

								// Trigger event
								rocketMagicReader.trigger('uploadstart', false);

							}, false);

						}

					}

					// Other cases
					else {

						var layerInfo = {
							id: result.href,
							title: result.href.split('/').pop().split('.').slice(0, -1).join(''),
							isSelectable: true,
							isRemovable: true,
							showLayersTabOnAdd: true,
							metadata: $.extend(result.metadata || {}, {
								type:result.type
							})
						};

						// Vector layers made of Features
						if (result.features && result.features.length > 0) {
							layerInfo.features = result.features;
						}

						// Raster COG or WMS
						else if (['cog', 'tilewms', 'wmts'].indexOf(result.type) !== -1) {
							layerInfo.title = result.type !== 'cog' ? result.href.toLowerCase().split('layers=').pop().split('&')[0] : layerInfo.title;
							layerInfo.type = result.type;
							layerInfo.options = {
								url:result.href
							};
						}

						// Not a valid layer
						else {
							rocketMagicReader.trigger('uploadstart', false);
							return rocketServices.error(rocketServices.translate('map.add.layer.empty'));
						}

						var tmpLayer = $scope.rocketMap.getLayerByRocketId(layerInfo.id);
						if (tmpLayer) {
							if (confirm(rocketServices.translate('map.layer.replace.confirm', [layerInfo.id]))) {
								$scope.rocketMap.removeLayer(tmpLayer);
							}
							else {
								return rocketMagicReader.trigger('uploadstart', false);
							}
						}

						// Add layer
						return $scope.rocketMap.addLayer(layerInfo, {
							center: true,
							showLayersTab: true
						}, function(layer, error) {

							// Trigger event
							rocketMagicReader.trigger('uploadstart', false);

							if (layer) {
								rocketServices.success(rocketServices.translate('map.add.layer', [layerInfo.id]));
							}
							else {
								rocketServices.error(error ? error : rocketServices.translate('map.add.layer.error'));
							}
						});

					}


				},

				function (error) {
					// Trigger event
					rocketMagicReader.trigger('uploadstart', false);
					if (error.maxSizeReached) {
						rocketServices.error(rocketServices.translate('map.add.layer.toobig', [(error.maxSizeReached / 1000000) + 'Mo']));
					}
					else {
						rocketServices.error(rocketServices.translate('map.add.layer.error'));
					}

				}

			);

		};

		/**
		 * Called when layer upload start/stop
		 * @param {boolean} bool 
		 */
		function _uploadStart(bool) {
			$scope.uploadInProgress = bool;
		}

		/**
		 * Artificially simulate a drop (triggered by LayersManager component)
		 * 
		 * @param {Object} obj 
		 */
		function _drop(obj) {
			$scope.onDrop(obj);
		}

		///////////////////////////////////////////////////

		/**
		 * Launch after map is initialized
		 * 
		 */
		function _initSearch() {
			
			/*
			 * [Trick] If rocketHolder._search is set performs a search 
			 * (See home page)
			 */
			if (rocketHolder._search) {

				// Location is set (usually from HomePage) - set AOI and search
				if (rocketHolder._search.location) {
					$scope.setAOI(rocketHolder._search.location, {
						center: true
					},
					true);
				}
				else if (rocketHolder._search.filters) {
	
					rocketSearchService.addFilters(rocketHolder._search.filters, {
						append: false
					});
	
					rocketSearchService.search({
						center: rocketHolder._search.filters.bbox ? rocketHolder._search.filters.bbox : true
					}, $scope.rocketMap);
	
					// Remove AOI layer if _search filters has no bbox/intersect/name or if removeAOI is forced
					if ( rocketHolder._search.removeAOI || (!rocketHolder._search.filters.bbox && !rocketHolder._search.filters.intersects && !rocketHolder._search.name ) ) {
						var aoiLayer = $scope.rocketMap.getLayerByRocketId($scope.rocketMap.AOI_LAYER_ID);
						if (aoiLayer) {
							$scope.rocketMap.removeLayer(aoiLayer);
						}
					}
					
				}	

			}
			
			// Important !
			rocketHolder._search = null;

		}

		/////////////////////////////////////////////////////////////////////

		/**
		 * Called when a search endPoint is added
		 * 
		 * @param {object} endPoint 
		 */
		function _addEndPoint(endPoint) {

			if (!endPoint) {
				_setPlanetInfo(null);
				return false;
			}

			var tmpLayer = $scope.rocketMap.getLayerByRocketId(endPoint.url);
			if (tmpLayer) {
				return false;
			}

			// Set planet
			if (!_setPlanetInfo(endPoint)) {

				// Remove endpoint from rocketSearchService
				rocketSearchService.removeEndPoint(endPoint.url);

				return false;
			}

			/* Create a vector */
			$scope.rocketMap.addLayer(rocketSearchService.getSearchLayerConfig(endPoint))

			// Set endPoint input filter if any
			if (searchFilters && searchFilters.__ep && searchFilters.__ep[endPoint.url]) {
				rocketSearchService.addFilters(searchFilters.__ep[endPoint.url], {
					url: endPoint.url,
					append: false
				});
			}

			// Update u if different from config
			if (config.endPoints.length > 0 && config.endPoints[0].url !== endPoint.url) {
				$location.search('u', endPoint.url);
			}

			return true;

		}

		/**
		 * Called when a search endPoint is removed
		 * 
		 * @param {object} endPoint 
		 */
		function _removeEndPoint(url) {
			if ($scope.rocketMap) {
				var tmpLayer = $scope.rocketMap.getLayerByRocketId(url);
				if (tmpLayer) {
					$scope.rocketMap.removeLayer(tmpLayer);
					// Trigger search for component that listen to RocketMap 'searchend' event
					$scope.rocketMap.searchEnd();
				}
			}
		}

		/**
		 * Change planet
		 * 
		 * @param {object} endPoint
		 */
		function _setPlanetInfo(endPoint) {

			if (!rocketHolder.mapContext) {

				// Set map context
				$scope.$parent.mainController.setMapContext(endPoint && endPoint.data && endPoint.data.planet ? endPoint.data.planet : config.defaultPlanet);

			}
			
			// This means that rocketMap was never initialized with input layers
			if (!_layersConfig) {

				_layersConfig = rocketHolder.mapContext.defaultLayersConfig;

				// Set planet
				$scope.rocketMap.setPlanet(rocketHolder.mapContext.planetInfo.planet, rocketHolder.mapContext.planetInfo.defaultProjCode);

				// Load new layers
				$scope.rocketMap.setLayers(_layersConfig, _mapDefaultParams);

			}
			else if (endPoint && endPoint.data && endPoint.data.planet && endPoint.data.planet.toLowerCase() !== rocketHolder.mapContext.planetInfo.planet) {

				if (config.askForPlanetChange) {
					if (!confirm(rocketServices.translate('map.change.planet.confirm', [endPoint.data.planet]))) {
						return false;
					}
				}

				// Feedback to user
				rocketServices.success(rocketServices.translate('map.change.planet', [endPoint.data.planet]));

				// Keep only new endpoints - remove all others
				rocketSearchService.keepOnlyEndPoint(endPoint.url);

				// Store new mapContext
				$scope.$parent.mainController.setMapContext(endPoint.data.planet);

				// Set planet
				$scope.rocketMap.setPlanet(rocketHolder.mapContext.planetInfo.planet, rocketHolder.mapContext.planetInfo.defaultProjCode);

				// Load new layers
				_layersConfig = rocketHolder.mapContext.defaultLayersConfig;
				$scope.rocketMap.setLayers(_layersConfig, _mapDefaultParams);

			}
			
			return true;

		}

		/**
		 * Search filters update
		 * 
		 * @param {object} obj
		 */
		function _update$location(obj) {
			
			obj = obj || {};
			obj.filters = obj.filters || {};

			/*
			 * Hack to avoid 414 Request-URI Too Large
			 */
			if (obj.filters.name && obj.filters.intersects) {
				delete obj.filters.intersects;
			}

			var encodedFilters = JSON.stringify(_cleanFilters(obj.filters));

			if (encodedFilters !== $location.search()['f']) {
				// [REMOVE] $location.search('f', encodedFilters);
			}

		}

		/**
		 * Return filters without null entries
		 * 
		 * @param {object} filters 
		 */
		function _cleanFilters(filters) {

			var cleanFilters = {};
			for (var key in filters) {
				if (filters[key] !== null) {
					cleanFilters[key] = filters[key];
				}
			}

			// Clean endPoints filters
			if (cleanFilters.__ep) {
				for (var ep in cleanFilters.__ep) {
					for (var key in cleanFilters.__ep[ep]) {
						if (cleanFilters.__ep[ep][key] === null) {
							delete cleanFilters.__ep[ep][key];
						}
					}
				}
			}

			// Hack ck and collections
			if (cleanFilters.__theme) {
				delete cleanFilters.collections;
				delete cleanFilters.__collection;
			}

			return cleanFilters;

		}

		/**
		 * Map event : initialized
		 * 
		 * After initialization :
		 *  - Assign state values to search context
		 * 
		 * @param {Object} obj 
		 */
		function _mapEventinitialized(obj) {
			_$locationIsInitialized = true;
			_mapEventmoveend(obj);
			_initSearch();
		}

		/**
		 * Map event : moveend
		 * 
		 * After a moveend
		 *  - Update visible features list
		 *  - Update location bar to set the new view
		 * 
		 * [IMPORTANT] Moveend is disabled in 3D mode due to unwanted laggy globe
		 * 
		 * @param {object} obj 
		 */
		function _mapEventmoveend(obj) {
			
			if ($scope.watch.isGlobeEnabled || !_$locationIsInitialized || !obj || !obj.center) {
				return;
			}
			
			$timeout(function() {
				$location.search()['c'] ? $location.search('c', obj.center.join(',')) : $location.search('c', obj.center.join(',')).replace();
			});
			
		}

		/**
		 * Map event : selectedfeatures
		 * 
		 * After a features selection
		 *  - Change chartAsset if already set
		 * 
		 * @param {Object} olFeatures 
		 */
		function _mapEventselectedfeatures(olFeatures) {
			
			/**
			 * Something is selected !
			 */
			$timeout(function () {
				$scope.selectedFeatures = window.rocketmap.Util.featuresToGeoJSON(olFeatures, $scope.rocketMap ? $scope.rocketMap.getProjectionCode() : _defaultProjCode);
			});

			/**
			 * Dispatch resize event
			 */
			$timeout(function () {
				if ($scope.rocketMap) {
					$window.dispatchEvent(new Event('resize'));
					$scope.rocketMap.map.updateSize();
				}
			}, 100);

			/*
			 * Chart panel is open
			 */
			if ($scope.chartAsset && olFeatures) {

				if (olFeatures.length !== 1) {

					$scope.chartAsset = null;

				}
				else {

					var assets = stacUtil.getAssetsArray(window.rocketmap.Util.featureToGeoJSON(olFeatures[0], $scope.rocketMap ? $scope.rocketMap.getProjectionCode() : _defaultProjCode), 'measurement');
					if (assets.length > 0) {
						$scope.onAssetTrigger('showmeasurement', assets[0]);
					}
					else {
						$scope.chartAsset = null;
					}

				}

			}

		}

		/**
		 * Map event : drawend
		 * 
		 * @param {Object} obj 
		 */
		function _mapEventdrawend(obj) {

			$scope.toggleDraw(null);
			
			if (obj) {
				var projCode = $scope.rocketMap ? $scope.rocketMap.getProjectionCode() : _defaultProjCode;
				$scope.setAOI({
					title: window.rocketmap.Util.geometryToName(window.rocketmap.Util.WKTToGeometry(obj.wkt, projCode), projCode),
					wkt: obj.wkt,
					properties:{
						_from:'draw'
					}
				}, {
					center: false,
					showLayersTab: false
				});

			}

		}

		/**
		 * Map event : drawend
		 * 
		 * @param {bool} bool 
		 */
		function _mapEventenableglobe(bool) {
			$timeout(function () {
				$scope.watch.isGlobeEnabled = bool;
			});
		}

		/////////////////////////////////////////////////////////////////////////////////////////////////

		/*
		 * Load initial endPoints
		 */
		if (rocketSearchService.endPoints.length > 0) {
			for (var i = 0, ii = rocketSearchService.endPoints.length; i < ii; i++) {
				_addEndPoint(rocketSearchService.endPoints[i]);
			}
		}

		if (config.endPoints.length === 0) {
			_setPlanetInfo(null);
		}

	};

})();
