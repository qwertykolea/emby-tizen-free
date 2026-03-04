define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _tabbedview, _globalize, _embyItemscontainer, _embyButton, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getDefaultSubviews() {
    return ['albums', 'albumartists', 'artists', 'playlists', 'songs', 'genres', 'folders'];
  }
  function getTabs() {
    var subviews = this.item.Subviews || getDefaultSubviews();
    var collectionType = this.item.CollectionType;
    return [{
      name: _globalize.default.translate('Suggestions'),
      id: 'suggestions'
    }, {
      name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderAudioBooks') : _globalize.default.translate('Albums'),
      id: 'albums',
      enabled: subviews.includes('albums')
    }, {
      name: _globalize.default.translate('HeaderAlbumArtists'),
      id: 'albumartists',
      enabled: collectionType !== 'audiobooks'
    }, {
      name: collectionType === 'audiobooks' ? _globalize.default.translate('Authors') : _globalize.default.translate('Artists'),
      id: 'artists',
      enabled: subviews.includes('artists')
    }, {
      name: _globalize.default.translate('Composers'),
      id: 'composers',
      enabled: collectionType !== 'audiobooks'
    }, {
      name: _globalize.default.translate('Playlists'),
      id: 'playlists',
      enabled: subviews.includes('playlists')
    }, {
      name: _globalize.default.translate('Genres'),
      id: 'genres',
      enabled: subviews.includes('genres')
    }, {
      name: _globalize.default.translate('Songs'),
      id: 'songs',
      enabled: collectionType !== 'audiobooks'
    }, {
      name: _globalize.default.translate('Tags'),
      id: 'tags',
      enabled: subviews.includes('tags')
    }, {
      name: _globalize.default.translate('Folders'),
      id: 'folders'
    }];
  }
  function MusicView(view, params) {
    _tabbedview.default.apply(this, arguments);
  }
  Object.assign(MusicView.prototype, _tabbedview.default.prototype);
  MusicView.prototype.getTabs = getTabs;
  MusicView.prototype.loadTabController = function (id) {
    switch (id) {
      case 'suggestions':
        return Emby.importModule('./music/suggestions.js');
      case 'albums':
        return Emby.importModule('./music/albums.js');
      case 'albumartists':
      case 'artists':
      case 'composers':
        return Emby.importModule('./modules/tabbedview/artiststab.js');
      case 'playlists':
        return Emby.importModule('./modules/tabbedview/playliststab.js');
      case 'genres':
        return Emby.importModule('./modules/tabbedview/genrestab.js');
      case 'songs':
        return Emby.importModule('./music/songs.js');
      case 'tags':
        return Emby.importModule('./modules/tabbedview/tagstab.js');
      case 'folders':
        return Emby.importModule('./modules/tabbedview/folderstab.js');
      default:
        throw new Error('tab not found: ' + id);
    }
  };
  MusicView.prototype.getAutoBackdropItemTypes = function () {
    return ['MusicAlbum'];
  };
  MusicView.prototype.supportsHorizontalTabScroll = function () {
    return true;
  };
  MusicView.prototype.getTabControllerOptions = function (id) {
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    if (id === 'genres') {
      // match the list screen once they click a genre
      options.queryIncludeItemTypes = ['MusicAlbum'];
    }
    return options;
  };
  var _default = _exports.default = MusicView;
});
