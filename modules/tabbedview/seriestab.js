define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function SeriesTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(SeriesTab.prototype, _itemstab.default.prototype);
  SeriesTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-series';
  };
  SeriesTab.prototype.getItemTypes = function () {
    return ['Series'];
  };
  SeriesTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = SeriesTab;
});
