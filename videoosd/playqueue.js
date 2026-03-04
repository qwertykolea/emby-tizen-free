define(["exports", "./../modules/common/playback/playbackmanager.js", "./../modules/listview/listview.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-button/paper-icon-button-light.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js"], function (_exports, _playbackmanager, _listview, _embyScroller, _paperIconButtonLight, _embyItemscontainer) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function buildDefaultLayout(parent, options) {
    var html = '';
    html += '<div is="emby-scroller" class="osdPlayQueue flex flex-grow osdPlaylist-scroller osdPlaylist flex-direction-column hide osdContentSection osdContentSection-split osd-autofadesection padded-left padded-right" data-contentsection="playqueue" data-mousewheel="true" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true">';
    html += '<div class="scrollSlider osdPlaylist-scrollSlider flex-grow flex-direction-column">';
    html += '<div is="emby-itemscontainer" class="flex-grow flex-direction-column vertical-list itemsContainer osdPlaylistItemsContainer" data-skipplaycommands="true" data-dragreorder="true" data-virtualscrolllayout="vertical-grid">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    parent.insertAdjacentHTML('afterbegin', html);
    return parent.querySelector('.osdPlayQueue');
  }
  function afterRefresh() {
    this.setScrollToTrack = true;
    if (this.scrollToTrack) {
      this.scrollToTrack = null;
      this.scrollCurrentTrackToTop();
    }
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
  function getPlaylistListOptions(items) {
    return {
      renderer: _listview.default,
      options: {
        smallIcon: true,
        action: 'setplaylistindex',
        playAction: 'setplaylistindex',
        fields: ['Name', 'ParentName'],
        enableUserDataButtons: false,
        //mediaInfo: false,
        moreButton: false,
        removeFromPlayQueueButton: true,
        dragReorder: true,
        autoHideBorderOnTouch: true,
        hideMoreButtonOnTouch: true,
        autoMoveParentName: true,
        buttonCommands: ['removefromplayqueue']
      },
      virtualScrollLayout: 'vertical-list'
    };
  }
  function onPlaylistItemDrop(e) {
    e.preventDefault();
    var newIndex = e.detail.newIndex;
    var item = e.detail.items[0];
    var playlistItemId = item.PlaylistItemId;
    _playbackmanager.default.movePlaylistItem(playlistItemId, newIndex, this.currentPlayer);
  }
  function OsdPlayQueue(options) {
    this.options = options;
    options.parent = buildDefaultLayout(options.parent, options);
    var parent = options.parent;
    this.playlistElement = options.parent;
    this.itemsContainer = parent.querySelector('.itemsContainer');
    this.itemsContainer.fetchData = fetchPlaylistItems.bind(this);
    this.itemsContainer.afterRefresh = afterRefresh.bind(this);
    this.itemsContainer.getListOptions = getPlaylistListOptions.bind(this);
    this.itemsContainer.scrollResizeObserver = true;
    this.itemsContainer.addEventListener('itemdrop', onPlaylistItemDrop.bind(this));
  }
  OsdPlayQueue.prototype.scrollCurrentTrackToTop = function () {
    var index = _playbackmanager.default.getCurrentPlaylistIndex(this.currentPlayer);
    if (index === -1) {
      return;
    }
    var itemsContainer = this.playlistElement.querySelector('.itemsContainer');
    if (!itemsContainer) {
      return;
    }
    itemsContainer.scrollToIndex(index, {
      behavior: 'instant',
      skipWhenVisibleY: true
    }, false);
  };
  OsdPlayQueue.prototype.setPausedState = function (paused) {};
  OsdPlayQueue.prototype.updatePlaylist = function (player, playlistItemId, playlistIndex, playlistLength) {
    //console.trace('updatePlaylist');

    this.currentPlayer = player;
    if (this.setScrollToTrack !== false) {
      this.scrollToTrack = true;
    }
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
    this.playlistElement = null;
  };
  var _default = _exports.default = OsdPlayQueue;
});
