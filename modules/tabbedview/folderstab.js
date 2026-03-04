define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function FoldersTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(FoldersTab.prototype, _itemstab.default.prototype);
  FoldersTab.prototype.supportsAlphaPicker = function () {
    return true;
  };
  FoldersTab.prototype.isRecursiveQuery = function () {
    return false;
  };
  FoldersTab.prototype.getContext = function () {
    return 'folders';
  };
  FoldersTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-folders';
  };
  FoldersTab.prototype.getVisibleFilters = function () {
    return [];
  };
  FoldersTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = FoldersTab;
});
