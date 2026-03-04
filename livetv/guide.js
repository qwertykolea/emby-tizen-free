define(["exports", "./../modules/tabbedview/basetab.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/emby-apiclient/events.js", "./../modules/appheader/appheader.js", "./../modules/layoutmanager.js", "./../modules/backdrop/backdrop.js", "./../modules/emby-elements/guide/guide.js"], function (_exports, _basetab, _embyItemscontainer, _embyButton, _embyScroller, _connectionmanager, _events, _appheader, _layoutmanager, _backdrop, _guide) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!livetv/guide.css']);
  function onGuideFocus(e, detail) {
    this._lastFocusInfo = detail;
    this.onFocusIn(detail.element);
  }
  function onGuideFocusOut(e, detail) {
    this._lastFocusInfo = null;
    this.onFocusOut();
  }
  function GuideTab(view, params) {
    _basetab.default.apply(this, arguments);
    this.apiClient = _connectionmanager.default.getApiClient(params.serverId);
    this.view = view;
    this.params = params;
    if (_layoutmanager.default.tv) {
      view.classList.add('guideContainer-tv');
    }
    this.boundonGuideFocus = onGuideFocus.bind(this);
    this.boundonGuideFocusOut = onGuideFocusOut.bind(this);
  }
  Object.assign(GuideTab.prototype, _basetab.default.prototype);
  GuideTab.prototype.getFocusPreviewItem = function (element) {
    var focusInfo = this._lastFocusInfo;
    if ((focusInfo == null ? void 0 : focusInfo.element) === element) {
      return focusInfo.item;
    }
    return null;
  };
  GuideTab.prototype.refetchItemForFocusPreview = function () {
    return true;
  };
  GuideTab.prototype.enableFocusPreview = function () {
    return _layoutmanager.default.tv ? true : false;
  };
  GuideTab.prototype.createFocusPreviewElement = function () {
    var elem = this.view.querySelector('.guideSelectedInfo');
    this.fillFocusPreviewContainer(elem);
    elem.querySelector('.focusPreviewOverview').classList.add('guide-focusPreviewOverview');
    return elem;
  };
  GuideTab.prototype.onResume = function (options) {
    _basetab.default.prototype.onResume.apply(this, arguments);
    if (!options) {
      options = {};
    }
    _appheader.default.ensureVisible();
    _backdrop.default.clear();
    var guideInstance = this.guideInstance;
    var guideContainer = this.view;
    var focusGuideOnLoad = options.autoFocus || guideContainer.contains(document.activeElement);
    var isNew;
    if (!guideInstance) {
      isNew = true;
      guideInstance = this.guideInstance = new _guide.default({
        element: guideContainer,
        serverId: this.params.serverId,
        condensed: _layoutmanager.default.tv
      });
      if (_layoutmanager.default.tv) {
        _events.default.on(this.guideInstance, 'focus', this.boundonGuideFocus);
        guideContainer.addEventListener('focusout', this.boundonGuideFocusOut);
        this.view.querySelector('.guideSelectedInfo').classList.remove('hide');
      }
      options.refresh = true;
    }
    if (_layoutmanager.default.tv) {
      this.view.classList.add('liveGuideTab-tv');
    } else {
      this.view.classList.remove('liveGuideTab-tv');
    }
    var apiClient = this.getApiClient();
    var promise;
    if (isNew && _layoutmanager.default.tv) {
      promise = apiClient.getItems(apiClient.getCurrentUserId(), {
        IncludeItemTypes: 'TvChannel',
        EnableTotalRecordCount: false,
        Limit: 1,
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        Fields: 'UserDataPlayCount',
        //IsPlayed: true,
        Recursive: true,
        EnableImages: false,
        AddCurrentProgram: false
      });
    }
    if (!promise) {
      promise = Promise.resolve({
        Items: []
      });
    }
    return promise.then(function (result) {
      var _lastPlayedChannel$Us, _options$previousView;
      var lastPlayedChannel = result.Items[0];
      if (lastPlayedChannel != null && (_lastPlayedChannel$Us = lastPlayedChannel.UserData) != null && _lastPlayedChannel$Us.PlayCount) {
        options.scrollToChannelId = lastPlayedChannel.Id;
        options.focusOnScroll = focusGuideOnLoad;
        options.scrollBehavior = 'instant';
      }

      // todo: this should be false when returning from a dialog
      options.resetScroll = ((_options$previousView = options.previousViewInfo) == null || (_options$previousView = _options$previousView.params) == null ? void 0 : _options$previousView.asDialog) !== 'true';
      return guideInstance.resume(options);
    });
  };
  GuideTab.prototype.enableFocusPreviewImage = function () {
    return true;
  };
  GuideTab.prototype.hideFocusPreviewElementUsingDisplay = function () {
    return false;
  };
  GuideTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    var guideInstance = this.guideInstance;
    if (guideInstance) {
      guideInstance.pause();
    }
  };
  GuideTab.prototype.destroy = function () {
    var view = this.view;
    _basetab.default.prototype.destroy.apply(this, arguments);
    var guideInstance = this.guideInstance;
    if (guideInstance) {
      if (this.boundonGuideFocus) {
        _events.default.off(guideInstance, 'focus', this.boundonGuideFocus);
        this.boundonGuideFocus = null;
      }
      if (this.boundonGuideFocusOut) {
        view == null || view.removeEventListener('focusout', this.boundonGuideFocusOut);
        this.boundonGuideFocusOut = null;
      }
      guideInstance.destroy();
    }
    this._lastFocusInfo = null;
    this.guideInstance = null;
  };
  var _default = _exports.default = GuideTab;
});
