define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/common/globalize.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/tabbedview/sectionscontroller.js", "./../modules/approuter.js", "./../modules/common/itemmanager/itemmanager.js"], function (_exports, _basetab, _globalize, _embyItemscontainer, _embyButton, _embyScroller, _sectionscontroller, _approuter, _itemmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function LiveTvSuggestionsTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
  }
  Object.assign(LiveTvSuggestionsTab.prototype, _basetab.default.prototype);
  Object.assign(LiveTvSuggestionsTab.prototype, _sectionscontroller.default.prototype);
  function isNotName(n) {
    return n !== 'Name';
  }
  function isNotParentName(n) {
    return n !== 'ParentName';
  }
  function isNotAirTime(n) {
    return n !== 'AirTime';
  }
  function getListOptions(options) {
    return Object.assign({
      preferThumb: 'auto',
      inheritThumb: false,
      shape: 'autooverflow',
      centerText: true,
      multiSelect: false,
      programsAsSeries: true
    }, options);
  }
  LiveTvSuggestionsTab.prototype.getSectionListOptions = function (items) {
    var options = _sectionscontroller.default.prototype.getSectionListOptions.apply(this, arguments);
    if (items.length && items[0].AsSeries) {
      var listOptions = options.options;
      listOptions.progress = false;
      listOptions.showAirDateTime = false;
      listOptions.fields = listOptions.fields.filter(isNotName).filter(isNotParentName).filter(isNotAirTime);
      var bindInfo = this;
      var instance = bindInfo.instance;
      var viewScrollX = instance.scrollDirection() === 'x';
      if (!viewScrollX) {
        listOptions.fields.push('ParentNameOrName');
      }
    }
    return options;
  };
  LiveTvSuggestionsTab.prototype.onItemCustomAction = function (options) {
    var _item$Id;
    var item = options.item;
    if ((_item$Id = item.Id) != null && _item$Id.startsWith('livetv_')) {
      var tab = item.Id.split('_')[1];
      _approuter.default.show('/livetv?tab=' + tab + '&serverId=' + item.ServerId);
      return;
    }
    return _sectionscontroller.default.prototype.onItemCustomAction.apply(this, arguments);
  };
  LiveTvSuggestionsTab.prototype.fetchSections = function () {
    var sections = [];
    var serverId = this.serverId();
    var refreshInterval = 300000;
    var enableFocusPreview = this.enableFocusPreview();
    var viewScrollX = this.scrollDirection() === 'x';
    if (viewScrollX && this.options.addCategories) {
      sections.push({
        Id: 'Categories',
        Name: ' ',
        CollectionType: 'livetv',
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
        Items: [{
          Name: _globalize.default.translate('Channels'),
          Id: 'livetv_channels',
          ServerId: serverId,
          Icon: _itemmanager.default.getDefaultIcon({
            Type: 'TvChannel'
          }),
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }, {
          Name: _globalize.default.translate('Guide'),
          Id: 'livetv_guide',
          ServerId: serverId,
          Icon: 'dvr',
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }, {
          Name: _globalize.default.translate('Recordings'),
          Id: 'livetv_recordings',
          ServerId: serverId,
          Icon: _itemmanager.default.getDefaultIcon({
            Type: 'Video'
          }),
          // for focus handler to ignore
          Type: 'AppCategory',
          IsFolder: true
        }]
      });
    }
    sections.push({
      Id: 'OnNow',
      Name: _globalize.default.translate('HeaderOnNow'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      SectionType: 'onnow',
      ListOptions: getListOptions({
        fields: enableFocusPreview ? [] : ['CurrentProgramName', 'CurrentProgramParentNameOrName', 'CurrentProgramTime'],
        showCurrentProgramImage: true,
        defaultShape: 'portrait',
        action: 'programlink',
        programsAsSeries: false
      }),
      QueryOptions: {
        EnableUserData: false
      },
      CommandOptions: {
        createRecording: false
      },
      Href: 'list/list.html?type=OnNow' + '&serverId=' + serverId
    });
    if (!viewScrollX) {
      sections.push({
        Id: 'Tags',
        CollectionType: 'livetv',
        Monitor: [],
        RefreshInterval: refreshInterval,
        SectionType: 'livetvtags',
        ViewType: 'buttons',
        ListOptions: getListOptions({
          sideFooter: true,
          smallSideFooter: true,
          multiSelect: false,
          image: false,
          imageFallback: false,
          imageContainer: false,
          hoverMenu: false,
          contextMenu: false,
          centerText: true,
          fields: ['Name'],
          draggable: false,
          autoWidth: true,
          cardBoxClass: 'buttonCardBox'
        }),
        QueryOptions: {},
        CommandOptions: {}
      });
    }
    sections.push({
      Id: 'NewEpisodes',
      Name: _globalize.default.translate('TitleNewEpisodes'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        showAirDateTime: true,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'AirTime']
      }),
      QueryOptions: {
        HasAired: false,
        IsSports: false,
        IsKids: false,
        IsNews: false,
        IsSeries: true,
        Fields: "PrimaryImageAspectRatio,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate',
        GroupProgramsBySeries: true,
        IsNewOrPremiere: true
      },
      Href: 'list/list.html?type=Program&IsSeries=true&IsNews=false&IsKids=false&IsSports=false&IsNewOrPremiere=true' + '&serverId=' + serverId
    });
    sections.push({
      Id: 'Shows',
      Name: _globalize.default.translate('Shows'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        showAirDateTime: true,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'AirTime']
      }),
      QueryOptions: {
        HasAired: false,
        IsSports: false,
        IsKids: false,
        IsNews: false,
        IsSeries: true,
        Fields: "PrimaryImageAspectRatio,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate',
        GroupProgramsBySeries: true
      },
      Href: 'list/list.html?type=Program&IsSeries=true&IsNews=false&IsKids=false&IsSports=false' + '&serverId=' + serverId
    });
    sections.push({
      Id: 'Movies',
      Name: _globalize.default.translate('Movies'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        preferThumb: null,
        fields: enableFocusPreview ? [] : ['Name', 'ProductionYear', 'AirTime'],
        showAirDateTime: true
      }),
      QueryOptions: {
        HasAired: false,
        IsMovie: true,
        IsKids: false,
        Fields: "PrimaryImageAspectRatio,ProductionYear,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate',
        GroupProgramsBySeries: true
      },
      Href: 'list/list.html?type=Program&IsMovie=true&IsKids=false' + '&serverId=' + serverId
    });
    sections.push({
      Id: 'Sports',
      Name: _globalize.default.translate('Sports'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        programsAsSeries: false,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'AirTime'],
        showAirDateTime: true
      }),
      QueryOptions: {
        HasAired: false,
        IsSports: true,
        Fields: "PrimaryImageAspectRatio,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate'
      },
      Href: 'list/list.html?type=Program&IsSports=true' + '&serverId=' + serverId
    });
    sections.push({
      Id: 'Kids',
      Name: _globalize.default.translate('HeaderForKids'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        showAirDateTime: true,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'AirTime']
      }),
      QueryOptions: {
        HasAired: false,
        IsKids: true,
        Fields: "PrimaryImageAspectRatio,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate',
        GroupProgramsBySeries: true
      },
      Href: 'list/list.html?type=Program&IsKids=true' + '&serverId=' + serverId
    });
    sections.push({
      Id: 'News',
      Name: _globalize.default.translate('News'),
      CollectionType: 'livetv',
      Monitor: [],
      RefreshInterval: refreshInterval,
      ListOptions: getListOptions({
        showAirDateTime: true,
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'AirTime']
      }),
      QueryOptions: {
        HasAired: false,
        IsNews: true,
        Fields: "PrimaryImageAspectRatio,ChannelImageIfNoImage",
        IncludeItemTypes: 'Program',
        Recursive: true,
        SortBy: 'StartDate',
        GroupProgramsBySeries: true
      },
      Href: 'list/list.html?type=Program&IsNews=true' + '&serverId=' + serverId
    });
    return Promise.resolve(sections);
  };
  LiveTvSuggestionsTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  LiveTvSuggestionsTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  LiveTvSuggestionsTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = LiveTvSuggestionsTab;
});
