/* 
 * rocket - resto Web client
 * 
 * Copyright (C) 2021 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 * This class is an angularjs implementation of stac-fields - https://github.com/stac-utils/stac-fields
 * 
 */
(function () {
    'use strict';

    /**
     * 
     */
    angular.module('rocket')
        .factory('stacFields', [stacFields]);

    function stacFields() {

        return {
            "extensions": {
                "alternate": "Alternative Access Methods",
                "anon": "Anonymized Location",
                "card4l": {
                    "label": "CARD4L",
                    "explain": "CEOS Analysis Ready Data for Land"
                },
                "cf": {
                    "label": "CF",
                    "explain": "The CF metadata conventions are designed to promote the processing and sharing of files created with the NetCDF API"
                },
                "classification": "Classification",
                "cube": "Data Cube",
                "eo": "Electro-Optical",
                "forecast": "Forecast",
                "file": "File",
                "grid": "Gridded Data",
                "goes": {
                    "label": "NOAA GOES",
                    "explain": "NOAA Geostationary Operational Environmental Satellite"
                },
                "label": "Labels / ML",
                "language": "Internationalization / Localization",
                "mgrs": {
                    "label": "MGRS",
                    "explain": "Military Grid Reference System"
                },
                "noaa_mrms_qpe": {
                    "label": "NOAA MRMS QPE",
                    "explain": "NOAA Multi-Radar Multi-Sensor Quantitative Precipitation Estimation"
                },
                "odc": "Open Data Cube",
                "order": "Order",
                "pc": "Point Cloud",
                "processing": "Processing",
                "proj": "Projection",
                "raster": "Raster Imagery",
                "sar": {
                    "label": "SAR",
                    "explain": "Synthetic Aperture Radar"
                },
                "sat": "Satellite",
                "sci": "Scientific",
                "ssys": "Solar System",
                "storage": "Cloud Storage",
                "table": "Tabular Data",
                "tiles": "Tiled Assets",
                "view": "View Geometry",
                "web-map-links": "Web Maps",
                "xarray": "xarray",
        
                "gee": "Google Earth Engine",
                "landsat": "Landsat",
                "msft": "Microsoft",
                "openeo": "openEO",
                "pl": "Planet Labs Inc.",
                "sentinel": "Copernicus Sentinel",
                "cbers": {
                    "label": "CBERS",
                    "explain": "China-Brazil Earth Resources Satellite Program"
                },
                "geoadmin": {
                    "label": "swisstopo",
                    "explain": "Federal Office of Topography (Switzerland)"
                }
            },
            "links": {
                "href": {
                    "label": "URL",
                    "format": "Url"
                },
                "hreflang": {
                    "label": "Language",
                    "format": "LanguageCode"
                },
                "rel": {
                    "label": "Relation",
                    "explain": "Based on IANA relation types",
                    "mapping": {
                        "self": "This document",
                        "root": "Root STAC Catalog",
                        "parent": "Parent STAC Catalog",
                        "collection": "STAC Collection",
                        "derived_from": "STAC Item for input data",
                        "about": "About this resource",
                        "alternate": "Alternative representation",
                        "via": "Source metadata",
                        "next": "Next page",
                        "prev": "Previous page",
                        "canonical": "Origin of this document",
                        "processing-expression": "Processing inctructions/code",
                        "latest-version": "Latest version",
                        "predecessor-version": "Predecessor version",
                        "successor-version": "Successor version",
                        "source": "Source data",
                        "cite-as": "Citation information",
                        "related": "Related resource",
                        "describedby": "Description of the resource",
                        "service-desc": "API definitions",
                        "service-doc": "API user socumentation",
                        "conformance": "API conformance declaration",
                        "order": "Order details",
                        "xyz": "XYZ web map",
                        "wmts": "OGC WMTS web map"
                    }
                },
                "type": {
                    "label": "File Format",
                    "explain": "Based on the IANA media (MIME) types",
                    "format": "MediaType"
                },
                "href:servers": {
                    "label": "Servers",
                    "ext": "web-map-links"
                },
                "wmts:layer": {
                    "label": "WMTS Layers",
                    "ext": "web-map-links"
                },
                "wmts:dimensions": {
                    "label": "WMTS Dimensions",
                    "ext": "web-map-links"
                }
            },
            "assets": {
                "href": {
                    "label": "URL",
                    "format": "Url"
                },
                "hreflang": {
                    "label": "Language",
                    "format": "LanguageCode"
                },
                "type": {
                    "label": "File Format",
                    "explain": "Based on the IANA media (MIME) types",
                    "format": "MediaType"
                },
                "roles": {
                    "label": "Purpose",
                    "mapping": {
                        "thumbnail": "Preview",
                        "overview": "Overview",
                        "visual": "Visualization",
                        "data": "Data",
                        "metadata": "Metadata",
                        "graphic": "Illustration"
                    }
                },
                "alternate": {
                    "label": "Alternatives",
                    "listWithKeys": true,
                    "items": {
                        "href": {
                            "label": "URL",
                            "format": "Url"
                        },
                        "title": {
                            "alias": "title"
                        },
                        "description": {
                            "alias": "description"
                        }
                    },
                    "summary": false,
                    "ext": "alternate"
                },
                "pl:asset_type": "Asset Type",
                "pl:bundle_type": "Bundle Type",
                "table:storage_options": {
                    "alias": "xarray:storage_options"
                },
                "xarray:open_kwargs": {
                    "label": "Read Options",
                    "custom": true,
                    "summary": false
                },
                "xarray:storage_options": {
                    "label": "fsspec Options",
                    "custom": true,
                    "summary": false
                }
            },
            "metadata": {
                "id": "Identifier",
                "keywords": "Keywords",
        
                "datetime": {
                    "label": "Time of Data",
                    "format": "Timestamp",
                    "summary": false
                },
        
                "title": {
                    "label": "Title",
                    "summary": false
                },
                "description": {
                    "label": "Description",
                    "format": "CommonMark",
                    "summary": false
                },
        
                "start_datetime": {
                    "label": "Time of Data begins",
                    "format": "Timestamp",
                    "summary": false
                },
                "end_datetime": {
                    "label": "Time of Data ends",
                    "format": "Timestamp",
                    "summary": false
                },
        
                "created": {
                    "label": "Created",
                    "format": "Timestamp",
                    "summary": "r"
                },
                "updated": {
                    "label": "Updated",
                    "format": "Timestamp",
                    "summary": "r"
                },
            
                "published": {
                    "label": "Published",
                    "format": "Timestamp",
                    "summary": "r"
                },
                "expires": {
                    "label": "Expires",
                    "format": "Timestamp",
                    "summary": "r"
                },
                "unpublished": {
                    "label": "Unpublished",
                    "format": "Timestamp",
                    "summary": "r"
                },
        
                "license": {
                    "label": "License",
                    "format": "License",
                    "summary": false
                },
        
                "providers": {
                    "label": "Providers",
                    "format": "Providers",
                    "summary": false
                },
        
                "platform": "Platform",
                "instruments": {
                    "label": "Instruments",
                    "format": "CSV"
                },
                "constellation": "Constellation",
                "mission": "Mission",
                "gsd": {
                    "label": "GSD",
                    "explain": "Ground Sample Distance",
                    "unit": "m"
                },
        
                "version": {
                    "label": "Data Version",
                    "summary": false
                },
                "deprecated": {
                    "label": "Deprecated",
                    "summary": false
                },
        
                "language": {
                    "label": "Current Language",
                    "ext": "language",
                    "summary": "v",
                    "properties": {
                        "name": {
                            "label": "Name"
                        },
                        "alternate": {
                            "label": "Alternate Name"
                        },
                        "code": {
                            "label": "Code"
                        },
                        "dir": {
                            "label": "Direction",
                            "explain": "Reading and writing direction",
                            "mapping": {
                                "ltr": "left-to-right",
                                "rtl": "right-to-left"
                            },
                            "default": "ltr"
                        }
                    }
                },
                "languages": {
                    "label": "Available Languages",
                    "ext": "language",
                    "summary": false,
                    "items": {
                        "name": {
                            "label": "Name",
                            "sortable": true,
                            "order": 0
                        },
                        "alternate": {
                            "label": "Alternate Name",
                            "sortable": true,
                            "order": 1
                        },
                        "code": {
                            "label": "Code",
                            "sortable": true,
                            "order": 2
                        },
                        "dir": {
                            "label": "Direction",
                            "explain": "Reading and writing direction",
                            "sortable": true,
                            "order": 3,
                            "mapping": {
                                "ltr": "left-to-right",
                                "rtl": "right-to-left"
                            },
                            "default": "ltr"
                        }
                    }
                },
        
                "crs": {
                    "label": "CRS",
                    "format": "CRS",
                    "explain": "Coordinate Reference System"
                },
        
                "anon:size": {
                    "label": "Uncertainty",
                    "unit": "°",
                    "explain": "The size of one side of the anonymized bounding box"
                },
                "anon:warning": {
                    "label": "Warning",
                    "summary": false
                },
        
                "classification:classes": {
                    "summary": false,
                    "label": "Classes",
                    "items": {
                        "color_hint": {
                            "label": "Color",
                            "order": 0,
                            "format": "HexColor"
                        },
                        "value": {
                            "label": "Value",
                            "order": 1
                        },
                        "title": {
                            "label": "Title",
                            "order": 2
                        },
                        "name": {
                            "label": "Identifier",
                            "order": 3
                        },
                        "description": {
                            "label": "Description",
                            "order": 4,
                            "format": "CommonMark"
                        },
                        "nodata": {
                            "label": "No-data value",
                            "order": 5,
                            "default": false
                        }
                    }
                },
                "cf:parameter": {
                    "label": "CF parameter",
                    "items": {
                        "name": {
                            "label" : "Name"
                        },
                        "unit": {
                            "label" : "Unit"
                        }
                    }
                },
                "classification:bitfields": {
                    "summary": false,
                    "label": "Bit Mask",
                    "items": {
                        "name": {
                            "label": "Name",
                            "order": 0
                        },
                        "offset": {
                            "label": "Offset",
                            "explain": "Offset to the first bit",
                            "order": 1
                        },
                        "length": {
                            "label": "Number of bits",
                            "order": 2
                        },
                        "description": {
                            "label": "Description",
                            "order": 3,
                            "format": "CommonMark"
                        },
                        "classes": {
                            "alias": "classification:classes"
                        },
                        "roles": {
                            "label": "Purpose"
                        }
                    }
                },
        
                "cube:dimensions": {
                    "label": "Dimensions",
                    "summary": false,
                    "listWithKeys": true,
                    "items": {
                        "type": {
                            "label": "Type",
                            "order": 0
                        },
                        "axis": {
                            "label": "Axis",
                            "order": 1
                        },
                        "description": {
                            "label": "Description",
                            "format": "CommonMark",
                            "order": 2
                        },
                        "extent": {
                            "label": "Extent",
                            "format": "Extent",
                            "order": 3
                        },
                        "values": {
                            "label": "Values",
                            "order": 4
                        },
                        "step": {
                            "label": "Step",
                            "order": 5
                        },
                        "unit": {
                            "alias": "file:unit",
                            "order": 5
                        },
                        "reference_system": {
                            "label": "Reference System",
                            "explain": "Coordinate / Temporal / Other Reference System",
                            "order": 6
                        }
                    }
                },
                "cube:variables": {
                    "label": "Variables",
                    "summary": false,
                    "listWithKeys": true,
                    "items": {
                        "dimensions": {
                            "label": "Dimensions",
                            "order": 0
                        },
                        "type": {
                            "label": "Type",
                            "order": 1,
                            "mapping": {
                                "data": "Measured values",
                                "auxiliary": "Coordinate data"
                            }
                        },
                        "description": {
                            "label": "Description",
                            "format": "CommonMark",
                            "order": 2
                        },
                        "extent": {
                            "label": "Extent",
                            "format": "Extent",
                            "order": 3
                        },
                        "values": {
                            "label": "Values",
                            "order": 4
                        },
                        "step": {
                            "label": "Step",
                            "order": 5
                        },
                        "unit": {
                            "alias": "file:unit",
                            "order": 6
                        }
                    }
                },
        
                "eo:bands": {
                    "label": "Spectral Bands",
                    "items": {
                        "name": {
                            "label": "Name",
                            "sortable": true,
                            "id": true,
                            "order": 0
                        },
                        "common_name": {
                            "label": "Common Name",
                            "sortable": true,
                            "order": 1
                        },
                        "description": {
                            "label": "Description",
                            "format": "CommonMark",
                            "order": 2
                        },
                        "center_wavelength": {
                            "label": "Wavelength",
                            "explain": "The center wavelength of the band",
                            "unit": "μm",
                            "sortable": true,
                            "order": 5
                        },
                        "full_width_half_max": {
                            "label": "FWHM",
                            "explain": "Full Width Half Max",
                            "unit": "μm",
                            "sortable": true,
                            "order": 6
                        },
                        "gsd": {
                            "alias": "gsd",
                            "sortable": true,
                            "order": 3
                        },
                        "cloud_cover": {
                            "alias": "eo:cloud_cover",
                            "sortable": true,
                            "order": 4
                        },
                        "solar_illumination": {
                            "label": "Solar Illumination",
                            "sortable": true,
                            "order": 7,
                            "unit": "W/m²/μm"
                        },
                        "classification:classes": {
                            "alias": "classification:classes"
                        },
                        "classification:bitfields": {
                            "alias": "classification:bitfields"
                        }
                    }
                },
                "eo:cloud_cover": {
                    "label": "Cloud Cover",
                    "unit": "%"
                },
                "eo:snow_cover": {
                    "label": "Snow/Ice Cover",
                    "unit": "%"
                },
        
                "forecast:reference_datetime": {
                    "label": "Reference Time",
                    "format": "Timestamp",
                    "summary": "r"
                },
                "forecast:horizon": {
                    "label": "Forecast Horizon",
                    "explain": "The time between the reference time and the forecast time",
                    "format": "Duration",
                    "summary": "r"
                },
                "forecast:duration": {
                    "label": "Forecast Length",
                    "format": "Duration",
                    "summary": "r"
                },
        
                "file:bits_per_sample": "Bits per Sample",
                "file:byte_order": "Byte Order",
                "file:checksum": {
                    "label": "Checksum",
                    "format": "Checksum",
                    "summary": false
                },
                "file:data_type": {
                    "label": "Data Type of Values",
                    "format": "FileDataType"
                },
                "file:header_size": {
                    "label": "Header Size",
                    "format": "FileSize",
                    "summary": false
                },
                "file:nodata": {
                    "label": "No-Data Values",
                    "format": "CSV",
                    "summary": false
                },
                "file:size": {
                    "label": "Size",
                    "format": "FileSize",
                    "summary": false
                },
                "file:unit": "Unit of Values",
                "file:values": {
                    "label": "Map of Values",
                    "summary": false,
                    "items": {
                        "values": {
                            "label": "Values",
                            "format": "CSV",
                            "order": 1
                        },
                        "summary": {
                            "label": "Summary",
                            "order": 0
                        }
                    }
                },
                "file:local_path": {
                    "label": "Local Path",
                    "summary": false
                },
        
                "goes:orbital_slot": "Orbital Slot",
                "goes:system_environment": {
                    "label": "System Environment",
                    "mapping": {
                        "OR": "Operational system, real-time data",
                        "OT": "Operational system, test data",
                        "IR": "Test system, real-time data",
                        "IT": "Test system, test data",
                        "IP": "Test system, playback data",
                        "IS": "Test system, simulated data"
                    }
                },
                "goes:image_type": {
                    "label": "Area",
                    "mapping": {
                        "FULL DISK": "The Americas (full disk)",
                        "CONUS": "North America (continental US)",
                        "MESOSCALE": "Central/South America (mesoscale)"
                    }
                },
                "goes:mesoscale_image_number": {
                    "label": "Area in Central/South America",
                    "mapping": {
                        "1": "Region 1",
                        "2": "Region 2"
                    }
                },
                "goes:mode": {
                    "label": "Capture Mode",
                    "mapping": {
                        "3": "3: 1x full disk, 3x continental US, 30x mesoscale region 1, 30x mesoscale region 2 (every 15 minutes)",
                        "4": "4: 1x full disk (every 5 minutes)",
                        "6": "6: 1x full disk, 2x continental US, 20x mesoscale region 1, 20x mesoscale region 2 (every 10 minutes)"
                    }
                },
                "goes:group_time_threshold": {
                    "label": "Time Threshold in a Group",
                    "explain": "Lightning group maximum time difference among lightning events in a group",
                    "unit": "s"
                },
                "goes:flash_time_threshold": {
                    "label": "Time Threshold in a Flash",
                    "explain": "Lightning flash maximum time difference among lightning events in a flash",
                    "unit": "s"
                },
                "goes:lightning_wavelength": {
                    "label": "Central Wavelength",
                    "unit": "nm"
                },
                "goes:yaw_flip_flag": {
                    "label": "Yaw Flip Configuration",
                    "explain": "Flag indicating that the spacecraft is operating in yaw flip configuration.",
                    "mapping": {
                        "0": "Upright",
                        "1": "Neither",
                        "2": "Inverted"
                    }
                },
                "goes:event_count": "Lightning Events",
                "goes:group_count": "Lightning Groups",
                "goes:flash_count": "Lightning Flashes",
                "goes:nominal_satellite_subpoint_lat": {
                    "label": "Satellite Subpoint Latitude",
                    "unit": "°N"
                },
                "goes:nominal_satellite_subpoint_lon": {
                    "label": "Satellite Subpoint Longitude",
                    "unit": "°E"
                },
                "goes:nominal_satellite_height": {
                    "label": "Satellite Height",
                    "explain": "Nominal satellite height above GRS 80 ellipsoid",
                    "unit": "km"
                },
                "goes:percent_navigated_L1b_events": {
                    "label": "Events navigated by Instrument",
                    "format": "Percent0to1",
                    "unit": "%"
                },
                "goes:percent_uncorrectable_L0_errors": {
                    "label": "Data Lost",
                    "format": "Percent0to1",
                    "unit": "%"
                },
        
                "grid:code": {
                    "label": "Grid",
                    "format": "GridCode"
                },
        
                "raster:bands": {
                    "label": "Bands",
                    "items": {
                        "nodata": {
                            "alias": "file:nodata"
                        },
                        "sampling": {
                            "label": "Sampling",
                            "mapping": {
                                "area": "Area",
                                "point": "Point (at pixel center)"
                            }
                        },
                        "data_type": {
                            "alias": "file:data_type"
                        },
                        "bits_per_sample": {
                            "alias": "file:bits_per_sample"
                        },
                        "spatial_resolution": {
                            "label": "Resolution",
                            "explain": "Average spatial resolution",
                            "unit": "m"
                        },
                        "statistics": {
                            "label": "Statistics",
                            "items": {
                                "mean": "Average",
                                "maximum": {
                                    "label": "Max.",
                                    "explain": "Maxmimum value"
                                },
                                "minimum": {
                                    "label": "Min.",
                                    "explain": "Minimum value"
                                },
                                "stdev": {
                                    "label": "Std. Dev.",
                                    "explain": "Standard Deviation"
                                },
                                "valid_percent": {
                                    "label": "Valid",
                                    "explain": "Percentage of valid pixels",
                                    "unit": "%"
                                }
                            }
                        },
                        "unit": {
                            "alias": "file:unit"
                        },
                        "scale": "Scale",
                        "offset": "Offset",
                        "histogram": {
                            "label": "Histogram",
                            "custom": true
                        },
                        "classification:classes": {
                            "alias": "classification:classes"
                        },
                        "classification:bitfields": {
                            "alias": "classification:bitfields"
                        }
                    }
                },
        
                "label:properties": {
                    "label": "Properties",
                    "null": "raster data"
                },
                "label:classes": {
                    "label": "Classes",
                    "items": {
                        "name": {
                            "label": "Name",
                            "null": "raster-formatted",
                            "sortable": true,
                            "id": true
                        },
                        "classes": "Classes"
                    }
                },
                "label:description": {
                    "label": "Description",
                    "format": "CommonMark",
                    "summary": false
                },
                "label:type": "Type",
                "label:tasks": "Tasks",
                "label:methods": "Methods",
                "label:overviews": {
                    "label": "Overviews",
                    "summary": false,
                    "items": {
                        "property_key": {
                            "label": "Property Key",
                            "id": true
                        },
                        "counts": {
                            "label": "Counts",
                            "custom": true
                        },
                        "statistics": {
                            "label": "Statistics",
                            "custom": true
                        }
                    }
                },
        
                "mgrs:latitude_band": "Latitude Band",
                "mgrs:grid_square": "Grid Square",
                "mgrs:utm_zone": "UTM Zone",
        
                "noaa_mrms_qpe:pass": {
                    "label": "Pass Number",
                    "mapping": {
                        "1": "1 (less latency / less gauges)",
                        "2": "2 (more latency / more gauges)"
                    }
                },
                "noaa_mrms_qpe:period": {
                    "label": "Accumulation Period",
                    "unit": "h"
                },
                "noaa_mrms_qpe:region": {
                    "label": "Region",
                    "mapping": {
                        "CONUS": "Continental US",
                        "HAWAII": "Hawaii",
                        "GUAM": "Guam",
                        "ALASKA": "Alaska",
                        "CARIB": "Caribbean Islands"
                    }
                },
        
                "openeo:status":  "Processing Status",
                "api_version": {
                    "label": "API Version",
                    "ext": "openeo"
                },
                "backend_version": {
                    "label": "Back-End Version",
                    "ext": "openeo"
                },
                "production": {
                    "label": "Production-Ready",
                    "ext": "openeo"
                },
                "endpoints": {
                    "label": "Supported Endpoints",
                    "ext": "openeo",
                    "summary": false,
                    "items": {
                        "path": {
                            "label": "Path Template",
                            "order": 0
                        },
                        "methods": {
                            "label": "HTTP Methods",
                            "order": 1,
                            "format": "CSV"
                        }
                    }
                },
                "billing": {
                    "label": "Billing",
                    "ext": "openeo",
                    "custom": true,
                    "summary": false
                },
        
                "order:status": {
                    "label": "Status",
                    "mapping": {
                        "orderable": "Orderable (data can be ordered)",
                        "ordered": "Ordered (preparing to deliver data)",
                        "pending": "Pending (waiting for activation)",
                        "shipping": "Shipping (data is getting processed)",
                        "succeeded": "Delivered (data is available)",
                        "failed": "Failed (unable to deliver)",
                        "canceled": "Canceled (delivery stopped)"
                    }
                },
                "order:id": "Identifier",
                "order:date": {
                    "label": "Submitted",
                    "format": "Timestamp",
                    "summary": "r"
                },
                "order:expiration_date": {
                    "alias": "expires"
                },
        
        
                "pc:count": {
                    "label": "Points",
                    "explain": "Number of Points"
                },
                "pc:type": "Type",
                "pc:encoding": "Format",
                "pc:schemas": {
                    "label": "Schemas",
                    "summary": false,
                    "items": {
                        "name": {
                            "label": "Name",
                            "sortable": true,
                            "id": true
                        },
                        "size": {
                            "label": "Size",
                            "unit": "bytes",
                            "sortable": true
                        },
                        "type": {
                            "label": "Type",
                            "sortable": true
                        }
                    }
                },
                "pc:density": "Density",
                "pc:statistics": {
                    "label": "Statistics",
                    "summary": "s",
                    "items": {
                        "name": {
                            "label": "Name",
                            "id": true
                        },
                        "position": "Position",
                        "average": "Average",
                        "count": "Count",
                        "maximum": {
                            "label": "Max.",
                            "explain": "Maxmimum value"
                        },
                        "minimum": {
                            "label": "Min.",
                            "explain": "Minimum value"
                        },
                        "stddev": {
                            "label": "Std. Dev.",
                            "explain": "Standard Deviation"
                        },
                        "variance": "Variance"
                    }
                },
        
                "processing:expression": {
                    "label": "Processing Instructions",
                    "summary": false
                },
                "processing:lineage": {
                    "label": "Lineage",
                    "format": "CommonMark",
                    "summary": false
                },
                "processing:level": "Level",
                "processing:facility": "Facility",
                "processing:software": {
                    "label": "Software",
                    "format": "Software",
                    "summary": false
                },
        
                "proj:epsg": {
                    "label": "EPSG Code",
                    "format": "EPSG",
                    "summary": "v"
                },
                "proj:wkt2": {
                    "label": "WKT2",
                    "explain": "Well-Known Text, version 2",
                    "format": "WKT2",
                    "summary": false
                },
                "proj:projjson": {
                    "label": "PROJJSON",
                    "explain": "JSON encoding of WKT2",
                    "format": "PROJJSON",
                    "summary": false
                },
                "proj:geometry": {
                    "label": "Footprint",
                    "custom": true,
                    "summary": false
                },
                "proj:bbox": {
                    "label": "Bounding Box",
                    "custom": true,
                    "summary": false
                },
                "proj:centroid": {
                    "label": "Centroid",
                    "custom": true,
                    "summary": false
                },
                "proj:shape": {
                    "label": "Image Dimensions",
                    "format": "Shape",
                    "summary": false
                },
                "proj:transform": {
                    "label": "Transformation Matrix",
                    "format": "Transform",
                    "summary": false
                },
        
                "sar:instrument_mode": "Instrument Mode",
                "sar:frequency_band": "Frequency Band",
                "sar:center_frequency": {
                    "label": "Center Frequency",
                    "unit": "GHz"
                },
                "sar:polarizations": {
                    "label": "Polarizations",
                    "format": "CSV"
                },
                "sar:product_type": "Product Type",
                "sar:resolution_range": {
                    "label": "Range Resolution",
                    "unit": "m"
                },
                "sar:resolution_azimuth": {
                    "label": "Azimuth Resolution",
                    "unit": "m"
                },
                "sar:pixel_spacing_range": {
                    "label": "Range Pixel Spacing",
                    "unit": "m"
                },
                "sar:pixel_spacing_azimuth": {
                    "label": "Aziumth Pixel Spacing",
                    "unit": "m"
                },
                "sar:looks_range": "Range Looks",
                "sar:looks_azimuth": "Azimuth Looks",
                "sar:looks_equivalent_number": {
                    "label": "ENL",
                    "explain": "Equivalent Number of Looks"
                },
                "sar:observation_direction": "Observation Direction",
        
                "sat:platform_international_designator": {
                    "label": "Int. Designator",
                    "explain": "International designator for the platform, also known as COSPAR ID and NSSDCA ID."
                },
                "sat:orbit_state": "Orbit State",
                "sat:absolute_orbit": {
                    "label": "Abs. Orbit Number",
                    "explain": "Absolute Orbit Number"
                },
                "sat:relative_orbit": {
                    "label": "Rel. Orbit Number",
                    "explain": "Relative Orbit Number"
                },
                "sat:anx_datetime": {
                    "label": "ANX Time",
                    "explain": "Ascending Node Crossing time",
                    "summary": "r"
                },
        
                "sci:doi": {
                    "label": "DOI",
                    "format": "DOI"
                },
                "sci:citation": "Citation",
                "sci:publications": {
                    "label": "Publications",
                    "summary": false,
                    "items": {
                        "citation": {
                            "label": "Publication",
                            "sortable": true,
                            "order": 0
                        },
                        "doi": {
                            "label": "DOI",
                            "format": "DOI",
                            "sortable": true,
                            "order": 1
                        }
                    }
                },
        
                "ssys:targets": "Target Body",
        
                "storage:platform": {
                    "label": "Provider",
                    "mapping": {
                        "ALIBABA": "Alibaba Cloud",
                        "AWS": "Amazon AWS",
                        "AZURE": "Microsoft Azure",
                        "GCP": "Google Cloud Platform",
                        "IBM": "IBM Cloud",
                        "ORACLE": "Oracle Cloud"
                    }
                },
                "storage:region": "Region",
                "storage:requester_pays": "Requester Pays",
                "storage:tier": "Tier Type",
        
                "table:columns": {
                    "label": "Columns",
                    "items": {
                        "name": {
                            "label": "Name",
                            "sortable": true,
                            "id": true,
                            "order": 0
                        },
                        "type": {
                            "label": "Data Type",
                            "sortable": true,
                            "order": 1
                        },
                        "description": {
                            "label": "Description",
                            "format": "CommonMark",
                            "order": 2
                        }
                    }
                },
                "table:primary_geometry": "Primary Geometry Column",
                "table:row_count": "Rows",
                "table:tables": {
                    "label": "Tables",
                    "summary": false,
                    "listWithKeys": true,
                    "items": {
                        "name": {
                            "label": "Name",
                            "sortable": true,
                            "id": true,
                            "order": 0
                        },
                        "description": {
                            "label": "Description",
                            "format": "CommonMark",
                            "order": 1
                        }
                    }
                },
        
                "tiles:tile_matrix_sets": {
                    "label": "Tile Matrix Sets",
                    "custom": true,
                    "summary": false
                },
                "tiles:tile_matrix_set_links": {
                    "label": "Tile Matrix Set Links",
                    "custom": true,
                    "summary": false
                },
        
                "view:off_nadir": {
                    "label": "Off-Nadir Angle",
                    "unit": "°"
                },
                "view:incidence_angle": {
                    "label": "Incidence Angle",
                    "unit": "°"
                },
                "view:azimuth": {
                    "label": "Viewing Azimuth",
                    "unit": "°"
                },
                "view:sun_azimuth": {
                    "label": "Sun Azimuth",
                    "unit": "°"
                },
                "view:sun_elevation": {
                    "label": "Sun Elevation",
                    "unit": "°"
                },
        
                "pl:black_fill": {
                    "label": "Unfilled Image Parts",
                    "unit": "%"
                },
                "pl:clear_percent": {
                    "label": "Clear Sky",
                    "unit": "%"
                },
                "pl:grid_cell": "Grid Cell",
                "pl:ground_control": "Positional Accuracy",
                "pl:ground_control_ratio": "Successful Rectification Ratio",
                "pl:item_type": "Type",
                "pl:pixel_resolution": {
                    "label": "Spatial Resolution",
                    "unit": "m"
                },
                "pl:publishing_stage": {
                    "label": "Publishing Stage",
                    "mapping": {
                        "preview": "Preview",
                        "standard": "Standard",
                        "finalized": "Finalized"
                    }
                },
                "pl:quality_category": {
                    "label": "Quality Category",
                    "mapping": {
                        "standard": "Standard",
                        "test": "Test"
                    }
                },
                "pl:strip_id": "Image Strip ID",
        
                "gee:type": {
                    "label": "Type",
                    "mapping": {
                        "image": "Single image",
                        "image_collection": "Image collection",
                        "table": "Table"
                    }
                },
                "gee:cadence": "Cadence",
                "gee:schema": {
                    "label": "Variables",
                    "items": {
                        "name": "Name",
                        "description": "Description",
                        "type": "Data Type"
                    },
                    "summary": false
                },
                "gee:revisit_interval": "Revisit Interval",
                "gee:terms_of_use": {
                    "label": "Terms of Use",
                    "format": "CommonMark",
                    "summary": false
                },
                "gee:visualizations": {
                    "label": "Visualizations",
                    "custom": true,
                    "summary": false
                },
                
                "landsat:scene_id": "Scene ID",
                "landsat:collection_category": "Collection Category",
                "landsat:collection_number": "Collection Number",
                "landsat:wrs_type": {
                    "label": "WRS Type",
                    "explain": "Worldwide Reference System Type"
                },
                "landsat:wrs_path": {
                    "label": "WRS Path",
                    "explain": "Worldwide Reference System Path"
                },
                "landsat:wrs_row": {
                    "label": "WRS Row",
                    "explain": "Worldwide Reference System Row"
                },
                "landsat:cloud_cover_land": {
                    "label": "Land Cloud Cover",
                    "unit": "%"
                },
        
                "msft:container": "Container",
                "msft:storage_account": "Storage Account",
                "msft:short_description": {
                    "label": "Summary",
                    "summary": false
                },
                
                "sentinel:utm_zone": "UTM Zone",
                "sentinel:latitude_band": "Latitude Band",
                "sentinel:grid_square": "Grid Square",
                "sentinel:sequence": "Sequence",
                "sentinel:product_id": {
                    "label": "Product ID",
                    "summary": "s"
                },
                "sentinel:data_coverage": {
                    "label": "Data Coverage",
                    "unit": "%"
                },
                "sentinel:valid_cloud_cover": "Valid Cloud Cover",
        
                "cbers:data_type": {
                    "label": "Processing Level",
                    "explain": "Geolocation precision level",
                    "mapping": {
                        "L2": "Geolocation using only satellite telemetry",
                        "L3": "Control points used to geolocate image, no terrain correction",
                        "L4": "Control points used to geolocate image, orthorectified"
                    },
                    "summary": "v"
                },
                "cbers:path": "Reference Grid Path",
                "cbers:row": "Reference Grid Row",
        
                "card4l:specification": {
                    "label": "Specification",
                    "mapping": {
                        "SR": "Surface Reflectance (Optical)",
                        "ST": "Surface Temperature (Optical)",
                        "NRB": "Normalized Radar Backscatter (SAR)",
                        "POL": "Polarimetric Radar (SAR)"
                    }
                },
                "card4l:specification_version": "Specification Version",
                "card4l:orbit_mean_altitude": {
                    "label": "Platform Altitude",
                    "unit": "m"
                },
                "card4l:incidence_angle_near_range": {
                    "label": "Incidence Angle (near)",
                    "unit": "°"
                },
                "card4l:incidence_angle_far_range": {
                    "label": "Incidence Angle (far)",
                    "unit": "°"
                },
                "card4l:noise_equivalent_intensity": {
                    "label": "Noise Equivalent Intensity",
                    "unit": "dB"
                },
                "card4l:mean_faraday_rotation_angle": {
                    "label": "Mean Faraday Rotation",
                    "unit": "°"
                },
                "card4l:speckle_filtering": {
                    "label": "Speckle Filtering",
                    "custom": true,
                    "summary": false,
                    "null": "not applied"
                },
                "card4l:relative_rtc_accuracy": {
                    "label": "Rel. RTC Accuracy",
                    "explain": "Relative accuracy of the Radiometric Terrain Correction",
                    "unit": "dB"
                },
                "card4l:absolute_rtc_accuracy": {
                    "label": "Abs. RTC Accuracy",
                    "explain": "Absolute accuracy of the Radiometric Terrain Correction",
                    "unit": "dB"
                },
                "card4l:northern_geometric_accuracy": {
                    "label": "Northern Geometric Accuracy",
                    "unit": "m"
                },
                "card4l:eastern_geometric_accuracy": {
                    "label": "Eastern Geometric Accuracy",
                    "unit": "m"
                },
                "card4l:ellipsoidal_height": {
                    "label": "Ellipsoidal Height",
                    "unit": "m"
                },

                "geoadmin:variant": {
                    "label": "Product Variant",
                    "mapping": {
                        "krel": "RGB color with relief",
                        "komb": "RGB color without relief",
                        "kgrel": "Grayscale with relief",
                        "kgrs": "Grayscale without relief"
                    }
                }
            }
        }
        
    }
})();