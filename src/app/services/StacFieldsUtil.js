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
        .factory('stacFieldsUtil', ['stacFields', 'rocketServices', stacFieldsUtil]);

    function stacFieldsUtil(stacFields, rocketServices) {

        var Registry = {

            externalRenderer: false,

            addExtension(prefix, spec) {
                stacFields.extensions[prefix] = _.normalizeField(spec, stacFields.extensions);
            },

            addMetadataField(field, spec) {
                stacFields.metadata[field] = _.normalizeField(spec, stacFields.metadata);
            },

            addLinkField(field, spec) {
                stacFields.links[field] = _.normalizeField(spec, stacFields.links);
            },

            addAssetField(field, spec) {
                stacFields.assets[field] = _.normalizeField(spec, stacFields.assets);
            },

            addMetadataFields(specs) {
                for (var key in specs) {
                    Registry.addMetadataField(key, specs[key]);
                }
            },

            getSpecification(field, type = null) {
                let spec = {};
                if (type === 'assets' && stacFields.assets[field]) {
                    spec = stacFields.assets[field];
                }
                else if (type === 'links' && stacFields.links[field]) {
                    spec = stacFields.links[field];
                }
                else if (stacFields.metadata[field]) {
                    spec = stacFields.metadata[field];
                }
                return spec;
            }

        };

        var _ = {

            e(str) {
                if (typeof str !== 'string') {
                    str = String(str);
                }
                return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, '&apos;');
            },

            toNothing(label = null) {
                if (label === null) {
                    label = 'n/a';
                }
                return `${label}`;
            },

            toList(arr, sort = false, formatter = null, ordered = null) {
                
                let list = arr;
                let tag = ordered === true ? 'ol' : 'ul';
                if (!Array.isArray(arr)) {
                    arr = [arr];
                }
                if (sort) {
                    list = list.slice(0);
                    if (typeof sort === 'function') {
                        list.sort(sort);
                    }
                    else {
                        list.sort();
                    }
                    if (ordered === null) {
                        tag = 'ol';
                    }
                }
                if (typeof formatter === 'function') {
                    list = list.map(formatter);
                }
                if (list.length === 0) {
                    return _.toNothing();
                }
                else if (list.length === 1) {
                    return list[0];
                }
                else if (list.length <= 100) {
                    return `<${tag}><li>${list.join("</li><li>")}</li></${tag}>`;
                }
                else {
                    return `<span>${list[0]} .... ${list[list.length - 1]}</span>`;
                }

            },

            toLink(url, title = "", rel = "", target = "_blank") {
                if (!title) {
                    if (url.length > 50) {
                        title = url.replace(/^\w+:\/\/([^\/]+)((\/[^\/\?]+)*\/([^\/\?]+)(\?.*)?)?$/ig, function (...x) {
                            if (x[4]) {
                                return x[1] + '​/[…]/​' + x[4]; // There are invisible zero-width whitespaces after and before the slashes. It allows breaking the link in the browser. Be careful when editing.
                            }
                            return x[1];
                        });
                    }
                    else {
                        title = url.replace(/^\w+:\/\//i, '');
                    }
                }
                return `<a href="${_.e(url)}" rel="${_.e(rel)}" target="${_.e(target)}">${_.e(title)}</a>`;
            },

            toObject(obj, formatter = null, keyFormatter = null) {
                let html = '<dl>';
                for (let key in obj) {
                    let label;
                    if (typeof keyFormatter === 'function') {
                        label = keyFormatter(key, obj);
                    }
                    else {
                        label = _.formatKey(key, true);
                    }
                    let value = obj[key];
                    if (typeof formatter === 'function') {
                        value = formatter(value, key, obj);
                    }
                    html += `<dt>${label}</dt><dd>${value}</dd>`;
                }
                html += `</dl>`;
                return html;
            },

            abbrev(short, long) {
                return `<abbr title="${_.e(long)}">${_.e(short)}</abbr>`;
            },

            isObject(obj) {
                return (typeof obj === 'object' && obj === Object(obj) && !Array.isArray(obj));
            },

            formatKey(key, prefix = false) {
                if (prefix === false) {
                    key = key.replace(/^\w+:/i, '');
                }
                return _.e(key).split(/[:_\-\s]/g).map(part => part.substr(0, 1).toUpperCase() + part.substr(1)).join(' ');
            },

            normalizeFields(fields) {
                let parts = ['extensions', 'metadata', 'links', 'assets'];
                for (let part of parts) {
                    for (let key in fields[part]) {
                        fields[part][key] = _.normalizeField(fields[part][key], fields[part]);
                    }
                }
                return fields;
            },

            normalizeField(spec, fields = {}) {
                // If just a string label is given, make a normal object with a label from it
                if (typeof spec === 'string') {
                    return {
                        label: spec
                    };
                }
                // Resolve alias
                if (typeof spec.alias === 'string') {
                    // As we don't know whether the alias has been resolved so far, resolve it here, too.
                    return Object.assign(spec, _.normalizeField(fields[spec.alias], fields));
                }

                // Add formatting callback as `formatter`
                if (typeof spec.format === 'string') {
                    spec.formatter = Formatters[`format${spec.format}`];
                }

                // Normalize items
                if (_.isObject(spec.items)) {
                    let itemOrder = [];
                    for (let key in spec.items) {
                        spec.items[key] = _.normalizeField(spec.items[key], fields);
                        itemOrder.push(Object.assign({ key }, spec.items[key]));
                    }

                    spec.itemOrder = itemOrder
                        .sort((i1, i2) => {
                            if (i1.id === true) {
                                return -1;
                            }
                            else if (i2.id === true) {
                                return 1;
                            }
                            else if (typeof i1.order === 'number' && typeof i2.order === 'number') {
                                return i1.order - i2.order;
                            }
                            else {
                                return i1.label.localeCompare(i2.label);
                            }
                        })
                        .map(item => item.key);
                }

                return spec;
            },

            hexToUint8(hexString) {
                if (hexString.length === 0 || hexString.length % 2 !== 0) {
                    throw new Error(`The string "${hexString}" is not valid hex.`)
                }
                return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            },

            uint8ToHex(bytes) {
                return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
            },

            keysFromListOfObjects(objectList) {
                return objectList.reduce(
                    (arr, o) => Object.keys(o).reduce(
                        (a, k) => {
                            if (a.indexOf(k) == -1) {
                                a.push(k);
                            }
                            return a;
                        },
                        arr
                    ),
                    []
                );
            },

            unit(value, unit = '') {
                if (typeof unit === 'string' && unit.length > 0) {
                    return `${value}&nbsp;<span class="unit">${unit}</unit>`;
                }
                return value;
            }

        };

        var DataTypes = {

            array(arr, sort = false, unit = '') {
                return _.toList(arr, sort, v => DataTypes.format(v, unit));
            },

            object(obj) {
                return _.toObject(obj, v => DataTypes.format(v));
            },

            null(label = 'n/a') {
                return `${label}`;
            },

            number(num, unit = '') {
                if (typeof num !== 'number') {
                    num = parseFloat(num);
                }
                return _.unit(num.toLocaleString(), unit);
            },

            string(str, unit = '') {
                return _.unit(_.e(str).replace(/(\r\n|\r|\n){2,}/g, '<br />'), unit);
            },

            boolean(bool) {
                return bool ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
            },

            format(value, unit = '') {
                if (typeof value === 'boolean') {
                    return DataTypes.boolean(value);
                }
                else if (typeof value === 'number') {
                    return DataTypes.number(value, unit);
                }
                else if (typeof value === 'string') {
                    return DataTypes.string(value, unit);
                }
                else if (Array.isArray(value)) {
                    return DataTypes.array(value, unit);
                }
                else if (_.isObject(value)) {
                    return DataTypes.object(value);
                }
                else {
                    return DataTypes.null();
                }
            }

        };

        var Formatters = {

            formatUrl(value, field, spec = {}, context = null, parent = null) {
                let title = _.isObject(parent) && typeof parent === 'string' ? parent.title : value;
                return _.toLink(value, title, parent.rel || "");
            },

            formatMediaType(value, short = false) {
                if (typeof value !== 'string') {
                    return DataTypes.null('Unknown');
                }
                switch (value.toLowerCase()) {
                    case 'image/tiff; application=geotiff':
                        return 'GeoTIFF image';
                    case 'image/tiff; application=geotiff; profile=cloud-optimized':
                        return 'Cloud-optimized GeoTIFF image';
                    case 'image/jp2':
                        return short ? 'JPEG 2000' : 'JPEG 2000 image';
                    case 'image/png':
                    case 'image/apng':
                    case 'image/vnd.mozilla.apng':
                        return short ? 'PNG' : 'PNG image';
                    case 'image/gif':
                        return short ? 'GIF' : 'GIF image';
                    case 'image/jpeg':
                    case 'image/jpg':
                        return short ? 'JPEG' : 'JPEG image';
                    case 'image/webp':
                        return short ? 'WebP' : 'WebP image';
                    case 'image/bmp':
                    case 'image/x-bmp':
                    case 'image/x-ms-bmp':
                    case 'image/wbmp':
                        return short ? 'Bitmap' : 'Bitmap image';
                    case 'image/svg+xml':
                        return short ? 'SVG' : 'SVG vector image';
                    case 'text/csv':
                        return short ? 'CSV' : 'Comma-separated values (CSV)';
                    case 'text/xml':
                    case 'application/xml':
                        return 'XML';
                    case 'text/json':
                    case 'application/json':
                        return 'JSON';
                    case 'application/x-ndjson':
                        return short ? 'NDJSON' : 'Newline Delimited JSON';
                    case 'text/yaml':
                    case 'text/vnd.yaml':
                    case 'text/x-yaml':
                    case 'application/x-yaml':
                        return 'YAML';
                    case 'application/geo+json':
                        return 'GeoJSON';
                    case 'application/gml+xml':
                        return 'GML';
                    case 'application/vnd.google-earth.kml+xml':
                        return 'KML';
                    case 'application/geopackage+vnd.sqlite3':
                    case 'application/geopackage+sqlite3':
                        return 'GeoPackage';
                    case 'text/html':
                    case 'application/html':
                    case 'application/xhtml+xml':
                        return short ? 'HTML' : 'HTML (Website)';
                    case 'text/plain':
                        return short ? 'Text' : 'Text document';
                    case 'text/markdown':
                        return short ? 'Markdown' : 'Markdown document';
                    case 'application/pdf':
                        return short ? 'PDF' : 'PDF document';
                    case 'application/zip':
                        return short ? 'ZIP' : 'ZIP archive';
                    case 'application/gzip':
                        return short ? 'GZIP' : 'GZIP archive';
                    case 'application/x-hdf':
                        return 'HDF';
                    case 'application/netcdf':
                    case 'application/x-netcdf':
                        return 'NetCDF';
                    case 'application/x.mrf':
                        return short ? 'MRF' : 'Meta Raster Format';
                    case 'application/wmo-GRIB2':
                        return 'GRIB2';
                    case 'application/octet-stream':
                        return short ? 'Binary' : 'Binary file';
                    case 'application/vnd.laszip':
                        return 'LASzip';
                    case 'application/vnd.laszip+copc': // https://github.com/copcio/copcio.github.io/issues/53
                        return short ? 'COPC' : 'Cloud-Optimized Point Cloud (LASzip)';
                    case 'application/vnd+zarr': // https://github.com/zarr-developers/zarr-specs/issues/123
                        return 'Zarr';
                    case 'application/x-parquet':
                        return 'Parquet';
                    // ToDo: Add media types for:
                    // - flatgeobuf: https://github.com/flatgeobuf/flatgeobuf/discussions/112
                    // - geoparquet: https://github.com/opengeospatial/geoparquet/issues/115
                    default:
                        let [group, format] = media.type.split('/');
                        format = _.formatKey(format.replace(/^(vnd|x)[.+-]/, ''));
                        if (short) {
                            return format;
                        }
                        switch (group) {
                            case 'audio':
                                return `${format} audio`;
                            case 'image':
                                return `${format} image`;
                            case 'font':
                                return `Font`;
                            case 'model':
                                return `${format} 3D model`;
                            case 'video':
                                return `${format} video`;
                            case 'text':
                            case 'application':
                                return format;
                            default:
                                return value;
                        }
                }
            },

            formatTimestamp(value) {
                return rocketServices.niceDate(value, {
                    withTime: true
                });
                /*if (typeof value === 'string') {
                    try {
                        return new Date(value).toLocaleString([], {
                            timeZone: "UTC",
                            timeZoneName: "short"
                        });
                    } catch (error) {}
                }
                return DataTypes.null();
                */
            },

            formatPercent0to1(value, field, spec = {}) {
                return DataTypes.number(value * 100, spec.unit);
            },

            formatDate(value) {
                if (typeof value === 'string') {
                    try {
                        return new Date(value).toLocaleString(I18N.locales, {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric'
                        });
                    } catch (error) { }
                }
                return DataTypes.null();
            },

            formatDuration(value) {
                if (typeof value === 'string') {
                    const lib = Registry.getDependency('@musement/iso-duration');
                    if (!lib) {
                        return _.e(value);
                    }
                    const { isoDuration, en } = lib;
                    isoDuration.setLocales({ en }, { fallbackLocale: 'en' });
                    let formatted = isoDuration(value).humanize('en');
                    if (formatted.length === 0) {
                        return _.e(_.t('none'));
                    }
                    else {
                        return _.e(formatted);
                    }
                }
                return DataTypes.null();
            },

            formatLanguageCode(value) {
                if (Array.isArray(value)) {
                    return _.toList(value, true, Formatters.formatLanguageCode, false);
                }
                else if (typeof value !== 'string' || value.length < 2) {
                    return DataTypes.null();
                }

                const list = require('./languages.json');
                const [code, ...rest] = value.split('-');
                if (code in list) {
                    const name = list[code];
                    if (rest.length > 0) {
                        return _.e(_.t(`${name} (${rest.join(' ')})`));
                    }
                    return _.e(_.t(name));
                }
                return _.e(_.t(value));
            },

            formatLicense(value, field, spec = {}, context = null) {
                if (typeof value !== 'string' || value.length === 0) {
                    return DataTypes.null();
                }

                // We could use the spdx-license-ids and/or spdx-to-html packages previously used in STAC Browser,
                // but let's try it without additional dependency for now.
                if (value !== 'proprietary' && value !== 'various' && value.match(/^[\w\.\-]+$/i)) { // SPDX
                    return _.toLink(`https://spdx.org/licenses/${value}.html`, value, "license");
                }

                let licenses = Array.isArray(context.links) ? context.links.filter(link => (_.isObject(link) && typeof link.href === 'string' && link.rel === 'license')) : [];
                if (licenses.length > 0) {
                    return _.toList(licenses, false, link => _.toLink(link.href, link.title || value, "license"));
                }
                else {
                    return DataTypes.string(value);
                }
            },

            formatProviders(value) {
                return _.toList(value, false, provider => {
                    let name = provider.name;
                    let roles = '';
                    let description = '';
                    if (typeof provider.url === 'string' && provider.url.length > 0) {
                        name = _.toLink(provider.url, name);
                    }
                    if (Array.isArray(provider.roles) && provider.roles.length > 0) {
                        roles = provider.roles.map(r => DataTypes.format(r)).join(', ');
                        roles = ` (<em>${roles}</em>)`;
                    }
                    if (typeof provider.description === 'string' && provider.description.length > 0) {
                        description = Formatters.formatCommonMark(provider.description);
                    }
                    return `${name}${roles}${description}`;
                });
            },


            formatCommonMark(value) {
                if (typeof value !== 'string' || value.length === 0) {
                    return DataTypes.null();
                }
                return value;
                //const commonmark = require('commonmark');
                //let reader = new commonmark.Parser();
                //let writer = new commonmark.HtmlRenderer({safe: true, smart: true});
                //let html = writer.render(reader.parse(value));
                //return `<div class="description">${html}</div>`;
            },

            formatSoftware(value) {
                if (!_.isObject(value)) {
                    return DataTypes.null();
                }

                let list = [];
                for (let software in value) {
                    let version = value[software];
                    if ((typeof version === 'string' && version.length > 0) || typeof version === 'number') {
                        list.push(`${software} (${version})`);
                    }
                    else {
                        list.push(software);
                    }
                }
                return _.toList(list, true);
            },

            formatDOI(value) {
                value = _.e(value);
                return _.toLink(`http://doi.org/${value}`, value);
            },

            formatCRS(value) {
                return _.toList(value, false, value => {
                    if (typeof value === 'string') {
                        let title = value
                            .replace(/^https?:\/\/www\.opengis\.net\/def\/crs\//i, '') // HTTP(s) URI
                            .replace(/^urn:ogc:def:crs:/i, ''); // OGC URN
                        return _.toLink(value, title);
                    }
                    return DataTypes.format(value);
                });
            },

            formatEPSG(value) {
                // Remove leading 'epsg:' which people sometimes prepend
                if (typeof value === 'string') {
                    value = value.replace(/^epsg:/i, '');
                }
                value = parseInt(value, 10);
                if (value > 0) {
                    return _.toLink(`http://epsg.io/${value}`, value);
                }
                else {
                    return DataTypes.null();
                }
            },

            formatExtent(value, unit = '') {
                if (!Array.isArray(value) || value.length < 2 || (value[0] === null && value[1] === null)) {
                    return DataTypes.null();
                }
                else if (value[0] === null) {
                    return `Until ${DataTypes.format(value[1], unit)}`;
                }
                else if (value[1] === null) {
                    return `From ${DataTypes.format(value[0], unit)}`;
                }
                else if (value[0] === value[1]) {
                    return DataTypes.format(value[0], unit);
                }
                else {
                    return value.map(v => DataTypes.format(v, unit)).join(' – ');
                }
            },

            formatHexColor(value) {
                if (typeof value !== 'string' || !value.match(/^#?[\dA-F]{3,8}$/i)) {
                    return DataTypes.null();
                }
                if (value.startsWith('#')) {
                    value = value.substring(1);
                }
                return `<div class="color" style="background-color: #${value}"><code class="color-code">#${value}</code></div>`;
            },

            formatPROJJSON(value) {
                if (!_.isObject(value)) {
                    return DataTypes.null();
                }
                if (_.isObject(value.id) && value.id.authority === 'EPSG' && typeof value.code === 'number' && value.code > 0) {
                    return 'EPSG ' + Formatters.formatEPSG(value);
                }
                else if (typeof value.name === 'string') {
                    return DataTypes.string(value.name);
                }
                else {
                    return DataTypes.object(value);
                }
            },

            // Helper, not used at the moment
            formatTemporalExtent(value) {
                if (!Array.isArray(value) || value.length < 2 || (typeof value[0] !== 'string' && typeof value[1] !== 'string')) {
                    return DataTypes.null();
                }
                else if (typeof value[0] !== 'string') {
                    return `Until ${Formatters.formatTimestamp(value[1])}`;
                }
                else if (typeof value[1] !== 'string') {
                    return `${Formatters.formatTimestamp(value[0])} until present`;
                }
                else if (value[0] === value[1]) {
                    return Formatters.formatTimestamp(value[0]);
                }
                else {
                    return value.map(date => Formatters.formatTimestamp(date)).join(' - ');
                }
            },

            formatTemporalExtents(value, field, spec = {}) {
                let sortExtents = (a, b) => {
                    if (a[0] === null) {
                        return -1;
                    }
                    else {
                        return a[0].localeCompare(b[0], I18N.locales);
                    }
                };
                return _.toList(value, sortExtents, v => Formatters.formatTemporalExtent(v, field, spec));
            },

            formatWKT2(value) {
                if (typeof value !== 'string') {
                    return DataTypes.null();
                }

                // This is a VERY simplistic WKT2 formatter, which may fail to render properly in some cases.
                let indent = -1;
                let formatted;
                try {
                    formatted = value.replace(/([A-Z]+)\[|\]/g, (match, keyword) => {
                        if (match === ']') {
                            indent--;
                            return match;
                        }
                        else {
                            indent++;
                            let tabs = "  ".repeat(indent);
                            return `\n${tabs}${keyword}[`;
                        }
                    });
                } catch (e) {
                    // In case the formatting did not work properly
                    // (usually the number of [ and ] doesn't match)
                    // just return the unformatted value
                    formatted = value;

                }

                return `<pre>${formatted}</pre>`;
            },

            fileSizeUnits: ['B', 'kB', 'MB', 'GB', 'TB'],

            formatFileSize(value) {
                if (typeof value !== 'number') {
                    return _.e(value);
                }
                var i = value == 0 ? 0 : Math.floor(Math.log(value) / Math.log(1024));
                return _.unit((value / Math.pow(1024, i)).toFixed(2) * 1, Formatters.fileSizeUnits[i]);
            },

            formatChecksum(value) {
                if (typeof value !== 'string') {
                    return DataTypes.null();
                }

                try {
                    //const multihash = require('multihashes');
                    //const meta = multihash.decode(_.hexToUint8(value));
                    const meta = _.hexToUint8(value);
                    const name = _.e(meta.name);
                    const hex = _.e(_.uint8ToHex(meta.digest));
                    return `<input class="checksum-input" size="32" value="${hex}" readonly /><br />Hashing algorithm: <strong>${name}</strong>`;
                } catch (error) {
                    return DataTypes.null();
                }
            },

            fileDataTypes: {
                "int8": "8-bit integer",
                "int16": "16-bit integer",
                "int32": "32-bit integer",
                "int64": "64-bit integer",
                "uint8": "unsigned 8-bit integer",
                "uint16": "unsigned 16-bit integer",
                "uint32": "unsigned 32-bit integer",
                "uint64": "unsigned 64-bit integer",
                "float16": "16-bit float",
                "float32": "32-bit float",
                "float64": "64-big float",
                "cint16": "16-bit complex integer",
                "cint32": "32-bit complex integer",
                "cfloat32": "32-bit complex float",
                "cfloat64": "64-bit complex float",
                "other": "Other"
            },

            formatFileDataType(value) {
                if (typeof value === 'string' && value in Formatters.fileDataTypes) {
                    return `<abbr title="${Formatters.fileDataTypes[value]}">${value}</abbr>`;
                }

                return DataTypes.null();
            },

            formatTransform(value) {
                if (Array.isArray(value) && value.length % 3 === 0) {
                    let rows = [];
                    for (let i = 0; i < value.length; i = i + 3) {
                        let chunk = value.slice(i, i + 3);
                        rows.push(`[${Formatters.formatCSV(chunk)}]`);
                    }
                    return rows.join('<br />');
                }
                else {
                    return Formatters.formatCSV(value);
                }
            },

            formatShape(value, field, spec = {}) {
                if (Array.isArray(value)) {
                    return value.map(x => DataTypes.format(x, spec.unit)).join(' × ');
                }
                else {
                    return DataTypes.format(value, spec.unit);
                }
            },

            formatCSV(value) {
                if (Array.isArray(value)) {
                    let numeric = value.find(v => typeof v === 'number') !== undefined;
                    // If there's potentially a comma in the values (decimal or thousand separators in numbers), use semicolon instead of comma.
                    return value.map(_.e).join(numeric ? '; ' : ', ');
                }
                else {
                    return _.e(value);
                }
            },

            formatGridCode(value) {
                if (typeof value !== 'string') {
                    return DataTypes.format(value);
                }

                let splitHalf = function (parts, value, labelA, labelB) {
                    let len = value.length;
                    if ((len % 2) === 1) {
                        parts.push(`Code: ${value}`);
                    }
                    else {
                        let mid = len / 2;
                        let a = value.substring(0, mid);
                        parts.push(`${labelA}: ${a}`);
                        let b = value.substring(mid, len);
                        parts.push(`${labelB}: ${b}`);
                    }
                };

                let [designator, code] = value.split(/-(.*)/);
                let parts = [];
                switch (designator) {
                    case 'MGRS':
                        parts.push(_.abbrev(_.t(designator), _.t('Military Grid Reference System')));
                        let [, utm, band, sq, coord] = code.match(/^(\d{2})([C-X])([A-Z]{2})(\d+)$/);
                        parts.push(`${_.t("UTM Zone")}: ${utm}`);
                        parts.push(`${_.t("Latitude Band")}: ${band}`);
                        parts.push(`${_.t("Square Identifier")}: ${sq}`);
                        splitHalf(parts, coord, _.t("Easting"), _.t("Northing"));
                        break;
                    case 'MSIN':
                        parts.push(_.t('MODIS Sinusoidal Tile Grid'));
                        splitHalf(parts, code, _.t('Horizontal'), _.t('Vertical'));
                        break;
                    case 'WRS1':
                    case 'WRS2':
                        let version = designator.substring(3, 4);
                        parts.push(_.abbrev(_.t('WRS-' + version), _.t('Worldwide Reference System ' + version)));
                        splitHalf(parts, code, _.t('Path'), _.t('Row'));
                        break;
                    case 'DOQ':
                        parts.push(_abbrev(_.t(designator), _.t('Digital Orthophoto Quadrangle')));
                        parts.push(`${_.t("Quadrangle")}: ${code}`);
                        break;
                    case 'DOQQ':
                        parts.push(_abbrev(_.t(designator), _.t('Digital Orthophoto Quarter Quadrangle')));
                        let quad = code.substr(0, code.length - 2);
                        parts.push(`${_.t("Quadrangle")}: ${quad}`);
                        let quarter = code.substr(-2);
                        let a = quarter[0] === 'N' ? _.t('North') : _.t('South');
                        let b = quarter[1] === 'E' ? _.t('East') : _.t('West');
                        parts.push(`${_.t("Quarter")}: ${a} ${b}`);
                        break;
                    case 'MXRA':
                        parts.push(_.t('Maxar ARD Tile Grid'));
                        let [zone, quadkey] = code.split(/-(.*)/);
                        if (zone.startsWith('Z')) {
                            zone = zone.substring(1);
                        }
                        parts.push(`${_.t("UTM Zone")}: ${zone}`);
                        parts.push(`${_.t("Quadkey")}: ${quadkey}`);
                        break;
                    case 'EASE':
                        let [dggs, components] = code.split('-');
                        if (dggs === 'DGGS') {
                            parts.push(_.t('EASE-DGGS'));
                            let [level, rowcol, ...fractions] = components.split('.');
                            parts.push(`${_.t("Level")}: ${level}`);
                            if (rowcol.length === 6) {
                                parts.push(`${_.t("Level 0 row cell")}: ${rowcol.substring(0, 3)}`);
                                parts.push(`${_.t("Level 0 column cell")}: ${rowcol.substring(3, 6)}`);
                                for (let i in fractions) {
                                    let value = fractions[i];
                                    if (value.length === 2) {
                                        parts.push(`${_.t("Fraction of level {i} row cell", { i })}: ${value[0]}`);
                                        parts.push(`${_.t("Fraction of level {i} column cell", { i })}: ${value[1]}`);
                                    }
                                }
                            }
                            break;
                        }
                    default:
                        parts.push(value);
                }

                return parts.join('<br />');
            }

        };

        var api = {
            format: format,
            label: label,
            extension: extension,
            formatSummaries: formatSummaries,
            formatItemProperties: formatItemProperties,
            formatAssets: formatAssets,
            Registry: Registry,
            Helper: _,
            DataTypes: DataTypes,
            Formatters: Formatters
        };

        return api;

        ////////////

        function formatGrouped(context, data, type, filter, coreKey) {
            // Group fields into extensions
            let groups = {};
            for (let field in data) {
                let value;
                try {
                    let parts = field.split(':', 2);
                    if (parts.length === 1) {
                        parts.unshift(coreKey);
                    }
                    let ext = parts[0];
                    if (typeof filter === 'function' && !filter(field)) {
                        continue;
                    }

                    // Add group if missing
                    if (!_.isObject(groups[ext])) {
                        groups[ext] = {
                            extension: ext,
                            label: extension(ext),
                            properties: {}
                        };
                    }

                    value = data[field];
                    let spec = Registry.getSpecification(field, type);
                    // Special handling for summaries that contain a list with keys (e.g. cube:dimensions, gee:schema)
                    // There's usually just a single object included, so get that as value
                    let isSummarizedListWithKeys = false;
                    if (type === 'summaries' && spec.listWithKeys && Array.isArray(value) && value.length > 0) {
                        value = value[0];
                        isSummarizedListWithKeys = true;
                    }

                    // Fill items with missing properties
                    let items = null;
                    let itemOrder = [];
                    if (_.isObject(spec.items)) {
                        let temp = value;
                        // Ignore keys for lists that are stored as object (e.g. cube:dimensions)
                        if (spec.listWithKeys) {
                            temp = Object.values(temp);
                        }

                        let itemFieldNames;
                        if (Array.isArray(temp)) {
                            itemFieldNames = _.keysFromListOfObjects(temp);
                        }
                        else if (_.isObject(temp)) {
                            itemFieldNames = Object.keys(temp);
                        }

                        items = {};
                        // Remove fields from list that are not available in the data
                        itemOrder = spec.itemOrder.filter(fieldName => itemFieldNames.includes(fieldName));

                        itemFieldNames.forEach(key => {
                            if (typeof spec.items[key] === 'undefined') {
                                // Add fields that are not specified in fields.json
                                items[key] = {
                                    label: _.formatKey(key),
                                    explain: key
                                };
                                // Place non-specified fields at the end
                                itemOrder.push(key);
                            }
                            else {
                                // Copy field spec from fields.json
                                items[key] = spec.items[key];
                                items[key].label = label(key, spec.items[key]);
                            }
                        });
                    }

                    // Format values
                    let formatted;

                    // Handle summaries
                    if (type === 'summaries') {
                        if (!isSummarizedListWithKeys && _.isObject(value)) {
                            if (typeof value.minimum !== 'undefined' && typeof value.minimum !== 'undefined') {
                                formatted = Formatters.formatExtent([value.minimum, value.maximum], spec.unit);
                            }
                            else {
                                formatted = DataTypes.object(value);
                            }
                        }
                        else if (Registry.externalRenderer && items) {
                            let formatted = isSummarizedListWithKeys ? Object.assign({}, value) : value.slice(0);
                            // Go through each field's summary
                            for (let i in formatted) {
                                let result = _.isObject(formatted[i]) ? {} : [];
                                // Go through each entry in a field's summary (this is besically a single value as defined in the Item spec)
                                for (let key in items) {
                                    result[key] = format(formatted[i][key], key, context, data, items[key]);
                                }
                                formatted[i] = result;
                            }
                        }
                        else if (Array.isArray(value)) {
                            formatted = _.toList(value, !spec.custom && !spec.items, v => format(v, field, context, data, spec));
                        }
                        else {
                            console.warn(`Invalid summary value: ${value}`);
                        }
                    }

                    // Fallback to "normal" rendering if not handled by summaries yet
                    if (typeof formatted === 'undefined') {
                        formatted = format(value, field, context, data, spec);
                    }

                    groups[ext].properties[field] = {
                        label: label(field, spec),
                        value,
                        formatted,
                        items,
                        itemOrder,
                        spec
                    };
                } catch (error) {
                    console.error(`Field '${field}' with value '${value}' resulted in an error`, error);
                }
            }
            return Object.values(groups).sort((a, b) => a.extension.localeCompare(b.extension));

        }

        // For assets (item and collection) and item-assets (extension)
        function formatAssets(assets, context, filter = null, coreKey = '') {
            let formatted = {};
            for (let key in assets) {
                formatted[key] = formatGrouped(context, assets[key], 'assets', filter, coreKey);
            }
            return formatted;
        }

        // For links
        function formatLinks(links, context, filter = null, coreKey = '') {
            let formatted = [];
            for (let link of links) {
                formatted.push(formatGrouped(context, link, 'links', filter, coreKey));
            }
            return formatted;
        }

        // For Collection summaries
        function formatSummaries(collection, filter = null, coreKey = '') {
            return formatGrouped(collection, collection.summaries, 'summaries', filter, coreKey);
        }

        // For item properties
        function formatItemProperties(item, filter = null, coreKey = '') {
            return formatGrouped(item, item.properties, 'metadata', filter, coreKey);
        }

        function format(value, field, context = null, parent = null, spec = null) {
            if (!_.isObject(spec)) {
                spec = stacFields.metadata[field] || {};
            }

            // Add formatting callback as `formatter`
            if (typeof spec.format === 'string' && !spec.formatter) {
                spec.formatter = Formatters[`format${spec.format}`];
            }

            if (typeof spec.formatter === 'function') {
                if (field === "extent" && parent) {
                    return spec.formatter(value, parent.unit);
                }
                return spec.formatter(value, field, spec, context, parent);
            }
            else if (_.isObject(spec.mapping)) {
                let key = String(value).toLowerCase();
                if (typeof spec.mapping[key] !== 'undefined') {
                    value = spec.mapping[key];
                }
                return DataTypes.format(value, spec.unit);
            }
            else if (value === null && spec.null) {
                return DataTypes.null(spec.null);
            }
            else if (Array.isArray(value)) {
                let callback = v => format(v, field, context, parent, spec);
                if (Registry.externalRenderer && (spec.custom || spec.items)) {
                    return value.map(callback);
                }
                else {
                    return _.toList(value, false, callback);
                }
            }
            else if (_.isObject(value) && _.isObject(spec.items)) {
                let callback = (v, k, p) => format(v, k, context, p, spec.listWithKeys ? Object.assign({}, spec, { listWithKeys: false }) : spec.items[k]);
                if (Registry.externalRenderer && (spec.custom || spec.items)) {
                    let formattedValues = {};
                    for (let key in value) {
                        formattedValues[key] = callback(value[key], key, value);
                    }
                    return formattedValues;
                }
                else {
                    return _.toObject(value, callback);
                }
            }
            else {
                return DataTypes.format(value, spec.unit);
            }
        }

        function label(key, spec = null) {
            if (!_.isObject(spec)) {
                spec = stacFields.metadata[key] || {};
            }
            if (_.isObject(spec) && typeof spec.label === 'string') {
                if (typeof spec.explain === 'string') {
                    return `<abbr title="${_.e(spec.explain)}">${spec.label}</abbr>`;
                }
                else if (typeof spec.label === 'string') {
                    return spec.label;
                }
            }
            return _.formatKey(key);
        }

        function extension(key) {
            return label(key, stacFields.extensions[key]);
        }

    }
})();