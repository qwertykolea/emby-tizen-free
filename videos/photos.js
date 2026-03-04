define(["exports", "./../modules/tabbedview/itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function PhotosTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(PhotosTab.prototype, _itemstab.default.prototype);
  PhotosTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-' + 'photos';
  };
  PhotosTab.prototype.getItemTypes = function () {
    return ['Photo'];
  };
  PhotosTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = PhotosTab;
});
