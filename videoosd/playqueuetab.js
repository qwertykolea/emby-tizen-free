define(["exports", "./basetab.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/layoutmanager.js", "./../modules/common/playback/playbackmanager.js"], function (_exports, _basetab, _cardbuilder, _layoutmanager, _playbackmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function fetchItems(query) {
    var _this$currentOptions;
    var player = (_this$currentOptions = this.currentOptions) == null ? void 0 : _this$currentOptions.currentPlayer;
    if (!player) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return _playbackmanager.default.getPlaylist(query || {}, player);
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
      action: 'setplaylistindex',
      playAction: 'setplaylistindex',
      cardClass: cardClass,
      fields: ['ParentName', 'Name'],
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
  function PlayQueueTab(view) {
    _basetab.default.apply(this, arguments);
  }
  Object.assign(PlayQueueTab.prototype, _basetab.default.prototype);
  var FocusScrollOffset = '-padding-inline-start';
  function scrollToIndex(instance, index, focus, scrollBehavior) {
    instance.itemsContainer.scrollToIndex(index, {
      offsetLeft: FocusScrollOffset,
      behavior: scrollBehavior
    }, focus);
  }
  function scrollToCurrent(instance, focus, scrollBehavior) {
    var _instance$currentOpti;
    var player = (_instance$currentOpti = instance.currentOptions) == null ? void 0 : _instance$currentOpti.currentPlayer;
    var newIndex = _playbackmanager.default.getCurrentPlaylistIndex(player);
    scrollToIndex(instance, newIndex, focus, scrollBehavior);
  }
  PlayQueueTab.prototype.loadTemplate = function () {
    var view = this.view;
    view.innerHTML = "\n                    <div is=\"emby-scroller\" data-mousewheel=\"false\" data-focusscroll=\"start\" data-focusscrolloffset=\"" + FocusScrollOffset + "\" class=\"padded-top-focusscale padded-bottom-focusscale\">\n                        <div is=\"emby-itemscontainer\" data-focusabletype=\"nearest\" class=\"focusable focuscontainer-x scrollSlider itemsContainer videoosd-padded-left videoosd-padded-right\" data-refreshinterval=\"300000\" data-virtualscrolllayout=\"horizontal-grid\"></div>\n                    </div>\n";
    this.itemsContainer = view.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchItems.bind(this);
    this.itemsContainer.getListOptions = getListOptions.bind(this);
    return Promise.resolve();
  };
  PlayQueueTab.prototype.scrollToCurrentItem = function (focus, scrollBehavior) {
    if (this.paused) {
      return;
    }
    if (this.itemsContainer.contains(document.activeElement)) {
      return;
    }
    scrollToCurrent(this, focus, scrollBehavior);
  };
  PlayQueueTab.prototype.onResume = function (options) {
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
  PlayQueueTab.prototype.refreshItem = function (options) {
    _basetab.default.prototype.refreshItem.apply(this, arguments);
    var instance = this;
    var hasFocus = instance.itemsContainer.contains(document.activeElement);
    return instance.itemsContainer.refreshItems(options).then(function () {
      instance.scrollToCurrentItem(hasFocus);
    });
  };
  PlayQueueTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    this.itemsContainer.pause();
  };
  PlayQueueTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    this.itemsContainer = null;
  };
  var _default = _exports.default = PlayQueueTab;
});
