define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/common/globalize.js", "./../modules/layoutmanager.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/tabbedview/sectionscontroller.js", "./../modules/approuter.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/common/itemmanager/itemmanager.js"], function (_exports, _basetab, _globalize, _layoutmanager, _embyItemscontainer, _embyScroller, _embyButton, _sectionscontroller, _approuter, _connectionmanager, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function MusicSuggestionsTab(view, params, options) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
  }
  Object.assign(MusicSuggestionsTab.prototype, _basetab.default.prototype);
  Object.assign(MusicSuggestionsTab.prototype, _sectionscontroller.default.prototype);
  function enableWrappedListView() {
    if (_layoutmanager.default.tv) {
      return false;
    }
    return false;
  }
  MusicSuggestionsTab.prototype.onItemCustomAction = function (options) {
    var _item$Id;
    var item = options.item;
    if ((_item$Id = item.Id) != null && _item$Id.startsWith('music_')) {
      var apiClient = _connectionmanager.default.getApiClient(item);
      var url = '/music?serverId=' + apiClient.serverId() + '&parentId=' + item.ParentId;
      var idParts = item.Id.split('_');
      if (idParts.length > 1) {
        url += '&tab=' + idParts[1];
      }
      _approuter.default.show(url);
    }
    return _sectionscontroller.default.prototype.onItemCustomAction.apply(this, arguments);
  };
  function getCategoryItems(instance) {
    var _instance$options;
    var apiClient = instance.getApiClient();
    var parentId = instance.params.parentId;
    var items = [];
    var collectionType = (_instance$options = instance.options) == null || (_instance$options = _instance$options.item) == null ? void 0 : _instance$options.CollectionType;
    items.push({
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderAudioBooks') : _globalize.default.translate('Albums'),
      Id: 'music_albums',
      ServerId: apiClient.serverId(),
      ParentId: parentId,
      Icon: _itemmanager.default.getDefaultIcon({
        Type: 'MusicAlbum'
      }),
      // for focus handler to ignore
      Type: 'AppCategory',
      IsFolder: true
    });
    if (collectionType === 'audiobooks') {
      items.push({
        Name: _globalize.default.translate('Authors'),
        Id: 'music_artists',
        ServerId: apiClient.serverId(),
        ParentId: parentId,
        Icon: _itemmanager.default.getDefaultIcon({
          Type: 'MusicArtist'
        }),
        // for focus handler to ignore
        Type: 'AppCategory',
        IsFolder: true
      });
    } else {
      items.push({
        Name: _globalize.default.translate('Artists'),
        Id: 'music_albumartists',
        ServerId: apiClient.serverId(),
        ParentId: parentId,
        Icon: _itemmanager.default.getDefaultIcon({
          Type: 'MusicArtist'
        }),
        // for focus handler to ignore
        Type: 'AppCategory',
        IsFolder: true
      });
    }
    items.push({
      Name: _globalize.default.translate('Genres'),
      Id: 'music_genres',
      ServerId: apiClient.serverId(),
      ParentId: parentId,
      Icon: _itemmanager.default.getDefaultIcon({
        Type: 'MusicGenre'
      }),
      // for focus handler to ignore
      Type: 'AppCategory',
      IsFolder: true
    });
    return Promise.resolve({
      Items: items,
      TotalRecordCount: items.length
    });
  }
  MusicSuggestionsTab.prototype.fetchSections = function () {
    var sections = [];
    var collectionType = this.options.item.CollectionType;
    var viewScrollX = this.scrollDirection() === 'x';
    var enableFocusPreview = this.enableFocusPreview();
    var wrappedList = enableWrappedListView();
    var params = this.params;
    var parentId = params.parentId;
    var serverId = this.serverId();
    if (viewScrollX && this.options.addCategories) {
      sections.push({
        Id: 'Categories',
        Name: ' ',
        CollectionType: 'music',
        Monitor: [],
        ListOptions: {
          shape: 'square',
          multiSelect: false,
          contextMenu: false,
          overlayText: true,
          fields: ['Name'],
          action: 'custom'
        },
        QueryOptions: {
          EnableUserData: false
        },
        CommandOptions: {},
        Items: getCategoryItems(this)
      });
    }
    var wrappedListOptions = {
      action: 'playallfromhere',
      verticalWrap: true,
      mediaInfo: false,
      enableSideMediaInfo: false,
      enableUserDataButtons: false,
      fields: enableFocusPreview ? [] : ['Name', 'ParentName']
    };
    if (collectionType === 'audiobooks') {
      sections.push({
        Id: 'Resume',
        Name: _globalize.default.translate('HeaderContinueListening'),
        CollectionType: collectionType,
        Monitor: ['audioplayback', 'markplayed'],
        SectionType: 'resumeaudio',
        ListOptions: {
          preferThumb: 'auto',
          shape: 'auto',
          fields: enableFocusPreview ? [] : ['Name', 'Album', 'ParentName'],
          showDetailsMenu: true,
          context: 'home',
          cardLayout: false,
          albumFirst: true,
          focusTransformTitleAdjust: true,
          animateProgressBar: true
        },
        QueryOptions: {
          ParentId: parentId,
          Recursive: true
        },
        CommandOptions: {
          removeFromResume: true
        }
      });
    }
    sections.push({
      Id: 'Latest',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderLatestAudioBooks') : _globalize.default.translate('HeaderLatestMusic'),
      CollectionType: collectionType,
      Monitor: ['audioplayback', 'markplayed'],
      SectionType: 'latestmedia',
      ListOptions: {
        shape: 'autooverflow',
        fields: enableFocusPreview ? [] : ['Name', 'ParentName'],
        cardLayout: true,
        vibrant: true
      },
      QueryOptions: {
        ParentId: parentId,
        Recursive: true
      }
    });
    sections.push({
      Id: 'RecentlyPlayed',
      Name: _globalize.default.translate('HeaderRecentlyPlayed'),
      CollectionType: collectionType,
      Monitor: ['audioplayback', 'markplayed'],
      ImmediateUpdate: false,
      ListOptions: wrappedList ? wrappedListOptions : {
        fields: enableFocusPreview ? [] : ['Name', 'ParentName'],
        action: 'playallfromhere',
        sideFooter: !viewScrollX,
        centerText: false,
        shape: 'autooverflow'
      },
      ViewType: wrappedList ? 'list' : null,
      QueryOptions: {
        SortBy: "DatePlayed",
        SortOrder: "Descending",
        IncludeItemTypes: "Audio",
        Recursive: true,
        Filters: "IsPlayed",
        ParentId: parentId
      },
      IndexOnStartItemId: true
    });
    sections.push({
      Id: 'FrequentlyPlayed',
      Name: _globalize.default.translate('HeaderFrequentlyPlayed'),
      CollectionType: collectionType,
      Monitor: ['audioplayback', 'markplayed'],
      ImmediateUpdate: false,
      ListOptions: wrappedList ? wrappedListOptions : {
        fields: enableFocusPreview ? [] : ['Name', 'ParentName'],
        action: 'playallfromhere',
        sideFooter: !viewScrollX,
        centerText: false,
        shape: 'autooverflow'
      },
      ViewType: wrappedList ? 'list' : null,
      QueryOptions: {
        SortBy: "PlayCount",
        SortOrder: "Descending",
        IncludeItemTypes: "Audio",
        Recursive: true,
        Filters: "IsPlayed",
        ParentId: parentId
      },
      IndexOnStartItemId: true
    });
    sections.push({
      Id: 'MusicArtist',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderFavoriteAuthors') : _globalize.default.translate('HeaderFavoriteArtists'),
      CollectionType: collectionType,
      SectionType: 'artists',
      Monitor: ['markfavorite'],
      ListOptions: {
        shape: 'autooverflow',
        fields: enableFocusPreview ? [] : ['Name'],
        round: true
      },
      QueryOptions: {
        SortBy: "SortName",
        SortOrder: "Ascending",
        Recursive: true,
        Filters: "IsFavorite",
        ParentId: parentId
      },
      CardSizeOffset: viewScrollX ? null : -1,
      Href: 'list/list.html?type=MusicArtist&IsFavorite=true' + '&serverId=' + serverId + '&parentId=' + params.parentId
    });
    sections.push({
      Id: 'MusicAlbum',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderFavoriteAudioBooks') : _globalize.default.translate('HeaderFavoriteAlbums'),
      CollectionType: collectionType,
      Monitor: ['markfavorite'],
      ListOptions: {
        shape: 'autooverflow',
        fields: enableFocusPreview ? [] : ['Name', 'ParentName']
      },
      QueryOptions: {
        SortBy: "SortName",
        SortOrder: "Ascending",
        IncludeItemTypes: "MusicAlbum",
        Recursive: true,
        Filters: "IsFavorite",
        ParentId: parentId
      },
      Href: 'list/list.html?type=MusicAlbum&IsFavorite=true' + '&serverId=' + serverId + '&parentId=' + params.parentId
    });
    sections.push({
      Id: 'Audio',
      Name: collectionType === 'audiobooks' ? _globalize.default.translate('HeaderFavoriteEpisodes') : _globalize.default.translate('HeaderFavoriteSongs'),
      CollectionType: collectionType,
      Monitor: ['markfavorite'],
      ImmediateUpdate: false,
      ListOptions: wrappedList ? wrappedListOptions : {
        fields: enableFocusPreview ? [] : ['Name', 'ParentName'],
        action: 'playallfromhere',
        sideFooter: !viewScrollX,
        centerText: false,
        shape: 'autooverflow'
      },
      ViewType: wrappedList ? 'list' : null,
      QueryOptions: {
        SortBy: "SortName",
        IncludeItemTypes: "Audio",
        Recursive: true,
        Filters: "IsFavorite",
        ParentId: parentId
      },
      Href: 'list/list.html?type=Audio&IsFavorite=true' + '&serverId=' + serverId + '&parentId=' + params.parentId
    });
    return Promise.resolve(sections);
  };
  MusicSuggestionsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  MusicSuggestionsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  MusicSuggestionsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = MusicSuggestionsTab;
});
