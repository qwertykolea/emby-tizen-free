define(["exports", "./../modules/tabbedview/itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function GamesTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(GamesTab.prototype, _itemstab.default.prototype);
  GamesTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  GamesTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-' + 'games';
  };
  GamesTab.prototype.getItemTypes = function () {
    return ['Game'];
  };
  var _default = _exports.default = GamesTab;
});
