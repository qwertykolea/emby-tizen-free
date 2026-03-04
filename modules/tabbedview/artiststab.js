define(["exports", "./itemstab.js"], function (_exports, _itemstab) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function ArtistsTab(view, params, options) {
    _itemstab.default.apply(this, arguments);
  }
  Object.assign(ArtistsTab.prototype, _itemstab.default.prototype);
  ArtistsTab.prototype.getQueryIncludeItemTypes = function () {
    return [];
  };
  ArtistsTab.prototype.getApiClientQueryMethodName = function () {
    return this.options.mode === 'albumartists' ? 'getAlbumArtists' : 'getArtists';
  };
  ArtistsTab.prototype.getSettingsKey = function () {
    var suffix = '-' + (this.options.mode || 'artists');
    return _itemstab.default.prototype.getSettingsKey.call(this) + suffix;
  };
  ArtistsTab.prototype.getItemTypes = function () {
    return ['MusicArtist'];
  };
  ArtistsTab.prototype.getBaseQuery = function () {
    var query = _itemstab.default.prototype.getBaseQuery.apply(this, arguments);
    if (this.options.mode === 'albumartists') {
      query.ArtistType = 'AlbumArtist';
    } else if (this.options.mode === 'composers') {
      query.ArtistType = 'Composer';
    } else {
      query.ArtistType = 'Artist,AlbumArtist';
    }
    return query;
  };
  ArtistsTab.prototype.getPrefixesApiClientMethodName = function () {
    return 'getArtistPrefixes';
  };
  ArtistsTab.prototype.getPrefixQueryIncludeItemTypes = function () {
    return [];
  };
  ArtistsTab.prototype.loadTemplate = function () {
    return this.loadItemsTemplate();
  };
  var _default = _exports.default = ArtistsTab;
});
