define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/events.js", "./../modules/common/globalize.js", "./../modules/common/playback/playbackmanager.js", "./../modules/appheader/appheader.js", "./../modules/backdrop/backdrop.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/layoutmanager.js", "./../modules/common/usersettings/usersettings.js", "./../modules/viewmanager/baseview.js", "./../search/searchfields.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-tabs/emby-tabs.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/tabbedview/listcontroller.js"], function (_exports, _connectionmanager, _events, _globalize, _playbackmanager, _appheader, _backdrop, _itemmanager, _layoutmanager, _usersettings, _baseview, _searchfields, _embyScroller, _embyTabs, _embyItemscontainer, _listcontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function hideOrShowAll(elems, hide) {
    for (var i = 0, length = elems.length; i < length; i++) {
      if (hide) {
        elems[i].classList.add('hide');
      } else {
        elems[i].classList.remove('hide');
      }
    }
  }
  function onSearch(e, value) {
    var activeSearchTab = this.view.querySelector('.emby-searchable-tab-button.emby-tab-button-active');
    if (activeSearchTab) {
      activeSearchTab.classList.remove('emby-searchable-tab-button');
    }
    this.itemsContainer.refreshItems();
  }
  function ItemsView(view, params) {
    _baseview.default.apply(this, arguments);
    _listcontroller.default.apply(this, arguments);
    var self = this;
    self.params = params;
    if (this.supportsViewSettings == null) {
      this.supportsViewSettings = params.parentId !== 'downloads' && params.type !== 'search';
    }
    if (this.enableTotalRecordCountDisplay == null) {
      this.enableTotalRecordCountDisplay = params.type !== 'search';
    }
    this.initItemsContainer();
    if (params.parentId) {
      this.itemsContainer.setAttribute('data-parentid', params.parentId);
    } else if (params.type === 'nextup') {
      this.itemsContainer.setAttribute('data-monitor', 'videoplayback');
    } else if (params.type === 'Program' || params.type === 'OnNow' || params.type === 'TvChannel') {
      this.itemsContainer.setAttribute('data-refreshinterval', '300000');
    }
    if (params.type === 'search') {
      var _document$querySelect;
      var searchFieldsElem = view.querySelector('.searchContainer');
      searchFieldsElem.classList.remove('hide');
      var leftNavValue = _layoutmanager.default.tv ? null : (_document$querySelect = document.querySelector('.txtNavDrawerSearch ')) == null ? void 0 : _document$querySelect.value;
      var initialValue = params.query || leftNavValue;
      this.searchFields = new _searchfields.default({
        element: view.querySelector('.searchFields'),
        serverId: this.serverId(),
        value: initialValue,
        autoFocus: !initialValue
      });
      _events.default.on(this.searchFields, 'search', onSearch.bind(this));
    }
    this.initButtons();
  }
  Object.assign(ItemsView.prototype, _baseview.default.prototype);
  Object.assign(ItemsView.prototype, _listcontroller.default.prototype);
  ItemsView.prototype.getFocusContainerElement = function () {
    var _this$scroller;
    return ((_this$scroller = this.scroller) == null ? void 0 : _this$scroller.querySelector('.scrollSlider')) || _baseview.default.prototype.getFocusContainerElement.apply(this, arguments);
  };
  ItemsView.prototype.onInputCommand = function (e) {
    switch (e.detail.command) {
      case 'refresh':
        {
          this.itemsContainer.refreshItems();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      case 'search':
        if (this.searchFields) {
          var _e$detail$originalEve;
          if ((_e$detail$originalEve = e.detail.originalEvent) != null && _e$detail$originalEve.target.closest('.navDrawerSearchForm')) {
            var _e$detail$commandOpti;
            // keep the focus in the left nav bar
            this.searchFields.setSearchTerm(((_e$detail$commandOpti = e.detail.commandOptions) == null ? void 0 : _e$detail$commandOpti.value) || '');
          } else {
            console.log('focusing search fields');
            this.searchFields.focus();
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        break;
      default:
        break;
    }
    _baseview.default.prototype.onInputCommand.apply(this, arguments);
  };
  function dispatchItemShowEvent(view, eventName, item) {
    view.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        item: item
      },
      bubbles: true,
      cancelable: false
    }));
  }
  ItemsView.prototype.getTitle = function () {
    var params = this.params;
    if (params.type === 'search') {
      return _globalize.default.translate('Search');
    }
    if (params.parentId === 'downloads') {
      return _globalize.default.translate('Downloads');
    }
    if (params.type === 'Recordings') {
      return _globalize.default.translate('Recordings');
    }
    if (params.type === 'OnNow') {
      return _globalize.default.translate('HeaderOnNow');
    }
    if (params.type === 'Program') {
      if (params.IsMovie === 'true') {
        return _globalize.default.translate('Movies');
      } else if (params.IsSports === 'true') {
        return _globalize.default.translate('Sports');
      } else if (params.IsKids === 'true') {
        return _globalize.default.translate('HeaderForKids');
      } else if (params.IsAiring === 'true') {
        return _globalize.default.translate('HeaderOnNow');
      } else if (params.IsSeries === 'true') {
        if (params.IsNewOrPremiere) {
          return _globalize.default.translate('TitleNewEpisodes');
        }
        return _globalize.default.translate('Shows');
      } else if (params.IsNews === 'true') {
        return _globalize.default.translate('News');
      } else {
        return _globalize.default.translate('Program');
      }
    }
    if (params.type === 'nextup') {
      return _globalize.default.translate('HeaderNextUp');
    }
    var item = this.getParentItem();
    if (item) {
      return item;
    }
    if (params.type) {
      return _itemmanager.default.getPluralItemTypeName(params.type);
    }
  };
  ItemsView.prototype.fetchItem = function () {
    var params = this.params;
    if (params.type === 'Recordings') {
      return Promise.resolve(null);
    }
    if (params.type === 'Program') {
      return Promise.resolve(null);
    }
    if (params.type === 'nextup') {
      return Promise.resolve(null);
    }
    if (params.type === 'search') {
      return Promise.resolve(null);
    }
    if (params.type === 'OnNow') {
      return Promise.resolve(null);
    }
    if (!params.serverId) {
      return Promise.resolve(null);
    }
    var apiClient = this.getApiClient();
    var itemId = params.genreId || params.gameGenreId || params.musicGenreId || params.studioId || params.tagId || params.artistId || params.albumArtistId || params.personId || params.parentId;
    if (!itemId || itemId === 'downloads') {
      return Promise.resolve(null);
    }
    return apiClient.getItem(apiClient.getCurrentUserId(), itemId);
  };
  ItemsView.prototype.onItemRefreshed = function (item) {
    if (item) {
      _backdrop.default.setBackdrops([item]);
      dispatchItemShowEvent(this.view, 'itemshow', item);
    } else {
      _backdrop.default.clear();
      dispatchItemShowEvent(this.view, 'itemclear', item);
    }
    this.setTitle();
  };
  ItemsView.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    var refresh = options.refresh;
    this.setTitle();
    var instance = this;
    var resumeArgs = arguments;
    return this.fetchItem().then(function (item) {
      instance.currentItem = item;
      instance.onItemRefreshed(item);
      var view = instance.view;
      if (instance.supportsPlay()) {
        hideOrShowAll(view.querySelectorAll('.btnPlay'), false);
      } else {
        hideOrShowAll(view.querySelectorAll('.btnPlay'), true);
      }
      if (instance.supportsShuffle()) {
        hideOrShowAll(view.querySelectorAll('.btnShuffle'), false);
      } else {
        hideOrShowAll(view.querySelectorAll('.btnShuffle'), true);
      }
      if (instance.supportsQueue()) {
        hideOrShowAll(view.querySelectorAll('.btnQueue'), false);
      } else {
        hideOrShowAll(view.querySelectorAll('.btnQueue'), true);
      }
      return _listcontroller.default.prototype.resume.apply(instance, resumeArgs).then(function () {
        // this needs to be after the itemsContainer resume so that it isn't paused
        var searchFields = instance.searchFields;
        if (searchFields) {
          searchFields.resume({
            refresh: refresh
          });
        }
        if (refresh) {
          instance.autoFocus();
        }
      });
    });
  };
  ItemsView.prototype.onPause = function () {
    _baseview.default.prototype.onPause.apply(this, arguments);
    var searchFields = this.searchFields;
    if (searchFields) {
      searchFields.pause();
    }
    _listcontroller.default.prototype.pause.apply(this, arguments);
  };
  ItemsView.prototype.destroy = function () {
    _baseview.default.prototype.destroy.apply(this, arguments);
    _listcontroller.default.prototype.destroy.apply(this, arguments);
    if (this.searchFields) {
      this.searchFields.destroy();
      this.searchFields = null;
    }
    this.currentItem = null;
  };
  ItemsView.prototype.getContext = function () {
    return this.params.context || _listcontroller.default.prototype.getContext.apply(this, arguments);
  };
  ItemsView.prototype.enableAutoFolderJumpThrough = function (toItem) {
    switch (toItem.Type) {
      case 'Audio':
        if (toItem.SupportsResume) {
          return true;
        }
        return false;
      default:
        return true;
    }
  };
  ItemsView.prototype.getCardOptions = function (items, settings) {
    var options = _listcontroller.default.prototype.getCardOptions.apply(this, arguments);
    var params = this.params;
    if (params.type === 'search') {
      var activeSearchTab = this.view.querySelector('.emby-searchable-tab-button.emby-tab-button-active');
      if (activeSearchTab) {
        var searchItemType = activeSearchTab.getAttribute('data-searchtype');
        if (searchItemType === 'MusicArtist') {
          options.round = true;
        }
      }
    }
    return options;
  };
  ItemsView.prototype.getListViewOptions = function (items, settings) {
    var options = _listcontroller.default.prototype.getListViewOptions.apply(this, arguments);
    var params = this.params;
    if (params.type === 'search') {
      options.imageSize = 'small';
    }
    return options;
  };
  ItemsView.prototype.getCommandOptions = function () {
    var options = _listcontroller.default.prototype.getCommandOptions.apply(this, arguments);
    options.removeFromNextUp = this.params.type === 'nextup';
    options.createRecording = this.params.type !== 'OnNow';
    return options;
  };
  function getTopLevelDownloadFolders(apiClient) {
    return apiClient.getLocalFolders();
  }
  function getDownloads(initialQuery) {
    return Promise.all(_connectionmanager.default.getApiClients().map(getTopLevelDownloadFolders)).then(function (responses) {
      var list = [];
      for (var i = 0, length = responses.length; i < length; i++) {
        list = list.concat(responses[i]);
      }
      return list;
    });
  }
  ItemsView.prototype.getItems = function (initialQuery, signal) {
    var params = this.params;
    if (params.parentId === 'downloads') {
      return getDownloads(initialQuery);
    }
    return _listcontroller.default.prototype.getItems.apply(this, arguments);
  };
  ItemsView.prototype.getApiClientQueryMethodName = function () {
    var params = this.params;
    if (params.type === 'MusicArtist') {
      return 'getArtists';
    }
    if (params.type === 'Person') {
      return 'getPeople';
    }
    if (params.type === 'Recordings') {
      return 'getLiveTvRecordings';
    }
    if (params.type === 'OnNow') {
      return 'getLiveTvChannels';
    }
    if (params.type === 'nextup') {
      return 'getNextUpEpisodes';
    }
    if (params.type === 'missingepisodes') {
      return 'getMissingEpisodes';
    }
    return _listcontroller.default.prototype.getApiClientQueryMethodName.apply(this, arguments);
  };
  ItemsView.prototype.getPrefixes = function () {
    if (this.params.parentId === 'downloads') {
      return Promise.resolve([]);
    }
    return _listcontroller.default.prototype.getPrefixes.apply(this, arguments);
  };
  ItemsView.prototype.getPrefixesApiClientMethodName = function () {
    var params = this.params;
    if (params.type === 'MusicArtist') {
      return 'getArtistPrefixes';
    }
    return _listcontroller.default.prototype.getPrefixesApiClientMethodName.apply(this, arguments);
  };
  ItemsView.prototype.getPrefixQueryIncludeItemTypes = function () {
    var params = this.params;
    if (params.type === 'MusicArtist') {
      return [];
    }
    return _listcontroller.default.prototype.getPrefixQueryIncludeItemTypes.apply(this, arguments);
  };
  ItemsView.prototype.getQueryIncludeItemTypes = function () {
    var params = this.params;
    if (params.musicGenreId) {
      var type = params.type || null;
      if (type === 'MusicArtist') {
        return [];
      }
      return type ? [type] : ['MusicAlbum', 'MusicVideo'];
    }
    if (params.gameGenreId) {
      return ['Game'];
    }
    if (params.genreId) {
      var _type = params.type || null;
      // coming from a playlist we may not know what genre type it is
      return _type ? [_type] : ['Movie', 'Series', 'Video', 'Game', 'MusicAlbum'];
    }
    if (params.personId) {
      var _type2 = params.type || null;
      return _type2 ? [_type2] : [];
    }
    if (params.studioId) {
      return ['Movie', 'Series', 'Video', 'Game'];
    }
    var item = this.getParentItem();
    if (item) {
      if (item.Type === 'MusicGenre') {
        return ['MusicAlbum', 'MusicVideo'];
      } else if (item.Type === 'GameGenre') {
        return ['Game'];
      } else if (item.Type === 'Genre') {
        return ['Movie', 'Series', 'Video'];
      } else if (item.Type === 'Person') {
        var _type3 = params.type || null;
        return _type3 ? [_type3] : [];
      } else if (item.Type === 'Studio') {
        return ['Movie', 'Series', 'Video', 'Game'];
      } else if (item.CollectionType === 'movies') {
        return ['Movie'];
      } else if (item.CollectionType === 'tvshows') {
        return ['Series'];
      }
    }
    if (params.type === 'MusicArtist' || params.type === 'Person' || params.type === 'search' || params.type === 'OnNow') {
      return [];
    }
    return _listcontroller.default.prototype.getQueryIncludeItemTypes.apply(this, arguments);
  };
  ItemsView.prototype.saveSortingOnServer = function () {
    if (this.params.type === 'OnNow') {
      return false;
    }
    return _listcontroller.default.prototype.saveSortingOnServer.apply(this, arguments);
  };
  function onSearchTabChange() {
    this.itemsContainer.refreshItems();
  }
  ItemsView.prototype.refreshSearchTabs = function (tabs) {
    var instance = this;
    if (tabs.length) {
      tabs.unshift({
        Name: _globalize.default.translate('HeaderTopResults'),
        Id: 'all'
      });
    }
    var html;
    if (tabs.length > 1) {
      html = '<div is="emby-tabs" class="searchTabsContainer searchFieldsBottomBorder padded-bottom focuscontainer-x"><div class="emby-tabs-slider scrollSliderX padded-top-focusscale padded-bottom-focusscale padded-left padded-left-page padded-right searchTabsScroller">';
      html += tabs.map(function (tab, index) {
        var pluralName = tab.Id === 'all' ? tab.Name : _itemmanager.default.getPluralItemTypeName(tab.Name);
        return '<button type="button" is="emby-button" class="emby-searchable-tab-button secondaryText emby-search-tab-button emby-tab-button emby-button" data-searchtype="' + (tab.Id || tab.Name) + '" data-index="' + index + '">' + pluralName + '</button>';
      }).join('');
      html += '</div></div>';
    }
    var elem = instance.view.querySelector('.searchTabs');
    elem.innerHTML = html;
    if (html) {
      elem.classList.remove('hide');
      elem.querySelector('.searchTabsContainer').addEventListener('tabchange', onSearchTabChange.bind(instance));
    } else {
      elem.classList.add('hide');
    }
  };
  ItemsView.prototype.setTitle = function () {
    if (this.params.setTitle === false) {
      return;
    }
    var title = this.getTitle();
    _appheader.default.setTitle(title || '');
  };
  ItemsView.prototype.getSortBySettingsKey = function (sortMenuOptions) {
    if (this.params.type === 'OnNow') {
      return _usersettings.default.getLiveTvChannelSortSettingsKey();
    }
    return _listcontroller.default.prototype.getSortBySettingsKey.apply(this, arguments);
  };
  ItemsView.prototype.getSortByValue = function () {
    if (this.params.type === 'OnNow') {
      var query = {};
      _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
      return query.SortBy;
    }
    return _listcontroller.default.prototype.getSortByValue.apply(this, arguments);
  };
  ItemsView.prototype.getDefaultSorting = function () {
    var params = this.params;
    if (params.type === 'OnNow') {
      var query = {};
      _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
      return {
        sortBy: query.SortBy,
        sortOrder: query.SortOrder
      };
    }
    return _listcontroller.default.prototype.getDefaultSorting.apply(this, arguments);
  };
  ItemsView.prototype.supportsPlay = function () {
    var params = this.params;
    var parentItem = this.getParentItem();
    var collectionType = parentItem == null ? void 0 : parentItem.CollectionType;
    if (params.parentId === 'downloads' || params.type === 'search' || params.type === 'missingepisodes' || collectionType === 'playlists' || collectionType === 'boxsets') {
      return false;
    }
    return _listcontroller.default.prototype.supportsPlay.apply(this, arguments);
  };
  ItemsView.prototype.supportsShuffle = function () {
    var params = this.params;
    var parentItem = this.getParentItem();
    var itemType = parentItem == null ? void 0 : parentItem.Type;
    var collectionType = parentItem == null ? void 0 : parentItem.CollectionType;
    if (params.parentId === 'downloads' || params.type === 'search' || params.type === 'missingepisodes' || collectionType === 'playlists' || collectionType === 'boxsets') {
      return false;
    } else if (itemType === 'MusicGenre' || params.type !== 'Program' && params.type !== 'TvChannel' && params.type !== 'OnNow' && params.type !== 'nextup' && params.type !== 'Game' && itemType !== 'Channel' && itemType !== 'GameSystem' && itemType !== 'GameGenre') {
      return this.supportsPlay();
    } else {
      return false;
    }
  };
  ItemsView.prototype.supportsQueue = function () {
    var params = this.params;
    var parentItem = this.getParentItem();
    var collectionType = parentItem == null ? void 0 : parentItem.CollectionType;
    if (params.parentId === 'downloads' || params.type === 'search' || params.type === 'missingepisodes' || collectionType === 'playlists' || collectionType === 'boxsets') {
      return false;
    }
    if (this.supportsPlay()) {
      var item = this.getParentItem();
      if (item) {
        return _playbackmanager.default.canQueue(item);
      }
    }
    return false;
  };
  ItemsView.prototype.getSortMenuOptions = function () {
    var params = this.params;
    if (params.parentId === 'downloads') {
      return [];
    }
    var paramsType = params.type;
    switch (paramsType) {
      case 'nextup':
      case 'search':
      case 'missingepisodes':
        return [];
      case 'OnNow':
        return _usersettings.default.getLiveTvChannelSortOrders(_globalize.default);
      default:
        return _listcontroller.default.prototype.getSortMenuOptions.apply(this, arguments);
    }
  };
  ItemsView.prototype.getVisibleFilters = function () {
    var params = this.params;
    if (params.parentId === 'downloads') {
      return [];
    }
    var paramsType = params.type;
    switch (paramsType) {
      case 'nextup':
      case 'OnNow':
      case 'search':
      case 'missingepisodes':
        return [];
      default:
        return _listcontroller.default.prototype.getVisibleFilters.apply(this, arguments);
    }
  };
  ItemsView.prototype.getDisplayPreset = function () {
    var params = this.params;
    if (params.mediaTypes) {
      return params.mediaTypes.split(',')[0];
    }
    return _listcontroller.default.prototype.getDisplayPreset.apply(this, arguments);
  };
  ItemsView.prototype.getViewSettingDefaults = function (parentItem, listItems, availableFieldIds) {
    var defaults = _listcontroller.default.prototype.getViewSettingDefaults.apply(this, arguments);
    var params = this.params;
    if (params.type === 'search') {
      defaults.fields = ['Name'];
      var activeSearchTab = this.view.querySelector('.emby-searchable-tab-button.emby-tab-button-active');
      if (activeSearchTab) {
        var searchItemType = activeSearchTab.getAttribute('data-searchtype');
        if (searchItemType === 'all') {
          defaults.fields.push('Type');
          defaults.fields.push('ProductionYear');
        } else if (searchItemType === 'Movie' || searchItemType === 'Series' || searchItemType === 'Trailer' || searchItemType === 'Book') {
          defaults.fields.push('ProductionYear');
        } else if (searchItemType === 'Audio') {
          defaults.imageType = 'list';
        }
      } else {
        defaults.fields.push('Type');
        defaults.fields.push('ProductionYear');
      }
    } else if (params.type === 'nextup') {
      defaults.imageType = this.params.defaultView || 'thumb';
    }
    return defaults;
  };
  ItemsView.prototype.getItemTypes = function () {
    var params = this.params;
    var paramsType = params.type;
    switch (paramsType) {
      case 'nextup':
      case 'missingepisodes':
        return ['Episode'];
      case 'OnNow':
        return ['TvChannel'];
      case 'search':
        return [];
      case 'Recordings':
        if (params.GroupItems === 'true') {
          return ['Series', 'Video', 'Movie'];
        }
        return ['Episode', 'Video', 'Movie'];
      default:
        return paramsType ? paramsType.split(',') : [];
    }
  };
  ItemsView.prototype.getSettingsKey = function () {
    var values = [];
    values.push('items');
    var params = this.params;
    if (params.type) {
      values.push(params.type);
    } else if (params.mediaTypes) {
      values.push(params.mediaTypes);
    } else if (params.parentId) {
      values.push(params.parentId);
    }
    if (params.IsAiring) {
      values.push('IsAiring');
    }
    if (params.IsMovie) {
      values.push('IsMovie');
    }
    if (params.IsKids) {
      values.push('IsKids');
    }
    if (params.IsSports) {
      values.push('IsSports');
    }
    if (params.IsNews) {
      values.push('IsNews');
    }
    if (params.IsSeries) {
      values.push('IsSeries');
    }
    if (params.IsFavorite) {
      values.push('IsFavorite');
    }
    if (params.genreId) {
      values.push('Genre');
    }
    if (params.gameGenreId) {
      values.push('GameGenre');
    }
    if (params.musicGenreId) {
      values.push('MusicGenre');
    }
    if (params.studioId) {
      values.push('Studio');
    }
    if (params.tagId) {
      values.push('Tag');
    }
    if (params.personId) {
      values.push('Person');
    }
    if (params.parentId) {
      values.push('Folder');
    }
    return values.join('-');
  };
  var _default = _exports.default = ItemsView;
});
