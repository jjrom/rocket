/* 
 * rocket Map
 * 
 * Copyright (C) 2015 Jérôme Gasperi <jerome.gasperi@gmail.com>
 *
 * This file is subject to the terms and conditions defined in
 * file LICENSE, which is part of this source code package.
 * 
 */
/**
 * rocketmap Generic button
 * 
 * @param {Object} window
 */
(function (window) {

    window.rocketmap = window.rocketmap || {};

    window.rocketmap.Drag = (function (PointerInteraction) {

        function Drag(options) {

            PointerInteraction.call(this, {
                handleDownEvent: handleDownEvent,
                handleDragEvent: handleDragEvent,
                // Disabled because handle in rocketMap
                //handleMoveEvent: handleMoveEvent,
                handleUpEvent: handleUpEvent,
            });

            /**
             * @type {import("../src/ol/coordinate.js").Coordinate}
             * @private
             */
            this.coordinate_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.cursor_ = 'pointer';

            /**
             * @type {Feature}
             * @private
             */
            this.feature_ = null;

            /**
             * @type {string|undefined}
             * @private
             */
            this.previousCursor_ = undefined;

            /**
             * @type {function|undefined}
             * @private
             */
            this.callback_ = options.callback;
            
        }

        if (PointerInteraction) Drag.__proto__ = PointerInteraction;
        Drag.prototype = Object.create(PointerInteraction && PointerInteraction.prototype);
        Drag.prototype.constructor = Drag;

        return Drag;
    }(window.ol.interaction.Pointer));

    /**
     * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    function handleDownEvent(evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            return isMovable(layer) ? feature : null;
        });

        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;

            if (typeof this.callback_ === 'function') {
                this.callback_('dragfeaturestart', {
                    coordinate:this.coordinate_,
                    feature: this.feature_
                });
            }

        }

        return !!feature;
    }

    /**
     * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
     */
    function handleDragEvent(evt) {
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = this.feature_.getGeometry();
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];

        if (typeof this.callback_ === 'function') {
            this.callback_('dragfeature', {
                coordinate:this.coordinate_,
                feature: this.feature_
            });
        }
    }

    /**
     * @param {import("../src/ol/MapBrowserEvent.js").default} evt Event.
     *
    function handleMoveEvent(evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                return isMovable(layer) ? feature : null;
            });
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
        }
    }*/

    /**
     * @return {boolean} `false` to stop the drag sequence.
     */
    function handleUpEvent() {
    
        if (typeof this.callback_ === 'function') {
            this.callback_('dragfeaturestop', {
                coordinate:this.coordinate_,
                feature: this.feature_
            });
        }

        this.coordinate_ = null;
        this.feature_ = null;

        return false;
    }

    /**
     * Return true if layer is movable
     * 
     * @param {Layer} layer 
     * @returns 
     */
    function isMovable (layer) {
        return layer && layer.get('_rocket') && layer.get('_rocket').isMovable;
    }


})(window);

