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
        .controller('LinksBrowserComponent', ['$window', 'rocketServices', LinksBrowserComponent]);

    function LinksBrowserComponent($window, rocketServices) {

        var self = this;

        /**
         * Copy to clipboard
         * 
         * @param {string} str
         */
         self.copyToClipboard = function (str) {

            if (str.startsWith('data:')) {
                rocketServices.copyToClipboard(atob(str.split(',')[1]));
                rocketServices.success('code.clipboard');
            }
            else {
                rocketServices.copyToClipboard(str);
                rocketServices.success('url.clipboard');
            }
        };

        /**
		 * Open external link
		 * 
		 * @param {string} url
		 */
		self.openExternalLink = function (url) {
			if (url) {
				$window.open(url, '_blank');
			}
		};

    }

    /**
     * Component definition
     */
    angular.module('rocket')
        .component('linksBrowser', {
            templateUrl: 'app/components/linksBrowser/linksBrowser.html',
            bindings: {

                /*
                 * Input feature
                 * Note: used for product page (see FeatureController.js)
                 */
                links: '<',
                
            },
            controller: 'LinksBrowserComponent'
        });

})();