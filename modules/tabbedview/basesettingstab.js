define(["exports", "./basetab.js", "./../viewmanager/basesettingscontainer.js"], function (_exports, _basetab, _basesettingscontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function BaseSettingsView(view, params, options) {
    _basesettingscontainer.default.call(this, view);
    _basetab.default.apply(this, arguments);
    this.options = options;
  }
  Object.assign(BaseSettingsView.prototype, _basesettingscontainer.default.prototype);
  Object.assign(BaseSettingsView.prototype, _basetab.default.prototype);
  BaseSettingsView.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    this.settingsOnResume(options);
  };
  var _default = _exports.default = BaseSettingsView;
});
