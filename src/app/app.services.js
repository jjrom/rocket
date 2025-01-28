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
        .factory('rocketServices', ['$location', '$translate', '$state', '$timeout', 'growl', rocketServices]);

    function rocketServices($location, $translate, $state, $timeout, growl) {

        var countries = [
            "AD", "AF", "AG",
            "AI", "AL", "AN",
            "AO", "AQ", "AR", "AE",
            "AM", "AS", "AT", "AU", "AW", "AX", "AZ", "BA",
            "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
            "BR", "BS", "BT", "BV",
            "BW", "BY", "BZ", "CA", "CC",
            "CD", "CF", "CG",
            "CH", "CI", "CK",
            "CL", "CM", "CN", "CO", "CR", "CS",
            "CU", "CV", "CW", "CX", "CY", "CZ",
            "DE", "DJ", "DK", "DM", "DO",
            "DZ", "EC", "EE", "EG", "EH",
            "ER", "ES", "ET", "FI", "FJ", "FK",
            "FM", "FO", "FR", "GA", "GB",
            "GD", "GE", "GF",
            "GG", "GGY", "GH", "GI", "GL", "GM", "GN", "GP", "GQ",
            "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
            "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO",
            "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
            "PN", "PR", "PS", "PSX", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF",
            "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM",
            "US", "UY", "UZ", "VA", "VC",
            "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW"
        ];

        var keywordTypes = {
            physical: ['bay', 'channel', 'fjord', 'gulf', 'inlet', 'lagoon', 'ocean', 'reef', 'river', 'sea', 'sound', 'strait'],
            political: ['continent', 'country', 'region', 'state']
        };

        var api = {
            copyToClipboard: copyToClipboard,
            error: error,
            extractLocation: extractLocation,
            extractKVP: extractKVP,
            focus: focus,
            getLang: getLang,
            getLinks: getLinks,
            go: go,
            info: info,
            isMobileOrTablet: isMobileOrTablet,
            makeAbsoluteUrl: makeAbsoluteUrl,
            niceDate: niceDate,
            success: success,
            translate: translate,
            round: round,
            concatUrl: concatUrl,
            randomString: randomString,
            countries: countries,
            keywordTypes: keywordTypes,
            getNiceFeatureTitle: getNiceFeatureTitle
        };

        return api;

        ////////////

        /**
         * Copy to clipboard
         *
         * @param {string} str
         */
        function copyToClipboard(str) {

            /*
             * Old browsers
             * (from https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f)
             */
            if (!navigator.clipboard){
                const el = document.createElement('textarea');  // Create a <textarea> element
                el.value = str;                                 // Set its value to the string that you want copied
                el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
                el.style.position = 'absolute';
                el.style.left = '-9999px';                      // Move outside the screen to make it invisible
                document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
                const selected =
                    document.getSelection().rangeCount > 0        // Check if there is any content selected previously
                        ? document.getSelection().getRangeAt(0)     // Store selection if found
                        : false;                                    // Mark as false to know no selection existed before
                el.select();                                    // Select the <textarea> content
                document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events
                document.body.removeChild(el);                  // Remove the <textarea> element
                if (selected) {                                 // If a selection existed before copying
                    document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
                    document.getSelection().addRange(selected);   // Restore the original selection
                }
            }
            /*
             * Modern browsers
             */
            else {
                navigator.clipboard.writeText(str);
            }   

        };


        /**
         * Return links from rel
         * 
         * @param {string} rel
         * @returns {Object}
         */
        function getLinks(links, rel) {
            var relLinks = [];
            links = links || [];
            if (links) {
                for (var i = 0, ii = links.length; i < ii; i++) {
                    if (links[i].rel === rel) {
                        relLinks.push(links[i]);
                    };
                }
            }
            return relLinks;
        };

        /**
         * Generate a random string (default is 8 characters long)
         * 
         * @param {integer} length 
         */
        function randomString(length) {
            var result = '';
            var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            length = length || 8;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        /**
         * Return absolute href based on root if needed
         * (inspired from https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript)
         * 
         * @param {string} base 
         * @param {string} relative 
         */
        function makeAbsoluteUrl(base, relative) {

            // Input href is already absolute
            if (/^https?:\/\//i.test(relative)) {
                return relative;
            }

            var stack = base.split("/"),
                parts = relative.split("/");

            // Relative starts with "/" => take the hostname from base
            if (relative.indexOf('/') === 0) {
                return [stack[0],stack[2]].join('//') + relative;
            }
            
            // Remove current file name (or empty string)
            stack.pop(); 

            // (omit if "base" is the current folder without trailing slash)
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] == ".") {
                    continue;
                }
                if (parts[i] == "..") {
                    stack.pop();
                }
                else {
                    stack.push(parts[i]);
                }
            }

            return stack.join("/");
            
        }

        /*
         * Check if input device is a mobile or a tablet
         * (from http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser)
         */
        function isMobileOrTablet() {
            var check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        /**
         * (From https://github.com/jjrom/mapshup/blob/master/client/js/mapshup/lib/core/Util.js)
         * 
         * Extract Key/Value pair from an url like string
         * (e.g. &lon=123.5&lat=2.3&zoom=5)
         * 
         * @param {String} str
         * @param {boolean} lowerCasedKey
         * @param {boolean} removeNull
         */
        function extractKVP(str, lowerCasedKey, removeNull) {
            var c = {};
            str = str || "";
            str.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                if (value === undefined || value === "") {
                    if (!removeNull) {
                        c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = true;
                    }
                }
                else {
                    try {
                        value = decodeURIComponent(value);
                    }
                    catch (e) {
                        value = unescape(value);
                    }
                    c[decodeURIComponent(lowerCasedKey ? key.toLowerCase() : key)] = value;
                }
            });
            return c;
        }

        /**
         * Set focus on element id
         * Note: $timeout is used to be sure that focus is run
         * after other events
         * Note2: focus is not applied on mobile/tablet
         * 
         * @param {string} id
         */
        function focus(id) {
            if (isMobileOrTablet()) {
                return false;
            }
            $timeout(function () {
                var element = document.getElementById(id);
                if (element)
                    element.focus();
            });
            return true;
        };

        /**
         * Get application language
         */
        function getLang() {
            return translate('lang');
        };

        /**
         * Go to view
         * 
         * @param {string} name
         * @param {Object} params
         * @param {Object} options
         */
        function go(name, params, options) {

            params = params || {};
            options = options || {}

            /*
             * These parameters are set in all routes
             */
            var commonParameters = ['u', 'uk'];
            for (var i = commonParameters.length; i--;) {
                if ($location.search()[commonParameters[i]]) {
                    params[commonParameters[i]] = $location.search()[commonParameters[i]];
                }
            }

            // Open in new window
            if (options.target) {
                var url = $state.href(name, params);
                window.open(url, options.target);
            }
            else {
                $state.go(name, params, options);
            }


        };

        /**
         * Display info
         * 
         * @param {string} message
         * @param {array} options
         */
        function info(message, options) {
            growl.info(message, options);
        }

        /**
         * Display error
         * 
         * @param {string} message
         * @param {array} options
         */
        function error(message, options) {
            growl.error(message, options);
        }

        /**
         * Display success
         * 
         * @param {string} message
         * @param {array} options
         */
        function success(message, options) {
            growl.success(message, options);
        }

        /**
         * Replace {a:1}, {a:2}, etc within str by array values
         * 
         * @param {string} str (e.g. "My name is {a:1} {a:2}")
         * @param {array} values (e.g. ['Jérôme', 'Gasperi'])
         * 
         */
        function translate(str, values) {

            var i, l, out = $translate.instant(str);

            /*
             * Replace additional arguments
             */
            if (values && out.indexOf('{a:') !== -1) {
                for (i = 0, l = values.length; i < l; i++) {
                    out = out.replace('{a:' + (i + 1) + '}', values[i]);
                }
            }

            return out;
        }

        /**
         * Return a rounded value limited to exp decimal digits
         * 
         * @param {float} value
         * @param {integer} exp
         * @returns {Number}
         */
        function round(value, exp) {
            if (typeof exp === 'undefined' || +exp === 0)
                return Math.round(value);

            value = +value;
            exp = +exp;

            if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
                return NaN;

            // Shift
            value = value.toString().split('e');
            value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

            // Shift back
            value = value.toString().split('e');
            return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
        };

        /**
         * Return a nice date
         * 
         * @param {String} input
         * @param {Object} options
         * @returns {String}
         */
        function niceDate(input, options) {

            if (!input) {
                return translate('nicedate.undefined');
            }

            options = options || {};

            /*
             * Correct input
             */
            var _today = new Date(),
                _yesterday = new Date(_today.valueOf() - 1000 * 60 * 60 * 24),
                date = "";

            /*
             * Special case
             */
            if (input === 'now') {
                input = _today.toISOString();
            }

            var splitted = input.split('T'),
                ymd = splitted[0].split('-'),
                hms = options.withTime && splitted[1] ? ' - ' + splitted[1].substring(0, 8) : '',
                day = ymd[2];

            /*
             * English special case - convert to 1st, 2nd, etc.
             */
            if (getLang() === 'en') {
                if (day) {
                    if (day.charAt(0) === '0') {
                        day = day.substring(1);
                    }
                    if (day === '1' || day === '21' || day === '31') {
                        day = day + 'st';
                    }
                    else if (day === '2' || day === '22') {
                        day = day + 'nd';
                    }
                    else if (day === '3' || day === '23') {
                        day = day + 'rd';
                    }
                    else {
                        day = day + 'th';
                    }
                }
            }

            /*
             * Check if date is today or yesterday
             */

            if (options.translateSpecial && _today.getUTCFullYear() == ymd[0] && _today.getUTCMonth() + 1 == ymd[1] && _today.getUTCDate() == ymd[2]) {
                date = translate('Today');
            }
            else if (options.translateSpecial && _yesterday.getUTCFullYear() == ymd[0] && _yesterday.getUTCMonth() + 1 == ymd[1] && _yesterday.getUTCDate() == ymd[2]) {
                date = translate('Yesterday');
            }
            else {
                date = translate('nicedate', [ymd[0], translate('month:' + ymd[1]), day]);
            }
            return date + hms;
        };

        /**
         * Return a feature title
         * 
         * @param {Object} feature
         * @returns {String}
         */
        function getNiceFeatureTitle(feature) {

            var title = "";
            
            if ( !feature ) {
                return title;
            }
    
            if ( !feature.properties ) {
                title = feature.id;
            }
            else if (feature.properties.title) {
                title = feature.properties.title;
            }
            else if (feature.properties.productIdentifier) {
                title = feature.properties.productIdentifier;
            }
            else if (feature.properties.datetime) {
                title = rocketServices.niceDate(feature.properties.datetime);
            }
            else if (feature.properties.start_datetime) {
                title = rocketServices.niceDate(feature.properties.start_datetime) + ' - ' + rocketServices.niceDate(feature.properties.end_datetime);
            }
            return title;
    
        };
    
        /**
         * Extract human readable location from feature keywords
         * 
         * @param {Object} keywords
         * @returns {String}
         */
        function extractLocation(keywords) {

            if (!keywords) {
                return '';
            }

            var mainLocation,
                secondLocation;

            var percentage = 0;
            for (var keyword in keywords) {
                if (keywords[keyword]['type'] === 'country') {
                    if (keywords[keyword]['value'] && keywords[keyword]['value'] > percentage) {
                        mainLocation = keywords[keyword];
                        percentage = keywords[keyword]['value'];
                    }
                }
            }
            if (mainLocation) {
                percentage = 0;
                for (var keyword in keywords) {
                    if ((keywords[keyword]['type'] === 'region' || keywords[keyword]['type'] === 'state') && keywords[keyword]['parentId'] === mainLocation['id']) {
                        if (keywords[keyword]['value'] && keywords[keyword]['value'] > percentage) {
                            secondLocation = keywords[keyword];
                            percentage = keywords[keyword]['value'];
                        }
                    }
                }
            }
            else {
                percentage = 0;
                for (var keyword in keywords) {
                    if (keywordTypes.physical.indexOf(keywords[keyword]['type']) !== -1 && keywords[keyword]['value'] > percentage) {
                        mainLocation = keywords[keyword];
                        percentage = keywords[keyword]['value'];
                    }
                }
            }

            return (mainLocation ? mainLocation.name : '') + (secondLocation ? ' / ' + secondLocation.name : '');
        };

        /**
         * Ensure url concatenation without dual '//'
         * 
         * @param {string} root
         * @param {string} path
         */
        function concatUrl(root, path) {
            if (root[root.length - 1] === '/') {
                root = root.substring(0, root.length - 1);
            }
            return root + path;
        };

    }

})();