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
 * RocketMap Progress bar 
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    /**
     * Renders a progress Bar
     */
    window.rocketmap.ProgressBar = function (el) {

        this.el = el;
        this.loading = 0;
        this.loaded = 0;

        /**
         * Increment the count of loading tiles.
         */
        this.addLoading = function () {
            if (this.loading === 0) {
                this.show();
            }
            ++this.loading;
            this.update();
        };


        /**
         * Increment the count of loaded tiles.
         */
        this.addLoaded = function () {
            var this_ = this;
            setTimeout(function () {
                ++this_.loaded;
                this_.update();
            }, 100);
        };


        /**
         * Update the progress bar.
         */
        this.update = function () {
            var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
            this.el.style.width = width;
            if (this.loading === this.loaded) {
                this.loading = 0;
                this.loaded = 0;
                var this_ = this;
                setTimeout(function () {
                    this_.hide();
                }, 500);
            }
        };


        /**
         * Show the progress bar.
         */
        this.show = function () {
            this.el.style.visibility = 'visible';
        };

        this.hide = function() {
            if (this.loading === this.loaded) {
                this.el.style.visibility = 'hidden';
                this.el.style.width = 0;
            }
        };

        return this;

    };

})(window);
