define(["exports", "./../modules/common/globalize.js", "./../modules/layoutmanager.js", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/tabbedview/sectionscontroller.js", "./../modules/common/itemmanager/itemmanager.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/approuter.js"], function (_exports, _globalize, _layoutmanager, _basetab, _embyItemscontainer, _embyScroller, _sectionscontroller, _itemmanager, _connectionmanager, _approuter) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var msPerDay = 86400000;
  function TvSuggestionsTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
  }
  Object.assign(TvSuggestionsTab.prototype, _basetab.default.prototype);
  Object.assign(TvSuggestionsTab.prototype, _sectionscontroller.default.prototype);
  TvSuggestionsTab.prototype.onSpotlightButtonCustomAction = function (options) {
    var _item$Id;
    var item = options.item;
    if ((_item$Id = item.Id) != null && _item$Id.startsWith('tv_')) {
      var apiClient = _connectionmanager.default.getApiClient(item);
      var url = '/tv?serverId=' + apiClient.serverId() + '&parentId=' + item.ParentId;
      var idParts = item.Id.split('_');
      if (idParts.length > 1) {
        url += '&tab=' + idParts[1];
      }
      _approuter.default.show(url);
      return;
    }
    return _sectionscontroller.default.prototype.onSpotlightButtonCustomAction.apply(this, arguments);
  };
  TvSuggestionsTab.prototype.fetchSections = function () {
    var instance = this;
    var sections = [];
    var enableFocusPreview = instance.enableFocusPreview();
    var parentId = instance.params.parentId;
    var serverId = instance.serverId();
    var viewScrollX = this.scrollDirection() === 'x';
    if (viewScrollX && instance.options.addCategories) {
      sections.push({
        Id: 'Spotlight',
        Name: ' ',
        SectionType: 'spotlight',
        CollectionType: 'tvshows',
        Monitor: [],
        ListOptions: {
          shape: 'backdrop',
          multiSelect: false,
          overlayText: true,
          fields: ['Name'],
          cardClass: 'wideSpotlightCard',
          coverImage: true
        },
        QueryOptions: {
          SortBy: "Random",
          IncludeItemTypes: "Series",
          Recursive: true,
          ParentId: parentId,
          EnableImageTypes: "Backdrop,Logo",
          ImageTypes: "Backdrop",
          Fields: 'Taglines',
          ImageTypeLimit: 1,
          Limit: 1
        },
        CommandOptions: {},
        // 30 seconds
        RefreshInterval: 1000 * 30,
        SpotlightButtons: [{
          Name: _globalize.default.translate('Shows'),
          Id: 'tv_shows',
          ParentId: parentId,
          ServerId: serverId,
          Icon: _itemmanager.default.getDefaultIcon({
            Type: 'Series'
          }),
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }, {
          Name: _globalize.default.translate('Favorites'),
          Id: 'tv_favorites',
          ParentId: parentId,
          ServerId: serverId,
          Icon: 'favorite',
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }, {
          Name: _globalize.default.translate('Upcoming'),
          Id: 'tv_upcoming',
          ParentId: parentId,
          ServerId: serverId,
          Icon: 'dvr',
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }]
      });
    }
    sections.push({
      Name: _globalize.default.translate('HeaderContinueWatching'),
      SectionType: 'resume',
      CollectionType: 'tvshows',
      Monitor: ['videoplayback', 'markplayed'],
      ListOptions: {
        fields: enableFocusPreview ? [] : ['ParentName', 'Name'],
        preferThumb: true
      },
      QueryOptions: {
        IncludeItemTypes: 'Episode',
        ParentId: parentId,
        Recursive: true
      },
      CommandOptions: {
        removeFromResume: true
      }
    });
    sections.push({
      Name: _globalize.default.translate('HeaderLatestEpisodes'),
      SectionType: 'latestmedia',
      CollectionType: 'tvshows',
      Monitor: ['videoplayback', 'markplayed'],
      ListOptions: {
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear']
      },
      QueryOptions: {
        IncludeItemTypes: 'Episode',
        ParentId: parentId,
        Recursive: true
      }
    });
    var minPremiereDate = new Date(Date.now());
    minPremiereDate.setTime(minPremiereDate.getTime() - msPerDay * 14);
    sections.push({
      Name: _globalize.default.translate('RecentlyReleasedEpisodes'),
      CollectionType: 'tvshows',
      Monitor: ['videoplayback', 'markplayed'],
      ListOptions: {
        fields: enableFocusPreview ? [] : ['ParentName', 'Name'],
        preferThumb: true
      },
      QueryOptions: {
        IncludeItemTypes: 'Episode',
        Recursive: true,
        SortBy: 'ProductionYear,PremiereDate,SortParentIndexNumber,SortIndexNumber',
        SortOrder: 'Descending,Descending,Ascending,Ascending',
        MinPremiereDate: minPremiereDate.toISOString(),
        IsUnaired: false,
        ParentId: parentId
      }
    });
    return Promise.resolve(sections);
  };
  TvSuggestionsTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && this.scrollDirection() === 'y';
  };
  TvSuggestionsTab.prototype.enablePushDownFocusPreview = function () {
    return _layoutmanager.default.tv && this.scrollDirection() === 'y';
  };
  TvSuggestionsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  TvSuggestionsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  TvSuggestionsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = TvSuggestionsTab;
});
