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

        /*
         * Hide elements before everything is loaded
         * 
         * http://blogs.infinitesquare.com/b/seb/archives/pourquoi-il-ne-faut-pas-utiliser-ngcloak
         */
        .directive("deferredCloak", function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    attrs.$set("deferredCloak", undefined);
                    element.removeClass("deferred-cloak");
                }
            };
        })
        /*
         * Display a default image while loading image in background
         */
        .directive('bgImage', function () {
            return {
                link: function (scope, element, attr) {
                    attr.$observe('bgImage', function () {

                        var gradient = attr.gradient ? attr.gradient + ',' : '';
                        
                        // Non <img> case - display default image
                        if (attr.defaultImage) {
                            if (attr.bgType === 'img') {
                                element.attr('src', attr.defaultImage);
                            }
                            else {
                                element.css('background-image', gradient + 'url(' + attr.defaultImage + ')');
                            }
                        }

                        if (attr.bgImage) {
                            var image = new Image();
                            image.onload = function () {

                                // Non <img> case - use background-image CSS
                                if (attr.bgType === 'img') {
                                    element.attr('src', attr.bgImage);
                                }
                                // Non <img> case - use background-image CSS
                                else {
                                    element.css('background-image', gradient + 'url(' + attr.bgImage + ')');
                                }
                            };
                            image.onerror = function () {

                                // Non <img> case - image failed to load
                                if (attr.defaultImage) {
                                    if (attr.bgType === 'img') {
                                        element.attr('src', attr.defaultImage);
                                    }
                                    else {
                                        element.css('background-image', gradient + 'url(' + attr.defaultImage + ')');
                                    }
                                }
                            };
                            image.src = attr.bgImage;
                        }
                    });
                }
            };
        })
        .directive('slideable', function () {
            return {
                restrict: 'C',
                compile: function (element, attr) {
                    // wrap tag
                    var contents = element.html();
                    element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');

                    return function postLink(scope, element, attrs) {
                        // default properties
                        attrs.duration = (!attrs.duration) ? '0.5s' : attrs.duration;
                        attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
                        element.css({
                            'overflow': 'hidden',
                            'height': '0px',
                            'transitionProperty': 'height',
                            'transitionDuration': attrs.duration,
                            'transitionTimingFunction': attrs.easing
                        });
                    };
                }
            };
        })
        .directive('slideToggle', function () {
            return {
                restrict: 'A',
                scope: {
                    expandedClass: "@",
                    hiddenClass: "@"
                },
                link: function (scope, element, attrs) {
                    var target, content;

                    attrs.expanded = false;

                    element.on('click', function () {
                        if (!target) target = document.querySelector(attrs.slideToggle);
                        if (!content) content = target.querySelector('.slideable_content');

                        if (!attrs.expanded) {
                            content.style.border = '1px solid rgba(0,0,0,0)';
                            var y = content.clientHeight;
                            content.style.border = 0;
                            target.style.height = y + 'px';
                            if (scope.expandedClass && scope.hiddenClass) {
                                $('span', element).removeClass(scope.hiddenClass).addClass(scope.expandedClass);
                            }
                        }
                        else {
                            target.style.height = '0px';
                            if (scope.expandedClass && scope.hiddenClass) {
                                $('span', element).addClass(scope.hiddenClass).removeClass(scope.expandedClass);
                            }
                        }
                        attrs.expanded = !attrs.expanded;
                    });
                }
            };
        })
        .directive('eventFocus', function (focus) {
            return function (scope, elem, attr) {
                elem.on(attr.eventFocus, function () {
                    focus(attr.eventFocusId);
                });

                // Removes bound events in the element itself
                // when the scope is destroyed
                scope.$on('$destroy', function () {
                    elem.off(attr.eventFocus);
                });
            };
        })
        /* 
         * Animate on click
         */
        .directive('animateOnClick', ['$timeout', function ($timeout) {
            return {
                link: function (scope, element, attrs) {
                    element.on('click', function () {
                        element.addClass('animated ' + attrs.animation);
                        $timeout( function(){
                            element.removeClass('animated ' + attrs.animation);
                        }, 500);
                    });
                }
            };
        }])
        /*
         * Set focus on input field
         * (see https://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field)
         */
        .directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
            return {
                //scope: true,   // optionally create a child scope
                link: function (scope, element, attrs) {
                    var model = $parse(attrs.focusMe);
                    scope.$watch(model, function (value) {
                        if (value === true) {
                            $timeout(function () {
                                element[0].focus();
                            });
                        }
                    });
                }
            };
        }])
        /**
         * drop-on-me zone
         * 
         * [WARNING][IMPORTANT]
         *   - A *onDrop(obj)* function must be defined in target scope
         *   - (Optionnaly) A *onDragOver(boolean)* function could be defined in target scope
         */
        .directive('dropOnMe', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {

                    /*if (typeof scope.onDragOver !== 'function' || typeof scope.getDragOver !== 'function') {
                        return;
                    }*/

                    // [REMOVE] Flickering issue on chrome/edge on windows - cannot test
                    element.on('dragover', function (event) {
                        event.preventDefault();
                        /*if ( !scope.getDragOver() ) {
                            scope.onDragOver(true);
                        }*/
                    });
                    element.on('dragleave', function (event) {
                        event.preventDefault();
                        /*if ( scope.getDragOver() ) {
                            scope.onDragOver(false);
                        }*/
                    });
                    element.on('drop', function (event) {

                        event.preventDefault();

                        //scope.onDragOver(false);

                        if (event.originalEvent && event.originalEvent.dataTransfer && typeof scope.onDrop === 'function') {

                            // Case 1 - drop url
                            var url = event.originalEvent.dataTransfer.getData('text');
                            if (url) {
                                return scope.onDrop({ url: url });
                            }

                            // Case 2 - drop file
                            var files = [];
                            if (event.originalEvent.dataTransfer.items) {
                                // Use DataTransferItemList interface to access the file(s)
                                for (var i = 0; i < event.originalEvent.dataTransfer.items.length; i++) {
                                    // If dropped items aren't files, reject them
                                    if (event.originalEvent.dataTransfer.items[i].kind === 'file') {
                                        files.push(event.originalEvent.dataTransfer.items[i].getAsFile());
                                    }
                                }
                            }
                            else {
                                // Use DataTransfer interface to access the file(s)
                                for (var i = 0; i < event.originalEvent.dataTransfer.files.length; i++) {
                                    files.push(event.originalEvent.dataTransfer.files[i]);
                                }
                            }

                            return scope.onDrop({ files: files });

                        }

                    });
                }
            };
        })

        /*
         * Display loading element when an $http request is running
         * (except for GET connect and gazetteer requests) 
         */
        .directive('loading', ['$http', loadingFct]);

    function loadingFct($http) {
        return {
            restrict: 'A',
            link: function (scope, elm, attr) {
                scope.isLoading = function () {
                    var load = false;
                    for (var i = $http.pendingRequests.length; i--;) {
                        if ($http.pendingRequests[i]['method'] === 'GET' && ($http.pendingRequests[i]['url'].slice(-8) === '/connect' || $http.pendingRequests[i]['url'].indexOf('/gazetteer/') !== -1)) {
                            load = false;
                            continue;
                        }
                        load = true;
                    }
                    return load;
                };
                scope.$watch(scope.isLoading, function (v) {
                    if (v) {
                        elm.show();
                    }
                    else {
                        elm.hide();
                    }
                });
            }
        };
    };

})();