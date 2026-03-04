define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/common/datetime.js", "./../modules/common/globalize.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/events.js", "./../modules/common/imagehelper.js", "./../modules/common/input/api.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _basetab, _embyItemscontainer, _embyButton, _embyScroller, _datetime, _globalize, _connectionmanager, _events, _imagehelper, _api, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function LiveTvScheduleTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
  }
  Object.assign(LiveTvScheduleTab.prototype, _basetab.default.prototype);
  Object.assign(LiveTvScheduleTab.prototype, _sectionscontroller.default.prototype);
  function onServerNotification() {
    if (this.paused) {
      this.needsSectionsRefresh = true;
    } else {
      this.onResume({
        refresh: true,
        refreshSections: true
      });
    }
  }
  function pushSection(sections, name, enableFocusPreview, items) {
    var primaryImageAspectRatio = _imagehelper.default.getPrimaryImageAspectRatio(items) || 1;
    var cardLayout = primaryImageAspectRatio >= 1.5;
    sections.push({
      Name: name,
      CollectionType: 'livetv',
      Monitor: [],
      ListOptions: {
        shape: 'autooverflow',
        fields: enableFocusPreview ? [] : ['ParentName', 'Name', 'ChannelName', 'AirTime'],
        showAirEndTime: true,
        cardLayout: cardLayout,
        centerText: !cardLayout,
        action: 'edit',
        cardFooterAside: false,
        showChannelLogo: cardLayout,
        preferThumb: cardLayout ? true : null,
        multiSelect: false
      },
      QueryOptions: {},
      Items: items
    });
  }
  LiveTvScheduleTab.prototype.fetchSections = function () {
    var instance = this;
    var enableFocusPreview = instance.enableFocusPreview();
    var apiClient = this.getApiClient();
    return apiClient.getLiveTvTimers({
      IsActive: false,
      IsScheduled: true
    }).then(function (result) {
      var sections = [];
      var cardLayout = false;
      sections.push({
        Name: _globalize.default.translate('HeaderActiveRecordings'),
        CollectionType: 'livetv',
        SectionType: 'recordings',
        Monitor: ['RecordingStarted', 'RecordingEnded'],
        RefreshInterval: 300000,
        ListOptions: {
          shape: 'autooverflow',
          cardLayout: cardLayout,
          fields: ['ParentName', 'Name', 'ChannelName', 'AirTime'],
          showAirEndTime: true,
          preferThumb: 'auto',
          centerText: !cardLayout,
          multiSelect: false
        },
        QueryOptions: {
          UserId: apiClient.getCurrentUserId(),
          IsInProgress: true,
          Recursive: true
        }
      });
      var items = result.Items;
      var currentGroupName = '';
      var currentGroup = [];
      var i, length;
      for (i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        var dateText = '';
        if (item.StartDate) {
          try {
            var premiereDate = _datetime.default.parseISO8601Date(item.StartDate);
            dateText = _datetime.default.toLocaleDateString(premiereDate, {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            });
          } catch (err) {}
        }
        if (dateText !== currentGroupName) {
          if (currentGroup.length) {
            pushSection(sections, currentGroupName, enableFocusPreview, currentGroup);
          }
          currentGroupName = dateText;
          currentGroup = [item];
        } else {
          currentGroup.push(item);
        }
      }
      if (currentGroup.length) {
        pushSection(sections, currentGroupName, enableFocusPreview, currentGroup);
      }
      return sections;
    });
  };
  LiveTvScheduleTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    if (!this.serverNotificationHandler) {
      var serverNotificationHandler = onServerNotification.bind(this);
      _events.default.on(_api.default, 'TimerCreated', serverNotificationHandler);
      _events.default.on(_api.default, 'TimerCancelled', serverNotificationHandler);
      _events.default.on(_api.default, 'RecordingStarted', serverNotificationHandler);
      _events.default.on(_api.default, 'RecordingEnded', serverNotificationHandler);
      this.serverNotificationHandler = serverNotificationHandler;
    }
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  LiveTvScheduleTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  LiveTvScheduleTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    var serverNotificationHandler = this.serverNotificationHandler;
    if (serverNotificationHandler) {
      _events.default.off(_api.default, 'TimerCreated', serverNotificationHandler);
      _events.default.off(_api.default, 'TimerCancelled', serverNotificationHandler);
      _events.default.off(_api.default, 'RecordingStarted', serverNotificationHandler);
      _events.default.off(_api.default, 'RecordingEnded', serverNotificationHandler);
      this.serverNotificationHandler = null;
    }
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = LiveTvScheduleTab;
});
