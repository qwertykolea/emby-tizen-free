define(["exports"], function (_exports) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BaseWidget(view, params) {
    this.view = view;
    this.params = params;
  }
  BaseWidget.prototype.onBeginResume = function (options) {
    this.paused = false;
  };
  BaseWidget.prototype.onResume = function (options) {
    this.paused = false;
  };
  BaseWidget.prototype.onPause = function () {
    this.paused = true;
  };
  BaseWidget.prototype.destroy = function () {
    this.paused = null;
    this.view = null;
    this.params = null;
  };
  var _default = _exports.default = BaseWidget;
});
