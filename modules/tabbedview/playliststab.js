define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function PlaylistsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(PlaylistsTab.prototype, _itemstab.default.prototype);
  PlaylistsTab.prototype.getItemTypes = function () {
    return ['Playlist'];
  };
  PlaylistsTab.prototype.getSettingsKey = function () {
    return _itemstab.default.prototype.getSettingsKey.call(this) + '-playlists';
  };
  PlaylistsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = PlaylistsTab;
});
