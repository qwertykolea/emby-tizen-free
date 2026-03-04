define(["exports", "./../modules/tabbedview/tabbedview.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/maintabsmanager.js"], function (_exports, _tabbedview, _embyScroller, _embyButton, _connectionmanager, _maintabsmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function createTabs(instance) {
    if (instance.tabsCreated) {
      return;
    }
    instance.tabsCreated = true;
    var html = '';
    var items = instance.item.UserViews;
    for (var i = 0, length = items.length; i < length; i++) {
      switch (items[i].CollectionType) {
        case 'livetv':
        case 'music':
        case 'audiobooks':
        case 'movies':
        case 'tvshows':
          html += "<div style=\"overflow:hidden;\" class=\"tabContent tabContent-positioned home-horiz-tabContent flex focuscontainer-x\" data-index=\"" + i + "\" data-swapnode=\"sectionstab\"></div>";
          break;
        default:
          html += "<div style=\"overflow:hidden;\" class=\"tabContent tabContent-positioned home-horiz-tabContent flex focuscontainer-x\" data-index=\"" + i + "\" data-swapnode=\"itemstab\"></div>";
          break;
      }
    }
    instance.view.insertAdjacentHTML('afterbegin', html);
  }
  function getTabs() {
    var items = this.item.UserViews;
    createTabs(this);
    return items.map(function (i) {
      return {
        name: i.Name,
        id: i.Id + '_' + (i.CollectionType || '')
      };
    });
  }
  function HomeView(view, params) {
    _tabbedview.default.apply(this, arguments);
    this.selectedItemInfoElement = view.querySelector('.selectedItemInfoInner');
    this.enableBackMenu = true;
  }
  Object.assign(HomeView.prototype, _tabbedview.default.prototype);
  HomeView.prototype.getTabs = getTabs;
  HomeView.prototype.getAutoBackdropItemTypes = function () {
    return ['Movie', 'Series', 'Game', 'Book'];
  };
  HomeView.prototype.fetchItem = function () {
    var apiClient = _connectionmanager.default.currentApiClient();
    return apiClient.getUserViews({}, apiClient.getCurrentUserId()).then(function (result) {
      return {
        UserViews: result.Items || result
      };
    });
  };
  HomeView.prototype.setTitle = function () {
    // handled by setting defaultTitle on the route
  };
  HomeView.prototype.loadTabController = function (id) {
    var parts = id.split('_');
    var contentType = parts[1];
    switch (contentType) {
      case 'movies':
        return Emby.importModule('./videos/moviesuggestions.js');
      case 'music':
      case 'audiobooks':
        return Emby.importModule('./music/suggestions.js');
      case 'tvshows':
        return Emby.importModule('./tv/suggestions.js');
      case 'livetv':
        return Emby.importModule('./livetv/suggestions.js');
      default:
        return Emby.importModule('./modules/tabbedview/folderstab.js');
    }
  };
  HomeView.prototype.getTabControllerParams = function (id) {
    var params = _tabbedview.default.prototype.getTabControllerParams.apply(this, arguments);
    var parts = id.split('_');
    id = parts[0];
    params.parentId = id;
    return params;
  };
  HomeView.prototype.getTabControllerOptions = function (id) {
    var _this$item;
    var options = _tabbedview.default.prototype.getTabControllerOptions.apply(this, arguments);
    var parts = id.split('_');
    id = parts[0];
    options.item = (_this$item = this.item) == null ? void 0 : _this$item.UserViews.filter(function (i) {
      return i.Id === id;
    })[0];
    options.addCategories = true;
    return options;
  };
  HomeView.prototype.supportsHorizontalTabScroll = function () {
    return true;
  };
  HomeView.prototype.tabScrollDirection = function () {
    return 'x';
  };
  HomeView.prototype.onWindowInputCommand = function (e) {
    switch (e.detail.command) {
      case 'home':
        _maintabsmanager.default.selectedTabIndex(0);
        e.preventDefault();
        return;
      default:
        break;
    }
    _tabbedview.default.prototype.onWindowInputCommand.apply(this, arguments);
  };
  var _default = _exports.default = HomeView;
});
