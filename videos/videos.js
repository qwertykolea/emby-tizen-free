define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js"], function (_exports, _tabbedview, _globalize, _embyItemscontainer, _embyButton, _embyScroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getVideosTab(item, subviews) {
    if (!item.CollectionType && subviews.includes('movies') && subviews.includes('series')) {
      return {
        name: _globalize.default.translate('MoviesAndShows'),
        id: 'moviesshows',
        enabled: true
      };
    }
    return {
      name: !item.CollectionType || item.CollectionType === 'movies' ? _globalize.default.translate('Movies') : _globalize.default.translate('Videos'),
      id: 'videos',
      enabled: subviews.includes('videos') || subviews.includes('movies')
    };
  }
  function getTabs() {
    var subviews = this.item.Subviews;
    return [{
      name: _globalize.default.translate('Shows'),
      id: 'series',
      enabled: subviews.includes('series') && !subviews.includes('movies')
    }, getVideosTab(this.item, subviews), {
      name: _globalize.default.translate('Suggestions'),
      id: 'suggestions',
      enabled: this.item.CollectionType === 'movies'
    }, {
      name: _globalize.default.translate('Trailers'),
      id: 'trailers',
      enabled: this.item.CollectionType === 'movies'
    }, {
      name: _globalize.default.translate('Photos'),
      id: 'photos',
      enabled: subviews.includes('photos')
    }, {
      name: _globalize.default.translate('HeaderAlbumArtists'),
      id: 'albumartists',
      enabled: subviews.includes('albumartists')
    }, {
      name: _globalize.default.translate('Artists'),
      id: 'artists',
      enabled: subviews.includes('artists')
    }, {
      name: _globalize.default.translate('Playlists'),
      id: 'playlists',
      enabled: subviews.includes('playlists')
    }, {
      name: _globalize.default.translate('Collections'),
      id: 'collections',
      enabled: subviews.includes('collections')
    }, {
      name: _globalize.default.translate('Genres'),
      id: 'genres',
      enabled: subviews.includes('genres')
    }, {
      name: _globalize.default.translate('Tags'),
      id: 'tags',
      enabled: subviews.includes('tags')
    }, {
      name: _globalize.default.translate('Favorites'),
      id: 'favorites',
      enabled: this.item.CollectionType === 'movies'
    }, {
      name: _globalize.default.translate('Folders'),
      id: 'folders'
    }];
  }
  function HomeVideosView(view, params) {
    _tabbedview.default.apply(this, arguments);
  }
  Object.assign(HomeVideosView.prototype, _tabbedview.default.prototype);
  HomeVideosView.prototype.getTabs = getTabs;
  HomeVideosView.prototype.getAutoBackdropItemTypes = function () {
    return ['Movie', 'Series', 'MusicVideo', 'Video'];
  };
  HomeVideosView.prototype.supportsHorizontalTabScroll = function () {
    return true;
  };
  HomeVideosView.prototype.loadTabController = function (id) {
    switch (id) {
      case 'suggestions':
        return Emby.importModule('./videos/moviesuggestions.js');
      case 'photos':
        return Emby.importModule('./videos/photos.js');
      case 'trailers':
        return Emby.importModule('./videos/trailers.js');
      case 'albumartists':
      case 'artists':
        return Emby.importModule('./modules/tabbedview/artiststab.js');
      case 'collections':
        return Emby.importModule('./modules/tabbedview/collectionstab.js');
      case 'playlists':
        return Emby.importModule('./modules/tabbedview/playliststab.js');
      case 'genres':
        return Emby.importModule('./modules/tabbedview/genrestab.js');
      case 'tags':
        return Emby.importModule('./modules/tabbedview/tagstab.js');
      case 'videos':
      case 'moviesshows':
        return Emby.importModule('./modules/tabbedview/videostab.js');
      case 'favorites':
        return Emby.importModule('./modules/tabbedview/videostab.js');
      case 'folders':
        return Emby.importModule('./modules/tabbedview/folderstab.js');
      case 'series':
        return Emby.importModule('./modules/tabbedview/seriestab.js');
      default:
        throw new Error('tab not found: ' + id);
    }
  };
  HomeVideosView.prototype.getDefaultTabId = function () {
    var item = this.item;
    if (!item.CollectionType) {
      return 'folders';
    }
    return null;
  };
  HomeVideosView.prototype.getTabControllerOptions = function (id) {
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    if (id === 'favorites') {
      if (this.item.CollectionType === 'movies') {
        options.itemType = 'Movie';
        options.enableAlphaPicker = true;
        options.mode = 'favorites';
      }
    } else if (id === 'genres') {
      // match the list screen once they click a genre
      if (this.item.CollectionType === 'movies') {
        options.queryIncludeItemTypes = ['Movie'];
      } else if (this.item.CollectionType === 'musicvideos') {
        options.queryIncludeItemTypes = ['MusicVideo'];
      } else if (this.item.CollectionType === 'homevideos') {
        options.queryIncludeItemTypes = ['Video', 'Photo'];
      }
    } else if (id === 'videos') {
      options.itemType = this.item.CollectionType === 'musicvideos' ? 'MusicVideo' : !this.item.CollectionType || this.item.CollectionType === 'movies' ? 'Movie' : 'Video';
      options.enableAlphaPicker = options.itemType !== 'Episode';
    } else if (id === 'moviesshows') {
      options.itemTypes = ['Movie', 'Series'];
      options.enableAlphaPicker = true;
    }
    return options;
  };
  var _default = _exports.default = HomeVideosView;
});
