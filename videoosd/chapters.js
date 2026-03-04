define(["exports", "./../modules/listview/listview.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js", "./../modules/focusmanager.js"], function (_exports, _listview, _embyScroller, _embyItemscontainer, _focusmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  function buildDefaultLayout(parent, options) {
    var html = '';
    html += '<div is="emby-scroller" class="flex flex-grow osdChapters-scroller osdChapers flex-direction-column hide osdContentSection osdContentSection-split osd-autofadesection padded-left padded-right" data-contentsection="chapters" data-mousewheel="true" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true">';
    html += '<div class="scrollSlider osdChapters-scrollSlider flex-grow flex-direction-column">';
    html += '<div is="emby-itemscontainer" class="flex-grow flex-direction-column vertical-list itemsContainer osdChaptersItemsContainer" data-virtualscrolllayout="vertical-grid">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    parent.insertAdjacentHTML('afterbegin', html);
    return parent.querySelector('.osdChapers');
  }
  function getListViewOptions() {
    var options = {
      action: 'seektoposition',
      playAction: 'seektoposition',
      multiSelect: false,
      contextMenu: false,
      imagePlayButton: true,
      mediaInfo: false,
      enableSideMediaInfo: false,
      enableUserDataButtons: false,
      fields: ['Name', 'ChapterTime']
    };
    options.moreButton = false;
    options.highlight = false;
    options.draggable = false;
    options.draggableXActions = false;
    return options;
  }
  function getListOptions(items) {
    return {
      renderer: _listview.default,
      options: getListViewOptions(),
      virtualScrollLayout: 'vertical-grid'
    };
  }
  ChaptersRenderer.prototype.getItemsInternal = function () {
    return Promise.resolve(this.currentChapters || []);
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
  function ChaptersRenderer(options) {
    this.options = options;
    var parent = options.parent;
    buildDefaultLayout(parent, options);
    var itemsContainer = parent.querySelector('.osdChaptersItemsContainer');
    itemsContainer.fetchData = getItems.bind(this);
    itemsContainer.virtualChunkSize = 30;
    itemsContainer.getListOptions = getListOptions.bind(this);
    this.itemsContainer = itemsContainer;
    this.currentIndex = -1;
  }
  ChaptersRenderer.prototype.onPlaybackStopped = function () {};
  ChaptersRenderer.prototype.pause = function () {
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
  ChaptersRenderer.prototype.focus = function () {
    if (this.selectedElement) {
      _focusmanager.default.focus(this.selectedElement);
    }
  };
  ChaptersRenderer.prototype.resume = function (options) {
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
  ChaptersRenderer.prototype.refreshEvents = function (events) {
    this.itemsContainer.refreshItems();
  };
  ChaptersRenderer.prototype.updateItem = function (item, chapters) {
    var changed = this.currentItem !== item;
    this.currentItem = item;
    this.currentChapters = chapters;
    if (changed) {
      this.itemsContainer.notifyRefreshNeeded(true);
    }
  };
  ChaptersRenderer.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
    this.currentTime = positionTicks;
    if (this.paused) {
      return;
    }
    var itemsContainer = this.itemsContainer;
    if (!itemsContainer) {
      return;
    }
  };
  ChaptersRenderer.prototype.destroy = function () {
    var options = this.options;
    if (options) {
      var parent = options.parent;
      if (parent) {
        parent.innerHTML = '';
        parent.classList.add('hide');
      }
    }
    this.currentItem = null;
    this.currentChapters = null;
    this.currentTime = null;
    this.paused = null;
    this.options = null;
    this.itemsContainer = null;
    this.currentIndex = null;
    this.selectedElement = null;
  };
  var _default = _exports.default = ChaptersRenderer;
});
