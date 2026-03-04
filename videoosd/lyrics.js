define(["exports", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/listview/listview.js", "./../modules/registrationservices/registrationservices.js", "./../modules/common/globalize.js", "./../modules/common/inputmanager.js", "./../modules/layoutmanager.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/focusmanager.js"], function (_exports, _connectionmanager, _listview, _registrationservices, _globalize, _inputmanager, _layoutmanager, _embyScroller, _embyItemscontainer, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!videoosd/lyrics.css']);
  var FocusScrollOffset = '-40px';
  function buildDefaultLayout(parent, options) {
    var html = '';
    var scrollerClass = 'flex flex-grow lyricsScroller';
    var scrollerSliderClass = 'focuscontainer navout-up navout-down scrollSlider flex-grow flex-direction-column padded-left padded-right';
    var itemsContainerClass = '';
    if (!_layoutmanager.default.tv) {
      // so that the fade doesn't make things hard to read
      scrollerSliderClass += ' padded-top';
      itemsContainerClass += ' padded-bottom';
    }
    var allownativesmoothscroll = _layoutmanager.default.tv ? false : true;
    html += '<div is="emby-scroller" class="' + scrollerClass + '" data-mousewheel="true" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="start" data-focusscrolloffset="' + FocusScrollOffset + '" data-allownativesmoothscroll="' + allownativesmoothscroll + '" data-dualscroll="' + (_layoutmanager.default.tv ? 'false' : 'true') + '">';
    html += '<div class="' + scrollerSliderClass + '">';
    html += '<div is="emby-itemscontainer" class="vertical-list itemsContainer osdLyricsItemsContainer' + itemsContainerClass + '">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    parent.innerHTML = html;
  }
  function getListViewOptions() {
    var options = {
      fields: ['Text'],
      playQueueIndicator: false
    };
    options.action = 'seektoposition';
    options.image = false;
    options.moreButton = false;
    options.highlight = false;
    options.verticalPadding = false;
    options.multiSelect = false;
    options.contextMenu = false;
    options.mediaInfo = false;
    options.enableUserDataButtons = false;
    options.draggable = false;
    options.draggableXActions = false;
    options.itemClass = 'lyricsItem secondaryText';
    return options;
  }
  function getListOptions(items) {
    return {
      renderer: _listview.default,
      options: getListViewOptions(),
      virtualScrollLayout: 'vertical-grid'
    };
  }
  function normalizeTrackEvents(trackEvents, item, apiClient) {
    for (var i = 0, length = trackEvents.length; i < length; i++) {
      var trackEvent = trackEvents[i];
      trackEvent.Id = item.Id + '_lyrics_' + i;
      trackEvent.Type = 'LyricsLine';
      trackEvent.ServerId = apiClient.serverId();
    }
  }
  function getPremiereLyrics(item, apiClient) {
    var trackEvents = [];
    trackEvents.push({
      Text: _globalize.default.translate('Lyrics')
    });
    trackEvents.push({
      Text: _globalize.default.translate('MessageUnlockAppWithSupporter')
    });
    normalizeTrackEvents(trackEvents, item, apiClient);
    return trackEvents;
  }
  LyricsRenderer.prototype.getItemsInternal = function () {
    this.needsRefresh = false;
    var item = this.currentItem;
    if (!item) {
      return Promise.resolve([]);
    }
    var apiClient = _connectionmanager.default.getApiClient(item);
    var mediaSource = item.MediaSources[0];
    if (!mediaSource) {
      return Promise.resolve([]);
    }
    var track = mediaSource.MediaStreams.filter(function (t) {
      return t.Type === 'Subtitle' && t.Index === mediaSource.DefaultSubtitleStreamIndex;
    })[0];
    if (!track) {
      return Promise.resolve([]);
    }
    return _registrationservices.default.validateFeature('dvr', {
      showDialog: false,
      viewOnly: true
    }).then(function () {
      var url = apiClient.getUrl('Items/' + item.Id + '/' + mediaSource.Id + '/Subtitles/' + track.Index + '/Stream.js', {});
      return apiClient.getJSON(url).then(function (result) {
        var trackEvents = result.TrackEvents;
        normalizeTrackEvents(trackEvents, item, apiClient);
        return trackEvents;
      });
    }, function () {
      return getPremiereLyrics(item, apiClient);
    });
  };
  function getItems(query) {
    return this.getItemsInternal().then(function (items) {
      var totalRecordCount = items.length;
      query = query || {};

      //if (query.StartIndex) {
      //    items = items.slice(query.StartIndex);
      //}

      //if (query.Limit) {
      //    items.length = Math.min(query.Limit, items.length);
      //}

      return {
        TotalRecordCount: totalRecordCount,
        Items: items
      };
    });
  }
  function onInputCommand(e) {
    switch (e.detail.command) {
      case 'up':
      case 'down':
        this.lastDirectionalInput = Date.now();
        e.stopPropagation();
        break;
      case 'left':
      case 'right':
        e.stopPropagation();
        break;
      case 'back':
        e.preventDefault();
        this.options.onBackPress();
        break;
      default:
        break;
    }
  }
  function LyricsRenderer(options) {
    this.options = options;
    var parent = options.parent;
    _inputmanager.default.on(parent, onInputCommand.bind(this));
    buildDefaultLayout(parent, options);
    var itemsContainer = parent.querySelector('.osdLyricsItemsContainer');
    itemsContainer.fetchData = getItems.bind(this);
    itemsContainer.virtualChunkSize = 30;
    itemsContainer.getListOptions = getListOptions.bind(this);
    this.itemsContainer = itemsContainer;
    this.currentIndex = -1;
    this.scroller = parent.querySelector('.lyricsScroller');
  }
  LyricsRenderer.prototype.onPlaybackStopped = function () {};
  LyricsRenderer.prototype.pause = function () {
    this.paused = true;
    if (this.itemsContainer) {
      if (this.itemsContainer.pause) {
        this.itemsContainer.pause();
      }
    }
  };
  function onUpgraded(e) {
    var itemsContainer = e.target;
    itemsContainer.resume(this);
  }
  LyricsRenderer.prototype.focus = function () {
    if (this.selectedElement) {
      _focusmanager.default.focus(this.selectedElement);
    }
  };
  LyricsRenderer.prototype.resume = function (options) {
    this.paused = false;
    if (this.itemsContainer.resume) {
      this.itemsContainer.resume();
    } else {
      this.itemsContainer.addEventListener('upgraded', onUpgraded.bind(options));
    }
    if (this.currentTime != null) {
      this.onTimeUpdate(this.currentTime);
    }
  };
  LyricsRenderer.prototype.refreshEvents = function (events) {
    this.itemsContainer.refreshItems();
  };
  LyricsRenderer.prototype.updateItem = function (item) {
    var changed = this.currentItem !== item;
    this.currentItem = item;
    if (changed) {
      this.itemsContainer.notifyRefreshNeeded(true);
    }
  };
  LyricsRenderer.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
    this.currentTime = positionTicks;
    if (this.paused) {
      return;
    }
    var itemsContainer = this.itemsContainer;
    // ensure custom element has upgraded
    if (!(itemsContainer != null && itemsContainer.getItems)) {
      return;
    }
    var items = itemsContainer.getItems();
    if (!items) {
      return;
    }
    var index = -1;
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      if (item.StartPositionTicks == null) {
        continue;
      }
      if (positionTicks >= item.StartPositionTicks) {
        index = i;
      } else if (index !== -1) {
        break;
      }
    }
    var previousIndex = this.currentIndex;
    if (index === previousIndex) {
      return;
    }
    var children = itemsContainer.children;
    var currentSelectedElement = previousIndex === -1 ? null : children[previousIndex];
    this.currentIndex = index;
    var newSelectedElement = index === -1 ? null : children[index];
    if (currentSelectedElement) {
      currentSelectedElement.classList.remove('lyricsItem-selected');
      void currentSelectedElement.offsetWidth;
    }
    this.selectedElement = newSelectedElement;
    if (Date.now() - (this.lastDirectionalInput || 0) < 2000) {
      return;
    }
    if (newSelectedElement) {
      newSelectedElement.classList.add('lyricsItem-selected');
      var activeElement = document.activeElement;
      if (newSelectedElement !== activeElement) {
        itemsContainer.scrollToIndex(index, {
          offsetTop: FocusScrollOffset
        }, itemsContainer.contains(activeElement != null ? activeElement : document.body) ? true : false);
      }
    }
  };
  LyricsRenderer.prototype.destroy = function () {
    var options = this.options;
    if (options) {
      var parent = options.parent;
      if (parent) {
        parent.innerHTML = '';
        parent.classList.add('hide');
      }
    }
    this.currentItem = null;
    this.currentTime = null;
    this.paused = null;
    this.options = null;
    this.itemsContainer = null;
    this.scroller = null;
    this.currentIndex = null;
    this.lastDirectionalInput = null;
    this.selectedElement = null;
  };
  var _default = _exports.default = LyricsRenderer;
});
