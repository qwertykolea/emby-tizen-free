define(["exports", "./../modules/tabbedview/itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function SongsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(SongsTab.prototype, _itemstab.default.prototype);
  SongsTab.prototype.getContext = function () {
    return 'music';
  };
  SongsTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-songs';
  };
  SongsTab.prototype.getItemTypes = function () {
    return ['Audio'];
  };
  SongsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = SongsTab;
});
