define(["exports", "./../modules/tabbedview/itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function GameSystemsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(GameSystemsTab.prototype, _itemstab.default.prototype);
  GameSystemsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  GameSystemsTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-' + 'gamesystems';
  };
  GameSystemsTab.prototype.getItemTypes = function () {
    return ['GameSystem'];
  };
  var _default = _exports.default = GameSystemsTab;
});
