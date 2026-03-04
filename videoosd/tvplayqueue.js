define(["exports", "./../modules/common/playback/playbackmanager.js", "./../modules/cardbuilder/cardbuilder.js"], function (_exports, _playbackmanager, _cardbuilder) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!videoosd/tvplayqueue.css']);
  function buildDefaultLayout(parent, options) {
    var html = '';
    html += '<div is="emby-scroller" class="osdPlayQueue padded-left padded-right flex flex-grow hide osdContentSection padded-top-focusscale padded-bottom-focusscale tvPlayQueueScroller" data-mousewheel="false" data-focusscroll="center" data-contentsection="playqueue">';
    html += '<div is="emby-itemscontainer" class="scrollSlider focuscontainer-x itemsContainer focusable" data-skipplaycommands="true" data-virtualscrolllayout="horizontal-grid">';
    html += '</div>';
    html += '</div>';
    parent.insertAdjacentHTML('afterbegin', html);
    return parent.querySelector('.tvPlayQueueScroller');
  }
  function fetchPlaylistItems(query) {
    var player = this.currentPlayer;
    if (this.empty || !player) {
      return Promise.resolve({
        Items: [],
        TotalRecordCount: 0
      });
    }
    return _playbackmanager.default.getPlaylist(query || {}, player);
  }
  function getListOptions(items) {
    var cardLayout = false;
    return {
      renderer: _cardbuilder.default,
      options: {
        action: 'setplaylistindex',
        playAction: 'setplaylistindex',
        shape: 'autooverflow',
        fields: ['ParentName', 'Name', 'ProductionYear'],
        lines: 2,
        centerText: !cardLayout,
        cardLayout: cardLayout,
        cardClass: 'tvPlayQueueCard',
        playQueueIndicator: true,
        allowBottomPadding: false
      },
      virtualScrollLayout: 'horizontal-grid'
    };
  }
  function scrollOrFocus(instance, focus) {
    var playlistIndex = _playbackmanager.default.getCurrentPlaylistIndex(instance.currentPlayer);
    if (playlistIndex === -1) {
      playlistIndex = 0;
    }
    instance.itemsContainer.scrollToIndex(playlistIndex, {}, focus);
  }
  function afterRefresh() {
    var focus = this.itemsContainer.contains(document.activeElement);

    //const focus = activeElement != null && this.itemsContainer.contains(activeElement);
    scrollOrFocus(this, focus);
  }
  function focusItemsContainer() {
    scrollOrFocus(this, true);
  }
  function OsdPlayQueue(options) {
    this.options = options;
    options.parent = buildDefaultLayout(options.parent, options);
    var parent = options.parent;
    this.itemsContainer = parent.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchPlaylistItems.bind(this);
    this.itemsContainer.getListOptions = getListOptions.bind(this);
    this.itemsContainer.afterRefresh = afterRefresh.bind(this);
    this.itemsContainer.focus = focusItemsContainer.bind(this);
    this.itemsContainer.scrollResizeObserver = true;
  }
  OsdPlayQueue.prototype.setPausedState = function (paused) {
    var elem = this.options.parent.querySelector('.activePlaylistCardBox');
    if (!elem) {
      return;
    }
    if (paused) {
      elem.classList.add('paused');
    } else {
      elem.classList.remove('paused');
    }
  };
  OsdPlayQueue.prototype.updatePlaylist = function (player, playlistItemId, playlistIndex, playlistLength) {
    this.currentPlayer = player;
    if (playlistLength) {
      this.empty = false;
      this.refreshItems();
    } else {
      this.empty = true;
      this.refreshItems();
    }
  };
  OsdPlayQueue.prototype.onPlaybackStopped = function () {
    this.empty = true;
    this.refreshItems();
  };
  OsdPlayQueue.prototype.refreshItems = function () {
    var itemsContainer = this.itemsContainer;
    // this check in theory shouldn't be necessary, but need to figure out why it might be getting called after destroy()
    if (!itemsContainer) {
      return;
    }
    return itemsContainer.waitForCustomElementUpgrade().then(function () {
      itemsContainer.refreshItems();
    });
  };
  OsdPlayQueue.prototype.onPlaylistItemMoved = function (player, e, info) {
    this.itemsContainer.refreshItems();
  };
  OsdPlayQueue.prototype.onPlaylistItemRemoved = function (player, e, info) {
    this.itemsContainer.refreshItems();
  };
  OsdPlayQueue.prototype.pause = function () {
    this.paused = true;
    if (this.itemsContainer.pause) {
      this.itemsContainer.pause();
    }
  };
  OsdPlayQueue.prototype.resume = function (options) {
    this.paused = false;
    var itemsContainer = this.itemsContainer;
    return itemsContainer.waitForCustomElementUpgrade().then(function () {
      itemsContainer.resume(options);
    });
  };
  OsdPlayQueue.prototype.destroy = function () {
    var options = this.options;
    if (options) {
      var parent = options.parent;
      if (parent) {
        parent.remove();
      }
    }
    this.options = null;
    this.currentPlayer = null;
    this.itemsContainer = null;
  };
  var _default = _exports.default = OsdPlayQueue;
});
