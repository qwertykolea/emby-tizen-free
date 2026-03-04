define(["exports", "./baseview.js", "./basesettingscontainer.js"], function (_exports, _baseview, _basesettingscontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BaseSettingsView(view, params, options) {
    _basesettingscontainer.default.call(this, view);
    _baseview.default.apply(this, arguments);

    // used by wmc theme
    view.classList.add('settingsView');
    this.options = options;
  }
  Object.assign(BaseSettingsView.prototype, _basesettingscontainer.default.prototype);
  Object.assign(BaseSettingsView.prototype, _baseview.default.prototype);
  BaseSettingsView.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    this.settingsOnResume(options);
  };
  var _default = _exports.default = BaseSettingsView;
});
