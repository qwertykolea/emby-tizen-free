define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/common/globalize.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/layoutmanager.js", "./../modules/common/usersettings/usersettings.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _basetab, _globalize, _connectionmanager, _approuter, _embyScroller, _embyItemscontainer, _layoutmanager, _usersettings, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function getRouteUrl(section, serverId) {
    return _approuter.default.getRouteUrl('list', {
      serverId: serverId,
      itemTypes: section.QueryOptions.IncludeItemTypes,
      isFavorite: true
    });
  }
  function FavoritesTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.currentApiClient();
  }
  Object.assign(FavoritesTab.prototype, _basetab.default.prototype);
  Object.assign(FavoritesTab.prototype, _sectionscontroller.default.prototype);
  FavoritesTab.prototype.fetchSections = function () {
    var instance = this;
    var sections = [];
    var monitor = ['markfavorite'];
    var enableFocusPreview = instance.enableFocusPreview();
    var apiClient = instance.getApiClient();
    var serverId = apiClient.serverId();
    var viewScrollX = instance.scrollDirection() === 'x';
    sections.push({
      Id: 'TvChannel',
      Name: _globalize.default.translate('HeaderFavoriteChannels'),
      CollectionType: 'livetv',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'CurrentProgramParentName', 'CurrentProgramTime'],
        defaultBackground: true,
        preferThumb: 'auto',
        programIndicators: !enableFocusPreview
      },
      QueryOptions: {
        IncludeItemTypes: "TvChannel",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Series',
      Name: _globalize.default.translate('HeaderFavoriteShows'),
      CollectionType: 'tvshows',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: "Series",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Episodes',
      Name: _globalize.default.translate('HeaderFavoriteEpisodes'),
      CollectionType: 'tvshows',
      Monitor: monitor,
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name']
      },
      QueryOptions: {
        IncludeItemTypes: "Episode",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Movies',
      Name: _globalize.default.translate('HeaderFavoriteMovies'),
      CollectionType: 'movies',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: "Movie",
        Recursive: true
      }
    });
    sections.push({
      Id: 'MusicVideo',
      Name: _globalize.default.translate('HeaderFavoriteMusicVideos'),
      CollectionType: 'musicvideos',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'ParentName']
      },
      QueryOptions: {
        IncludeItemTypes: "MusicVideo",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Video',
      Name: _globalize.default.translate('HeaderFavoriteVideos'),
      Monitor: monitor,
      ListOptions: {
        preferThumb: true,
        fields: enableFocusPreview ? [] : ['Name']
      },
      QueryOptions: {
        IncludeItemTypes: "Video",
        Recursive: true
      }
    });
    sections.push({
      Id: 'BoxSet',
      Name: _globalize.default.translate('HeaderFavoriteCollections'),
      CollectionType: 'boxsets',
      Monitor: monitor,
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name']
      },
      QueryOptions: {
        IncludeItemTypes: "BoxSet",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Playlist',
      Name: _globalize.default.translate('HeaderFavoritePlaylists'),
      CollectionType: 'playlists',
      Monitor: monitor,
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['Name']
      },
      QueryOptions: {
        IncludeItemTypes: "Playlist",
        Recursive: true
      }
    });
    sections.push({
      Id: 'MusicArtist',
      Name: _globalize.default.translate('HeaderFavoriteArtists'),
      CollectionType: 'music',
      SectionType: 'artists',
      Monitor: monitor,
      CardSizeOffset: viewScrollX ? null : -1,
      ListOptions: {
        round: true,
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['Name']
      },
      QueryOptions: {
        CollectionTypes: 'music',
        Recursive: true
      },
      Href: _approuter.default.getRouteUrl('list', {
        serverId: serverId,
        itemTypes: 'MusicArtist',
        isFavorite: true
      })
    });
    sections.push({
      Id: 'MusicAlbum',
      Name: _globalize.default.translate('HeaderFavoriteAlbums'),
      CollectionType: 'music',
      Monitor: monitor,
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['Name', 'ParentName']
      },
      QueryOptions: {
        IncludeItemTypes: "MusicAlbum",
        CollectionTypes: 'music',
        Recursive: true
      }
    });
    sections.push({
      Id: 'Audio',
      Name: _globalize.default.translate('HeaderFavoriteSongs'),
      CollectionType: 'music',
      Monitor: monitor,
      ViewType: _layoutmanager.default.tv ? null : 'list',
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name'],
        centerText: false,
        action: 'playallfromhere'
      },
      QueryOptions: {
        IncludeItemTypes: "Audio",
        CollectionTypes: 'music',
        Recursive: true
      }
    });
    if (apiClient.isMinServerVersion('4.9.0.41')) {
      sections.push({
        Id: 'Authors',
        Name: _globalize.default.translate('HeaderFavoriteAuthors'),
        CollectionType: 'audiobooks',
        SectionType: 'artists',
        Monitor: monitor,
        CardSizeOffset: viewScrollX ? null : -1,
        ListOptions: {
          round: true,
          preferThumb: false,
          fields: enableFocusPreview ? [] : ['Name']
        },
        QueryOptions: {
          CollectionTypes: 'audiobooks',
          Recursive: true
        },
        Href: _approuter.default.getRouteUrl('list', {
          serverId: serverId,
          itemTypes: 'MusicArtist',
          isFavorite: true
        })
      });
      sections.push({
        Id: 'AudioBooks',
        Name: _globalize.default.translate('HeaderFavoriteAudioBooks'),
        CollectionType: 'audiobooks',
        Monitor: monitor,
        ListOptions: {
          preferThumb: false,
          fields: enableFocusPreview ? [] : ['Name', 'ParentName']
        },
        QueryOptions: {
          IncludeItemTypes: "MusicAlbum",
          CollectionTypes: 'audiobooks',
          Recursive: true
        }
      });
    }
    sections.push({
      Id: 'Photo',
      Name: _globalize.default.translate('HeaderFavoritePhotos'),
      CollectionType: 'homevideos',
      Monitor: monitor,
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: "Photo",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Game',
      Name: _globalize.default.translate('HeaderFavoriteGames'),
      CollectionType: 'games',
      Monitor: monitor,
      ListOptions: {
        preferThumb: false,
        fields: enableFocusPreview ? [] : ['Name', 'ParentName', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: "Game",
        Recursive: true
      }
    });
    sections.push({
      Id: 'Person',
      Name: _globalize.default.translate('HeaderFavoritePeople'),
      Monitor: monitor,
      SectionType: 'people',
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name']
      },
      QueryOptions: {
        Recursive: true
      },
      Href: _approuter.default.getRouteUrl('list', {
        serverId: serverId,
        itemTypes: 'Person',
        isFavorite: true
      })
    });
    var clickTitles = !enableFocusPreview;
    for (var i = 0, length = sections.length; i < length; i++) {
      var section = sections[i];
      if (clickTitles) {
        if (!section.Href) {
          section.Href = getRouteUrl(section, apiClient.serverId());
        }
      }
      section.QueryOptions.Filters = 'IsFavorite';
    }
    return Promise.resolve(sections);
  };
  FavoritesTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && _usersettings.default.enableHomescreenFocusPreviews() && this.scrollDirection() === 'y';
  };
  FavoritesTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  FavoritesTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  FavoritesTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
    this.apiClient = null;
  };
  var _default = _exports.default = FavoritesTab;
});
