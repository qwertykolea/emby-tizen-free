define(["exports", "./basetab.js", "./../modules/cardbuilder/cardbuilder.js", "./../modules/common/playback/playbackmanager.js", "./../modules/focusmanager.js", "./../modules/layoutmanager.js"], function (_exports, _basetab, _cardbuilder, _playbackmanager, _focusmanager, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function fetchItems(query) {
    var chapters = this.currentOptions.currentDisplayChapters || [];
    var totalItems = chapters.length;
    if (query) {
      chapters = chapters.slice(query.StartIndex || 0);
      if (query.Limit && chapters.length > query.Limit) {
        chapters.length = query.Limit;
      }
    }
    return Promise.resolve({
      Items: chapters,
      TotalRecordCount: totalItems
    });
  }
  function getListOptions(items) {
    var cardClass = 'videoOsd-itemstab-card videoOsd-itemstab-card-threeline';
    return {
      renderer: _cardbuilder.default,
      options: {
        shape: 'autooverflow',
        fields: ['Name', 'ChapterTime', 'ChapterWatching'],
        multiSelect: false,
        contextMenu: false,
        playedButton: false,
        ratingButton: false,
        action: 'custom',
        playAction: 'custom',
        enableUserData: false,
        draggable: false,
        cardClass: cardClass,
        defaultShape: 'backdrop',
        allowBottomPadding: false,
        background: 'black',
        textLinks: false,
        enableFocusScaling: false,
        playQueueIndicator: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function onCardAction(e) {
    var item = e.detail.item;
    _playbackmanager.default.seek(item.StartPositionTicks || 0);
    this.closeTab();
  }
  function ChaptersTab(view) {
    _basetab.default.apply(this, arguments);
  }
  Object.assign(ChaptersTab.prototype, _basetab.default.prototype);
  var FocusScrollOffset = '-padding-inline-start';
  function scrollToCurrent(instance, focus) {
    var currentIndex = instance.getCurrentIndex();
    console.log('scrolling to chapter index: ' + currentIndex + ', focus: ' + focus);
    instance.itemsContainer.scrollToIndex(currentIndex, {
      offsetLeft: FocusScrollOffset
    }, focus);
  }
  ChaptersTab.prototype.loadTemplate = function () {
    var view = this.view;
    view.innerHTML = "\n                    <div is=\"emby-scroller\" data-mousewheel=\"false\" data-focusscroll=\"start\" data-focusscrolloffset=\"" + FocusScrollOffset + "\" class=\"padded-top-focusscale padded-bottom-focusscale\">\n                        <div is=\"emby-itemscontainer\" data-focusabletype=\"nearest\" class=\"focusable focuscontainer-x scrollSlider itemsContainer videoosd-padded-left videoosd-padded-right\" data-virtualscrolllayout=\"horizontal-grid\"></div>\n                    </div>\n";
    this.itemsContainer = view.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchItems.bind(this);
    this.itemsContainer.getListOptions = getListOptions.bind(this);
    this.itemsContainer.addEventListener('action-null', onCardAction.bind(this));
    return Promise.resolve();
  };
  ChaptersTab.prototype.scrollToCurrentItem = function (focus, hasFocus) {
    if (this.paused) {
      return;
    }

    // check the whole view for focus, to incorporate scroll buttons
    if (this.view.contains(document.activeElement)) {
      return;
    }
    if (focus && hasFocus) {
      _focusmanager.default.focus(this.itemsContainer);
      return;
    }
    scrollToCurrent(this, focus);
  };
  function updateWatchingText(instance) {
    var _itemsContainer$query;
    var currentTime = instance.positionTicks;
    if (currentTime == null) {
      return;
    }
    var itemsContainer = instance.itemsContainer;
    var previousWatchingCard = (_itemsContainer$query = itemsContainer.querySelector('.cardText-currentwatching')) == null ? void 0 : _itemsContainer$query.closest('.card');
    var items = itemsContainer.getItems();
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      var isWatching = currentTime >= item.StartPositionTicks && currentTime <= item.StartPositionTicks + (item.DurationTicks || 0);
      if (isWatching) {
        var index = itemsContainer.indexOfItemId(item.Id);
        if (index !== -1) {
          var elem = itemsContainer.getElement(index);
          if (elem === previousWatchingCard) {
            return;
          }
          itemsContainer.onItemUpdated(index, item);
          break;
        }
      }
    }
    if (previousWatchingCard) {
      var previousWatchingItem = itemsContainer.getItemFromElement(previousWatchingCard);
      if (previousWatchingItem) {
        var previousWatchingIndex = itemsContainer.indexOfItemId(previousWatchingItem.Id);
        if (previousWatchingIndex !== -1) {
          itemsContainer.onItemUpdated(previousWatchingIndex, previousWatchingItem);
        }
      }
    }
  }
  ChaptersTab.prototype.onResume = function (options) {
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
          instance.scrollToCurrentItem(options.autoFocus || hasFocus, hasFocus);
          updateWatchingText(instance);
        }
      });
    });
  };
  ChaptersTab.prototype.refreshItem = function (options) {
    _basetab.default.prototype.refreshItem.apply(this, arguments);
    var instance = this;
    var hasFocus = instance.itemsContainer.contains(document.activeElement);
    return instance.itemsContainer.refreshItems(options).then(function () {
      instance.scrollToCurrentItem(options.autoFocus || hasFocus, hasFocus);
    });
  };
  ChaptersTab.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
    _basetab.default.prototype.onTimeUpdate.apply(this, arguments);
    if (!this.paused) {
      if (_layoutmanager.default.tv) {
        this.scrollToCurrentItem();
      }
      updateWatchingText(this);
    }
  };
  ChaptersTab.prototype.getCurrentIndex = function () {
    var chapters = this.currentOptions.currentDisplayChapters || [];
    var positionTicks = this.positionTicks || 0;
    for (var i = 0, length = chapters.length; i < length; i++) {
      var chapter = chapters[i];
      if (positionTicks < chapter.StartPositionTicks) {
        return Math.max(0, i - 1);
      }
    }
    return positionTicks ? Math.max(chapters.length - 1, 0) : 0;
  };
  ChaptersTab.prototype.onPause = function () {
    _basetab.default.prototype.onPause.apply(this, arguments);
    this.itemsContainer.pause();
  };
  ChaptersTab.prototype.destroy = function () {
    _basetab.default.prototype.destroy.apply(this, arguments);
    this.itemsContainer = null;
  };
  var _default = _exports.default = ChaptersTab;
});
