define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/common/globalize.js", "./../modules/common/datetime.js", "./../modules/tabbedview/sectionscontroller.js"], function (_exports, _connectionmanager, _basetab, _embyItemscontainer, _embyScroller, _globalize, _datetime, _sectionscontroller) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function UpcomingTab(view, params) {
    _basetab.default.apply(this, arguments);
    _sectionscontroller.default.apply(this, arguments);
    this.view = view;
    this.params = params;
    this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
  }
  Object.assign(UpcomingTab.prototype, _basetab.default.prototype);
  Object.assign(UpcomingTab.prototype, _sectionscontroller.default.prototype);
  UpcomingTab.prototype.fetchSections = function () {
    var instance = this;
    var enableFocusPreview = instance.enableFocusPreview();
    var parentId = this.params.parentId;
    var apiClient = this.getApiClient();
    return apiClient.getUpcomingEpisodes({
      Limit: 100,
      UserId: apiClient.getCurrentUserId(),
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Backdrop,Thumb",
      EnableTotalRecordCount: false,
      parentId: parentId,
      Fields: 'Overview'
    }).then(function (result) {
      var sections = [];
      var currentGroupName = '';
      var currentGroup = [];
      var items = result.Items;
      var parentId = instance.params.parentId;
      for (var i = 0, length = items.length; i < length; i++) {
        var item = items[i];
        var dateText = '';
        if (item.PremiereDate) {
          try {
            var premiereDate = new Date(Date.parse(item.PremiereDate));
            if (_datetime.default.isRelativeDay(premiereDate, -1)) {
              dateText = _globalize.default.translate('Yesterday');
            } else {
              dateText = _datetime.default.toLocaleDateString(premiereDate, {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              });
            }
          } catch (err) {
            dateText = item.PremiereDate;
          }
        }
        if (dateText !== currentGroupName) {
          if (currentGroup.length) {
            sections.push({
              Name: currentGroupName,
              CollectionType: 'tvshows',
              Monitor: [],
              ListOptions: {
                fields: enableFocusPreview ? [] : ['ParentName', 'Name'],
                preferThumb: true,
                action: 'overview'
              },
              QueryOptions: {
                ParentId: parentId,
                Recursive: true
              },
              Items: currentGroup
            });
          }
          currentGroupName = dateText;
          currentGroup = [item];
        } else {
          currentGroup.push(item);
        }
      }
      return sections;
    });
  };
  UpcomingTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    return _sectionscontroller.default.prototype.onResume.apply(this, arguments);
  };
  UpcomingTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    _sectionscontroller.default.prototype.onPause.apply(this, arguments);
  };
  UpcomingTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    _sectionscontroller.default.prototype.destroy.apply(this, arguments);
  };
  var _default = _exports.default = UpcomingTab;
});
