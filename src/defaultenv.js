/**
 *  rocket default configuration 
 * 
 *  This file is stored in /app/app/env.js (within container)
 *  
 *  Every piece of configuration can be superseed in /app/env.js (within container)
 * 
 */
(function (window) {

    window.__env = {

        ////////////////////////// [START] Single configurations  ///////////////////////////////////////////


        /*
         * Ask user to confirm when switching to an endpoint
         * targeting a different planet than the current one
         */
        askForPlanetChange: true,

        /*
         * Collection order strategy i.e. how the list of collections is sorted in home page
         * 
         * Possible values are :
         * 
         *   - 'count'           =>  Sort by number of features in collection (descending)
         *   - 'alphabetical'    =>  Sort alphabetically (ascending) - this is the default
         */
        collectionsOrder: 'alphabetical',

        /* 
         * On the fly handle issue with -180/180 longitude polygon crossing problem 
         * This should be set to false when connecting to resto server.
         * 
         * [IMPORTANT] With resto > 9.5.3 this is not needed anymore and should be false
         */
        correctWrapDateline: false,

        /* 
         * Debug mode
         */
        debug: false,

        /*
         * Default planet when not specified in master endPoint
         */
        defaultPlanet: 'earth',

        /*
         * Default map projection code
         */
        defaultProjCode: 'EPSG:3857',

        /*
         * Default route (i.e. which page is displayed by default)
         *
         * Possible values are :
         * 
         *   - 'home'         => Display home page i.e. list collections - this is the default
         *   - 'map'          => Display map page
         */
        defaultRoute: 'home',

        /* 
         * [STAC] Number of results returned per page durin a search request
         */
        defaultSearchLimit: 20,

        /*
         * True to automatically detects browser language.
         * Languages supported are 'fr' and 'en' with fallback to 'en'
         */
        detectLanguage: true,

        /*
         * Header configuration
         */
        header: {

            // True to display
            display: true,

            // rgba header color
            bgcolor: 'rgba(0,0,0,0.4)',

            // Has search bar
            hasSearch: true

            // You can superseed header template here
            //templateUrl: 'app/components/headerToolbar/headerToolbar.html'
        },

        /* 
         * Home page - set to null for no home page
         */
        homePage: {
            controller: 'HomeController',
            templateUrl: 'app/pages/home/home.html'
        },

        /*
         * Superseed map page - this cannot be set to null
         */
        mapPage: {
            controller: 'MapController',
            templateUrl: 'app/pages/map/map.html'
        },

        /*
         * True to allow negative filters in searches
         *
         * A negative filter means "NOT filter" i.e. search on "-#cloudy" will
         * search for every feature without the keyword "#cloudy"
         */
        negateFilters: false,

        /* 
         * [STAC] Number of STAC child/item links limit (-1 means no limit)
         */
        numberOfLinksLimit: -1,

        /*
         * True to open Feature page in a new tab when clicking on "Product Page" - default is false
         */
        openFeaturePageInNewTab: false,

        /*
         * True to automatically launch a search each time the Area Of Interest is changed
         */
        searchOnAOIChange: true,

        /*
         * [STAC] Default oldest date value presented in calendar if temporal extent is not present in collection
         */
        startDate: '2008-01-01T00:00:00Z',

        /*
         * Version - computed during build
         */
        version: "$ROCKET_IMAGE_TAG",

        ////////////////////////// [END] Single configurations  ///////////////////////////////////////////

        ////////////////////////// [START] Object configurations  ///////////////////////////////////////////

        /*
         * Assets
         */
        assets: {

            /*
             *  True to automatically add the first mappable asset as a layer within the map view in Product page
             */
            autoLoadMappable: false,

            /*
             *  True to automatically add the first mappable asset as a layer within the map view in Map page
             */
            autoLoadMappableInMap: false,

            /*
             *  True to only display one mappable asset on the map at the same time
             */
            uniqueMappableInMap: true

        },

        /*
         * Authentication configuration
         */
        auth: {

            /*
             * Authentication strategy:
             *
             *  - 'none'        : No authentication - does not provide signin/register/profile or any services that need an authentication
             *  - 'internal'    : Add signin/register/resetPassword/forgotPassword/profile services with email/password authentication only (requires a resto /auth endPoint)
             *  - 'external'    : Add signin/profile services with authentication with external providers only (e.g. google)
             *  - 'both'        : Add both 'internal' and 'external' services
             */
            strategy: 'none',

            /*
             * Url to resto server for authentication/authorization endPoint:
             *
             *  - used for authentication if strategy is 'internal' or 'both'
             *  - used for profile/cart/view etc. services if strategy is everything except 'none'
             */
            endPoint: null,

            /*
             * List of external providers
             *
             * Object with key = provider identifier e.g.
             * 
             *      google: {
             *          
             *          // Icon to display for signin/register
             *          icon:'fab fa-google',
             * 
             *          // Provider title
             *          title:'Google',
             * 
             *          // resto endpoint with valid /auth
             *          endPoint:'https://tamn.snapplanet.io',
             * 
             *          // ClientId (assuming Oauth2 in this case - google)
             *          clientId:'426412538974-23d5udhd93838cl7ihalarv4l0j159ni.apps.googleusercontent.com'
             * 
             *      }
             */
            providers: {}

        },

        /*
         * Brands
         */
        brands: [
            {

                /*
                 * Text title display in the upper left header
                 */
                //title: 'rocket',

                /*
                 * Logo display in the upper left header (i.e. (icon + title) or img)
                 */
                //icon: 'fas fa-igloo',

                /*
                 * Logo display in the upper left header for big screen
                 */
                img: "assets/img/logo_snapplanet_white.png",

                /*
                 * Logo display in the upper left header for small screen (i.e. mobile phone)
                 */
                //smallImg:"assets/img/logo_snapplanet_white_small.png",

                /*
                 * Url to open when clicking on uppder left header title/logo. Go to homepage if not set
                 */
                url: 'https://snapplanet.io'

            }
        ],

        /*
         * Functions to display
         */
        display: {

            // Display basemaps in map components - if false, display within layersManager component instead
            basemapsInMap: true,

            // Display map bottom container (i.e. the one containing layersManager, explore, filter, etc.)
            bottomContainer: true,

            // Display brand in header
            brandsInHeader: false,

            // Display brand in map
            brandsInMap: false,

            // Display brand in pages
            brandsInPages: false,

            // Display cart button and subsequent service
            cart: true,

            // Display catalogs as overlays layers within layersManager component
            catalogsInLayers: false,

            // Allow user to change STAC endpoint
            changeCatalog: true,

            // Allow user to change OGC API Processes endpoint
            changeOAPIP: true,

            // Display chart evolution in feature page
            chartGestalt: false,

            // Display collections list as block in FiltersManager component
            collectionsListAsBlock: false,

            // Allow Drag&Drop of files/url within map to add layer
            dragNDrop: true,

            // Draw tools
            draw: {
                polygon: true,
				linestring: true,
				circle: true
            },

            // Display search tab
            filtersTab: true,

            // Display getFeatureInfo button for WMS layers
            getFeatureInfo: false,

            // Display heatmaps
            heatmapVisible: false,

            // Hide mapBottomContainer on map click
            hideBottomOnMapClick: false,

            // Hilite feature in carousel with a line pointing to the feature on map when hovering with mouse, (if false just hilite the feature in carousel)
            hiliteWithLine: false,

            // Display hints (e.g. text to help user experience)
            hint: true,

            // Features Carousel template - set to null or false means no features carousel
            featuresCarouselTmpl: 'innerMap',

            // Display jobs (i.e. from OGC API Processes)
            jobs: true,

            // Display layers tab
            layersTab: true,

            // Display projection switcher
            projectionSwitcher: false,

            // Display North/South projection switcher
            northSouthSwitcher: true,

            // Display "similar features carousel" in feature page
            similarFeatures: false,

            // Suggest toolbar
            suggest: {
                catalogs: true,
                gazetteer: true
            },

            // Show mapBottomContainer "explore" tab on add catalog
            tabOnAddCatalog: false,

            // Show mapBottomContainer "layers" tab on add layer
            tabOnAddLayer: false,

            // Show mapBottomContainer "results" tab on search results
            tabOnSearchResults: false,

            // Display thumbnail link in assets if found
            thumbnailInAssets: true,

            // Display "views" button an subsequent service (require Authentication)
            views: true,

            // Display title and description in home page before collection listing
            whatisit: false

        },

        /*
         * Array of server endpoints.
         * rocket supports several endpoint at the same time - in this case it acts as a broker i.e. sending search requests in parallel
         * 
         * [IMPORTANT] The first server is the default server
         */
        endPoints: [
            {

                // STAC root endpoint
                url: 'http://127.0.0.1:5252',
                
                /*
                 * This is to display a heatmap of result client side instead of vector
                 * This should only work for point geometries - see envs/plastic.js
                 * 
                 * display:'heatmap',
                 * ol:{
                 *      blur: parseInt(10),
                 *      radius: parseInt(8),
                 *      weight: function (feature) {
                 *          return feature.getProperties().total_normalized_log;
                 *      }
                 *  }
                 */
                options: {

                    // True to allow user to remove this endpoint
                    isRemovable: false,

                    // Default unfolded catalog url
                    defaultUnfolded: null,

                }
            }
        ],

        /*
         * Array of OGA API Processes endpoints
         * [IMPORTANT] The first server is the default server
         */
        processesEndPoints: [
            /*{
                url:'http://127.0.0.1:5252/oapi-p'
            }*/
        ],

        /*
         * Map configuration
         */
        map: {

            footer: {
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                color: 'black'
            },

            /*
             * Greatest extent allowed for map browsing
             * 
             * It can be either :
             *  - an array of 4 coordinates in EPSG:4326 i.e. [latmin,lonmin,latmax,lonmax]
             *  - EARTH_EXTENT : this is an alias to the whole earth 
             *  - null : no restriction on extent
             */
            maxExtent: 'EARTH_EXTENT',

            /*
             * This is the logo displayed on the map component
             */
            logo: {

                /*
                 * Logo title
                 */
                title: 'rocket',

                /*
                 * Logo is icon + title or image
                 */
                icon: 'fas fa-rocket',

                /*
                 * Input class (for positioning)
                 * [HINT] Set value to "hidden" to not display the logo
                 */
                inputClass: 'map-footer',

                /*
                 * Large image logo
                 */
                //img: "assets/img/logo_snapplanet_white.png",

                /*
                 * Small image logo
                 */
                //smallImg:"assets/img/logo_snapplanet_white_small.png",

                /*
                 * If set, click on home open external url. Go to homepage otherwise
                 */
                url: 'https://snapplanet.io'

            },

            /*
             * 3D globe uses CesiumJS
             */
            globe: {

                /*
                 * True to enable i.e. display 3D icon and subsequent service
                 */
                enabled: true,

                /*
                 * Cesium Terrain Ion token to display topography
                 * (See https://cesium.com/learn/ion/cesium-ion-access-tokens/)
                 */
                ionToken: null,

                /*
                 * Terrain providers for different planet
                 *
                 * [IMPORTANT] The "earth" planet (default) uses the default Cesium Terrain
                 */
                terrainProviders: {
                    mars: {
                        // This is buggy
                        //url:'https://marshub.s3.amazonaws.com/mars_v14'
                    }
                }

            },

            /*
             * If true mapPin will appear on long click on map - otherwise it appears on simple click on map
             */
            mapPinUseLongClick: true,

            /*
             * True to allow select feature on map
             */
            selectFeatureOnMap: true,

            /*
             * Select feature hitTolerance in pixels
             */
            selectHitTolerance: 0,
            
            /*
             * Default style configuration for overlay vectors
             */
            stylesConfig: {
                default: {
                    invert: true,
                    fill: {
                        color: "transparent"
                    },
                    stroke: {
                        color: "rgba(255,255,255,0.9)"
                    },
                    circle: {
                        radius: 10
                    }
                },
                dashed: {
                    invert: true,
                    fill: {
                        color: "transparent"
                    },
                    stroke: {
                        color: "rgba(255,255,255,0.9)",
                        lineDash: [2, 2]
                    },
                    circle: {
                        radius: 10
                    }
                },
                selected: {
                    invert: true,
                    fill: {
                        color: "rgba(255,255,0,0.01)"
                    },
                    stroke: {
                        color: "rgba(255,255,0,1)",
                        width: 1
                    },
                    circle: {
                        radius: 10
                    }
                },
                hilited: {
                    invert: true,
                    fill: {
                        color: "rgba(255,255,255,0.3)"
                    },
                    stroke: {
                        color: "rgba(255,255,0,1)",
                        width: 1
                    },
                    circle: {
                        radius: 10
                    }
                },
                aoi: {
                    invert: true,
                    stroke: {
                        color: "rgba(255,129,0,1)",
                        width: 1
                    },
                    circle: {
                        radius: 10
                    }
                },
                aoihilited: {
                    fill: {
                        color: "rgba(255,255,0,0.3)"
                    },
                    stroke: {
                        color: "rgba(255,255,0,1)",
                        width: 1
                    },
                    circle: {
                        radius: 10
                    }
                }
            }
        },

        /*
         * Planets configuration
         *
         * [IMPORTANT] The planet is discovered in STAC root endpoint from the ssys:targets property if set
         * (see SolarSystem STAC extension https://github.com/thareUSGS/ssys)
         * 
         */
        planets: {

            /*
             * The default planet
             */
            earth: {

                /*
                 * [UNUSUED] Optional background to display on Home page
                 */
                preview: "/assets/img/earth_bg.jpg",

                /*
                 * Optional URL to resto Gazetteer plugin service endpoint
                 */
                gazetteer: {

                    url: "https://tamn.snapplanet.io/gazetteer/default",

                    // Feature class to be discarded in reverse search (see http://www.geonames.org/source-code/javadoc/org/geonames/FeatureClass.html)
                    reverseDiscardClass: []
                },

                /*
                 * BING API key to use for "bing" layers
                 * (see https://learn.microsoft.com/en-us/bingmaps/getting-started/bing-maps-dev-center-help/getting-a-bing-maps-key)
                 */
                BING_KEY: "Arz66S4QjRa_aCS3STC9cbyvKPjElSHR8L0Ff99mFwL6AlFublV81KnYjDQKy7p-",

                /*
                 * List of map layers
                 */
                layers: [

                    {

                        /*
                         * Unique identifier
                         */
                        id: "Aerial",

                        /*
                         * Title displayed for this layer
                         */
                        title: "Aerial",

                        /*
                         * Thumbnail displayed in layers list
                         */
                        thumbnail: "assets/img/backgrounds/aerial.png",

                        /*
                         * [UNUSUED]
                         */
                        color: "dark",

                        /*
                         * Layer type, one of :
                         *   - bing : BingsMap layer source (https://openlayers.org/en/latest/apidoc/module-ol_source_BingMaps-BingMaps.html)
                         *   - xyz : XYZ layer source (https://openlayers.org/en/latest/apidoc/module-ol_source_XYZ-XYZ.html)
                         *   - tilewms : TileWMS layer source (https://openlayers.org/en/latest/apidoc/module-ol_source_TileWMS-TileWMS.html)
                         *   - GeoJSON : GeoJSON layer format (https://openlayers.org/en/latest/apidoc/module-ol_format_GeoJSON-GeoJSON.html) 
                         */
                        type: "bing",

                        /* 
                         * True for background - false for overlay (default false)
                         */
                        isBackground: true,

                        /*
                         * [UNUSUED]
                         */
                        group: "Permanent",

                        /* 
                         * Layer visibility
                         */
                        visible:false,

                        /*
                         * OpenLayers source options passed during layer creation
                         */
                        options: {
                            imagerySet: "Aerial",
                            //preload: Infinity,
                            wrapX: true
                        }
                    },
                    {
                        id: "AerialWithLabelsOnDemand",
                        title: "Aerial with labels",
                        thumbnail: "assets/img/backgrounds/aerialwithlabels.png",
                        color: "dark",
                        type: "bing",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            imagerySet: "AerialWithLabelsOnDemand",
                            wrapX: true
                        }
                    },
                    {
                        id: "RoadOnDemand",
                        title: "Road",
                        thumbnail: "assets/img/backgrounds/road.png",
                        color: "light",
                        type: "bing",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            imagerySet: "RoadOnDemand",
                            wrapX: true
                        }
                    },
                    {
                        id: "CanvasDark",
                        title: "Road (dark)",
                        thumbnail: "assets/img/backgrounds/roaddark.png",
                        color: "dark",
                        type: "bing",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            imagerySet: "CanvasDark",
                            wrapX: true
                        }
                    },/*
                    {
                        id: "label",
                        title: "Road (light)",
                        thumbnail: "assets/img/backgrounds/roadlight.png",
                        color: "light",
                        type: "stamen",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            layer: "toner-lite",
                            wrapX: true
                        }
                    },*/
                    {
                        id: "VIIRS_Black_Marble",
                        title: "Night",
                        thumbnail: "assets/img/backgrounds/VIIRS_Black_Marble.png",
                        color: "dark",
                        type: "xyz",
                        format: 'png',
                        tileMatrix: 8,
                        time: '2016-01-01',
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Terra_CorrectedReflectance_TrueColor",
                        title: "MODIS Terra True Color",
                        thumbnail: "assets/img/backgrounds/MODIS_Terra_CorrectedReflectance_TrueColor.png",
                        color: "dark",
                        type: "xyz",
                        tileMatrix: 9,
                        format: 'jpg',
                        isBackground: true,
                        group: "Daily",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Aqua_CorrectedReflectance_TrueColor",
                        title: "MODIS Aqua True Color",
                        thumbnail: "assets/img/backgrounds/MODIS_Aqua_CorrectedReflectance_TrueColor.png",
                        color: "dark",
                        type: "xyz",
                        tileMatrix: 9,
                        format: 'jpg',
                        isBackground: true,
                        group: "Daily",
                        visible: false, 
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Terra_CorrectedReflectance_Bands721",
                        title: "MODIS Terra Bands 7-2-1",
                        thumbnail: "assets/img/backgrounds/MODIS_Terra_CorrectedReflectance_Bands721.png",
                        color: "dark",
                        type: "xyz",
                        tileMatrix: 9,
                        format: 'jpg',
                        isBackground: true,
                        group: "Daily",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Aqua_CorrectedReflectance_Bands721",
                        title: "MODIS Aqua Bands 7-2-1",
                        thumbnail: "assets/img/backgrounds/MODIS_Aqua_CorrectedReflectance_Bands721.png",
                        color: "dark",
                        type: "xyz",
                        tileMatrix: 9,
                        format: 'jpg',
                        isBackground: true,
                        group: "Daily",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Terra_CorrectedReflectance_Bands367",
                        title: "MODIS Terra Bands 3-6-7",
                        thumbnail: "assets/img/backgrounds/MODIS_Terra_CorrectedReflectance_Bands367.png",
                        color: "dark",
                        type: "xyz",
                        tileMatrix: 9,
                        format: 'jpg',
                        isBackground: true,
                        group: "Daily",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    }/*,
                    {
                        id: "Test",
                        title: "Test WMS",
                        color: "dark",
                        type: "tilewms",
                        visible: false,
                        options: {
                            url: "https://tds3.ifremer.fr/thredds/wms/GLOBCOAST-GLO-SPM_MERIS-FOR_FULL_TIME_SERIE?LAYERS=concentration_of_suspended_matter_in_sea_water&FORMAT=image/png",
                            wrapX: true
                        }
                    },
                    {
                        id: "MODIS_Terra_NDSI_Snow_Cover",
                        title: "Snow cover",
                        color: "dark",
                        type: "xyz",
                        format: 'png',
                        tileMatrix: 8,
                        isRemovable: true,
                        group: "Daily",
                        visible: false,
                        options: {
                            url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{:id:}/default/{:time:}/GoogleMapsCompatible_Level{:tileMatrix:}/{z}/{y}/{x}.{:format:}',
                            attributions: '{:id:} - <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">NASA EOSDIS GIBS</a>',
                            wrapX: true
                        }
                    },
                    {
                        id: "SWOT_Lake",
                        title: "SWOT Lake",
                        color: "dark",
                        type: "tilewms",
                        visible: false,
                        options: {
                            url: "http://127.0.0.1:8282/wms/hysope2?layers=LakeTile&format=image/png",
                            wrapX: true
                        }
                    },
                    {
                        id: "Hydroweb",
                        title: "Hydroweb",
                        type: "GeoJSON",
                        isSelectable:true,
                        clusterize:true,
                        visible: true,
                        options: {
                            url: "https://jrombucket.s3.eu-central-1.amazonaws.com/hydroweb/hydroweb_with_assets.json"
                        }
                    }*/
                ]
            },
            mars: {
                preview: "/assets/img/mars_bg.jpg",
                gazetteer: {
                    url: "https://tamn.snapplanet.io/gazetteer/mars"
                },
                layers: [
                    {
                        id: "opmmarsbasemap",
                        title: "Mars basemap",
                        thumbnail: "assets/img/backgrounds/marsbasemap.png",
                        type: "xyz",
                        isBackground: true,
                        group: "Permanent",
                        options: {
                            url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
                            wrapX: true,
                            attributions: ['OpenPlanetary - Mars BaseMap 0.2']
                        }
                    },
                    {
                        id: "Mars_HRSC",
                        title: "Mars global colour mosaic from high altitude observations",
                        thumbnail: "assets/img/backgrounds/mars_hrsc.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: "https://pdssp.ias.universite-paris-saclay.fr/basemaps/mars_hrsc?layers=hrsc_color_mosaic&FORMAT=image/png",
                            wrapX: true,
                            attributions: ["HRSC mosaic data - http://dx.doi.org/10.17169/refubium-40624"]
                        }
                    }
                    /*,
                    {
                        id: "VIKING21",
                        title: "VIKING (MDIM 2.1)",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map&service=WMS&request=GetMap&layers=MDIM21&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    }*/,
                    {
                        id: "marsgeology",
                        title: "Mars 15M Geologic Map GIS Renovation",
                        thumbnail: "assets/img/backgrounds/marsgeology.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            //url: "http://pdssp.snapplanet.io/basemaps/mars?LAYERS=geounits,geostructure&FORMAT=image/png",
                            url: "https://pdssp.ias.universite-paris-saclay.fr/basemaps/mars?layers=geounits,geostructure&FORMAT=image/png",
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    },
                ]
            },
            moon: {
                preview: "/assets/img/moon_bg.jpg",
                gazetteer: {
                    url: null
                },
                layers: [
                    {
                        id: "opmmoonbasemap",
                        title: "Moon basemap",
                        thumbnail: "assets/img/backgrounds/moonbasemap.png",
                        type: "xyz",
                        isBackground: true,
                        group: "Permanent",
                        options: {
                            url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
                            wrapX: true,
                            attributions: ['OpenPlanetary - Moon BaseMap 0.1']
                        }
                    }/*,
                    {
                        id: "KaguyaTC_Ortho",
                        title: "Kaguya TC Ortho Mosaic",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/moon/moon_simp_cyl.map&service=WMS&request=GetMap&layers=KaguyaTC_Ortho&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    }*/
                ]
            },
            mercury: {
                preview: "/assets/img/mercury_bg.jpg",
                defaultProjCode: 'EPSG:4326',
                gazetteer: {
                    url: null
                },
                layers: [
                    {
                        id: "Messenger Global Mosaic v8",
                        title: "MESSENGER_v8",
                        thumbnail: "assets/img/backgrounds/mercury_messsenger_v8.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mercury/mercury_simp_cyl.map&service=WMS&request=GetMap&layers=MESSENGER_v8&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    },
                    {
                        id: "MERCURY_NOMENCLATURE_WMS",
                        title: "Mercury nomenclature",
                        thumbnail: "assets/img/backgrounds/mercury_nomenclature.png",
                        type: "tilewms",
                        isBackground: false,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mercury/mercury_nomen_wms.map&service=WMS&request=GetMap&layers=MERCURY_NOMENCLATURE_WMS&styles=&format=image%2Fpng&transparent=true&version=1.1.1&upperCase=false&width=512&height=512&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    }
                ]
            },
            titan: {
                preview: "/assets/img/titan_bg.jpg",
                defaultProjCode: 'EPSG:4326',
                gazetteer: {
                    url: null
                },
                layers: [
                    {
                        id: "Titan_VIMS",
                        title: "Titan VIMS Global Mosaic",
                        thumbnail: "assets/img/backgrounds/titan_vims.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        options: {
                            url: "https://pdssp.ias.universite-paris-saclay.fr/basemaps/titan?layers=titan_vims&FORMAT=image/png",
                            wrapX: true,
                            attributions: ['https://doi.org/10.22002/D1.1173']
                        }
                    },
                    {
                        id: "Titan_HiSAR_Mosaic",
                        title: "Titan HiSAR Global Mosaic",
                        thumbnail: "assets/img/backgrounds/titan_hisar.png",
                        type: "tilewms",
                        isBackground: false,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/saturn/titan_simp_cyl.map&service=WMS&request=GetMap&layers=Titan_HiSAR_Mosaic&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    },
                    {
                        id: "TITAN_NOMENCLATURE_WMS",
                        title: "Titan nomenclature",
                        thumbnail: "assets/img/backgrounds/titan_nomenclature.png",
                        type: "tilewms",
                        isBackground: false,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/saturn/titan_nomen_wms.map&service=WMS&request=GetMap&layers=TITAN_NOMENCLATURE_WMS&styles=&format=image%2Fpng&transparent=true&version=1.1.1&upperCase=false&width=512&height=512&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    }
                ]
            },
            venus: {
                preview: "/assets/img/venus_bg.jpg",
                defaultProjCode: 'EPSG:4326',
                gazetteer: {
                    url: null
                },
                layers: [
                    {
                        id: "MAGELLAN_color",
                        title: "Venus Colorized Global Mosaic",
                        thumbnail: "assets/img/backgrounds/venus_magellan_color.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/venus/venus_simp_cyl.map&service=WMS&request=GetMap&layers=MAGELLAN_color&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    },
                    {
                        id: "MAGELLAN_topography",
                        title: "Venus Colorized Topographic Global Mosaic",
                        thumbnail: "assets/img/backgrounds/venus_magellan_topography.png",
                        type: "tilewms",
                        isBackground: true,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/venus/venus_simp_cyl.map&service=WMS&request=GetMap&layers=MAGELLAN_topography&styles=&format=image%2Fpng&transparent=false&version=1.1.1&upperCase=false&width=256&height=256&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    },
                    {
                        id: "VENUS_NOMENCLATURE_WMS",
                        title: "Venus nomenclature",
                        thumbnail: "assets/img/backgrounds/venus_nomenclature.png",
                        type: "tilewms",
                        isBackground: false,
                        group: "Permanent",
                        visible: false,
                        options: {
                            url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/venus/venus_nomen_wms.map&service=WMS&request=GetMap&layers=VENUS_NOMENCLATURE_WMS&styles=&format=image%2Fpng&transparent=true&version=1.1.1&upperCase=false&width=512&height=512&srs=EPSG%3A4326&bbox=-180,-90,180,90',
                            wrapX: true,
                            attributions: ['USGS Astrogeology Science Center']
                        }
                    }
                ]
            }
        },

        /*
         * List of map projection definitions available (requires "display.projectionSwitcher" to be set to "true")
         */
        projections: {
            "EPSG:3857": {
                name: "WGS 84 / Pseudo-Mercator -- Spherical Mercator",
                def: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs",
                extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
            },
            "EPSG:4326": {
                name: "WGS 84 -- WGS84 - World Geodetic System 1984",
                def: "+proj=longlat +datum=WGS84 +no_defs",
                extent: [180.0, -90.0, 180.0, 90.0]
            },
            "EPSG:3413": {
                name: "WGS 84 / NSIDC Sea Ice Polar Stereographic North",
                def: "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
                extent: [-4194304, -4194304, 4194304, 4194304]
            },
            "EPSG:3976": {
                name: "WGS 84 / NSIDC Sea Ice Polar Stereographic South",
                def: "+proj=stere +lat_0=-90 +lat_ts=-70 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs",
                extent: [-3289335.29, -3323160.27, 3289335.29, 3323160.27]
            },
            "ESRI:54009": {
                name: "Mollweide",
                def: "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
                extent: [-18e6, -9e6, 18e6, 9e6]
            },
            "ESRI:102016": {
                name: "North Pole Azimuthal Equidistant projection ",
                def: "+proj=aeqd +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
            },
            "ESRI:102019": {
                name: "South Pole Azimuthal Equidistant",
                def: "+proj=aeqd +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
            },
            "ESRI:102018": {
                name: "WGS 1984 Stereographic North Pole",
                def: "+proj=stere +lat_0=90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs",
                extent: [-12584193.98, -12713600.1, 12584193.98, 12713600.1]
            },
            "ESRI:102021": {
                name: "WGS 1984 Stereographic South Pole",
                def: "+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs",
                extent: [-12584193.98, -12713600.1, 12584193.98, 12713600.1]
            }
        },

        /*
         * Additional services
         */
        services: {

            /*
             * [UNUSUED] Google Analytics
             */
            analytics: {
                gtag: null
            },

            /*
             * Datacube
             */
            datacube: {

                /*
                 * Template used when clicking on small cube in STAC explorer
                 */
                template: "import intake\ncatalog = intake.open_stac_item_collection(\"%STAC_CATALOG_URL%\")\nlist(catalog)\n"
            },

            /*
             * WMS GEtfeatureInfo STAcking Service
             *
             * [IMPORTANT] Require proprietary service https://github.com/jjrom/wms-gestalt
             */
            gestalt: {
                url: 'http://localhost:4100/gestalt',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAiLCJpYXQiOjI1MTYyMzkwMjJ9.hlkq13Tq8062C46agrhP6BamKY1ayiYwaPMnmYJ6J10'
                }
            },

            /*
             * Simple Map Service is used to compute missing quicklooks
             */
            sms: {
                url: 'https://sms.snapplanet.io/',
                width: 256,
                height: 256,
                outline: '#00F'
            },

            /*
             * Upload files in rocket
             */
            upload: {

                /*
                 * True to allow upload of files in rocket
                 */
                allowed: true,

                /*
                 * Allowed file format
                 */
                supportedFormats: ['GeoJSON', 'KML', 'GPX', 'IGC', 'ShapeFile'],

                /*
                 * Maximum allowed size of file in Bytes
                 */
                maxSize: 50000000,

                /*
                 * [IMPORTANT] Upload of shapefiles requires a server side resto proprietary plugin
                 * (see https://github.com/jjrom/resto-addon-shp-uploader)
                 */
                shp: {
                    maxSize: 1000000,
                    converter: 'http://127.0.0.1:5252/shp/convert'
                }
            }

        }

    }

})(this);