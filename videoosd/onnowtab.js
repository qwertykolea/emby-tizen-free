define(["exports", "./basetab.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/common/usersettings/usersettings.js", "./../modules/common/globalize.js", "./../modules/layoutmanager.js", "./../modules/focusmanager.js", "./../modules/common/inputmanager.js"], function (_exports, _basetab, _cardbuilder, _usersettings, _globalize, _layoutmanager, _focusmanager, _inputmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function fetchItems(query) {
    var apiClient = this.apiClient;
    query = Object.assign({
      UserId: apiClient.getCurrentUserId(),
      IsAiring: true,
      ImageTypeLimit: 1,
      EnableImageTypes: "Primary,Thumb,Backdrop",
      Fields: 'ProgramPrimaryImageAspectRatio,PrimaryImageAspectRatio',
      EnableUserData: false,
      SortBy: "ChannelNumber,SortName"
    }, query);
    _usersettings.default.addLiveTvChannelSortingToQuery(query, _globalize.default);
    return apiClient.getLiveTvChannels(query);
  }
  function getListOptions(items) {
    var cardClass = 'videoOsd-itemstab-card videoOsd-itemstab-card-threeline';
    var forceBackdrop = _layoutmanager.default.tv ? true : false;
    var options = {
      preferThumb: forceBackdrop ? null : 'auto',
      inheritThumb: false,
      shape: forceBackdrop ? 'backdrop' : 'auto',
      contextMenu: false,
      multiSelect: false,
      programsAsSeries: false,
      showCurrentProgramImage: true,
      defaultShape: 'portrait',
      action: 'play',
      cardClass: cardClass,
      fields: ['CurrentProgramName', 'CurrentProgramParentNameOrName', 'CurrentProgramTime'],
      allowBottomPadding: false,
      defaultBackground: true,
      textLinks: false,
      enableFocusScaling: false
    };
    return {
      renderer: _cardbuilder.default,
      options: options,
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function OnNowTab(view) {
    _basetab.default.apply(this, arguments);
  }
  Object.assign(OnNowTab.prototype, _basetab.default.prototype);
  var FocusScrollOffset = '-padding-inline-start';
  function scrollToIndex(instance, index, focus, scrollBehavior) {
    instance.itemsContainer.scrollToIndex(index, {
      offsetLeft: FocusScrollOffset,
      behavior: scrollBehavior
    }, focus);
  }
  function scrollToCurrent(instance, focus, scrollBehavior) {
    var item = instance.item;
    if (!item || item.Type !== 'TvChannel') {
      scrollToIndex(instance, 0, focus, scrollBehavior);
      return;
    }
    var itemId = item.Id;
    //itemId = 1348755;

    var index = instance.itemsContainer.indexOfItemId(itemId);
    if (index !== -1) {
      scrollToIndex(instance, index, focus, scrollBehavior);
      return;
    }
    fetchItems.call(instance, {
      Limit: 0
    }).then(function (totalResult) {
      // save an unnecessary request
      if (totalResult.TotalRecordCount <= 1) {
        scrollToIndex(instance, 0, focus, scrollBehavior);
        return;
      }
      fetchItems.call(instance, {
        StartItemId: itemId,
        Limit: 0
      }).then(function (result) {
        var newIndex = result.TotalRecordCount ? Math.max(totalResult.TotalRecordCount - result.TotalRecordCount, 0) : 0;
        scrollToIndex(instance, newIndex, focus, scrollBehavior);
      });
    });
  }
  function triggerCommand(name, e) {
    var options = {
      sourceElement: e.target,
      repeat: e.repeat,
      originalEvent: e
    };
    _inputmanager.default.trigger(name, options);
  }
  function onInputCommand(e) {
    var detail = e.detail;
    var command = detail.command;
    switch (command) {
      case 'channelup':
        triggerCommand(document.dir === 'rtl' ? 'left' : 'right', detail.originalEvent || e);
        e.preventDefault();
        break;
      case 'channeldown':
        triggerCommand(document.dir === 'rtl' ? 'right' : 'left', detail.originalEvent || e);
        e.preventDefault();
        break;
      default:
        break;
    }
  }
  OnNowTab.prototype.loadTemplate = function () {
    var view = this.view;
    view.innerHTML = "\n                    <div is=\"emby-scroller\" data-mousewheel=\"false\" data-focusscroll=\"start\" data-focusscrolloffset=\"" + FocusScrollOffset + "\" class=\"padded-top-focusscale padded-bottom-focusscale\">\n                        <div is=\"emby-itemscontainer\" data-focusabletype=\"nearest\" class=\"focusable focuscontainer-x scrollSlider itemsContainer videoosd-padded-left videoosd-padded-right\" data-refreshinterval=\"300000\" data-virtualscrolllayout=\"horizontal-grid\"></div>\n                    </div>\n";
    this.itemsContainer = view.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchItems.bind(this);
    this.itemsContainer.getListOptions = getListOptions.bind(this);
    _inputmanager.default.on(this.itemsContainer, onInputCommand);
    return Promise.resolve();
  };
  OnNowTab.prototype.scrollToCurrentItem = function (focus, scrollBehavior) {
    if (this.paused) {
      return;
    }
    if (this.itemsContainer.contains(document.activeElement)) {
      return;
    }
    if (focus) {
      _focusmanager.default.focus(this.itemsContainer);
      return;
    }
    scrollToCurrent(this, focus, scrollBehavior);
  };
  OnNowTab.prototype.onResume = function (options) {
    var instance = this;
    return _basetab.default.prototype.onResume.apply(this, arguments).then(function () {
      var optionsWithoutRefresh = Object.assign(Object.assign({}, options), {
        refresh: false
      });
      var hasFocus = instance.itemsContainer.contains(document.activeElement);
      return instance.itemsContainer.resume(optionsWithoutRefresh).then(function () {
        if (options.refresh) {
          instance.refreshItem(options);
        } else {
          instance.scrollToCurrentItem(hasFocus, 'instant');
        }
      });
    });
  };
  OnNowTab.prototype.refreshItem = function (options) {
    _basetab.default.prototype.refreshItem.apply(this, arguments);
    var instance = this;
    var hasFocus = instance.itemsContainer.contains(document.activeElement);
    return instance.itemsContainer.refreshItems(options).then(function () {
      instance.scrollToCurrentItem(hasFocus);
    });
  };
  OnNowTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    this.itemsContainer.pause();
  };
  OnNowTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    this.itemsContainer = null;
    this.item = null;
  };
  var _default = _exports.default = OnNowTab;
});
