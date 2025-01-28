/*!
 * angular-schema-form-bootstrap
 * @version 1.0.0-alpha.5
 * @date Fri, 26 Jan 2024 16:07:55 GMT
 * @link https://github.com/json-schema-form/angular-schema-form-bootstrap
 * @license MIT
 * Copyright (c) 2014-2024 JSON Schema Form
 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 23);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(21);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

var path = '/bootstrap/actions.html';
var html = "<div class=\"btn-group schema-form-actions {{::form.htmlClass + ' ' + idClass}}\">\n  <input ng-repeat-start=\"item in form.items\"\n         type=\"submit\"\n         class=\"btn {{ item.style || 'btn-default' }} {{::form.fieldHtmlClass}}\"\n         value=\"{{item.title}}\"\n         ng-if=\"item.type === 'submit'\">\n  <button ng-repeat-end\n          class=\"btn {{ item.style || 'btn-default' }} {{::form.fieldHtmlClass}}\"\n          type=\"button\"\n          ng-disabled=\"form.readonly\"\n          ng-if=\"item.type !== 'submit'\"\n          ng-click=\"buttonClick($event,item)\"><span ng-if=\"item.icon\" class=\"{{item.icon}}\"></span>{{item.title}}</button>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

var path = '/bootstrap/array.html';
var html = "<div  class=\"schema-form-array {{::form.htmlClass + ' ' + idClass}}\"\n      sf-field-model=\"sf-new-array\"\n      sf-new-array>\n  <label class=\"control-label\" ng-show=\"showTitle()\">{{ form.title }}</label>\n  <ol class=\"list-group\" sf-field-model ui-sortable=\"form.sortOptions\">\n    <li class=\"list-group-item {{::form.fieldHtmlClass}}\"\n        sf-field-model=\"ng-repeat\"\n        ng-repeat=\"item in $$value$$ track by $id(trackBy(item, $index))\">\n      <button ng-hide=\"form.readonly || form.remove === null\"\n              ng-click=\"deleteFromArray(item)\"\n              ng-disabled=\"form.schema.minItems >= modelArray.length\"\n              style=\"position: relative; z-index: 20;\"\n              type=\"button\" class=\"close pull-right\">\n              <span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span>\n      </button>\n      <div schema-form-array-items sf-key-controller sf-parent-key=\"[{{form.key.join('][')}}]\" sf-index=\"{{$index}}\"></div>\n    </li>\n  </ol>\n  <div class=\"clearfix\" style=\"padding: 15px;\" ng-model=\"modelArray\" schema-validate=\"form\">\n    <div class=\"help-block\"\n         ng-show=\"(hasError() && errorMessage(schemaError())) || form.description\"\n         ng-bind-html=\"(hasError() && errorMessage(schemaError())) || form.description\"></div>\n\n    <button ng-hide=\"form.readonly || form.add === null\"\n            ng-click=\"appendToArray()\"\n            ng-disabled=\"form.schema.maxItems <= modelArray.length\"\n            type=\"button\"\n            class=\"btn {{ form.style.add || 'btn-default' }} pull-right\">\n      <i class=\"glyphicon glyphicon-plus\"></i>\n      {{ form.add || 'Add'}}\n    </button>\n  </div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

var path = '/bootstrap/bbox.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' schema-form-' + form.type + ' ' + idClass}}\" ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\"\n    for=\"{{::fieldId(true, false)}}\">{{form.title}}\n  </label>\n  <input ng-show=\"::form.key\" type=\"{{::form.type}}\" step=\"any\" sf-changed=\"form\" placeholder=\"{{::form.placeholder}}\"\n    class=\"form-control {{::form.fieldHtmlClass}}\" id=\"{{::fieldId(true, false)}}\" sf-field-model\n    ng-disabled=\"form.readonly\" schema-validate=\"form\" name=\"{{::fieldId(true, false)}}\"\n    aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n  <button class=\"button {{ form.style || '' }}\" type=\"button\" ng-click=\"buttonClick($event, form)\">\n    {{ 'ok' | translate }}\n  </button>\n\n</div>";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

var path = '/bootstrap/checkbox.html';
var html = "<div class=\"checkbox schema-form-checkbox {{::form.htmlClass + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"{{::form.labelHtmlClass}}\">\n    <input type=\"checkbox\"\n           sf-changed=\"form\"\n           ng-disabled=\"form.readonly\"\n           sf-field-model\n           schema-validate=\"form\"\n           class=\"{{::form.fieldHtmlClass}}\"\n           name=\"{{::fieldId(true, false)}}\">\n    <span ng-bind-html=\"form.title\"></span>\n  </label>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

var path = '/bootstrap/checkboxes.html';
var html = "<div sf-field-model=\"sf-new-array\"\n     sf-new-array\n     class=\"form-group schema-form-checkboxes {{::form.htmlClass + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true &&  hasError(),\n       'has-success': form.disableSuccessState !== true &&  hasSuccess(),\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\"\n         sf-field-model\n         schema-validate=\"form\"\n         ng-show=\"showTitle()\">{{form.title}}</label>\n\n  <div class=\"checkbox\" ng-repeat=\"val in titleMapValues track by $index\" >\n    <label>\n      <input type=\"checkbox\"\n             ng-disabled=\"form.readonly\"\n             sf-changed=\"form\"\n             class=\"{{::form.fieldHtmlClass}}\"\n             ng-model=\"titleMapValues[$index]\"\n             name=\"{{::fieldId(true, false)}}\">\n      <span ng-bind-html=\"form.titleMap[$index].name\"></span>\n    </label>\n\n  </div>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

var path = '/bootstrap/default.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' schema-form-' + form.type + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\" for=\"{{::fieldId(true, false)}}\">{{form.title}}</label>\n\n  <input ng-if=\"!form.fieldAddonLeft && !form.fieldAddonRight\"\n         ng-show=\"::form.key\"\n         type=\"{{::form.type}}\"\n         step=\"any\"\n         sf-changed=\"form\"\n         placeholder=\"{{::form.placeholder}}\"\n         class=\"form-control {{::form.fieldHtmlClass}}\"\n         id=\"{{::fieldId(true, false)}}\"\n         sf-field-model\n         ng-disabled=\"form.readonly\"\n         schema-validate=\"form\"\n         name=\"{{::fieldId(true, false)}}\"\n         aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n  <div ng-if=\"form.fieldAddonLeft || form.fieldAddonRight\"\n       ng-class=\"{'input-group': (form.fieldAddonLeft || form.fieldAddonRight)}\">\n    <span ng-if=\"form.fieldAddonLeft\"\n          class=\"input-group-addon\"\n          ng-bind-html=\"form.fieldAddonLeft\"></span>\n    <input ng-show=\"::form.key\"\n           type=\"{{::form.type}}\"\n           step=\"any\"\n           sf-changed=\"form\"\n           placeholder=\"{{::form.placeholder}}\"\n           class=\"form-control {{::form.fieldHtmlClass}}\"\n           id=\"{{::fieldId(true, false)}}\"\n           sf-field-model\n           ng-disabled=\"form.readonly\"\n           schema-validate=\"form\"\n           name=\"{{::fieldId(true, false)}}\"\n           aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n    <span ng-if=\"form.fieldAddonRight\"\n          class=\"input-group-addon\"\n          ng-bind-html=\"form.fieldAddonRight\"></span>\n  </div>\n\n  <span ng-if=\"form.feedback !== false\"\n        class=\"form-control-feedback\"\n        ng-class=\"evalInScope(form.feedback) || {'glyphicon': true, 'glyphicon-ok': form.disableSuccessState !== true && hasSuccess(), 'glyphicon-remove': form.disableErrorState !== true && hasError() }\"\n        aria-hidden=\"true\"></span>\n\n  <span ng-if=\"hasError() || hasSuccess()\"\n        id=\"{{::fieldId(true, true) + '-status'}}\"\n        class=\"sr-only\">{{ hasSuccess() ? '(success)' : '(error)' }}</span>\n\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

var path = '/bootstrap/feature.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' schema-form-' + form.type + ' ' + idClass}}\" ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\"\n    for=\"{{::fieldId(true, false)}}\">{{form.title}}\n  </label>\n  <input ng-show=\"::form.key\" type=\"{{::form.type}}\" step=\"any\" sf-changed=\"form\" placeholder=\"{{::form.placeholder}}\"\n    class=\"form-control {{::form.fieldHtmlClass}}\" id=\"{{::fieldId(true, false)}}\" sf-field-model\n    ng-disabled=\"form.readonly\" schema-validate=\"form\" name=\"{{::fieldId(true, false)}}\"\n    aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n  <button class=\"button {{ form.style || '' }}\" type=\"button\" ng-click=\"buttonClick($event, form)\">\n    {{ 'ok' | translate }}\n  </button>\n\n</div>";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

var path = '/bootstrap/featurecollection.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' schema-form-' + form.type + ' ' + idClass}}\" ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\"\n    for=\"{{::fieldId(true, false)}}\">{{form.title}}\n  </label>\n  <input ng-show=\"::form.key\" type=\"{{::form.type}}\" step=\"any\" sf-changed=\"form\" placeholder=\"{{::form.placeholder}}\"\n    class=\"form-control {{::form.fieldHtmlClass}}\" id=\"{{::fieldId(true, false)}}\" sf-field-model\n    ng-disabled=\"form.readonly\" schema-validate=\"form\" name=\"{{::fieldId(true, false)}}\"\n    aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n  <button class=\"button {{ form.style || '' }}\" type=\"button\" ng-click=\"buttonClick($event, form)\">\n    {{ 'ok' | translate }}\n  </button>\n\n</div>";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

var path = '/bootstrap/fieldset.html';
var html = "<fieldset ng-disabled=\"form.readonly\" class=\"schema-form-fieldset {{::form.htmlClass + ' ' + idClass}}\">\n  <legend ng-class=\"{'sr-only': !showTitle() }\">{{ form.title }}</legend>\n  <div class=\"help-block\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></div>\n</fieldset>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

var path = '/bootstrap/geometry.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' schema-form-' + form.type + ' ' + idClass}}\" ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\"\n    for=\"{{::fieldId(true, false)}}\">{{form.title}}\n  </label>\n  <input ng-show=\"::form.key\" type=\"{{::form.type}}\" step=\"any\" sf-changed=\"form\" placeholder=\"{{::form.placeholder}}\"\n    class=\"form-control {{::form.fieldHtmlClass}}\" id=\"{{::fieldId(true, false)}}\" sf-field-model\n    ng-disabled=\"form.readonly\" schema-validate=\"form\" name=\"{{::fieldId(true, false)}}\"\n    aria-describedby=\"{{::fieldId(true, true) + '-status'}}\">\n\n  <button class=\"button {{ form.style || '' }}\" type=\"button\" ng-click=\"buttonClick($event, form)\">\n    {{ 'ok' | translate }}\n  </button>\n\n</div>";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

var path = '/bootstrap/help.html';
var html = "<div class=\"helpvalue schema-form-helpvalue {{::form.htmlClass + ' ' + idClass}}\" ng-bind-html=\"form.helpvalue\"></div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

var path = '/bootstrap/radio-buttons.html';
var html = "<div class=\"form-group schema-form-radiobuttons {{::form.htmlClass + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true &&  hasError(),\n       'has-success': form.disableSuccessState !== true &&  hasSuccess(),\n       'required': form.required === true\n     }\">\n  <div>\n    <label class=\"control-label {{::form.labelHtmlClass}}\" ng-show=\"showTitle()\">{{form.title}}</label>\n  </div>\n  <div class=\"btn-group\">\n    <label sf-field-model=\"replaceAll\" class=\"btn {{ (tm.value === $$value$$) ? form.style.selected || 'btn-default' : form.style.unselected || 'btn-default'; }}\"\n           ng-class=\"{ active: tm.value === $$value$$ }\"\n           ng-repeat=\"tm in form.titleMap\">\n      <input type=\"radio\"\n             class=\"{{::form.fieldHtmlClass}}\"\n             sf-changed=\"form\"\n             style=\"display: none;\"\n             ng-disabled=\"form.readonly\"\n             sf-field-model\n             schema-validate=\"form\"\n             ng-value=\"tm.value\"\n             name=\"{{::fieldId(true, false)}}\">\n      <span ng-bind-html=\"tm.name\"></span>\n    </label>\n  </div>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

var path = '/bootstrap/radios-inline.html';
var html = "<div class=\"form-group schema-form-radios-inline {{::form.htmlClass + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true &&  hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\"\n        ng-show=\"showTitle()\" sf-field-model\n        schema-validate=\"form\" >{{form.title}}</label>\n  <div>\n      <label class=\"radio-inline\" ng-repeat=\"tm in form.titleMap\" >\n      <input type=\"radio\"\n             class=\"{{::form.fieldHtmlClass}}\"\n             sf-changed=\"form\"\n             ng-disabled=\"form.readonly\"\n             sf-field-model\n             ng-value=\"tm.value\"\n             name=\"{{::fieldId(true, false)}}\">\n      <span ng-bind-html=\"tm.name\"></span>\n    </label>\n  </div>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

var path = '/bootstrap/radios.html';
var html = "<div class=\"form-group schema-form-radios {{::form.htmlClass + ' ' + idClass}}\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true &&  hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\"\n         sf-field-model schema-validate=\"form\"\n         ng-show=\"showTitle()\">{{form.title}}</label>\n  <div class=\"radio\" ng-repeat=\"tm in form.titleMap\">\n    <label>\n      <input type=\"radio\"\n             class=\"{{::form.fieldHtmlClass}}\"\n             sf-changed=\"form\"\n             ng-disabled=\"form.readonly\"\n             sf-field-model\n             ng-value=\"tm.value\"\n             name=\"{{::fieldId(true, false)}}\">\n      <span ng-bind-html=\"tm.name\"></span>\n    </label>\n  </div>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 15 */
/***/ (function(module, exports) {

var path = '/bootstrap/section.html';
var html = "<div class=\"schema-form-section {{::form.htmlClass + ' ' + idClass}}\" sf-key-controller sf-parent-key=\"[{{form.key.join('][')}}]\" sf-index=\"{{$index}}\"></div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 16 */
/***/ (function(module, exports) {

var path = '/bootstrap/select.html';
var html = "<div class=\"form-group {{::form.htmlClass + ' ' + idClass}} schema-form-select\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-show=\"showTitle()\" for=\"{{::fieldId(true, false)}}\">\n    {{form.title}}\n  </label>\n  <select sf-field-model\n          id=\"{{::fieldId(true, false)}}\"\n          ng-disabled=\"form.readonly\"\n          sf-changed=\"form\"\n          class=\"form-control {{::form.fieldHtmlClass}}\"\n          schema-validate=\"form\"\n          ng-options=\"item.value as item.name group by item.group for item in form.titleMap\"\n          name=\"{{::fieldId(true, false)}}\">\n  </select>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 17 */
/***/ (function(module, exports) {

var path = '/bootstrap/submit.html';
var html = "<div class=\"form-group schema-form-submit {{::form.htmlClass + ' ' + idClass}}\">\n  <input type=\"submit\"\n         class=\"btn {{ form.style || 'btn-primary' }} {{::form.fieldHtmlClass}}\"\n         value=\"{{form.title}}\"\n         ng-disabled=\"form.readonly\"\n         ng-if=\"form.type === 'submit'\">\n  <button class=\"btn {{ form.style || 'btn-default' }}\"\n          type=\"button\"\n          ng-click=\"buttonClick($event,form)\"\n          ng-disabled=\"form.readonly\"\n          ng-if=\"form.type !== 'submit'\">\n      <span ng-if=\"form.icon\" class=\"{{form.icon}}\"></span>\n      {{form.title}}\n  </button>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

var path = '/bootstrap/tabarray.html';
var html = "<div ng-init=\"selected = { tab: 0 }\"\n     ng-model=\"modelArray\" schema-validate=\"form\"\n     sf-field-model=\"sf-new-array\"\n     sf-new-array\n     class=\"clearfix schema-form-tabarray schema-form-tabarray-{{form.tabType || 'left'}} {{::form.htmlClass + ' ' + idClass}}\">\n  <div ng-if=\"!form.tabType || form.tabType !== 'right'\"\n       ng-class=\"{'col-xs-3': !form.tabType || form.tabType === 'left'}\">\n    <ol class=\"nav nav-tabs\"\n        ng-class=\"{ 'tabs-left': !form.tabType || form.tabType === 'left'}\"\n        sf-field-model ui-sortable=\"form.sortOptions\">\n      <li sf-field-model=\"ng-repeat\"\n          ng-repeat=\"item in $$value$$ track by $index\"\n          ng-click=\"$event.preventDefault() || (selected.tab = $index)\"\n          ng-class=\"{active: selected.tab === $index}\">\n          <a href=\"#\">{{interp(form.title,{'$index':$index, value: item}) || $index}}</a>\n      </li>\n      <li ng-hide=\"form.readonly || form.add === null\"\n          ng-disabled=\"form.schema.maxItems <= modelArray.length\"\n          ng-click=\"$event.preventDefault() || (selected.tab = appendToArray().length - 1)\">\n        <a href=\"#\">\n          <i class=\"glyphicon glyphicon-plus\"></i>\n          {{ form.add || 'Add'}}\n          </a>\n      </li>\n    </ol>\n  </div>\n\n  <div ng-class=\"{'col-xs-9': !form.tabType || form.tabType === 'left' || form.tabType === 'right'}\">\n    <div class=\"tab-content {{::form.fieldHtmlClass}}\">\n      <div class=\"tab-pane clearfix tab{{selected.tab}} index{{$index}}\"\n           sf-field-model=\"ng-repeat\"\n           ng-repeat=\"item in $$value$$ track by $index\"\n           ng-show=\"selected.tab === $index\"\n           ng-class=\"{active: selected.tab === $index}\">\n\n           <div schema-form-array-items sf-key-controller sf-parent-key=\"[{{form.key.join('][')}}]\" sf-index=\"{{$index}}\"></div>\n\n           <button ng-hide=\"form.readonly || form.remove === null\"\n                   ng-click=\"selected.tab = deleteFromArray($index).length - 1\"\n                   ng-disabled=\"form.schema.minItems >= modelArray.length\"\n                   type=\"button\"\n                   class=\"btn {{ form.style.remove || 'btn-default' }} pull-right\">\n             <i class=\"glyphicon glyphicon-trash\"></i>\n             {{ form.remove || 'Remove'}}\n           </button>\n      </div>\n      <div class=\"help-block\"\n           ng-show=\"(hasError() && errorMessage(schemaError())) || form.description\"\n           ng-bind-html=\"(hasError() && errorMessage(schemaError())) || form.description\"></div>\n      </div>\n    </div>\n  </div>\n\n  <div ng-if=\"form.tabType === 'right'\" class=\"col-xs-3\">\n    <ul class=\"nav nav-tabs tabs-right\">\n      <li  sf-field-model=\"ng-repeat\"\n          ng-repeat=\"item in $$value$$ track by $index\"\n          ng-click=\"$event.preventDefault() || (selected.tab = $index)\"\n          ng-class=\"{active: selected.tab === $index}\">\n          <a href=\"#\">{{interp(form.title,{'$index':$index, value: item}) || $index}}</a>\n      </li>\n      <li ng-hide=\"form.readonly || form.add === null\"\n          ng-disabled=\"form.schema.maxItems <= modelArray.length\"\n          ng-click=\"$event.preventDefault() || (selected.tab = appendToArray().length - 1)\">\n        <a href=\"#\">\n          <i class=\"glyphicon glyphicon-plus\"></i>\n          {{ form.add || 'Add'}}\n          </a>\n      </li>\n    </ul>\n  </div>\n\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 19 */
/***/ (function(module, exports) {

var path = '/bootstrap/tabs.html';
var html = "<div ng-init=\"selected = { tab: 0 }\" class=\"schema-form-tabs {{::form.htmlClass + ' ' + idClass}}\">\n  <ul class=\"nav nav-tabs\">\n    <li ng-repeat=\"tab in form.tabs\"\n        ng-disabled=\"form.readonly\"\n        ng-click=\"$event.preventDefault() || (selected.tab = $index)\"\n        ng-class=\"{active: selected.tab === $index}\">\n        <a href=\"#\">{{ tab.title }}</a>\n    </li>\n  </ul>\n\n  <div class=\"tab-content {{::form.fieldHtmlClass}}\">\n  </div>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 20 */
/***/ (function(module, exports) {

var path = '/bootstrap/textarea.html';
var html = "<div class=\"form-group has-feedback {{::form.htmlClass + ' ' + idClass}} schema-form-textarea\"\n     ng-class=\"{\n       'has-error': form.disableErrorState !== true && hasError(),\n       'has-success': form.disableSuccessState !== true && hasSuccess(),\n       'has-feedback': form.feedback !== false,\n       'required': form.required === true\n     }\">\n  <label class=\"control-label {{::form.labelHtmlClass}}\" ng-class=\"{'sr-only': !showTitle()}\" for=\"{{::fieldId(true, false)}}\">{{form.title}}</label>\n\n  <textarea ng-if=\"!form.fieldAddonLeft && !form.fieldAddonRight\"\n            class=\"form-control {{::form.fieldHtmlClass}}\"\n            id=\"{{::fieldId(true, false)}}\"\n            sf-changed=\"form\"\n            ng-attr-placeholder=\"{{::form.placeholder}}\"\n            ng-disabled=\"form.readonly\"\n            sf-field-model\n            schema-validate=\"form\"\n            name=\"{{::fieldId(true, false)}}\"></textarea>\n\n  <div ng-if=\"form.fieldAddonLeft || form.fieldAddonRight\"\n       ng-class=\"{'input-group': (form.fieldAddonLeft || form.fieldAddonRight)}\">\n    <span ng-if=\"form.fieldAddonLeft\"\n          class=\"input-group-addon\"\n          ng-bind-html=\"form.fieldAddonLeft\"></span>\n    <textarea class=\"form-control {{::form.fieldHtmlClass}}\"\n              id=\"{{::fieldId(true, false)}}\"\n              sf-changed=\"form\"\n              ng-attr-placeholder=\"{{::form.placeholder}}\"\n              ng-disabled=\"form.readonly\"\n              sf-field-model\n              schema-validate=\"form\"\n              name=\"{{::fieldId(true, false)}}\"></textarea>\n    <span ng-if=\"form.fieldAddonRight\"\n          class=\"input-group-addon\"\n          ng-bind-html=\"form.fieldAddonRight\"></span>\n  </div>\n\n  <span class=\"help-block\" sf-message=\"form.description\"></span>\n</div>\n";
window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
module.exports = path;

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bootstrap_actions_html__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__bootstrap_actions_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__bootstrap_actions_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__bootstrap_array_html__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__bootstrap_array_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__bootstrap_array_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__bootstrap_checkbox_html__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__bootstrap_checkbox_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__bootstrap_checkbox_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__bootstrap_checkboxes_html__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__bootstrap_checkboxes_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__bootstrap_checkboxes_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__bootstrap_fieldset_html__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__bootstrap_fieldset_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__bootstrap_fieldset_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__bootstrap_help_html__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__bootstrap_help_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6__bootstrap_help_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__bootstrap_radio_buttons_html__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__bootstrap_radio_buttons_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_7__bootstrap_radio_buttons_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__bootstrap_radios_html__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__bootstrap_radios_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8__bootstrap_radios_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__bootstrap_radios_inline_html__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__bootstrap_radios_inline_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_9__bootstrap_radios_inline_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__bootstrap_section_html__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__bootstrap_section_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_10__bootstrap_section_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__bootstrap_select_html__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__bootstrap_select_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_11__bootstrap_select_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__bootstrap_submit_html__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__bootstrap_submit_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_12__bootstrap_submit_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__bootstrap_tabarray_html__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__bootstrap_tabarray_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_13__bootstrap_tabarray_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__bootstrap_tabs_html__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__bootstrap_tabs_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_14__bootstrap_tabs_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__bootstrap_textarea_html__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__bootstrap_textarea_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_15__bootstrap_textarea_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__bootstrap_bbox_html__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__bootstrap_bbox_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_16__bootstrap_bbox_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__bootstrap_geometry_html__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__bootstrap_geometry_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_17__bootstrap_geometry_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__bootstrap_feature_html__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__bootstrap_feature_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_18__bootstrap_feature_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__bootstrap_featurecollection_html__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__bootstrap_featurecollection_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_19__bootstrap_featurecollection_html__);
// ngtemplate-loader embeds the html on build





















angular
  .module('schemaForm')
  .config(bootstrapDecoratorConfig);

bootstrapDecoratorConfig.$inject = [
  'schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfBuilderProvider', 'sfPathProvider', '$injector'
];

function bootstrapDecoratorConfig(
    schemaFormProvider, decoratorsProvider, sfBuilderProvider, sfPathProvider, $injector) {
  var base = 'decorators/bootstrap/';

  var simpleTransclusion  = sfBuilderProvider.builders.simpleTransclusion;
  var ngModelOptions      = sfBuilderProvider.builders.ngModelOptions;
  var ngModel             = sfBuilderProvider.builders.ngModel;
  var sfField             = sfBuilderProvider.builders.sfField;
  var condition           = sfBuilderProvider.builders.condition;
  var array               = sfBuilderProvider.builders.array;
  var numeric             = sfBuilderProvider.builders.numeric;

  // Tabs is so bootstrap specific that it stays here.
  var tabs = function(args) {
    if (args.form.tabs && args.form.tabs.length > 0) {
      var tabContent = args.fieldFrag.querySelector('.tab-content');

      args.form.tabs.forEach(function(tab, index) {
        var evalExpr = '(evalExpr(' + args.path + '.tabs[' + index + ']' +
                       '.condition, { model: model, "arrayIndex": $index}))';
        var div = document.createElement('div');
        div.className = 'tab-pane';
        div.setAttribute('ng-disabled', 'form.readonly');
        div.setAttribute('ng-show', 'selected.tab === ' + index);
        div.setAttribute('ng-class', '{active: selected.tab === ' + index + '}');
        if(!!tab.condition) {
          div.setAttribute('ng-if', evalExpr);
        };

        var childFrag = args.build(tab.items, args.path + '.tabs[' + index + '].items', args.state);
        div.appendChild(childFrag);
        tabContent.appendChild(div);
      });
    }
  };

  var selectPlaceholder = function(args) {
    if (args.form.placeholder) {
      var selectBox = args.fieldFrag.querySelector('select');
      var option = document.createElement('option');
      option.setAttribute('value', '');

      /* We only want the placeholder to show when we do not have a value on the model.
       * We make ngModel builder replace all so we can use $$value$$.
       */
      option.setAttribute('sf-field-model', 'replaceAll');

      /* https://github.com/angular/angular.js/issues/12190#issuecomment-115277040
       * angular > 1.4 does a emptyOption.attr('selected', true)
       * which does not like the ng-if comment.
       */
      if (angular.version.major === 1 && angular.version.minor < 4) {
        option.setAttribute('ng-if', '$$value$$ === undefined');
      } else {
        option.setAttribute('ng-show', '$$value$$ === undefined');
      }

      option.textContent = args.form.placeholder;

      selectBox.appendChild(option);
    }
  };

  var defaults = [sfField, ngModel, ngModelOptions, condition];
  decoratorsProvider.defineDecorator('bootstrapDecorator', {
    actions: {template: __WEBPACK_IMPORTED_MODULE_0__bootstrap_actions_html___default.a, builder: defaults},
    array: {template: __WEBPACK_IMPORTED_MODULE_1__bootstrap_array_html___default.a, builder: [ sfField, ngModelOptions, ngModel, array, condition ]},
    button: {template: __WEBPACK_IMPORTED_MODULE_12__bootstrap_submit_html___default.a, builder: defaults},
    checkbox: {template: __WEBPACK_IMPORTED_MODULE_2__bootstrap_checkbox_html___default.a, builder: defaults},
    checkboxes: {template: __WEBPACK_IMPORTED_MODULE_3__bootstrap_checkboxes_html___default.a, builder: [ sfField, ngModelOptions, ngModel, array, condition ]},
    conditional: {template: __WEBPACK_IMPORTED_MODULE_10__bootstrap_section_html___default.a, builder: [ sfField, simpleTransclusion, condition ]},
    'default': {template: __WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html___default.a, builder: defaults},
    fieldset: {template: __WEBPACK_IMPORTED_MODULE_5__bootstrap_fieldset_html___default.a, builder: [ sfField, simpleTransclusion, condition ]},
    help: {template: __WEBPACK_IMPORTED_MODULE_6__bootstrap_help_html___default.a, builder: defaults},
    number: {template: __WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html___default.a, builder: defaults.concat(numeric)},
    password: {template: __WEBPACK_IMPORTED_MODULE_4__bootstrap_default_html___default.a, builder: defaults},
    radios: {template: __WEBPACK_IMPORTED_MODULE_8__bootstrap_radios_html___default.a, builder: defaults},
    'radios-inline': {template: __WEBPACK_IMPORTED_MODULE_9__bootstrap_radios_inline_html___default.a, builder: defaults},
    radiobuttons: {template: __WEBPACK_IMPORTED_MODULE_7__bootstrap_radio_buttons_html___default.a, builder: defaults},
    section: {template: __WEBPACK_IMPORTED_MODULE_10__bootstrap_section_html___default.a, builder: [ sfField, simpleTransclusion, condition ]},
    select: {template: __WEBPACK_IMPORTED_MODULE_11__bootstrap_select_html___default.a, builder: [ selectPlaceholder ].concat(defaults)},
    submit: {template: __WEBPACK_IMPORTED_MODULE_12__bootstrap_submit_html___default.a, builder: defaults},
    tabarray: {template: __WEBPACK_IMPORTED_MODULE_13__bootstrap_tabarray_html___default.a, builder: [ sfField, ngModelOptions, ngModel, array, condition ]},
    tabs: {template: __WEBPACK_IMPORTED_MODULE_14__bootstrap_tabs_html___default.a, builder: [ sfField, ngModelOptions, tabs, condition ]},
    textarea: {template: __WEBPACK_IMPORTED_MODULE_15__bootstrap_textarea_html___default.a, builder: defaults},
    // Geo types
    bbox: {template: __WEBPACK_IMPORTED_MODULE_16__bootstrap_bbox_html___default.a, builder: defaults},
    geometry: {template: __WEBPACK_IMPORTED_MODULE_17__bootstrap_geometry_html___default.a, builder: defaults},
    feature: {template: __WEBPACK_IMPORTED_MODULE_18__bootstrap_feature_html___default.a, builder: defaults},
    featurecollection: {template: __WEBPACK_IMPORTED_MODULE_19__bootstrap_featurecollection_html___default.a, builder: defaults},
    
  }, []);
};


/***/ }),
/* 22 */,
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ })
/******/ ]);